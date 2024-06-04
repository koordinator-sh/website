# 负载感知调度

## 摘要

虽然 Koordinator 通过超卖机制超卖资源可以提高节点的利用率，但也会因为 BestEffort 类型的工作负载干扰延迟敏感型应用，尤其是当节点负载水位较高时，这种干扰带来的影响会放大，不仅可能导致延迟敏感型应用的服务质量，也可能导致 BestEffort 类型的工作负载本身也不能很快的完成任务。

## 动机

Koordinator 通过超卖机制超卖一些资源。尽管它可以提高节点的利用率，但 BestEffort 工作负载也可能会干扰对延迟敏感的应用程序。

### 目标

1. 提供可配置的调度插件来帮助控制集群资源利用率。
2. 资源利用率控制机制支持多种资源。
3. 将资源利用率控制在安全阈值。

### 非目标/未来工作

1. 通过应用画像帮助插件实现更合理的评估机制并获得更好的均衡效果。这是一项后续工作，将在不同的提案下完成。

## 用户故事

### 故事 1

当节点的资源利用率达到高阈值时，节点上正在运行的工作负载之间会发生严重的资源争用。例如，由于更高优先级的应用程序需要资源，因此经常 BestEffort 的工作负载。结果，BestEffort 的工作负载超时甚至被迫结束；或者对延迟敏感的应用程序将在高利用率下遭受严重的性能下降，无法满足外部 SLA。应该避免这种情况。

### 故事 2

混部集群中的工作负载具有不同的资源需求。典型的 CPU 密集型工作负载预计会使用更多 CPU，而其他类型的工作负载可能会使用更多内存。有可能 CPU 资源的利用率比较高，而内存资源的利用率比较低。在这种情况下，资源的不平衡利用会影响调度的效果，甚至可能导致资源空闲但 Pod 无法调度的问题。

### 故事 3

Koordinator 定义 NodeMetric CRD 来描述节点的资源使用情况，并由 Koordlet 定期更新。但是，如果在更新周期中有很多 Pod 调度到冷节点（即资源利用率低的节点），当这些 Pod 开始运行时，这些节点的资源利用率可能会超过预期的阈值。结果，这些 Pod 的运行时质量并没有预期的那么好。
### 故事 4

由于节点异常，Koordlet 可能无法报告最新的资源使用情况。在调度过程中应避免此类节点，以防止出现意外异常。

## 实施细节

![image](/img/load-aware-scheduling-arch.svg)

调度插件过滤异常节点并根据资源使用情况对其进行评分。这个调度插件扩展了 Kubernetes 调度框架中定义的 Filter/Score/Reserve/Unreserve 扩展点。

### 过滤不健康的节点

默认过滤异常节点，但是用户可以根据需要通过配置来决定是否开启。

- 过滤 Koordlet 无法更新 NodeMetric 的节点。如果配置启用，插件将排除 nodeMetrics.status.updateTime >= LoadAwareSchedulingArgs.nodeMetricExpirationSeconds 的节点。

- 按利用率阈值过滤节点。如果配置启用，插件将排除 latestUsageUtilization >= 利用率阈值的节点。 在过滤阶段，仅从最新的 NodeMetric 中获取资源利用率，已分配但尚未统计的 Pod 的资源利用率不参与计算，以便为新创建的 Pod 分配资源，避免因估算不合理而导致调度失败。

### 评分算法

评分算法的核心逻辑是选择资源使用量最小的节点。但是考虑到资源使用上报的延迟和 Pod 启动时间的延迟，时间窗口内已经调度的 Pod 和当前正在调度的 Pod 的资源请求也会被估算出来，并且估算值将参与计算。

### 插件配置

```go

type LoadAwareSchedulingArgs struct {
  metav1.TypeMeta

  FilterExpiredNodeMetrics    *bool                          `json:"filterExpiredNodeMetrics,omitempty"`
  NodeMetricExpirationSeconds *int64                         `json:"nodeMetricExpirationSeconds,omitempty"`
  ResourceWeights             map[corev1.ResourceName]int64 `json:"resourceWeights,omitempty"`
  UsageThresholds             map[corev1.ResourceName]int64 `json:"usageThresholds,omitempty"`
  EstimatedScalingFactors     map[corev1.ResourceName]int64 `json:"estimatedScalingFactors,omitempty"`
}

```

- `FilterExpiredNodeMetrics` 指定是否过滤 Koordlet 无法更新 NodeMetric 的节点。
- `NodeMetricExpirationSeconds` 表示 NodeMetric 过期时间，单位为秒；当NodeMetric过期时，节点被认为异常。默认为180秒。
- `ResourceWeights` 表示资源的权重。默认情况下，CPU 和内存的权重都为1。
- `UsageThresholds` 表示资源利用率阈值，CPU 的默认值为65%，内存的默认值为95%。
- `EstimatedScalingFactors` 表示估计资源使用情况时的系数。CPU 的默认值为85%，内存的默认值为70%。

`FilterExpiredNodeMetrics` 控制 Filter 行为，如果值为 `false`，`NodeMetricExpirationSeconds` 在计分时仍然可以使用。

### 自定义节点指标更新周期

此插件依赖于 NodeMetric 的报告周期。需要根据不同的场景和工作量设置不同的报告周期。如果报告周期比较长，Koordlet 需要在报告周期内进行汇总，以保证指标的效果。因此，NodeMetricSpec 需要扩展以支持用户自定义的报告周期和聚合周期。用户可以修改 `slo-controller-config` 来完成相应的配置，Koord-Manager 中的控制器会负责更新相关节点的 NodeMetrics 的上报周期和聚合周期字段。

```go
// NodeMetricSpec defines the desired state of NodeMetric
type NodeMetricSpec struct {
  // CollectPolicy defines the Metric collection policy
  CollectPolicy *NodeMetricCollectPolicy `json:"metricCollectPolicy,omitempty"`
}

// NodeMetricCollectPolicy defines the Metric collection policy
type NodeMetricCollectPolicy struct {
  // AggregateDurationSeconds represents the aggregation period in seconds
  AggregateDurationSeconds *int64 `json:"aggregateDurationSeconds,omitempty"`
  // ReportIntervalSeconds represents the report period in seconds
  ReportIntervalSeconds *int64 `json:"reportIntervalSeconds,omitempty"`
}
```

### 自定义节点使用阈值

目前，节点的资源利用率阈值是根据经验配置的，以保证节点的运行质量。但也有一些方法可以评估节点上运行的工作负载，以达到更合适的资源利用率阈值。例如，在分时场景中，可以设置更高的阈值以允许调度在延迟敏感的应用程序的低谷期间运行更多的 BestEffort 工作负载。当对延迟敏感的应用程序的峰值出现时，降低阈值并驱逐一些 BestEffort 工作负载。此外，可以使用 3-sigma 来分析集群中的利用率水平，以获得更合适的阈值。

支持用户通过 Annotation 自定义节点资源利用率阈值。

```go
const (
  AnnotationCustomUsageThresholds = "scheduling.koordinator.sh/usage-thresholds"
)

type CustomUsageThresholds struct {
  UsageThresholds map[corev1.ResourceName]int64 `json:"usageThresholds,omitempty"`
}
```
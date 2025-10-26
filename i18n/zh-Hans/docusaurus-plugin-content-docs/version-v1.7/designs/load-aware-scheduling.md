# 负载感知调度

## 摘要

虽然 Koordinator 提供了混部机制来提高集群的资源利用率并降低成本，但它还没有能力均衡集群维度的各节点的资源利用率。本提案定义了一个调度插件来帮助 Koordinator 实现这一能力。

## 动机

Koordinator 通过超卖机制超卖一些资源。尽管它可以提高节点的利用率，但 BestEffort 工作负载也可能会干扰对延迟敏感的应用程序。

### 目标

1. 提供一个可配置的调度插件，帮助将节点资源利用率控制在安全阈值内并在节点间平衡利用率。
2. 利用率控制机制应支持多种资源和调度策略，以适应具有不同工作负载资源需求组合的集群。
3. 对节点、其上的现有工作负载和即将调度的工作负载进行直观、合理且可定制的估算配置，因为利用率是可变的，调度器可能需要从其他组件获取更多信息来做出更好的决策。
4. 插件在实现上应具有良好的性能，以避免降低调度吞吐量。

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

调度插件过滤异常节点并根据资源使用情况对其进行评分。这个调度插件扩展了 Kubernetes 调度框架中定义的 PreFilter/Filter/Score/Reserve/Unreserve 扩展点。

> PreFilter 阶段打开LoadAwareScheduling是可选的但推荐的配置。它计算并存储在 Filter 和 Score 阶段需要的可重用数据。

### 过滤不可用节点

默认过滤异常节点，但是用户可以根据需要通过配置来决定是否开启。

- 过滤 koordlet 无法更新 NodeMetric 的不健康节点。如果配置启用，插件将排除 `now() - nodeMetrics.status.updateTime >= LoadAwareSchedulingArgs.nodeMetricExpirationSeconds` 的节点。

- 通过利用率阈值过滤繁忙节点。如果配置启用，插件将排除 `estimatedUsageIfScheduled >= usageThresholds` 的节点。estimatedUsageIfScheduled 包括从最新 NodeMetric 获取的节点使用率、如果启用估算则包括此节点上现有 Pod 使用率超出部分以及如果调度到该节点上的当前 Pod 的估算使用率这三部分的累积值，避免了在短时间内将大量 Pod 调度到空节点。

### 评分算法

评分算法的核心逻辑是选择资源使用量最小的节点。但是考虑到资源使用上报的延迟和 Pod 启动时间的延迟，时间窗口内已经调度的 Pod 和当前正在调度的 Pod 的资源请求也会被估算出来，并且估算值将参与计算。

我们还基于主导资源公平性概念添加了一个 dominantResourceWeight 参数，表示主导资源的权重。节点的主导资源是其上利用率最大的资源。在集群节点类型异构或各种工作负载需要 Pod 间亲和性，导致不同节点上资源利用率的不平衡时，这个权重参数很有用。例如，某些节点 CPU 使用率高，而其他节点内存使用率高时，我们倾向选择 CPU 余量多的节点去调度 CPU 预估使用量高的作业。

### 资源估算

考虑到学习成本和调度性能，负载感知插件中的节点可分配资源和 Pod 使用率估算算法设计需要简单明了，因为它在每个节点的过滤和调度打分中都会被调用。复杂的估算算法应该在单独的组件中实现，并通过自定义配置与负载感知插件支持的自定义参数进行交互。

默认情况下，节点可分配资源估算从节点的 `.status.allocatable` 字段获取。可以通过在节点上设置 `node.koordinator.sh/raw-allocatable` 注解来自定义。

在 Koordinator 中，Pod 使用资源估算默认由 LoadAwareSchedulingArgs 中的 `estimatedScalingFactors` 控制。可以通过在 Pod 上设置 `scheduling.koordinator.sh/load-estimated-scaling-factors` 注解来自定义。结果是 `estimated = max(factor * max(pod-requests[resource], pod-limits[resource]), pod-usage[resource])`。

以下状态的 Pod 会激活使用量估算：

1. 调度中的新 Pod。
2. 节点上现有的未终止 Pod 且 NodeMetric 中未收集到此 Pod 的使用率（刚调度或其他原因）。
3. 现有 Pod 的指标仍在报告间隔内（`metric.updateTime - reportInterval < podScheduledTime`），这意味着 Pod 不存在完整报告间隔，没有足够的指标点。
4. 现有 Pod 在估算中配置：插件参数中的 `estimatedSecondsAfterPodScheduled` 和 `estimatedSecondsAfterInitialized`，以及如果允许自定义的话，在 Pod 上设置的 `scheduling.koordinator.sh/load-estimated-seconds-after-pod-scheduled` 和 `scheduling.koordinator.sh/load-estimated-seconds-after-initialized` 注解。这些配置强制 Pod 在启动时进行估算。

### 性能优化

我们可以通过在缓存中存储所有中间结果来提高负载感知过滤和打分的性能，以避免对已分配的 Pod 进行重复计算是否触发预估和预估资源量计算，并将资源列表转换为向量以避免从许多小 map 中检索值。

因为在负载感知中我们应该只计算我们可以采集到或估算的有限种类的实际资源，所以向量化是有效的。

### 插件配置

```go
type LoadAwareSchedulingArgs struct {
  metav1.TypeMeta `json:",inline"`

  NodeMetricExpirationSeconds          *int64                             `json:"nodeMetricExpirationSeconds,omitempty"`
  EnableScheduleWhenNodeMetricsExpired *bool                              `json:"enableScheduleWhenNodeMetricsExpired,omitempty"`
  ResourceWeights                      map[corev1.ResourceName]int64      `json:"resourceWeights,omitempty"`
  DominantResourceWeight               int64                              `json:"dominantResourceWeight,omitempty"`
  UsageThresholds                      map[corev1.ResourceName]int64      `json:"usageThresholds,omitempty"`
  ProdUsageThresholds                  map[corev1.ResourceName]int64      `json:"prodUsageThresholds,omitempty"`
  ProdUsageIncludeSys                  bool                               `json:"prodUsageIncludeSys,omitempty"`
  ScoreAccordingProdUsage              *bool                              `json:"scoreAccordingProdUsage,omitempty"`
  EstimatedScalingFactors              map[corev1.ResourceName]int64      `json:"estimatedScalingFactors,omitempty"`
  EstimatedSecondsAfterPodScheduled    *int64                             `json:"estimatedSecondsAfterPodScheduled,omitempty"`
  EstimatedSecondsAfterInitialized     *int64                             `json:"estimatedSecondsAfterInitialized,omitempty"`
  AllowCustomizeEstimation             bool                               `json:"allowCustomizeEstimation,omitempty"`
  Aggregated                           *LoadAwareSchedulingAggregatedArgs `json:"aggregated,omitempty"`
  SupportedResources                   []corev1.ResourceName              `json:"supportedResources,omitempty"`
}

type LoadAwareSchedulingAggregatedArgs struct {
  UsageThresholds         map[corev1.ResourceName]int64 `json:"usageThresholds,omitempty"`
  UsageAggregationType    extension.AggregationType     `json:"usageAggregationType,omitempty"`
  UsageAggregatedDuration *metav1.Duration              `json:"usageAggregatedDuration,omitempty"`
  ScoreAggregationType    extension.AggregationType     `json:"scoreAggregationType,omitempty"`
  ScoreAggregatedDuration *metav1.Duration              `json:"scoreAggregatedDuration,omitempty"`
}
```

- `NodeMetricExpirationSeconds` 表示 NodeMetric 过期时间，单位为秒；当NodeMetric过期时，节点被认为异常。默认为180秒。
- `EnableScheduleWhenNodeMetricsExpired` 表示是否允许具有过期 nodeMetrics 的节点调度 Pod。
- `ResourceWeights` 表示资源的权重。默认情况下，CPU 和内存的权重都为1。
- `DominantResourceWeight` 表示主导资源的权重。主导资源是利用率最大的资源，基于主导资源公平性概念。
- `UsageThresholds` 表示资源利用率阈值，CPU 的默认值为65%，内存的默认值为95%。
- `ProdUsageThresholds` 表示 Prod Pod 相对于整机的资源利用率阈值。 默认情况下不启用。
- `ProdUsageIncludeSys` 表示在汇总当前 prod pod 使用量时是否包含系统使用量（非 pod 使用）。
- `ScoreAccordingProdUsage` 控制是否根据 Prod Pod 的利用率进行评分。
- `EstimatedScalingFactors` 表示估计资源使用情况时的系数。CPU 的默认值为85%，内存的默认值为70%。
- `EstimatedSecondsAfterPodScheduled` 表示 Pod 条件 PodScheduled 转换为 True 后的强制估算持续时间（秒）。
- `EstimatedSecondsAfterInitialized` 表示 Pod 条件 Initialized 转换为 True 后的强制估算持续时间（秒）。
- `AllowCustomizeEstimation` 表示是否允许从 Pod 的元数据中读取估算参数。
- `Aggregated` 支持基于百分位数统计的资源利用率过滤和评分。
- `SupportedResources` 是可以在负载感知调度中使用的额外资源名称列表。cpu、memory 和参数中出现的所有其他资源都默认支持。如果在收集过程中添加了更多资源，但未在插件参数中显示为过滤阈值或评分权重，仅在自定义节点注解中设置，我们应该在插件参数中显式传递这些资源名称。

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
	UsageThresholds     map[corev1.ResourceName]int64 `json:"usageThresholds,omitempty"`
	ProdUsageThresholds map[corev1.ResourceName]int64 `json:"prodUsageThresholds,omitempty"`
	AggregatedUsage     *CustomAggregatedUsage        `json:"aggregatedUsage,omitempty"`
}

type CustomAggregatedUsage struct {
	UsageThresholds         map[corev1.ResourceName]int64 `json:"usageThresholds,omitempty"`
	UsageAggregationType    AggregationType               `json:"usageAggregationType,omitempty"`
	UsageAggregatedDuration *metav1.Duration              `json:"usageAggregatedDuration,omitempty"`
}
```

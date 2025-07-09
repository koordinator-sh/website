# 负载感知调度

负载感知调度（Load Aware Scheduling） 是 koord-scheduler 提供的一种调度能力，调度 Pod 时根据节点的负载情况选择合适的节点，均衡节点间的负载情况。

## 简介

负载均衡是资源调度中的常见问题。资源未充分利用的节点会带来很大的资源浪费，而过度使用的节点可能会导致性能下降。这些问题都不能高效的管理和使用资源。
原生 Kubernetes Scheduler 根据 Requests 和节点可分配总量来调度 Pod，既不考虑实时负载，也不估计使用量。 当我们期望使用原生调度器均匀的打散 Pod 并保持节点间的负载均衡，我们需要为应用程序设置精确的资源规格。此外，当 Koordinator 通过超卖机制提升资源使用效率时，我们需要一种机制尽量避免性能回退，并避免负载过高的问题。

koord-scheduler 参考 koordlet 上报的资源利用率数据平衡在线 Pod(LSE/LSR/LS）和离线 Pod（BE）的调度。

![图片](/img/load-aware-scheduling-arch.svg)

想要了解更多信息，请参阅 [设计：负载感知调度](/docs/designs/load-aware-scheduling)。

## 设置

### 前提条件

- Kubernetes >= 1.18
- Koordinator >= 0.4

### 安装

请确保 Koordinator 组件已正确安装在你的集群中。 如果没有，请参考[安装文档](/docs/installation)。

### 配置全局策略

负载感知调度是默认启用的，不需要修改调度器的配置即可使用。

对于需要深入定制的用户，可以通过修改 Helm Chart 中的 ConfigMap `koord-scheduler-config` 规则来配置负载感知调度。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: koord-scheduler-config
  ...
data:
  koord-scheduler-config: |
    apiVersion: kubescheduler.config.k8s.io/v1
    kind: KubeSchedulerConfiguration
    profiles:
      - schedulerName: koord-scheduler
        plugins:
          # enable the LoadAwareScheduling plugin
          filter:
            enabled:
              - name: LoadAwareScheduling
              ...
          score:
            enabled:
              - name: LoadAwareScheduling
                weight: 1
              ...
          reserve:
            enabled:
              - name: LoadAwareScheduling
          ...
        pluginConfig:
        # configure the thresholds and weights for the plugin
        - name: LoadAwareScheduling
          args:
            apiVersion: kubescheduler.config.k8s.io/v1
            kind: LoadAwareSchedulingArgs
            # whether to filter nodes where koordlet fails to update NodeMetric
            filterExpiredNodeMetrics: true
            # the expiration threshold seconds when using NodeMetric
            nodeMetricExpirationSeconds: 300
            # weights of resources
            resourceWeights:
              cpu: 1
              memory: 1
            # thresholds (%) of resource utilization
            usageThresholds:
              cpu: 75
              memory: 85
            # thresholds (%) of resource utilization of Prod Pods
            prodUsageThresholds:
              cpu: 55
              memory: 65
            # enable score according Prod usage
            scoreAccordingProdUsage: true
            # the factor (%) for estimating resource usage
            estimatedScalingFactors:
              cpu: 80
              memory: 70
            # enable resource utilization filtering and scoring based on percentile statistics
            aggregated:
              usageThresholds:
                cpu: 65
                memory: 75
              usageAggregationType: "p99"
              scoreAggregationType: "p99"
```

koord-descheduler 是通过 Configmap 加载[调度器配置](https://kubernetes.io/docs/reference/scheduling/config/)的。因此需要通过重启调度器才能使用最新的配置。

| 字段 | 说明 | 版本 |
|-------|-------------| --------|
| filterExpiredNodeMetrics | filterExpiredNodeMetrics 表示是否过滤koordlet更新NodeMetric失败的节点。 默认情况下启用，但在 Helm chart 中，它被禁用。| >= v0.4.0 |
| nodeMetricExpirationSeconds | nodeMetricExpirationSeconds 指示 NodeMetric 过期时间（以秒为单位）。 当 NodeMetrics 过期时，节点被认为是异常的。 默认为 180 秒。| >= v0.4.0 |
| resourceWeights | resourceWeights 表示资源的权重。 CPU 和 Memory 的权重默认都是 1。| >= v0.4.0 |
| usageThresholds | usageThresholds 表示整机的资源利用率阈值。 CPU 的默认值为 65%，内存的默认值为 95%。| >= v0.4.0 |
| estimatedScalingFactors | estimatedScalingFactors 表示估计资源使用时的因子。 CPU 默认值为 85%，Memory 默认值为 70%。| >= v0.4.0 |
| prodUsageThresholds| prodUsageThresholds 表示 Prod Pod 相对于整机的资源利用率阈值。 默认情况下不启用。 | >= v1.1.0 |
| scoreAccordingProdUsage | scoreAccordingProdUsage 控制是否根据 Prod Pod 的利用率进行评分。| >= v1.1.0 |
| aggregated | aggregated 支持基于百分位数统计的资源利用率过滤和评分。| >= v1.1.0 |

Aggregated 支持的字段:

| 字段 | 说明 | 版本 |
|-------|-------------| --------|
| usageThresholds | usageThresholds 表示机器基于百分位统计的资源利用率阈值。| >= v1.1.0|
| usageAggregationType | usageAggregationType 表示过滤时机器利用率的百分位类型。 目前支持 `avg`、`p50`、`p90`、`p95` 和 `p99`。  | >= v1.1.0 |
| usageAggregatedDuration | usageAggregatedDuration 表示过滤时机器利用率百分位数的统计周期。不设置该字段时，调度器默认使用 NodeMetrics 中最大周期的数据。| >= v1.1.0|
| scoreAggregationType | scoreAggregationType 表示评分时机器利用率的百分位类型。 目前支持 `avg`、`p50`、`p90`、`p95` 和 `p99`。| >= v1.1.0
| scoreAggregatedDuration | scoreAggregatedDuration 表示打分时 Prod Pod 利用率百分位的统计周期。 不设置该字段时，调度器默认使用 NodeMetrics 中最大周期的数据。| >= v1.1.0 |

### 按照节点配置过滤阈值

通过插件的配置可以作为集群默认的全局配置，用户也可以通过在节点上附加 annotation 来设置节点维度的负载阈值。 当节点上存在 annotation 时，会根据注解指定的参数进行过滤。

Annotation 定义如下：

```go
const (
  AnnotationCustomUsageThresholds = "scheduling.koordinator.sh/usage-thresholds"
)

// CustomUsageThresholds supports user-defined node resource utilization thresholds.
type CustomUsageThresholds struct {
	// UsageThresholds indicates the resource utilization threshold of the whole machine.
	UsageThresholds map[corev1.ResourceName]int64 `json:"usageThresholds,omitempty"`
	// ProdUsageThresholds indicates the resource utilization threshold of Prod Pods compared to the whole machine
	ProdUsageThresholds map[corev1.ResourceName]int64 `json:"prodUsageThresholds,omitempty"`
	// AggregatedUsage supports resource utilization filtering and scoring based on percentile statistics
	AggregatedUsage *CustomAggregatedUsage `json:"aggregatedUsage,omitempty"`
}

type CustomAggregatedUsage struct {
	// UsageThresholds indicates the resource utilization threshold of the machine based on percentile statistics
	UsageThresholds map[corev1.ResourceName]int64 `json:"usageThresholds,omitempty"`
	// UsageAggregationType indicates the percentile type of the machine's utilization when filtering
	UsageAggregationType slov1alpha1.AggregationType `json:"usageAggregationType,omitempty"`
	// UsageAggregatedDuration indicates the statistical period of the percentile of the machine's utilization when filtering
	UsageAggregatedDuration *metav1.Duration `json:"usageAggregatedDuration,omitempty"`
}
```

## 使用负载感知调度

### 感知整机负载进行调度

本文示例的集群有3台 4核16GiB 节点。

1. 使用下面的 YAML 创建一个 `stress` Pod

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stress-demo
  namespace: default
  labels:
    app: stress-demo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: stress-demo
  template:
    metadata:
      name: stress-demo
      labels:
        app: stress-demo
    spec:
      containers:
        - args:
            - '--vm'
            - '2'
            - '--vm-bytes'
            - '1600M'
            - '-c'
            - '2'
            - '--vm-hang'
            - '2'
          command:
            - stress
          image: polinux/stress
          imagePullPolicy: Always
          name: stress
          resources:
            limits:
              cpu: '2'
              memory: 4Gi
            requests:
              cpu: '2'
              memory: 4Gi
      restartPolicy: Always
      schedulerName: koord-scheduler # use the koord-scheduler
```

```bash
$ kubectl create -f stress-demo.yaml
deployment.apps/stress-demo created
```

2. 观察 Pod 的状态，直到它开始运行。

```bash
$ kubectl get pod -o wide
NAME                           READY   STATUS    RESTARTS   AGE   IP           NODE                    NOMINATED NODE   READINESS GATES
stress-demo-7fdd89cc6b-gcnzn   1/1     Running   0          82s   10.0.3.114   cn-beijing.10.0.3.112   <none>           <none>
```

Pod `stress-demo-7fdd89cc6b-gcnzn` 调度在 `cn-beijing.10.0.3.112`。

3. 检查每个node节点的负载。

```bash
$ kubectl top node
NAME                    CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
cn-beijing.10.0.3.110   92m          2%     1158Mi          9%
cn-beijing.10.0.3.111   77m          1%     1162Mi          9%
cn-beijing.10.0.3.112   2105m        53%    3594Mi          28%
```
按照输出结果显示，节点 `cn-beijing.10.0.3.111` 负载最低，节点`cn-beijing.10.0.3.112` 的负载最高。

4. 使用下面的 YAML 文件部署 `nginx` deployment。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-with-loadaware
  labels:
    app: nginx
spec:
  replicas: 6
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      name: nginx
      labels:
        app: nginx
    spec:
      schedulerName: koord-scheduler # use the koord-scheduler
      containers:
      - name: nginx
        image: nginx
        resources:
          limits:
            cpu: 500m
          requests:
            cpu: 500m
```

```bash
$ kubectl create -f nginx-with-loadaware.yaml
deployment/nginx-with-loadawre created
```

5. 检查 `nginx` Pods 的调度结果。

```bash
$ kubectl get pods | grep nginx
nginx-with-loadaware-5646666d56-224jp   1/1     Running   0          18s   10.0.3.118   cn-beijing.10.0.3.110   <none>           <none>
nginx-with-loadaware-5646666d56-7glt9   1/1     Running   0          18s   10.0.3.115   cn-beijing.10.0.3.110   <none>           <none>
nginx-with-loadaware-5646666d56-kcdvr   1/1     Running   0          18s   10.0.3.119   cn-beijing.10.0.3.110   <none>           <none>
nginx-with-loadaware-5646666d56-qzw4j   1/1     Running   0          18s   10.0.3.113   cn-beijing.10.0.3.111   <none>           <none>
nginx-with-loadaware-5646666d56-sbgv9   1/1     Running   0          18s   10.0.3.120   cn-beijing.10.0.3.111   <none>           <none>
nginx-with-loadaware-5646666d56-z79dn   1/1     Running   0          18s   10.0.3.116   cn-beijing.10.0.3.111   <none>           <none>
```

现在我们可以看到 `nginx` pods 被调度在 `cn-beijing.10.0.3.112`  (负载最高的节点) 以外的节点上。

### 感知 Prod Pods 的负载进行调度

如果一个 Node 中调度了很多 BestEffort Pod，可能会因为节点的负载已达到使用限制而导致延迟敏感的 Pod 无法调度。 在 Koordinator v1.1.0 中，负载感知调度针对这种场景进行了优化。 对于延迟敏感（LSE/LSR/LS）的 Pod，优先调度到 Prod Pod 总利用率较低的节点，而 BestEffort(BE) Pod 根据整机利用率水平进行调度。

通过设置以下参数启用相关优化：

| 字段 | 说明 | 版本 |
|-------|-------------| --------|
| prodUsageThresholds| prodUsageThresholds 表示 Prod Pod 相对于整机的资源利用率阈值。 默认情况下不启用。 | >= v1.1.0 |
| scoreAccordingProdUsage | scoreAccordingProdUsage 控制是否根据 Prod Pod 的利用率进行评分。| >= v1.1.0 |

### 感知基于百分位数统计的利用率进行调度

Koordinator v1.0及以前的版本都是按照 koordlet 上报的平均利用率数据进行过滤和打分。但平均值隐藏了比较多的信息，因此在 Koordinator v1.1 中 koordlet 新增了根据百分位数统计的利用率聚合数据。调度器侧也跟着做了相应的适配。

通过设置以下参数启用相关优化：

| 字段 | 说明 | 版本 |
|-------|-------------| --------|
| aggregated | aggregated 支持基于百分位数统计的资源利用率过滤和评分。| >= v1.1.0 |

Aggregated 支持的字段:

| 字段 | 说明 | 版本 |
|-------|-------------| --------|
| usageThresholds | usageThresholds 表示机器基于百分位统计的资源利用率阈值。| >= v1.1.0|
| usageAggregationType | usageAggregationType 表示过滤时机器利用率的百分位类型。 目前支持 `avg`、`p50`、`p90`、`p95` 和 `p99`。  | >= v1.1.0 |
| usageAggregatedDuration | usageAggregatedDuration 表示过滤时机器利用率百分位数的统计周期。不设置该字段时，调度器默认使用 NodeMetrics 中最大周期的数据。| >= v1.1.0|
| scoreAggregationType | scoreAggregationType 表示评分时机器利用率的百分位类型。 目前支持 `avg`、`p50`、`p90`、`p95` 和 `p99`。| >= v1.1.0
| scoreAggregatedDuration | scoreAggregatedDuration 表示打分时 Prod Pod 利用率百分位的统计周期。 不设置该字段时，调度器默认使用 NodeMetrics 中最大周期的数据。| >= v1.1.0 |

`aggregated` 和 `usageThresholds` 参数是互斥的。 当两者都配置时，将使用 `aggregated`。此外，目前不支持 Pod 类型感知。
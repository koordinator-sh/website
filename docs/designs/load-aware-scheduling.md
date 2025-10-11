# Load-aware Scheduling

## Summary

Although Koordinator provides the co-location mechanism to improve the resource utilization of the cluster and reduce costs, it does not yet have the ability to control the utilization level of the cluster dimension. This proposal defines a scheduling plugin to help Koordinator achieve this capability.

## Motivation

Koordinator oversells some resources through the co-location mechanism. Although it can improve the utilization of nodes, Best Effort workloads may also interfere with latency-sensitive applications. 

### Goals

1. Provides a configurable scheduling plugin to help control node resource utilization at a safe threshold and balance utilization between nodes.
2. Utilization control mechanism should support multiple resources and scheduling strategies for cluster with different combination of workload resource requirements.
3. Intuitive, reasonable and customizable estimation configuration for node, existing workloads on it and incoming workloads, since utilization are mutable and scheduler might need more knowledge from other components to make better decisions.
4. The plugin should have good performance in implementation to avoid reduce scheduling throughput.

### Non-Goals/Future Work

1. Help the plugin to achieve more reasonable estimates and better results through application profiles. This is left as a follow-up work that will be done under a different proposal.

## User stories

### Story 1

When the resource utilization of the node has reached a high threshold, serious resource contention will occur between the running workloads on the node. For example, best effort workloads are frequently suppressed due to higher-priority applications requiring resources. As a result, best effort workloads are timed out or even forced to end; or a latency-sensitive application will suffer severe performance degradation under high utilization, failing to meet external SLAs. This should be avoided.

### Story 2

Workloads in a co-located cluster have different resource requirements. Typical CPU-bound workloads expect to use more CPU, while other types of workloads may use more memory. It is possible that the utilization of CPU resources is relatively high, while the utilization of memory resources is relatively low. In this scenario, the unbalanced utilization of resources will affect the effect of scheduling, and may even lead to the problem that resources are idle but Pods cannot be scheduled.

### Story 3

Koordinator defines NodeMetric CRD to describe the resource usage of nodes and is regularly updated by koordlet. However, if there are many Pods scheduled to cold nodes (that is, nodes with low resource utilization) during the update cycle, when these Pods start running, the resource utilization of these nodes may exceed the expected threshold. As a result, the runtime quality of these pods is not as good as expected.

### Story 4

The koordlet may not be able to report the latest resource usage due to node exception. Such nodes should be avoided during scheduling to prevent unexpected exceptions.

## Implementation Details

![image](/img/load-aware-scheduling-arch.svg)

The scheduling plugin filters abnormal nodes and scores them according to resource usage. This scheduling plugin extends the PreFilter/Filter/Score/Reserve/Unreserve extension points defined in the Kubernetes scheduling framework.

> PreFilter phase is optional but recommended. It calculates and stores reusable data that required in Filter and Score.

### Filter Unavailable Nodes

By default, unavailable nodes are filtered. Users can decide whether to enable or not by configuring as needed.

- Filter unhealthy nodes where koordlet fails to update NodeMetric. If the configuration enables, the plugin will exclude nodes with `now() - nodeMetrics.status.updateTime >= LoadAwareSchedulingArgs.nodeMetricExpirationSeconds`.

- Filter busy nodes by utilization thresholds. If the configuration enables, the plugin will exclude nodes with `estimatedUsageIfScheduled >= usageThresholds`. estimatedUsageIfScheduled includes node usage fetched from the latest NodeMetric with node profile, exceeded part of estimated utilization of existing pods on this node if estimation is activated and estimated utilization of incoming pod. This implementation avoids scheduling numerous pods to empty node in a short period.

### Score Algorithm

The core logic of the scoring algorithm is to select the node with the least resource usage. Node's usage here is also estimatedUsageIfScheduled, same quantity as the one used in Filter phase. We can configure the weight for each resource based on the actual situation of the cluster. The more required and lacked resource should have higher weight.

We also add a dominantResourceWeight args which indicates the weight of the dominant resource. Dominant resource for a node is the resource with the maximum utilization on it, which is based on the concept of Dominant Resource Fairness. It is useful when node type is heterogeneous or various workloads have required inter-pod affinity to fit that causes unbalanced utilization of resources on different nodes. For example, some nodes are lack of cpu while some others are lack of memory.

### Resource Estimation

Resource estimation for allocatable and usage in load aware plugin should be simple and easy to use considering learning cost and scheduling performance, since it is invoked in every node's filtering and scoring. Complicated scheduling algorithm should be implemented in a separate components and cooperated with load aware plugin with customization configuration.

Node allocatable resource estimation are fetched from node's `.status.allocatable` field by default. It can be customized by setting `node.koordinator.sh/raw-allocatable` annotation on node.

Pod usage resource estimation are controlled by `estimatedScalingFactors` in LoadAwareSchedulingArgs by default. It can be customized by setting `scheduling.koordinator.sh/load-estimated-scaling-factors` annotation on pod. The result is `estimated = max(factor * max(pod-requests[resource], pod-limits[resource]), pod-usage[resource])`.

Pod usage estimation is activated for pods in these status:

1. Incoming pod in scheduling.
2. Existing and not terminated pod on node when usage for this pod is not collected in NodeMetric (just scheduled or other reasons).
3. Existing pod which metrics is still in the report interval (`metric.updateTime - reportInterval < podScheduledTime`) which means the pod doesn't exist for a full report interval and doesn't have enough metrics point.
4. Existing pod is configured in estimation: `estimatedSecondsAfterPodScheduled` and `estimatedSecondsAfterInitialized` in args, and `scheduling.koordinator.sh/load-estimated-seconds-after-pod-scheduled` and `scheduling.koordinator.sh/load-estimated-seconds-after-initialized` annotation on pod if customization is allowed. These configuration force the pod to be estimated in pod bootstrapping.

### Performance Improvement

We can improve load aware filtering and scoring performance by storing all intermediate results in cache to avoid duplicated evaluation on assigned pods and converting resources list to vector to avoid value retrieval from many small map.

Vectorization is useful in load aware because we should only evaluate on real limited kind of resources that we can collect or estimate.

### Plugin Configuration

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

- `NodeMetricExpirationSeconds` indicates the NodeMetric expiration in seconds. When NodeMetrics expired, the node is considered abnormal. Default is 180 seconds.
- `EnableScheduleWhenNodeMetricsExpired` indicates whether nodes with expired nodeMetrics are allowed to schedule pods.
- `ResourceWeights` indicates the weights of resources. The weights of CPU and Memory are both 1 by default.
- `DominantResourceWeight` indicates the weight of the dominant resource. Dominant resource is the resource with the maximum utilization, which is based on the concept of Dominant Resource Fairness.
- `UsageThresholds` indicates the resource utilization threshold, the default for CPU is 65%, and the default for memory is 95%.
- `ProdUsageThresholds` indicates the resource utilization threshold of prod pods compared to the whole machine. Not enabled by default.
- `ProdUsageIncludeSys` indicates whether to include system usage (not used by pods) when summing up current usage for prod pods.
- `ScoreAccordingProdUsage` controls whether to score according to the utilization of prod pod
- `EstimatedScalingFactors` indicates the factor when estimating resource usage. The default value of CPU is 85%, and the default value of Memory is 70%.
- `EstimatedSecondsAfterPodScheduled` indicates the force estimation duration after pod condition PodScheduled transition to True in seconds.
- `EstimatedSecondsAfterInitialized` indicates the force estimation duration after pod condition Initialized transition to True in seconds.
- `AllowCustomizeEstimation` indicates whether to allow reading estimation args from pod's metadata.
- `Aggregated` supports resource utilization filtering and scoring based on percentile statistics.
- `SupportedResources` is the list of extra resource names that can be used in load-aware scheduling. cpu, memory and all other resources that show up in args are supported by default. If more resource are added in collection, don't show up as filter thresholds or score weights in plugin args and only set up in custom node annotations, we should pass these resource names in plugin args explicitly.

### Custom NodeMetric Update Period

This plugin is dependent on NodeMetric's reporting period. Different reporting periods need to be set according to different scenarios and workloads. If the reporting period is relatively long, koordlet needs to aggregate within the reporting period to ensure the effect of the metrics. Therefore, NodeMetricSpec needs to be extended to support user-defined reporting period and aggregation period. Users can modify `slo-controller-config` to complete the corresponding configuration, and the controller in `koord-manager` will be responsible for updating the reporting period and aggregation period fields of NodeMetrics of related nodes.

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

### Node Thresholds Customization

Currently, the resource utilization thresholds of nodes are configured based on experience to ensure the runtime quality of nodes. But there are also ways to evaluate the workload running on the node to arrive at a more appropriate threshold for resource utilization. For example, in a time-sharing scenario, a higher threshold can be set to allow scheduling to run more best effort workloads during the valley of latency-sensitive applications. When the peak of latency-sensitive applications comes up, lower the threshold and evict some best effort workloads. In addition, 3-sigma can be used to analyze the utilization level in the cluster to obtain a more appropriate threshold.

Define Annotation supports user-defined node resource utilization thresholds.

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

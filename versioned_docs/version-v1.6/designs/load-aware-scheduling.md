# Load-aware Scheduling

## Summary

Although Koordinator provides the co-location mechanism to improve the resource utilization of the cluster and reduce costs, it does not yet have the ability to control the utilization level of the cluster dimension. This proposal defines a scheduling plugin to help Koordinator achieve this capability.

## Motivation

Koordinator oversells some resources through the co-location mechanism. Although it can improve the utilization of nodes, Best Effort workloads may also interfere with latency-sensitive applications. 

### Goals

1. Provides a configurable scheduling plugin to help control cluster resource utilization.
2. Utilization control mechanism that supports multiple resources.
3. Control resource utilization at a safe threshold.

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

The scheduling plugin filters abnormal nodes and scores them according to resource usage. This scheduling plugin extends the Filter/Score/Reserve/Unreserve extension points defined in the Kubernetes scheduling framework.

### Filter unhealthy nodes

By default, abnormal nodes are filtered, and users can decide whether to enable or not by configuring as needed.

- Filter nodes where koordlet fails to update NodeMetric. If the configuration enables, the plugin will exclude nodes with *nodeMetrics.status.updateTime >= LoadAwareSchedulingArgs.nodeMetricExpirationSeconds*.

- Filter nodes by utilization thresholds. If the configuration enables, the plugin will exclude nodes with *latestUsageUtilization >= utilizationThreshold*. In the filtering phase, only the resource utilization is obtained from the latest NodeMetric, and the resource usage of the allocated but not yet counted Pods does not participate in the calculation, so as to allocate resources to the newly created Pods and avoid scheduling failure due to unreasonable estimates.

### Score algorithm

The core logic of the scoring algorithm is to select the node with the smallest resource usage. However, considering the delay of resource usage reporting and the delay of Pod startup time, the resource requests of the Pods that have been scheduled and the Pods currently being scheduled within the time window will also be estimated, and the estimated values will be involved in the calculation.

### Plugin configuration

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

- `FilterExpiredNodeMetrics` indicates whether to filter nodes where koordlet fails to update NodeMetric.
- `NodeMetricExpirationSeconds` indicates the NodeMetric expiration in seconds. When NodeMetrics expired, the node is considered abnormal.Default is 180 seconds.
- `ResourceWeights` indicates the weights of resources. The weights of CPU and Memory are both 1 by default.
- `UsageThresholds` indicates the resource utilization threshold, the default for CPU is 65%, and the default for memory is 95%. 
- `EstimatedScalingFactors` indicates the factor when estimating resource usage. The default value of CPU is 85%, and the default value of Memory is 70%.

`FilterExpiredNodeMetrics` controls the filter behavior, if it is false, `NodeMetricExpirationSeconds` can still be used when scoring.

### Custom NodeMetric update Period

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

### Custom node usage thresholds

Currently, the resource utilization thresholds of nodes are configured based on experience to ensure the runtime quality of nodes. But there are also ways to evaluate the workload running on the node to arrive at a more appropriate threshold for resource utilization. For example, in a time-sharing scenario, a higher threshold can be set to allow scheduling to run more best effort workloads during the valley of latency-sensitive applications. When the peak of latency-sensitive applications comes up, lower the threshold and evict some best effort workloads. In addition, 3-sigma can be used to analyze the utilization level in the cluster to obtain a more appropriate threshold.

Define Annotation supports user-defined node resource utilization thresholds.

```go
const (
  AnnotationCustomUsageThresholds = "scheduling.koordinator.sh/usage-thresholds"
)

type CustomUsageThresholds struct {
  UsageThresholds map[corev1.ResourceName]int64 `json:"usageThresholds,omitempty"`
}
```
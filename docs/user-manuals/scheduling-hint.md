# Scheduling Hint

Scheduling Hint is an internal protocol of koord-scheduler that allows scheduling-related components to provide hints to the scheduler for making more efficient scheduling decisions.

## Introduction

Scheduling Hint provides an internal API for scheduling components (such as queue systems) to hint the scheduler for optimized scheduling decisions. For example, a queue component with network topology awareness can suggest the optimal placement nodes for job pods. The feature is designed to be extensible, and the current version provides mechanisms like preferred nodes, with more capabilities to be added in future releases.

**Comparison with `.status.nominatedNodeName`:**

The `preferredNodeNames` field in Scheduling Hint is similar to `.status.nominatedNodeName` in that both suggest nodes for scheduling, but with key differences:
- Uses a list of nodes instead of a single node, providing fallback options
- The hinted pods do not account for the nodes before assuming
- If the preferred nodes don't work, the scheduler will try other nodes normally

Note: This comparison only applies to the `preferredNodeNames` sub-field of Scheduling Hint. Other fields serve different purposes.

## Setup

### Prerequisite

- Kubernetes >= 1.18
- Koordinator >= 1.8

### Installation

Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to [Installation](/docs/installation).

### Configurations

Scheduling Hint is enabled by default in koord-scheduler. You can use it without any additional configuration.

## Use Scheduling Hint

### Quick Start

1. Create a Pod with the scheduling hint annotation:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-with-hint
  annotations:
    internal.scheduling.koordinator.sh/scheduling-hint: '{"preferredNodeNames": ["node-1", "node-2"]}'
spec:
  containers:
    - name: nginx
      image: nginx
      resources:
        requests:
          cpu: 500m
          memory: 512Mi
  schedulerName: koord-scheduler
```

2. The scheduler will first try to schedule the pod on `node-1`. If that fails, it will try `node-2`. If both preferred nodes fail, the scheduler will proceed with normal scheduling across all available nodes.

### API Specification

The Scheduling Hint is specified via the `internal.scheduling.koordinator.sh/scheduling-hint` annotation on the Pod. The annotation value is a JSON string with the following structure:

```go
type SchedulingHint struct {
    // NodeNames is a list of node names that the pod is required to be scheduled on.
    NodeNames []string `json:"nodeNames,omitempty"`
    // PreferredNodeNames is an ordered list of preferred node names that the pod should try to schedule first.
    // It is recommended to use as few nodes as possible to reduce the overhead.
    PreferredNodeNames []string `json:"preferredNodeNames,omitempty"`
    // Extensions is a map of hint extensions for plugins.
    Extensions map[string]interface{} `json:"extensions,omitempty"`
}
```

#### Field: `nodeNames`

- Type: `[]string`
- Description: A list of node names that the pod is **required** to be scheduled on. This acts as a hard constraint - the scheduler will only consider these nodes for scheduling.

#### Field: `preferredNodeNames`

- Type: `[]string`
- Description: An ordered list of preferred node names that the pod should try to schedule first. The scheduler will attempt nodes in the order specified. If all preferred nodes fail, normal scheduling continues with other nodes.
- Note: It is recommended to use as few nodes as possible to reduce the scheduling overhead.

#### Field: `extensions`

- Type: `map[string]interface{}`
- Description: A map of hint extensions for scheduling plugins. This allows plugins to define custom hint data.

### Examples

#### Example: Preferred Nodes

Use `preferredNodeNames` to suggest nodes without enforcing a hard constraint:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-preferred-nodes
  annotations:
    internal.scheduling.koordinator.sh/scheduling-hint: |
      {
        "preferredNodeNames": ["high-performance-node-1", "high-performance-node-2"]
      }
spec:
  containers:
    - name: app
      image: my-app:latest
      resources:
        requests:
          cpu: 2
          memory: 4Gi
  schedulerName: koord-scheduler
```

In this example, the scheduler will:
1. First try to schedule on `high-performance-node-1`
2. If that fails, try `high-performance-node-2`
3. If both fail, proceed with normal scheduling

#### Example: Required Nodes

Use `nodeNames` to enforce a hard constraint on node selection:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-required-nodes
  annotations:
    internal.scheduling.koordinator.sh/scheduling-hint: |
      {
        "nodeNames": ["zone-a-node-1", "zone-a-node-2"]
      }
spec:
  containers:
    - name: app
      image: my-app:latest
      resources:
        requests:
          cpu: 1
          memory: 2Gi
  schedulerName: koord-scheduler
```

In this example, the scheduler will **only** consider `zone-a-node-1` and `zone-a-node-2` for scheduling. If neither can accommodate the pod, scheduling will fail.

#### Example: Combined with Network Topology Aware Scheduling

When using Scheduling Hint with Network Topology Aware Scheduling, the hint is considered alongside other constraints:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-with-topology-hint
  annotations:
    internal.scheduling.koordinator.sh/scheduling-hint: |
      {
        "preferredNodeNames": ["topology-optimized-node-1", "topology-optimized-node-2"]
      }
spec:
  containers:
    - name: app
      image: my-app:latest
      resources:
        requests:
          cpu: 4
          memory: 8Gi
  schedulerName: koord-scheduler
```

**Note:** When the user also enables the network-topology-aware scheduling and generates the PreFilterResult by the FindOneNode plugin according to the best plan, the preference hint is ignored. The SchedulingHint plugin considers the intersection of the original PreFilterResult. When the preferred nodes are not included in the PreFilterResult, the scheduler does not break the constraint of the existing PreFilter, but aborts the hint instead.

#### Example: Job Queueing Scenario

This example shows how a queue system can use Scheduling Hint to optimize pod placement:

```yaml
# Pod dequeued by a job queue system with preferred nodes
apiVersion: v1
kind: Pod
metadata:
  name: job-pod-1
  annotations:
    internal.scheduling.koordinator.sh/scheduling-hint: |
      {
        "preferredNodeNames": ["node-with-gpu-1", "node-with-gpu-2"]
      }
  labels:
    queue: high-priority
spec:
  containers:
    - name: ml-training
      image: ml-training:latest
      resources:
        requests:
          cpu: 4
          memory: 16Gi
          nvidia.com/gpu: 1
  schedulerName: koord-scheduler
```

The queue system can set the preferred nodes based on its scheduling decisions, allowing the scheduler to try those nodes first without the overhead of full scheduling.

### Compatibility Notes

1. **NominatedNodeName vs Scheduling Hint**: The comparison with `.status.nominatedNodeName` only applies to the `preferredNodeNames` field. Unlike `nominatedNodeName`, `preferredNodeNames` uses a list of nodes, and the hinted pods do not account for the nodes before assuming.

2. **Preemption**: The preference to filter is not the same as the preference for preempt. The scheduling hint currently focuses on the filtering phase.

3. **Network Topology**: When network-topology-aware scheduling is enabled and generates a PreFilterResult, the preference hint may be ignored to respect the topology constraints.

4. **Deprecated Annotation**: The older annotation key `scheduling.koordinator.sh/scheduling-hint` is deprecated. Please use `internal.scheduling.koordinator.sh/scheduling-hint` instead.

## Use Cases

### 1. Network Topology Aware Queue Systems

Queue components with network topology awareness can suggest the optimal placement nodes for job pods, enabling more efficient scheduling decisions.

### 2. Job Queueing Systems

Queue systems can provide hints about optimal node placement after dequeuing pods, enabling faster scheduling decisions.

### 3. Multi-Scheduler Environments

When multiple schedulers or queue components are involved, scheduling hints can coordinate pod placement preferences across components.

### 4. Performance Optimization

By providing preferred nodes, you can reduce scheduling latency by avoiding the need for the scheduler to evaluate all nodes.

## Future Extensions

Scheduling Hint is designed to be an extensible internal protocol. The current version provides the `preferredNodeNames` mechanism, and more capabilities will be added in future releases to support additional scheduling optimization scenarios.

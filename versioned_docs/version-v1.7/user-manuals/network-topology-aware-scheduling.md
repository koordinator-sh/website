# Network Topology Aware

## Introduction

In large-scale AI training scenarios, especially for large language models (LLMs), efficient inter-pod communication is critical to training performance. Model parallelism techniques such as Tensor Parallelism (TP), Pipeline Parallelism (PP), and Data Parallelism (DP) require frequent and high-bandwidth data exchange across GPUs—often spanning multiple nodes. Under such workloads, **network topology becomes a key performance bottleneck**, where communication latency and bandwidth are heavily influenced by the physical network hierarchy (e.g., NVLink, block, spine).

To optimize training efficiency, Koordinator provides **Network-Topology Aware Scheduling** capability, which ensures:
- When cluster resources are sufficient, pods with network topology scheduling requirements will be scheduled to topology domains with better performance (e.g., lower latency, higher bandwidth) according to user-specified strategies.
- When cluster resources are insufficient, the scheduler will preempt resources for the GangGroup based on network topology constraints through job-level preemption, and record the resource nominations in the `.status.nominatedNode` field to ensure consistent placement.

This capability works seamlessly with [PodGroup/GangGroup](https://koordinator.sh/docs/next/architecture/job/) semantics.

## Prerequisites

- Kubernetes >= 1.18
- Koordinator >= 1.7.0

## Verify Network Topology Support is Enabled

Although network topology aware scheduling is **enabled by default** as of Koordinator >= 1.7.0, it's recommended to confirm the configuration before proceeding.

### Check koord-scheduler Startup Parameters

1. Verify that the koord-scheduler has the network topology manager enabled:

```bash
kubectl -n koordinator-system get deployment koord-scheduler -o yaml | grep enable-network-topology-manager
```

Expected output:

```yaml
- --enable-network-topology-manager=true
```

If the parameter is missing or set to `false`, update the koord-scheduler deployment to add this flag.

### Check Coscheduling Plugin Configuration

2. Verify that the Coscheduling plugin has network topology awareness enabled:

```bash
kubectl -n koordinator-system get cm koord-scheduler-config -o yaml
```

Ensure the Coscheduling plugin configuration includes `awareNetworkTopology: true`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: koord-scheduler-config
  namespace: koordinator-system
data:
  koord-scheduler-config: |
    apiVersion: kubescheduler.config.k8s.io/v1
    kind: KubeSchedulerConfiguration
    profiles:
    - pluginConfig:
      - name: Coscheduling
        args:
          apiVersion: kubescheduler.config.k8s.io/v1
          kind: CoschedulingArgs
          awareNetworkTopology: true
          enablePreemption: true
```

If `awareNetworkTopology` is missing or set to `false`, update the ConfigMap and restart the koord-scheduler pod:

```bash
kubectl delete po -l koord-app=koord-scheduler -n koordinator-system 
```

## Configure Network Topology

### Label Nodes with Topology Information

First, use tools like NVIDIA's [topograph](https://github.com/NVIDIA/topograph/blob/v0.1.0/docs/engines/k8s.md) to label nodes with their network topology positions:

```yaml
apiVersion: v1
kind: Node
metadata:
  name: node-0
  labels:
    network.topology.nvidia.com/block: b1
    network.topology.nvidia.com/spine: s1
```

### Create ClusterNetworkTopology

Administrators define the topology hierarchy via a `ClusterNetworkTopology` CR named `default`:

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: ClusterNetworkTopology
metadata:
  name: default
spec:
  networkTopologySpec:
    - labelKey:
      - network.topology.nvidia.com/spine
      topologyLayer: SpineLayer
    - labelKey:
      - network.topology.nvidia.com/block
      parentTopologyLayer: SpineLayer
      topologyLayer: BlockLayer
    - parentTopologyLayer: BlockLayer
      topologyLayer: NodeTopologyLayer
```

The topology forms a tree structure, where each layer represents a level of aggregation in the network (e.g., Node → Block → Spine).

### Verify Topology Configuration

After applying the ClusterNetworkTopology, check its status:

```bash
kubectl get clusternetworktopology default -o yaml
```

Example output:

```yaml
status:
  detailStatus:
  - childTopologyLayer: SpineLayer
    childTopologyNames:
    - spine-0
    - spine-1
    - spine-2
    nodeNum: 12
    topologyInfo:
      topologyLayer: ClusterTopologyLayer
      topologyName: ""
  - childTopologyLayer: BlockLayer
    childTopologyNames:
    - block-0
    - block-1
    nodeNum: 5
    parentTopologyInfo:
      topologyLayer: ClusterTopologyLayer
      topologyName: ""
    topologyInfo:
      topologyLayer: SpineLayer
      topologyName: spine-0
  - childTopologyLayer: NodeTopologyLayer
    nodeNum: 3
    parentTopologyInfo:
      topologyLayer: SpineLayer
      topologyName: spine-0
    topologyInfo:
      topologyLayer: BlockLayer
      topologyName: block-0
  - childTopologyLayer: NodeTopologyLayer
    nodeNum: 2
    parentTopologyInfo:
      topologyLayer: SpineLayer
      topologyName: spine-0
    topologyInfo:
      topologyLayer: BlockLayer
      topologyName: block-1
  - childTopologyLayer: BlockLayer
    childTopologyNames:
    - block-2
    - block-3
    nodeNum: 4
    parentTopologyInfo:
      topologyLayer: ClusterTopologyLayer
      topologyName: ""
    topologyInfo:
      topologyLayer: SpineLayer
      topologyName: spine-1
  - childTopologyLayer: NodeTopologyLayer
    nodeNum: 2
    parentTopologyInfo:
      topologyLayer: SpineLayer
      topologyName: spine-1
    topologyInfo:
      topologyLayer: BlockLayer
      topologyName: block-2
  - childTopologyLayer: NodeTopologyLayer
    nodeNum: 2
    parentTopologyInfo:
      topologyLayer: SpineLayer
      topologyName: spine-1
    topologyInfo:
      topologyLayer: BlockLayer
      topologyName: block-3
  - childTopologyLayer: BlockLayer
    childTopologyNames:
    - block-4
    nodeNum: 3
    parentTopologyInfo:
      topologyLayer: ClusterTopologyLayer
      topologyName: ""
    topologyInfo:
      topologyLayer: SpineLayer
      topologyName: spine-2
  - childTopologyLayer: NodeTopologyLayer
    nodeNum: 3
    parentTopologyInfo:
      topologyLayer: SpineLayer
      topologyName: spine-2
    topologyInfo:
      topologyLayer: BlockLayer
      topologyName: block-4
```

Based on the above `status`, the cluster has a two-tier **spine-block** architecture:

```
ClusterTopologyLayer
├── SpineLayer: spine-0
│   ├── BlockLayer: block-0
│   │   └── NodeTopologyLayer: 3 nodes
│   └── BlockLayer: block-1
│       └── NodeTopologyLayer: 2 nodes
│
├── SpineLayer: spine-1
│   ├── BlockLayer: block-2
│   │   └── NodeTopologyLayer: 2 nodes
│   └── BlockLayer: block-3
│       └── NodeTopologyLayer: 2 nodes
│
└── SpineLayer: spine-2
    └── BlockLayer: block-4
        └── NodeTopologyLayer: 3 nodes
```

We may have noticed that this network topology architecture is consistent with the one used in the [network topology algorithm demonstration](https://koordinator.sh/docs/next/architecture/job#topology-gather-algorithm).

## Usage Example

### Environment Setup

To demonstrate network topology aware scheduling, we assume the cluster has the topology configuration shown in the [Verify Topology Configuration](#verify-topology-configuration) section:

- 12 worker nodes total (node-0 through node-11)
- 3 Spines:
  - spine-0: 5 nodes (block-0 with 3 nodes: node-0, node-1, node-2; block-1 with 2 nodes: node-3, node-4)
  - spine-1: 4 nodes (block-2 with 2 nodes: node-5, node-6; block-3 with 2 nodes: node-7, node-8)
  - spine-2: 3 nodes (block-4 with 3 nodes: node-9, node-10, node-11)
- Each node configuration: 8 CPU cores, 32 GiB Memory

```
ClusterTopologyLayer
├── SpineLayer: spine-0 (5 nodes)
│   ├── BlockLayer: block-0 (node-0, node-1, node-2)
│   └── BlockLayer: block-1 (node-3, node-4)
├── SpineLayer: spine-1 (4 nodes)
│   ├── BlockLayer: block-2 (node-5, node-6)
│   └── BlockLayer: block-3 (node-7, node-8)
└── SpineLayer: spine-2 (3 nodes)
    └── BlockLayer: block-4 (node-9, node-10, node-11)
```

Our demonstration will include:
1. **Example 1**: Topology-aware scheduling with `PreferGather` strategy and Binpack algorithm
2. **Example 2**: `MustGather` scheduling and topology-aware preemption when constraints cannot be satisfied

### Example 1: Topology-Aware Scheduling with `PreferGather` and Binpack

This example demonstrates how Koordinator schedules pods with `PreferGather` strategy to achieve both **optimal network performance** and **minimal resource waste**. The `PreferGather` strategy ensures pods are gathered within the same topology domain for better network locality, while the Binpack algorithm selects the most compact domain to minimize resource fragmentation.

#### Scenario

We will create a 4-pod training job when all 12 nodes are idle:
- Each pod requires **8 CPU cores** (occupies entire node)
- Total requirement: 4 pods = 4 nodes
- The scheduler should select the most compact topology domain that provides:
  - **Best network performance**: Pods gathered in the same Spine for lower latency and higher bandwidth
  - **Least resource waste**: The smallest topology domain that can accommodate all pods

**Expected result**: Pods scheduled to **spine-1** (node-5 through node-8), which is the optimal choice because:
- It has exactly 4 nodes (perfect fit, zero waste)
- All pods are in the same Spine for optimal network performance
- No resource fragmentation in other Spines

#### Step 1: Create PodGroup with `PreferGather` Strategy

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: topology-demo-job
  namespace: default
  annotations:
    gang.scheduling.koordinator.sh/network-topology-spec: |
      {
        "gatherStrategy": [
          {
            "layer": "BlockLayer",
            "strategy": "PreferGather"
          },
          {
            "layer": "SpineLayer",
            "strategy": "PreferGather"
          }
        ]
      }
spec:
  minMember: 4
  scheduleTimeoutSeconds: 300
```

#### Step 2: Create 4-Pod Training Job

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: training-pod-0
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: topology-demo-job
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "0"
spec:
  schedulerName: koord-scheduler
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
---
apiVersion: v1
kind: Pod
metadata:
  name: training-pod-1
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: topology-demo-job
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "1"
spec:
  schedulerName: koord-scheduler
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
---
apiVersion: v1
kind: Pod
metadata:
  name: training-pod-2
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: topology-demo-job
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "2"
spec:
  schedulerName: koord-scheduler
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
---
apiVersion: v1
kind: Pod
metadata:
  name: training-pod-3
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: topology-demo-job
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "3"
spec:
  schedulerName: koord-scheduler
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
```

#### Step 3: Apply and Verify the Scheduling Result

```bash
kubectl apply -f topology-demo-job.yaml
```

After a few seconds, check the pod scheduling results:

```bash
kubectl get pods -o wide | grep training-pod
```

Expected output:

```
NAME            READY   STATUS    RESTARTS   AGE   IP            NODE      NOMINATED NODE
training-pod-0  1/1     Running   0          30s   10.244.5.10   node-5    <none>
training-pod-1  1/1     Running   0          30s   10.244.6.11   node-6    <none>
training-pod-2  1/1     Running   0          30s   10.244.7.10   node-7    <none>
training-pod-3  1/1     Running   0          30s   10.244.8.11   node-8    <none>
```

#### How the Binpack Algorithm Works

**Step 1: Calculate offerslots from bottom to top**

For each node (each pod requires 8 CPU cores to occupy the entire node):
- All nodes (node-0 through node-11): offerslots = 1 (8 cores available / 8 cores per pod)

For each Block:
- block-0 (node-0, node-1, node-2): offerslots = 3
- block-1 (node-3, node-4): offerslots = 2
- block-2 (node-5, node-6): offerslots = 2
- block-3 (node-7, node-8): offerslots = 2
- block-4 (node-9, node-10, node-11): offerslots = 3

For each Spine:
- spine-0 (block-0, block-1): offerslots = 5
- spine-1 (block-2, block-3): offerslots = 4
- spine-2 (block-4): offerslots = 3

**Step 2: Find candidate topology nodes**

We need 4 pods (4 offerslots). Only spine-0 (5 slots) and spine-1 (4 slots) can accommodate the job.

At the Block level, no single block can accommodate all 4 pods, so candidates are at the Spine level.

**Step 3: Apply Binpack algorithm**

Among the candidate spines:
- spine-0: offerslots = 5, required = 4, waste = 1
- spine-1: offerslots = 4, required = 4, waste = 0  ← **Selected (minimum waste)**

The Binpack algorithm selects **spine-1** (node-5 through node-8), which has zero waste after placing all 4 pods.

**Final placement**: All 4 pods are scheduled to **spine-1** (node-5, node-6, node-7, node-8), achieving:
- **Optimal network performance (`PreferGather` effect)**: All pods are gathered within the same Spine (spine-1), minimizing cross-spine traffic and maximizing network bandwidth for inter-pod communication
- **Minimal resource waste (Binpack effect)**: spine-1 has exactly 4 slots for 4 pods (zero waste), while spine-0 would have 1 wasted slot. This leaves spine-0 with all 5 nodes available for future workloads, preventing resource fragmentation

### Example 2: `MustGather` and Topology-Aware Preemption

This example demonstrates why `MustGather` is necessary for certain workloads and how preemption respects network topology constraints. 

**Why `MustGather` is required**: In latency-sensitive distributed training scenarios, network communication patterns are extremely sensitive to latency. If pods are scattered across different Spines, cross-spine communication overhead can increase training time by 3-5x, making the job economically unfeasible. Therefore, **`MustGather` is not just an optimization—it's a hard requirement** for these workloads.

**How preemption respects topology**: When `MustGather` constraints cannot be satisfied due to insufficient resources, Koordinator performs **topology-aware preemption**. This means:
1. The scheduler identifies which low-priority pods need to be preempted
2. Preemption decisions respect the same topology constraints as scheduling
3. The scheduler ensures the freed resources can satisfy the `MustGather` requirements
4. Resources are reserved via `nominatedNode` to prevent other pods from stealing them

#### Scenario

This example shows a scenario where:
1. Low-priority pods occupy node-0, node-1, and node-5 (each pod occupies entire node)
2. A high-priority 4-pod job with `MustGather` to SpineLayer is submitted (each pod occupies entire node)
3. **No single Spine has 4 available nodes** without preemption
4. Koordinator performs topology-aware preemption: preempts the pod on node-5 and schedules all 4 high-priority pods to node-5 through node-8 (within spine-1), **maintaining the `MustGather` constraint throughout the preemption process**



- 3 low-priority pods already running on node-0, node-1, and node-5 (each occupying entire node with 8 cores)
- A high-priority 4-pod training job with strict network requirements:
  - **Requires `MustGather`** to SpineLayer: Cross-spine latency would degrade performance by 3-5x
  - Each pod requires **8 CPU cores** (occupies entire node)
- **Current state**: No single Spine has 4 available nodes
  - spine-0: 3 available nodes (node-2, node-3, node-4) - node-0, node-1 occupied
  - spine-1: 3 available nodes (node-6, node-7, node-8) - node-5 occupied
  - spine-2: 3 available nodes (node-9, node-10, node-11)

**Expected result**: The scheduler performs **topology-aware preemption**, preempting the low-priority pod on node-5 to satisfy the `MustGather` constraint, and schedules all 4 high-priority pods to **spine-1** (node-5 through node-8).

#### Step 1: Define PriorityClasses

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 1000000
preemptionPolicy: PreemptLowerPriority
description: "High priority for critical training jobs"
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: low-priority
value: 1000
preemptionPolicy: PreemptLowerPriority
description: "Low priority for best-effort jobs"
```

```bash
kubectl apply -f priorityclasses.yaml
```

#### Step 2: Create Low-Priority Pods on node-0, node-1, and node-5

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: low-priority-pod-0
  namespace: default
spec:
  schedulerName: koord-scheduler
  priorityClassName: low-priority
  nodeName: node-0
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
---
apiVersion: v1
kind: Pod
metadata:
  name: low-priority-pod-1
  namespace: default
spec:
  schedulerName: koord-scheduler
  priorityClassName: low-priority
  nodeName: node-1
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
---
apiVersion: v1
kind: Pod
metadata:
  name: low-priority-pod-5
  namespace: default
spec:
  schedulerName: koord-scheduler
  priorityClassName: low-priority
  nodeName: node-5
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
```

```bash
kubectl apply -f low-priority-pods.yaml
```

Verify the pods are running:

```bash
kubectl get pods -o wide
```

```
NAME                  READY   STATUS    RESTARTS   AGE   IP            NODE     NOMINATED NODE
low-priority-pod-0    1/1     Running   0          10s   10.244.0.10   node-0   <none>
low-priority-pod-1    1/1     Running   0          10s   10.244.1.10   node-1   <none>
low-priority-pod-5    1/1     Running   0          10s   10.244.5.10   node-5   <none>
```

#### Step 3: Create High-Priority Job with `MustGather` to SpineLayer

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: high-priority-training
  namespace: default
  annotations:
    gang.scheduling.koordinator.sh/network-topology-spec: |
      {
        "gatherStrategy": [
          {
            "layer": "SpineLayer",
            "strategy": "MustGather"
          }
        ]
      }
spec:
  minMember: 4
  scheduleTimeoutSeconds: 300
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hp-training-pod-0
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: high-priority-training
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "0"
spec:
  schedulerName: koord-scheduler
  priorityClassName: high-priority
  preemptionPolicy: PreemptLowerPriority
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
---
apiVersion: v1
kind: Pod
metadata:
  name: hp-training-pod-1
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: high-priority-training
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "1"
spec:
  schedulerName: koord-scheduler
  priorityClassName: high-priority
  preemptionPolicy: PreemptLowerPriority
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
---
apiVersion: v1
kind: Pod
metadata:
  name: hp-training-pod-2
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: high-priority-training
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "2"
spec:
  schedulerName: koord-scheduler
  priorityClassName: high-priority
  preemptionPolicy: PreemptLowerPriority
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
---
apiVersion: v1
kind: Pod
metadata:
  name: hp-training-pod-3
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: high-priority-training
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "3"
spec:
  schedulerName: koord-scheduler
  priorityClassName: high-priority
  preemptionPolicy: PreemptLowerPriority
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
```

#### Step 4: Apply and Observe Preemption

```bash
kubectl apply -f high-priority-training.yaml
```

Immediately after submitting, check the pod status:

```bash
kubectl get pods -o wide
```

Expected output during preemption:

```
NAME                  READY   STATUS        RESTARTS   AGE   IP            NODE     NOMINATED NODE
low-priority-pod-0    1/1     Running       0          2m    10.244.0.10   node-0   <none>
low-priority-pod-1    1/1     Running       0          2m    10.244.1.10   node-1   <none>
low-priority-pod-5    0/1     Terminating   0          2m    10.244.5.10   node-5   <none>
hp-training-pod-0     0/1     Pending       0          10s   <none>        <none>   node-5
hp-training-pod-1     0/1     Pending       0          10s   <none>        <none>   node-6
hp-training-pod-2     0/1     Pending       0          10s   <none>        <none>   node-7
hp-training-pod-3     0/1     Pending       0          10s   <none>        <none>   node-8
```

**Understanding Scheduler Messages During Topology-Aware Preemption**

While the preemption is in progress (before the victim pod fully terminates), the high-priority pods will be in `Pending` state. You can inspect the detailed scheduler messages:

```bash
kubectl get pod hp-training-pod-0 -o yaml
```

The pod status will contain informative messages explaining why scheduling is waiting:

```yaml
status:
  conditions:
  - lastProbeTime: null
    lastTransitionTime: "2025-10-23T07:35:30Z"
    message: '0/12 nodes are available: no candidate topology nodes can accommodate
      job, desiredOfferSlot: 4, topology topologyNode SpineLayer/spine-0: 3;topology
      topologyNode SpineLayer/spine-1: 3;topology topologyNode SpineLayer/spine-2:
      3. preemption: not eligible due to terminating pod on the nominated node..'
    reason: Unschedulable
    status: "False"
    type: PodScheduled
  nominatedNodeName: node-5
  phase: Pending
```

**Key information in the message:**

1. **Topology constraint evaluation**: `no candidate topology nodes can accommodate job, desiredOfferSlot: 4`
   - The job requires 4 slots (nodes) within a single topology domain

2. **Per-Spine availability**: 
   - `topology topologyNode SpineLayer/spine-0: 3` - Only 3 available nodes
   - `topology topologyNode SpineLayer/spine-1: 3` - Only 3 available nodes
   - `topology topologyNode SpineLayer/spine-2: 3` - Only 3 available nodes
   - **None of the Spines can satisfy the `MustGather` requirement without preemption**

3. **Preemption status**: `preemption: not eligible due to terminating pod on the nominated node`
   - Preemption has been triggered for low-priority-pod-5 on node-5
   - The scheduler is waiting for the victim pod to fully terminate
   - Resources have been reserved via `nominatedNodeName: node-5`

4. **GangGroup coordination**: Other member pods (hp-training-pod-1, hp-training-pod-2, hp-training-pod-3) will show similar messages, indicating they're waiting due to the GangGroup constraint:

```yaml
message: 'GangGroup "default/high-priority-training" gets rejected due to member Pod 
  "default/hp-training-pod-0" is unschedulable with reason "no candidate topology nodes 
  can accommodate job, desiredOfferSlot: 4...", alreadyWaitForBound: 0. preemption: 
  preemption already attempted by default/hp-training-pod-0 with message not eligible 
  due to terminating pod on the nominated node..'
```

This message confirms that:
- All pods in the GangGroup wait together (gang scheduling semantics)
- Preemption is coordinated at the job level
- Topology constraints are enforced throughout the preemption process

#### Step 5: Verify Final Scheduling Result

After the low-priority pod on node-5 terminates, check again:

```bash
kubectl get pods -o wide
```

Expected final output:

```
NAME                  READY   STATUS    RESTARTS   AGE   IP            NODE     NOMINATED NODE
low-priority-pod-0    1/1     Running   0          3m    10.244.0.10   node-0   <none>
low-priority-pod-1    1/1     Running   0          3m    10.244.1.10   node-1   <none>
hp-training-pod-0     1/1     Running   0          45s   10.244.5.20   node-5   <none>
hp-training-pod-1     1/1     Running   0          45s   10.244.6.20   node-6   <none>
hp-training-pod-2     1/1     Running   0          45s   10.244.7.20   node-7   <none>
hp-training-pod-3     1/1     Running   0          45s   10.244.8.20   node-8   <none>
```

#### How Topology-Aware Preemption Works

**Step 1: Identify topology requirements and validate `MustGather` constraint**

The high-priority job requires all 4 pods to be in the same Spine (`MustGather` to SpineLayer). This is a **hard constraint**—the job cannot run if this requirement is not met. Each pod requires 8 CPU cores (entire node).

**Step 2: Evaluate available resources per Spine (respecting topology)**

Current cluster state:
- spine-0 (5 nodes):
  - node-0: Occupied by low-priority-pod-0 (8 cores used, 0 cores available)
  - node-1: Occupied by low-priority-pod-1 (8 cores used, 0 cores available)
  - node-2: Available (8 cores)
  - node-3: Available (8 cores)
  - node-4: Available (8 cores)
  - Total: 3 nodes available (need 4 for the job)
  
- spine-1 (4 nodes):
  - node-5: Occupied by low-priority-pod-5 (8 cores used, 0 cores available)
  - node-6: Available (8 cores)
  - node-7: Available (8 cores)
  - node-8: Available (8 cores)
  - Total: 3 nodes available (need 4 for the job)
  
- spine-2 (3 nodes):
  - node-9: Available (8 cores)
  - node-10: Available (8 cores)
  - node-11: Available (8 cores)
  - Total: 3 nodes available (cannot accommodate 4 pods even with preemption)

**Key observation**: No single Spine has enough available resources without preemption. **The scheduler must perform topology-aware preemption to satisfy the `MustGather` constraint.**

**Step 3: Determine topology-aware preemption strategy**

The scheduler evaluates minimal preemption options **while respecting the SpineLayer topology constraint**:

- **spine-0**: Would need to preempt 1 node (either node-0 or node-1), resulting in 4 available nodes
  - Preemption count: 1 pod
  - After preemption: Can satisfy `MustGather` to SpineLayer
  
- **spine-1**: Would need to preempt 1 node (node-5), resulting in 4 available nodes
  - Preemption count: 1 pod
  - After preemption: Can satisfy `MustGather` to SpineLayer
  
- **spine-2**: Cannot accommodate 4 pods (only 3 nodes total)
  - Not a valid candidate

Both spine-0 and spine-1 require the same amount of preemption (1 pod). The Binpack algorithm chooses **spine-1** because:
1. It has exactly 4 nodes (perfect fit, zero waste)
2. After preempting node-5: all 4 nodes in spine-1 become available
3. This satisfies the `MustGather` constraint with minimal disruption

**Step 4: Execute topology-aware preemption**

Koordinator performs preemption **while maintaining topology constraints**:
1. Marks low-priority-pod-5 for preemption (sets DisruptionTarget condition)
2. Sets `nominatedNode` for all 4 high-priority pods to nodes **within spine-1** (node-5 through node-8)
   - This ensures topology constraints are preserved during resource reservation
3. Deletes low-priority-pod-5
4. Schedules all high-priority pods to spine-1, **satisfying the `MustGather` constraint**

**Key takeaways:**

1. **`MustGather` is a hard requirement**: For latency-sensitive workloads like Tensor Parallelism training, `MustGather` is not optional—it's essential for acceptable performance. Cross-spine communication would make the job 3-5x slower.

2. **Preemption respects topology constraints**: When `MustGather` cannot be satisfied with available resources, the scheduler performs **topology-aware preemption**. It evaluates preemption candidates **within each topology domain** (Spine) separately, ensuring the final placement satisfies the topology requirements.

3. **Minimal disruption**: The scheduler preempted only 1 pod (the minimum necessary) to satisfy the `MustGather` constraint, choosing spine-1 because it's a perfect fit (4 nodes for 4 pods).

4. **Resource reservation maintains topology**: The `nominatedNode` mechanism reserves resources **within the selected topology domain** (spine-1), preventing other pods from breaking the topology constraint during the preemption process.

5. **End-to-end topology guarantee**: From preemption decision through resource reservation to final scheduling, the entire process maintains the `MustGather` constraint, ensuring all 4 pods are placed within spine-1.

## Advanced Configuration

### Topology Layer Naming Conventions

It's recommended to use clear naming conventions to identify topology layers:

```yaml
# Recommended layer naming
NodeTopologyLayer       # Node layer
AcceleratorLayer        # Accelerator interconnection layer (e.g., NVLink)
BlockLayer              # Block switch layer
SpineLayer              # Spine switch layer
DatacenterLayer         # Datacenter layer
```

### Topology Strategy Selection Guide

| Strategy | Use Case | Behavior |
|----------|----------|----------|
| `PreferGather` | Topology Layer need good network performance but can tolerate some dispersion | Gather as much as possible, but allow dispersion when resources are insufficient |
| `MustGather` | Topology Layer with strict network bandwidth requirements | Must gather in the specified layer, otherwise scheduling fails |

### Multi-PodGroup Coordinated Scheduling

For complex training jobs containing master and worker, use `GangGroup` semantics:

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  annotations:
    gang.scheduling.koordinator.sh/groups: |
      ["default/llm-master", "default/llm-worker"]
    gang.scheduling.koordinator.sh/network-topology-spec: |
      {
        "gatherStrategy": [
          {
            "layer": "SpineLayer",
            "strategy": "MustGather"
          }
        ]
      }
```

Ensure all related PodGroups use the same `gang.scheduling.koordinator.sh/groups` and `gang.scheduling.koordinator.sh/network-topology-spec` annotation.

## Troubleshooting

### Pod Stuck in Pending State

**Possible Cause**: Network topology constraints are too strict, not enough nodes satisfy the requirements

**Solution**: 
- Check cluster topology configuration: `kubectl get clusternetworktopology default -o yaml`
- Relax topology strategy, change `MustGather` to `PreferGather`
- Add cluster nodes or adjust node topology labels

### Topology-Aware Scheduling Not Taking Effect

**Troubleshooting Steps**:

1. Verify if Koord-Scheduler has the network topology plugin enabled:

```bash
kubectl -n koordinator-system get cm koord-scheduler-config -o yaml
```

2. Check if nodes have the correct topology labels:

```bash
kubectl get nodes --show-labels | grep network.topology
```

3. Check ClusterNetworkTopology status:

```bash
kubectl get clusternetworktopology default -o yaml
```

### Preemption Not Occurring as Expected

**Check**:

1. Confirm PriorityClass is configured correctly
2. Check Pod's `preemptionPolicy` setting
3. View scheduler logs:

```bash
kubectl -n koordinator-system logs -l component=koord-scheduler --tail=100
```

## Best Practices

1. **Start with `PreferGather` strategy**: For initial deployments, use `PreferGather` to understand pod placement patterns before applying strict `MustGather` constraints

2. **Use topology indices for distributed training**: Always assign `gang.scheduling.koordinator.sh/network-topology-index` annotations to establish clear communication patterns in data-parallel jobs

3. **Choose appropriate topology layers**:
   - For latency-sensitive inference services: `MustGather` + `BlockLayer`
   - For large-scale LLM training: `MustGather` + `SpineLayer`
   - For general distributed training: `PreferGather` combination across multiple layers

4. **Combine with priorities for critical workloads**: Set high priorities for production training jobs to ensure they can preempt lower-priority jobs while maintaining topology constraints

5. **Monitor topology distribution**: Regularly check pod placement patterns and adjust topology strategies based on actual network performance metrics

6. **Plan for preemption scenarios**: When using `MustGather`, ensure there's enough capacity in at least one topology domain to avoid scheduling failures

## References

- [Job Architecture](../architecture/job)
- [Job Level Preemption](../user-manuals/job-level-preemption)
- [Gang Scheduling](../user-manuals/gang-scheduling)
- [Network Topology Proposal](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20250611-networktopology-aware-scheduling.md)

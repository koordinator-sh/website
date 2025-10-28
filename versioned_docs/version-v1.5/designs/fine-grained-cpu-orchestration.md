# Fine-grained CPU orchestration

## Summary

This proposal defines the fine-grained CPU orchestration for Koordinator QoS in detail, and how to be compatible with the existing design principles and implementations of K8s. This proposal describes the functionality that koordlet, koord-runtime-proxy and koord-scheduler need to enhance.

## Motivation

An increasing number of systems leverage a combination of CPUs and hardware accelerators to support latency-critical execution and high-throughput parallel computation. These include workloads in fields such as telecommunications, scientific computing, machine learning, financial services and data analytics. Such hybrid systems comprise a high performance environment.

In order to extract the best performance, optimizations related to CPU isolation, NUMA-locality are required.

### Goals

1. Improve the CPU orchestration semantics of Koordinator QoS.
1. Determine compatible kubelet policies.
1. Clarify how koordlet should enhance CPU scheduling mechanism.
1. Provide a set of API such as CPU bind policies, CPU exclusive policies, NUMA topology alignment policies, NUMA topology information, etc. for applications and cluster administrator to support complex CPU orchestration scenarios.
1. Provide the CPU orchestration optimization API.

### Non-Goals/Future Work

1. Describe specific design details of koordlet/koord-runtime-proxy.
1. Describe specific design details of CPU descheduling mechanism.

## Proposal

### Design Overview

![image](/img/cpu-orchestration-seq-uml.svg)

When koordlet starts, koordlet gather the NUMA topology information from kubelet include NUMA Topology, CPU Topology, kubelet cpu management policy, kubelet allocated CPUs for Guaranteed Pods etc., and update to the NodeResourceTopology CRD. The latency-sensitive applications are scaling, the new Pod can set Koordinator QoS with LSE/LSR, CPU Bind policy and CPU exclusive policy to require koord-scheduler to allocate best-fit CPUs to get the best performance. When koord-scheduler scheduling the Pod, koord-scheduler will filter Nodes that satisfied NUMA Topology Alignment policy, and select the best Node by scoring, allocating the CPUs in Reserve phase, and records the result to Pod annotation when PreBinding. koordlet hooks the kubelet CRI request to replace the CPUs configuration parameters with the koord-scheduler scheduled result to the runtime such as configure the cgroup.

### User stories

#### Story 1

Compatible with kubelet's existing CPU management policies. The CPU manager policy `static` allows pods with certain resource characteristics to be granted increased CPU affinity and exclusivity in the node. If enabled the `static` policy, the cluster administrator must configure the kubelet reserve some CPUs. There are some options for `static` policy. If the `full-pcpus-only(beta, visible by default)` policy option is specified, the `static` policy will always allocate full physical cores. If the `distribute-cpus-across-numa(alpha, hidden by default)` option is specified, the `static` policy will evenly distribute CPUs across NUMA nodes in cases where more than one NUMA node is required to satisfy the allocation.

#### Story 2

Similarly, the semantics of the existing K8s Guaranteed Pods in the community should be compatible. The cpu cores allocated to K8s Guaranteed Pods with `static` policy will not share to the default best effort Pods, so it is equivalent to LSE. But when the load in the node is relatively low, the CPUs allocated by LSR Pods should be shared with best effort workloads to obtain economic benefits. 

#### Story 3

The Topology Manager is a kubelet component that aims to coordinate the set of components that are responsible for these optimizations. After Topology Manager was introduced the problem of launching pod in the cluster where worker nodes have different NUMA topology and different amount of resources in that topology became actual. The Pod could be scheduled in the node where the total amount of resources is enough, but resource distribution could not satisfy the appropriate Topology policy. 

#### Story 4

The scheduler can coordinate the arrangement between latency-sensitive applications. For example, the same latency-sensitive applications can be mutually exclusive in the CPU dimension, and latency-sensitive applications and general applications can be deployed in the CPU dimension affinity. Costs can be reduced and runtime quality can be guaranteed.

#### Story 5

When allocating CPUs based on NUMA topology, users want to have different allocation strategies. For example, bin-packing takes precedence, or assigns the most idle NUMA Node.

#### Story 6

As the application scaling or rolling deployment, the best-fit allocatable space will gradually become fragmented, which will lead to the bad allocation effect of some strategies and affect the runtime effect of the application. 

## Design Details

### Basic CPU orchestration principles

1. Only supports the CPU allocation mechanism of the Pod dimension.
1. Koordinator divides the CPU on the machine into `CPU Shared Pool`, `statically exclusive CPUs` and `BE CPU Shared Pool`. 
    1. The `CPU Shared Pool` is the set of CPUs on which any containers in `K8s Burstable` and `Koordinator LS` Pods run. Containers in `K8s Guaranteed` pods with `fractional CPU requests` also run on CPUs in the shared pool. The shared pool contains all unallocated CPUs in the node but excluding CPUs allocated by K8s Guaranteed, LSE and LSR Pods. If kubelet reserved CPUs, the shared pool includes the reserved CPUs. 
    1. The `statically exclusive CPUs` are the set of CPUs on which any containers in `K8s Guaranteed`, `Koordinator LSE` and `LSR` Pods that have integer CPU run. When new K8s Guaranteed, LSE and LSR Pods request CPU, koord-scheduler will allocate from the `CPU Shared Pool`.
    1. The `BE CPU Shared pool` is the set of CPUs on which any containers in `K8s BestEffort` and `Koordinator BE` Pods run. The `BE CPU Shared Pool` contains all CPUs in the node but excluding CPUs allocated by `K8s Guaranteed` and `Koordinator LSE` Pods.

### Koordinator QoS CPU orchestration principles

1. The Request and Limit of LSE/LSR Pods **MUST** be equal and the CPU value **MUST** be an integer multiple of 1000.
1. The CPUs allocated by the LSE Pod are completely **exclusive** and **MUST NOT** be shared. If the node is hyper-threading architecture, only the logical core dimension is guaranteed to be isolated, but better isolation can be obtained through the `CPUBindPolicyFullPCPUs` policy.
1. The CPUs allocated by the LSR Pod only can be shared with BE Pods.
1. LS Pods bind the CPU shared pool, **excluding** CPUs allocated by LSE/LSR Pods.
1. BE Pods bind all CPUs in the node, **excluding** CPUs allocated by LSE Pods.
1. The K8s Guaranteed Pods already running is equivalent to Koordinator LSR if kubelet enables the CPU manager `static` policy.
1. The K8s Guaranteed Pods already running is equivalent to Koordinator LS if kubelet enables the CPU manager `none` policy.
1. Newly created K8s Guaranteed Pod without Koordinator QoS specified will be treated as LS.

![img](/img/qos-cpu-orchestration.png)

### Compatible kubelet CPU management policies

1. If kubelet set the CPU manager policy options `full-pcpus-only=true` / `distribute-cpus-across-numa=true`, and there is no new CPU bind policy defined by Koordinator in the node, follow the semantics of these parameters defined by the kubelet.
1. If kubelet set the Topology manager policy, and there is no new NUMA Topology Alignment policy defined by Koordinator in the node, follow the semantics of these parameters defined by the kubelet. 

### Take over kubelet CPU management stages

The node formerly managed by the kubelet static CPU manager can be taken over by Koordinator with the following steps:
1. When the users want to keep the kubelet static cpu manager in use until the node is offline or removed, they
   can set the koordlet's argument `disable-query-kubelet-config=true` and feature-gate`CPUSetAllocator=false`. 
   It will disable the reporting of the kubelet cpu manager state and the cpuset cgroups managment of the koordlet, so
   to make the koord-scheduler ignore the cpuset cpus managed by the kubelet. With these configurations, the scheduler
   can allocate the cpuset cpus including the cpus managed by the kubelet static cpu manager. And the container cgroups'
   cpuset are still managed by the kubelet. When the node is offline or ready to go to the stage 2, the users can reset
   the `disable-query-kubelet-config=false` and enable the feature-gate `CPUSetAllocator=false`.
2. By default, the koordlet should take over the cpuset cpus for the new pods. The remain cpuset pods managed by the
   kubelet static cpu manager are reported according to the `/configz` and `cpu_manager_state`, so the related cpuset
   cpus are excluded from the cpu allocation of the scheduler. For the newly-scheduled cpuset pods, the koordlet
   follows their cpuset allocation results on the annotations that are exclusive to the remaining cpuset cpus managed
   by the kubelet static cpu manager. The users should no longer use the kubelet static cpu manager anymore and should
   set the policy to "none". After the last pod of the static cpu manager policy is terminated, the cpuset cpus will
   be fully managed by the koordlet.

### Take over kubelet CPU management policies

Because the CPU reserved by kubelet mainly serves K8s BestEffort and Burstable Pods. But Koordinator will not follow the policy. The K8s Burstable Pods should use the CPU Shared Pool, and the K8s BestEffort Pods should use the `BE CPU Shared Pool`.

1. For K8s Burstable and Koordinator LS Pods:
    1. When the koordlet starts, calculates the `CPU Shared Pool` and applies the shared pool to all Burstable and LS Pods in the node, that is, updating their cgroups to set cpuset. The same logic is executed when LSE/LSR Pods are creating or destroying. 
    1. koordlet ignore the CPUs reserved by kubelet, and replace them with CPU Shared Pool defined by Koordinator. 
1. For K8s BestEffort and Koordinator BE Pods:
    1. If kubelet reserved CPUs, the best effort Pods use the reserved CPUs first.
    1. koordlet can use all CPUs in the node but exclude the CPUs allocated by K8s Guaranteed and Koordinator LSE Pods that have integer CPU. It means that if koordlet enables the CPU Suppress feature should follow the constraint to guarantee not affecting LSE Pods. Similarly, if kubelet enables the CPU manager policy with `static`, the K8s Guaranteed Pods should also be excluded. 
1. For K8s Guaranteed Pods:
    1. If there is `scheduling.koordinator.sh/resource-status` updated by koord-scheduler in the Pod annotation, then replace the CPUSet in the kubelet CRI request, including Sandbox/Container creating stage.
    1. kubelet sometimes call `Update` method defined in CRI to update container cgroup to set new CPUs, so koordlet and koord-runtime-proxy need to hook the method.
1. Automatically resize CPU Shared Pool
    1. koordlet automatically resize `CPU Shared Pool` based on the changes such as Pod creating/destroying. If `CPU Shared Pool` changed, koordlet should update cgroups of all LS/K8s Burstable Pods with the CPUs of shared pool. 
    1. If the corresponding `CPU Shared Pool` is specified in the annotation `scheduling.koordinator.sh/resource-status` of the Pod, koordlet need to bind only the CPUs of the corresponding pool when configuring the cgroup.

The takeover logic will require koord-runtime-proxy to add new extension points, and require koordlet to implement a new runtime hook plugin. When koord-runtime-proxy is not installed, these takeover logic will also be able to be implemented.

## CPU orchestration API

### Application CPU CPU orchestration API

#### Resource spec

The annotation `scheduling.koordinator.sh/resource-spec` is a resource allocation API defined by Koordinator. The user specifies the desired CPU orchestration policy by setting the annotation. In the future, we can also extend and add resource types that need to be supported as needed. The scheme corresponding to the annotation value is defined as follows:

```go
// ResourceSpec describes extra attributes of the compute resource requirements.
type ResourceSpec struct {
  PreferredCPUBindPolicy       CPUBindPolicy      `json:"preferredCPUBindPolicy,omitempty"`
  PreferredCPUExclusivePolicy  CPUExclusivePolicy `json:"preferredCPUExclusivePolicy,omitempty"`
}

type CPUBindPolicy string

const (
  // CPUBindPolicyDefault performs the default bind policy that specified in koord-scheduler configuration
  CPUBindPolicyDefault CPUBindPolicy = "Default"
  // CPUBindPolicyFullPCPUs favor cpuset allocation that pack in few physical cores
  CPUBindPolicyFullPCPUs CPUBindPolicy = "FullPCPUs"
  // CPUBindPolicySpreadByPCPUs favor cpuset allocation that evenly allocate logical cpus across physical cores
  CPUBindPolicySpreadByPCPUs CPUBindPolicy = "SpreadByPCPUs"
  // CPUBindPolicyConstrainedBurst constrains the CPU Shared Pool range of the Burstable Pod
  CPUBindPolicyConstrainedBurst CPUBindPolicy = "ConstrainedBurst"
)

type CPUExclusivePolicy string

const (
  // CPUExclusivePolicyDefault performs the default exclusive policy that specified in koord-scheduler configuration
  CPUExclusivePolicyDefault CPUExclusivePolicy = "Default"
  // CPUExclusivePolicyPCPULevel represents mutual exclusion in the physical core dimension 
  CPUExclusivePolicyPCPULevel CPUExclusivePolicy = "PCPULevel"
  // CPUExclusivePolicyNUMANodeLevel indicates mutual exclusion in the NUMA topology dimension
  CPUExclusivePolicyNUMANodeLevel CPUExclusivePolicy = "NUMANodeLevel"
)
```

- The `CPUBindPolicy` defines the CPU binding policy. The specific values are defined as follows:
   - `CPUBindPolicyDefault` or empty value performs the default bind policy that specified in koord-scheduler configuration.
   - `CPUBindPolicyFullPCPUs` is a bin-packing policy, similar to the `full-pcpus-only=true` option defined by the kubelet, that allocate full physical cores. However, if the number of remaining logical CPUs in the node is sufficient but the number of full physical cores is insufficient, the allocation will continue. This policy can effectively avoid the noisy neighbor problem.
   - `CPUBindPolicySpreadByPCPUs` is a spread policy. If the node enabled Hyper-Threading, when this policy is adopted, the scheduler will evenly allocate logical CPUs across physical cores. For example, the current node has 8 physical cores and 16 logical CPUs. When a Pod requires 8 logical CPUs and the `CPUBindPolicySpreadByPCPUs` policy is adopted, the scheduler will allocate an logical CPU from each physical core. This policy is mainly used by some latency-sensitive applications with multiple different peak-to-valley characteristics. It can not only allow the application to fully use the CPU at certain times, but will not be disturbed by the application on the same physical core. So the noisy neighbor problem may arise when using this policy.
   - `CPUBindPolicyConstrainedBurst` a special policy that mainly helps K8s Burstable/Koordinator LS Pod get better performance. When using the policy, koord-scheduler is filtering out Nodes that have NUMA Nodes with suitable CPU Shared Pool by Pod Limit. After the scheduling is successful, the scheduler will update `scheduling.koordinator.sh/resource-status` in the Pod, declaring the `CPU Shared Pool` to be bound. The koordlet binds the CPU Shared Pool of the corresponding NUMA Node according to the `CPU Shared Pool`
   - If `kubelet.koordinator.sh/cpu-manager-policy` in `NodeResourceTopology` has option `full-pcpus-only=true`, or `node.koordinator.sh/cpu-bind-policy` in the Node with the value `PCPUOnly`, the koord-scheduler will check whether the number of CPU requests of the Pod meets the `SMT-alignment` requirements, so as to avoid being rejected by the kubelet after scheduling. koord-scheduler will avoid such nodes if the Pod uses the `CPUBindPolicySpreadByPCPUs` policy or the number of logical CPUs mapped to the number of physical cores is not an integer.
- The `CPUExclusivePolicy` defines the CPU exclusive policy, it can help users to avoid noisy neighbor problems. The specific values are defined as follows:
   - `CPUExclusivePolicyDefault` or empty value performs the default exclusive policy that specified in koord-scheduler configuration.
   - `CPUExclusivePolicyPCPULevel`. When allocating logical CPUs, try to avoid physical cores that have already been applied for by the same exclusive policy. It is a supplement to the `CPUBindPolicySpreadByPCPUs` policy. 
   - `CPUExclusivePolicyNUMANodeLevel`. When allocating logical CPUs, try to avoid NUMA Nodes that has already been applied for by the same exclusive policy. If there is no NUMA Node that satisfies the policy, downgrade to `CPUExclusivePolicyPCPULevel` policy.

For the ARM architecture, `CPUBindPolicy` only support `CPUBindPolicyFullPCPUs`, and `CPUExclusivePolicy` only support `CPUExclusivePolicyNUMANodeLevel`.

#### Resource status

The annotation `scheduling.koordinator.sh/resource-status` represents resource allocation result. koord-scheduler patch Pod with the annotation before binding to node. koordlet uses the result to configure cgroup.

The scheme corresponding to the annotation value is defined as follows:

```go
type ResourceStatus struct {
  CPUSet         string          `json:"cpuset,omitempty"`
  CPUSharedPools []CPUSharedPool `json:"cpuSharedPools,omitempty"`
}
```

- `CPUSet` represents the allocated CPUs. When LSE/LSR Pod requested, koord-scheduler will update the field. It is Linux CPU list formatted string. For more details, please refer to [doc](http://man7.org/linux/man-pages/man7/cpuset.7.html#FORMATS).
- `CPUSharedPools` represents the desired CPU Shared Pools used by LS Pods. If the Node has the label `node.koordinator.sh/numa-topology-policy` with `Restricted/SingleNUMANode`, koord-scheduler will find the best-fit NUMA Node for the LS Pod, and update the field that requires koordlet uses the specified CPU Shared Pool. It should be noted that the scheduler does not update the `CPUSet` field in the `CPUSharedPool`, koordlet binds the CPU Shared Pool of the corresponding NUMA Node according to the `Socket` and `Node` fields in the `CPUSharedPool`.

#### Example

The following specific example:

```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    scheduling.koordinator.sh/resource-spec: |-
      {
        "preferredCPUBindPolicy": "SpreadByPCPUs",
        "preferredCPUExclusivePolicy": "PCPULevel"
      }
    scheduling.koordinator.sh/resource-status: |-
      {
        "cpuset": "0-3"
      }
  name: test-pod
  namespace: default
spec:
  ...
```

### Node CPU orchestration API

From the perspective of cluster administrators, it is necessary to support some APIs to control the CPU orchestration behavior of nodes.

#### CPU bind policy

The label `node.koordinator.sh/cpu-bind-policy` constrains how to bind CPU logical CPUs when scheduling. 

The following is the specific value definition:
- `None` or empty value does not perform any policy.
- `FullPCPUsOnly` requires that the scheduler must allocate full physical cores. Equivalent to kubelet CPU manager policy option `full-pcpus-only=true`. 
- `SpreadByPCPUs` requires that the schedler must evenly allocate logical CPUs across physical cores. 

If there is no `node.koordinator.sh/cpu-bind-policy` in the node's label, it will be executed according to the policy configured by the Pod or koord-scheduler.

#### NUMA allocate strategy

The label `node.koordinator.sh/numa-allocate-strategy` indicates how to choose satisfied NUMA Nodes when scheduling. The following is the specific value definition:
- `MostAllocated` indicates that allocates from the NUMA Node with the least amount of available resource.
- `LeastAllocated` indicates that allocates from the NUMA Node with the most amount of available resource.
- `DistributeEvenly` indicates that evenly distribute CPUs across NUMA Nodes.

If the cluster administrator does not set label `node.koordinator.sh/numa-allocate-strategy` on Node, but `kubelet.koordinator.sh/cpu-manager-policy` in `NodeResourceTopology` has option `distribute-cpus-across-numa=true`, then follow the semantic allocation of `distribute-cpus-across-numa`. 

If there is no `node.koordinator.sh/numa-allocate-strategy` in the node's label and no `kubelet.koordinator.sh/cpu-manager-policy` with `distribute-cpus-across-numa` option in `NodeResourceTopology`, it will be executed according to the policy configured by the koord-scheduler.

If both `node.koordinator.sh/numa-allocate-strategy` and `kubelet.koordinator.sh/cpu-manager-policy` are defined, `node.koordinator.sh/numa-allocate-strategy` is used first.

#### NUMA topology alignment policy

The label `node.koordinator.sh/numa-topology-policy` represents that how to aligning resource allocation according to the NUMA topology. The policy semantic follow the K8s community. Equivalent to the field `TopologyPolicies` in `NodeResourceTopology`, and the topology policies `SingleNUMANodePodLevel` and `SingleNUMANodeContainerLevel` are mapping to `SingleNUMANode` policy. 

- `None` is the default policy and does not perform any topology alignment.
- `BestEffort` indicates that preferred select NUMA Node that is topology alignment, and if not, continue to allocate resources to Pods.
- `Restricted` indicates that each resource requested by a Pod on the NUMA Node that is topology alignment, and if not, koord-scheduler will skip the node when scheduling.
- `SingleNUMANode` indicates that all resources requested by a Pod must be on the same NUMA Node, and if not, koord-scheduler will skip the node when scheduling.

If there is no `node.koordinator.sh/numa-topology-policy` in the node's label and `TopologyPolicies=None` in `NodeResourceTopology`, it will be executed according to the policy configured by the koord-scheduler.

If both `node.koordinator.sh/numa-topology-policy` in Node and `TopologyPolicies=None` in `NodeResourceTopology` are defined, `node.koordinator.sh/numa-topology-policy` is used first.

#### Example

The following specific example:

```yaml
apiVersion: v1
kind: Node
metadata:
  labels:
    node.koordinator.sh/cpu-bind-policy: "FullPCPUsOnly"
    node.koordinator.sh/numa-topology-policy: "BestEffort"
    node.koordinator.sh/numa-allocate-strategy: "MostAllocated"
  name: node-0
spec:
  ...
```

### NodeResourceTopology CRD

The node resource information to be reported mainly includes the following categories:

- NUMA Topology, including resources information, CPU information such as logical CPU ID, physical Core ID, NUMA Socket ID and NUMA Node ID and etc. 
- The topology manager scopes and policies configured by kubelet.
- The CPU manager policies and options configured by kubelet.
- Pod bound CPUs allocated by kubelet or koord-scheduler, including K8s Guaranteed Pods, Koordinator LSE/LSR Pods but except the LS/BE.
- CPU Shared Pool defined by koordlet

The above information can guide koord-scheduler to better be compatible with the kubelet's CPU management logic, make more appropriate scheduling decisions and help users quickly troubleshoot.

#### CRD Scheme definition

We use [NodeResourceTopology](https://github.com/k8stopologyawareschedwg/noderesourcetopology-api/blob/master/pkg/apis/topology/v1alpha1/types.go) CRD to describe the NUMA Topology. The community-defined NodeResourceTopology CRD is mainly used for the following considerations:

- NodeResourceTopology already contains basic NUMA topology information and kubelet TopologyManager's Scope and Policies information. We can reuse the existing codes.
- Keep up with the evolution of the community and influence the community to make more changes.

#### Compatible

The koordlet creates or updates NodeResourceTopology periodically. The name of NodeResourceTopology is same as the name of Node. and add the label `app.kubernetes.io/managed-by=Koordinator` describes the node is managed by Koordinator.

#### Extension

At present, the NodeResourceTopology lacks some information, and it is temporarily written in the NodeResourceTopology in the form of annotations or labels:

- The annotation `kubelet.koordinator.sh/cpu-manager-policy` describes the kubelet CPU manager policy and options. The scheme is defined as follows:

```go
const (
  FullPCPUsOnlyOption            string = "full-pcpus-only"
  DistributeCPUsAcrossNUMAOption string = "distribute-cpus-across-numa"
)

type KubeletCPUManagerPolicy struct {
  Policy  string            `json:"policy,omitempty"`
  Options map[string]string `json:"options,omitempty"`
  ReservedCPUs string       `json:"reservedCPUs,omitempty"`
}

```

- The annotation `node.koordinator.sh/cpu-topology` describes the detailed CPU topology. Fine-grained management mechanism needs more detailed CPU topology information. The scheme is defined as follows:

```go
type CPUTopology struct {
  Detail []CPUInfo `json:"detail,omitempty"`
}

type CPUInfo struct {
  ID     int32 `json:"id"`
  Core   int32 `json:"core"`
  Socket int32 `json:"socket"`
  Node   int32 `json:"node"`
}
```

- annotation `node.koordinator.sh/pod-cpu-allocs` describes the CPUs allocated by Koordinator LSE/LSR and K8s Guaranteed Pods. The scheme corresponding to the annotation value is defined as follows:

```go
type PodCPUAlloc struct {
  Namespace        string    `json:"namespace,omitempty"`
  Name             string    `json:"name,omitempty"`
  UID              types.UID `json:"uid,omitempty"`
  CPUSet           string    `json:"cpuset,omitempty"`
  ManagedByKubelet bool      `json:"managedByKubelet,omitempty"`
}

type PodCPUAllocs []PodCPUAlloc
```

- The annotation `node.koordinator.sh/cpu-shared-pools` describes the CPU Shared Pool defined by Koordinator. The shared pool is mainly used by Koordinator LS Pods or K8s Burstable Pods. The scheme is defined as follows:

```go
type NUMACPUSharedPools []CPUSharedPool

type CPUSharedPool struct {
  Socket int32  `json:"socket"`
  Node   int32  `json:"node"`
  CPUSet string `json:"cpuset,omitempty"`
}
```
The `CPUSet` field is Linux CPU list formatted string. For more details, please refer to [doc](http://man7.org/linux/man-pages/man7/cpuset.7.html#FORMATS).


#### Create/Update NodeResourceTopology

- koordlet is responsible for creating/updating NodeResourceTopology
- It is recommended that koordlet obtain the CPU allocation information of the existing K8s Guaranteed Pod by parsing the CPU state checkpoint file. Or obtain this information through the CRI interface and gRPC provided by kubelet.
- When the CPU of the Pod is allocated by koord-scheduler, replace the CPUs in the kubelet state checkpoint file.
- It is recommended that koordlet obtain the CPU manager policy and options from [kubeletConfiguration](https://kubernetes.io/docs/reference/config-api/kubelet-config.v1beta1/).

#### Example

A complete NodeResourceTopology example:

```yaml
apiVersion: topology.node.k8s.io/v1alpha1
kind: NodeResourceTopology
metadata:
  annotations:
    kubelet.koordinator.sh/cpu-manager-policy: |-
      {
        "policy": "static",
        "options": {
          "full-pcpus-only": "true",
          "distribute-cpus-across-numa": "true"
        }
      }
    node.koordinator.sh/cpu-topology: |-
          {
            "detail": [
              {
                "id": 0,
                "core": 0,
                "socket": 0,
                "node": 0
              },
              {
                "id": 1,
                "core": 1,
                "socket": 1,
                "node": 1
              }
            ]
          }
    node.koordinator.sh/cpu-shared-pools: |-
      [
        {
          "socket": 0,
          "node": 0, 
          "cpuset": "0-3"
        }
      ]
    node.koordinator.sh/pod-cpu-allocs: |-
      [
        {
          "namespace": "default",
          "name": "static-guaranteed-pod",
          "uid": "32b14702-2efe-4be9-a9da-f3b779175846",
          "cpu": "4-8",
          "managedByKubelet": "true"
        }
      ]
  labels:
    app.kubernetes.io/managed-by: Koordinator
  name: node1
topologyPolicies: ["SingleNUMANodePodLevel"]
zones:
  - name: node-0
    type: Node
    resources:
      - name: cpu
        capacity: 20
        allocatable: 15
        available: 10
      - name: vendor/nic1
        capacity: 3
        allocatable: 3
        available: 3
  - name: node-1
    type: Node
    resources:
      - name: cpu
        capacity: 30
        allocatable: 25
        available: 15
      - name: vendor/nic2
        capacity: 6
        allocatable: 6
        available: 6
  - name: node-2
    type: Node
    resources:
      - name: cpu
        capacity: 30
        allocatable: 25
        available: 15
      - name: vendor/nic1
        capacity: 3
        allocatable: 3
        available: 3
  - name: node-3
    type: Node
    resources:
      - name: cpu
        capacity: 30
        allocatable: 25
        available: 15
      - name: vendor/nic1
        capacity: 3
        allocatable: 3
        available: 3
```
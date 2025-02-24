---
slug: release-v1.6.0
title: "Koordinator v1.6: Support typical scheduling scenarios in the AI/ML domain! Continuously optimization in areas such as resource reservation, co-location, and rescheduling!"
authors: [ZiMengSheng,saintube,]
tags: [release]
---

## Background
In the past two years, Koordinator has been continuously committed to providing efficient co-located workload orchestration and resource scheduling solutions for the Kubernetes community. We have also made significant efforts to support more workloads and resource types. 

Following the release of fine-grained GPU sharing scheduling capabilities in v0.7, the community has been continuously enhancing Koordinator's device scheduling capabilities. In the Koordinator v1.6 release, we have improved Koordinator's device topology scheduling capabilities, supporting the recognition of GPU topologies for more machine types, thereby accelerating GPU interconnectivity within AI applications. Additionally, we have collaborated with other open-source projects in the community to provide end-to-end joint allocation capabilities for GPUs and RDMA, as well as strong GPU isolation capabilities. These enhancements accelerate cross-machine interconnectivity for typical AI training tasks and increase the deployment density of AI inference tasks, better ensuring application performance and improving cluster resource utilization.

We are delighted to announce the release of Koordinator v1.6.0. This version not only includes the aforementioned enhancements in device scheduling capabilities but also strengthens the resource plugins in the Kubernetes community, allowing different node scoring strategies for different resource configurations. This feature effectively reduces GPU fragmentation when GPU and CPU tasks are co-located in the same cluster. Furthermore, this release includes a series of functional optimizations in areas such as resource reservation, co-location, scheduling, and rescheduling.

This is the 14th major version released by Koordinator since it was officially open-sourced in April 2022. Over the past two years, Koordinator has been fortunate to attract many outstanding engineers from companies such as Alibaba, Ant Group, Intel, Xiaohongshu, Xiaomi, iQIYI, 360, and Youzan, who have contributed numerous ideas, code, and use cases. In the v1.6.0 release, 10 new developers joined the Koordinator community: @LY-today, @AdrianMachao, @TaoYang526, @dongjiang1989, @chengjoey, @JBinin, @clay-wangzhi, @ferris-cx, @nce3xin, and @lijunxin559. We would like to express our gratitude to all the community members for their active participation and contributions, and to everyone for their ongoing dedication to the community.



## Key Features
### Acceleration of GPU interconnectivity within AI applications: GPU topology-aware scheduling
With the rapid development of fields such as deep learning and high-performance computing (HPC), GPUs have become a core resource for many compute-intensive workloads. In Kubernetes clusters, efficient GPU utilization is crucial for enhancing application performance and resource utilization. However, the performance of GPU resources is not uniform and is influenced by hardware topology and resource allocation. For example:

In systems with multiple NUMA nodes, the physical connections between GPUs, CPUs, and memory can affect data transfer speeds and computational efficiency.
For NVIDIA cards like the L20 and L40S, the communication efficiency between GPUs depends on whether they belong to the same PCIe or the same NUMA node.
For Huawei Ascend NPUs and NVIDIA H-series machines using the SharedNVSwitch mode in virtualized environments, GPU allocation must adhere to predefined Partition rules.

Koordinator provides a rich set of device topology scheduling APIs to meet the GPU topology requirements of Pods in these device scenarios. Below are some examples of how these APIs can be used:

1. GPU, CPU, and memory are allocated on the same NUMA Node"
    ```yaml
    apiVersion: v1
    kind: Pod
    metadata:
    annotations:
        scheduling.koordinator.sh/numa-topology-spec: '{"numaTopologyPolicy":"Restricted", "singleNUMANodeExclusive":"Preferred"}'
    spec:
    containers:
    - resources:
        limits:
            koordinator.sh/gpu: 200
            cpu: 64
            memory: 500Gi
        requests:
            koordinator.sh/gpu: 200
            cpu: 64
            memory: 500Gi
    ```
2. GPUs are allocated on the same PCIe
    ```yaml
    apiVersion: v1
    kind: Pod
    metadata:
    annotations: 
        scheduling.koordinator.sh/device-allocate-hint: |-
        {
            "gpu": {
            "requiredTopologyScope": "PCIe"
            }
        }
    spec:
    containers:
    - resources:
        limits:
            koordinator.sh/gpu: 200
    ```
3. "GPUs are allocated on the same NUMA Node
    ```yaml
    apiVersion: v1
    kind: Pod
    metadata:
    annotations: 
        scheduling.koordinator.sh/device-allocate-hint: |-
        {
            "gpu": {
            "requiredTopologyScope": "NUMANode"
            }
        }
    spec:
    containers:
    - resources:
        limits:
            koordinator.sh/gpu: 400
    ```
4. GPUs need to be allocated according to predefined Partitions
    
Typically, the predefined GPU Partition rules are determined by specific GPU models or system configurations and may also be influenced by the GPU configuration on a particular node. The scheduler does not have insight into the specific details of the hardware model or GPU type; instead, it relies on node-level components to report these predefined rules to the device Custom Resource (CR) as shown below:

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Device
metadata:
  annotations:
    scheduling.koordinator.sh/gpu-partitions: |
      {
        "1": [
            "NVLINK": {
                {
                  # Which GPUs are included
                  "minors": [
                      0
                  ],
                  # GPU Interconnect Type
                  "gpuLinkType": "NVLink",
                  # Here we take the bottleneck bandwidth between GPUs in the Ring algorithm. BusBandwidth can be referenced from https://github.com/NVIDIA/nccl-tests/blob/master/doc/PERFORMANCE.md
                  "ringBusBandwidth": 400Gi
                  # Indicate the overall allocation quality for the node after the partition has been assigned away.
                  "allocationScore": "1",
                },
                ...
            }
            ...
        ],
        "2": [
            ...
        ],
        "4": [
            ...
        ],
        "8": [
            ...
        ]
      }
  labels:
    // Indicate whether the Partition rules must be followed
    node.koordinator.sh/gpu-partition-policy: "Honor"
  name: node-1
```
When there are multiple optional Partition schemes available, Koordinator allows users to decide whether to allocate according to the optimal Partition:

```yaml
kind: Pod
metadata:
  name: hello-gpu
  annotations:
    scheduling.koordinator.sh/gpu-partition-spec: |
      {
        # BestEffort|Restricted
        "allocatePolicy": "Restricted", 
      }
spec:
  containers:
    - name: main
      resources:
        limits:
          koordinator.sh/gpu: 100
```
When the user does not require allocation according to the optimal Partition, the scheduler will allocate resources in a way that maximizes binpacking.

For more details on GPU topology-aware scheduling, please refer to the following design document:
- [NUMA Topology Scheduling](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20230415-numa-topology-scheduling.md)
- [Device Allocate Hint API](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20230803-device-allocate-hint-apis.md)
- [GPU Partition APIs](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20241008-gpu-partition-api.md)
  
We sincerely thank the community developer @eahydra for his contribution to this feature!

### Inter-machine Interconnect Acceleration for Training Jobs: End-to-End GDR Solution

In AI model training scenarios, GPUs need to perform collective communication. For single-machine collective communication, Koordinator has already provided the aforementioned GPU topology-aware scheduling capabilities. For multi-machine collective communication, Koordinator needs to be able to detect RDMA. Since version v1.5.0, Koordinator has implemented joint scheduling capabilities for GPUs and RDMA. In version v1.6.0, Koordinator provides an end-to-end solution. The overall architecture is as follows:

![image](/img/gpu-rdma-joint-allocation.jpg)

1. Koordlet detects the GPUs and RDMA devices on the node and reports the relevant information to the Device CR.
2. Koord-Manager synchronizes the resources from the Device CR to node.status.allocatable.
3. Koord-Scheduler allocates GPUs and RDMA to Pods based on the device topology and annotates the allocation 4. results to the Pods.
4. Multus-CNI accesses the Koordlet PodResources Proxy to obtain the RDMA devices allocated to the Pods and attaches the corresponding NICs to the network namespaces of the Pods.
5. Koordlet provides an NRI (Node Resource Interface) plugin to mount the devices into the containers.

Due to the involvement of numerous components and a complex environment, Koordinator v1.6.0 provides [best practices](https://koordinator.sh/docs/next/best-practices/gpu-and-rdma-joint-allocation/) to demonstrate how to step-by-step deploy Koordinator, Multus-CNI, and SRIOV-CNI. After deploying the relevant components, users can simply use the following Pod specification to request the scheduler to perform joint allocation for the requested GPUs and RDMA:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-vf01
  namespace: kubeflow
  annotations:
    scheduling.koordinator.sh/device-joint-allocate: |-
      {
        "deviceTypes": ["gpu","rdma"]
      }
    scheduling.koordinator.sh/device-allocate-hint: |-
      {
       "rdma": {
         "vfSelector": {} //apply VF
       }
      }
spec:
  schedulerName: koord-scheduler
  containers:
  - name: container-vf
    resources:
      requests:
        koordinator.sh/gpu: 100
        koordinator.sh/rdma: 100
      limits:
        koordinator.sh/gpu: 100
        koordinator.sh/rdma: 100
```

To further test GDR tasks end-to-end using Koordinator, you can follow the examples in the [best practices](https://koordinator.sh/docs/next/best-practices/gpu-and-rdma-joint-allocation/) step by step. We also sincerely thank the community developer @ferris-cx for their contribution to this feature!

### Improving Resource Utilization for Inference Tasks: Strong Isolation Under GPU Sharing

GPUs are indispensable devices for training and inference of large models, providing powerful computational support for AI applications. However, this powerful computational capability comes at a high cost. Koordinator has observed that some inference tasks often do not utilize the full capacity of a GPU, using only about 50% of its computational power or GPU memory. Therefore, sharing a single GPU among multiple Pods can significantly improve GPU resource utilization.

HAMi is a CNCF Sandbox project aimed at providing a device management middleware for Kubernetes. HAMi-Core is its core module, which provides GPU sharing and isolation capabilities by intercepting API calls between CUDA-Runtime (libcudart.so) and CUDA-Driver (libcuda.so). In version v1.6.0, Koordinator leverages HAMi-Core's GPU isolation features to provide an end-to-end GPU sharing solution.

You can deploy the DaemonSet using the following YAML file to install HAMi-Core directly on the corresponding nodes.
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: hami-core-distribute
  namespace: default
spec:
  selector:
    matchLabels:
      koord-app: hami-core-distribute
  template:
    metadata:
      labels:
        koord-app: hami-core-distribute
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: node-type
                operator: In
                values:
                - "gpu"
      containers:
      - command:
        - /bin/sh
        - -c
        - |
          cp -f /k8s-vgpu/lib/nvidia/libvgpu.so /usl/local/vgpu && sleep 3600000
        image: docker.m.daocloud.io/projecthami/hami:v2.4.0
        imagePullPolicy: Always
        name: name
        resources:
          limits:
            cpu: 200m
            memory: 256Mi
          requests:
            cpu: "0"
            memory: "0"
        volumeMounts:
        - mountPath: /usl/local/vgpu
          name: vgpu-hook
        - mountPath: /tmp/vgpulock
          name: vgpu-lock
      tolerations:
      - operator: Exists
      volumes:
      - hostPath:
          path: /usl/local/vgpu
          type: DirectoryOrCreate
        name: vgpu-hook
     # https://github.com/Project-HAMi/HAMi/issues/696
      - hostPath:
          path: /tmp/vgpulock
          type: DirectoryOrCreate
        name: vgpu-lock
```
The GPU Binpack capability of the Koordinator scheduler is enabled by default. After installing Koordinator and HAMi-Core, users can request shared GPUs and enable HAMi-Core isolation using the following method.
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-example
  namespace: default
  labels:
    koordinator.sh/gpu-isolation-provider: hami-core
spec:
  schedulerName: koord-scheduler
  containers:
  - command:
    - sleep
    - 365d
    image: busybox
    imagePullPolicy: IfNotPresent
    name: curlimage
    resources:
      limits:
        cpu: 40m
        memory: 40Mi
        koordinator.sh/gpu-shared: 1
        koordinator.sh/gpu-core: 50
        koordinator.sh/gpu-memory-ratio: 50
      requests:
        cpu: 40m
        memory: 40Mi
        koordinator.sh/gpu-shared: 1
        koordinator.sh/gpu-core: 50
        koordinator.sh/gpu-memory-ratio: 50
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
```
For guidance on enabling HAMi GPU sharing and isolation capabilities in Koordinator, please refer to:
- [Device Scheduling - GPU Share With HAMi](https://koordinator.sh/docs/next/user-manuals/device-scheduling-gpu-share-with-hami/)

We sincerely thank the HAMi community maintiner @wawa0210 for their support of this feature!

### GPU Resource Differentiated Scheduling Strategy: A Simple and Effective Method to Reduce GPU Fragmentation

The native NodeResourcesFit plugin in Kubernetes currently only supports configuring the same scoring strategy for different resources. For example:
```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
profiles:
  - pluginConfig:
      - name: NodeResourcesFit
        args:
          apiVersion: kubescheduler.config.k8s.io/v1
          kind: NodeResourcesFitArgs
          scoringStrategy:
            type: LeastAllocated
            resources:
              - name: cpu
                weight: 1
              - name: memory
                weight: 1
              - name: nvidia.com/gpu
                weight: 1
```
However, in production practice, some scenarios are not suitable for this design. For example, in AI scenarios, applications requesting GPUs prefer to occupy entire GPU machines to prevent GPU fragmentation. Applications requesting CPU and memory prefer to be spread out to reduce CPU hotspots. In version v1.6.0, Koordinator introduced the NodeResourceFitPlus plugin to support differentiated scoring strategies for different resources. Users can configure this when installing the Koordinator scheduler as follows:
```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
profiles:
- pluginConfig:
  - args:
      apiVersion: kubescheduler.config.k8s.io/v1
      kind: NodeResourcesFitPlusArgs
      resources: 
        nvidia.com/gpu:
          type: MostAllocated
          weight: 2
        cpu:
          type: LeastAllocated
          weight: 1
        memory:
          type: LeastAllocated
          weight: 1
    name: NodeResourcesFitPlus
  plugins:
    score:
      enabled:
      - name: NodeResourcesFitPlus
        weight: 2
  schedulerName: koord-scheduler
```
Additionally, applications requesting CPU and memory prefer to be scheduled to non-GPU machines to prevent excessive consumption of CPU and memory on GPU machines, which can cause genuine GPU tasks to remain in a Pending state due to insufficient non-GPU resources. In version v1.6.0, Koordinator introduced the ScarceResourceAvoidance plugin to support this requirement. Users can configure the scheduler as follows, indicating that nvidia.com/gpu is a scarce resource, and when a Pod does not request this scarce resource, it should avoid scheduling to those nodes.

```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
profiles:
- pluginConfig:
  - args:
      apiVersion: kubescheduler.config.k8s.io/v1
      kind: ScarceResourceAvoidanceArgs
      resources: 
      - nvidia.com/gpu
    name: ScarceResourceAvoidance
  plugins:
    score:
      enabled:
      - name: NodeResourcesFitPlus
        weight: 2
      - name: ScarceResourceAvoidance
        weight: 2
      disabled:
      - name: "*"
  schedulerName: koord-scheduler
```
For detailed design and usage guidance on the GPU resource differentiated scheduling strategy, please refer to:
- [Design Details](https://koordinator.sh/docs/next/designs/node-resource-fit-plus-scoring/)
- [User Mannuals](http://koordinator.sh/docs/next/user-manuals/node-resource-fit-plus-scoring)

We sincerely thank the community developer @LY-today for their contribution to this feature.
### More Refined Resource Reservation
Resource Reservation aims to address the issue of resource determinism in Kubernetes clusters. It allows us to submit a custom resource, Reservation, to reserve node resources for specific Pods. In heterogeneous resource scenarios, there is a greater need for more refined and flexible resource reservations. To this end, the v1.6 version of this feature brings the following enhancements and performance optimizations:

1. Support for fine-grained CPU and GPU resource reservation and preemption.
2. Support for precise matching of Pod resource reservations.
3. Resource reservation affinity supports specifying reservation names and tolerating taints.
4. Resource reservation supports limiting the number of Pods.
5. Support for preempting lower-priority Pods for resource reservations.

Plugin extension interface changes:

1. The ReservationFilterPlugin interface for validating reserved resources has been moved from the PreScore phase to the Filter phase to ensure more accurate filtering results.
2. The ReservationRestorePlugin interface for returning reserved resource ledgers has deprecated unnecessary methods to improve scheduling efficiency.

Here are examples of how to use the new features:

1. Exact-Match Reservation
   
  Specify that a Pod should exactly match the reserved resource amount. This can be used to narrow down the matching relationship between a set of Pods and a set of reserved resources, making the allocation of reserved resources more controllable.

  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    annotations:
      # Specify the exact resource types that the Pod should match. The Pod can only match Reservation objects where the reserved resource amounts and Pod sp
      scheduling.koordinator.sh/exact-match-reservation: '{"resourceNames":{"cpu","memory","nvidia.com/gpu"}}'
  ```
2.  Ignore Resource Reservation (reservation-ignored)

  Specify that a Pod should ignore resource reservations, allowing the Pod to fill in the idle node resources that are reserved but not yet allocated. This can be used in conjunction with preemption to further reduce resource fragmentation.
  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    labels:
      # Specify that the Pod's scheduling can ignore resource reservations
      scheduling.koordinator.sh/reservation-ignored: "true"
  ```
3. Specify Reservation Affinity by Reservation Name (ReservationAffinity)
  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    annotations:
      # Specify the name of the resource reservation to match
      scheduling.koordinator.sh/reservation-affinity: '{"name":"test-reservation"}'
  ```
4. Specify Taints and Tolerations for Resource Reservations
  ```yaml
  apiVersion: scheduling.koordinator.sh/v1alpha1
  kind: Reservation
  metadata:
    name: test-reservation
  spec:
    # Specify the taints for the Reservation, where the reserved resources can only be allocated to Pods that tolerate these taints
    taints:
    - effect: NoSchedule
      key: test-taint-key
      value: test-taint-value
    # ...
  ---
  apiVersion: v1
  kind: Pod
  metadata:
    annotations:
      # Specify the tolerations for the resource reservation
      scheduling.koordinator.sh/reservation-affinity: '{"tolerations":[{"key":"test-taint-key","operator":"Equal","value":"test-taint-value","effect":"NoSchedule"}]}'
  ```
5. Enable Reservation Preemption

  > Note: The current implementation does not support high-priority Pods preempting low-priority Reservations.


  ```yaml
  apiVersion: kubescheduler.config.k8s.io/v1beta3
  kind: KubeSchedulerConfiguration
  profiles:
  - pluginConfigs:
    - name: Reservation
      args:
        apiVersion: kubescheduler.config.k8s.io/v1beta3
        kind: ReservationArgs
        enablePreemption: true
    # ...
    plugins:
      postFilter:
      # In the scheduler configuration, disable the preemption of the DefaultPreemption plugin and enable the preemption of the Reservation plugin
      - disabled:
        - name: DefaultPreemption
        # ...
      - enabled:
        - name: Reservation
  ```
  We sincerely thank the community developer @saintube for their contribution to this feature!

### Colocation: Mid-tier Support for Idle Resource Redistribution and Enhanced Pod-level QoS Configuration
Koordinator v1.6.0 includes several functional optimizations and bug fixes in resource overcommitment and mixed deployment QoS:

1. Mid-tier Resource Overcommitment and Node Profiling Feature Optimization: The calculation logic has been optimized to support overcommitting unallocated resources on nodes, avoiding secondary overcommitment of node resources.
2. Load-aware Scheduling Optimization: The metric degradation logic has been improved.
3. CPU QoS and Resctrl QoS Support for Pod-level Configuration: CPU QoS and Resctrl QoS now support configuration at the pod level.
4. Out-of-band Load Management with Prometheus Metrics: Additional Prometheus metrics have been added to enhance observability.
5. Bug Fixes for Blkio QoS and Resource Amplification Features: Various bug fixes have been applied.

Mid-tier Resource Overcommitment was introduced in Koordinator v1.3, providing dynamic resource overcommitment based on node profiling. However, to ensure the stability of overcommitted resources, mid-tier resources were entirely obtained from already allocated Prod pods, meaning that empty nodes initially had no mid-tier resources. This posed significant inconvenience for some workloads using mid-tier resources, and the Koordinator community received feedback and contributions from enterprise users.
```
MidAllocatable := min(ProdReclaimable, NodeAllocatable * thresholdRatio) + ProdUnallocated * unallocatedRatio
ProdReclaimable := min(max(0, ProdAllocated - ProdPeak * (1 + safeMargin)), NodeUnused)
```
Changes in Calculation Logic:

1. Support for Overcommitting Unallocated Resources at a Static Ratio: This improves the cold start problem.
2. No Overcommitment of Actually Used Node Resources: This avoids large overestimations in some secondary overcommitment scenarios. For example, some users used Koordinator's node resource amplification capability to schedule more Prod pods, resulting in ProdAllocated > NodeAllocatable, causing the MidAllocatable estimate to deviate from the actual node load.


In addition, Koordinator v1.6 enhances the QoS policy configuration capability at the Pod level, suitable for scenarios such as blacklisting interfering Pods and adjusting colocated deployment QoS in a phased manner on colocated nodes:

- Support for LLC and Memory Bandwidth Isolation at the Pod Level

  By leveraging the Node Resource Interface (NRI) of the container runtime, the Resctrl feature allows users to set LLC and memory bandwidth allocation strategies for individual Pods on a node. This feature can be enabled as follows:

  1. Enable the Resctrl feature in the Koordlet's feature-gate.
  2. Configure LLC and memory bandwidth (MB) limitation policies via the Pod Annotation node.koordinator.sh/resctrl. For example,

  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    annotations:
      node.koordinator.sh/resctrl: '{"llc": {"schemata": {"range": [0, 30]}}, "mb": {"schemata": {"percent": 20}}}'
  ```

- Support for CPU QoS Configuration at the Pod Level

  This feature can be enabled as follows:

  1. Enable CPU QoS, please refer to: https://koordinator.sh/docs/user-manuals/cpu-qos/
  2. Configure the Pod's CPU QoS strategy using the Pod Annotation koordinator.sh/cpuQOS. For example
  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    annotations:
      koordinator.sh/cpuQOS: '{"groupIdentity": 1}'
  ```
Sincere thanks to community developers @kangclzjc, @j4ckstraw, @lijunxin559, @tan90github, @yangfeiyu20102011 for their contributions to the mixed deployment features!

### Scheduler and Descheduler Optimization
In version v1.6.0, we have continued to optimize the scheduler and descheduler. The main performance optimizations in the scheduler include:

1. Move the MinMember check of PodGroup to PreEnqueue to reduce unnecessary scheduling cycles.
2. Delay the return of Reservation resources to the AfterPreFilter stage, returning resources only to nodes allowed by PreFilterResult, reducing algorithm complexity.
3. Optimize the distribution of CycleState in plugins like NodeNUMAResource, DeviceShare, and Reservation, reducing memory overhead.
4. Add latency metrics for additional extension points introduced by Koordinator, such as BeforePreFilter and AfterPreFilter.

As cluster sizes continue to grow and resource competition intensifies in multi-tenant environments, cluster stability has become a core concern in re-scheduling and resource management. Frequent evictions can lead to workloads being repeatedly scheduled between different nodes, increasing system overhead and posing stability risks. To address this challenge, in v1.6.0, the re-scheduler has released several feature enhancements and rule optimizations in the load-aware re-scheduling plugin and eviction controller. These improvements further enhance the stability and rationality of the re-scheduling process:

1. LowNodeLoad Plugin Optimization:
   1. The LowNodeLoad plugin now supports configuring ProdHighThresholds and ProdLowThresholds, enabling differentiated management of resource utilization based on Koordinator priorities (Priority). This reduces hotspot issues caused by production applications, achieving finer-grained load balancing.
   2. Optimized the sorting logic for pods to be evicted, using a piecewise function scoring algorithm to select the most suitable pod for eviction, ensuring reasonable resource allocation and avoiding stability issues from evicting the pod with the highest resource utilization.
   3. Improved the pre-eviction check logic, where LowNodeLoad checks one by one whether the target node will become a new hotspot due to re-scheduling. This optimization effectively avoids repeated re-scheduling.

2. Enhancements to the MigrationController Eviction Controller:
   1. The MigrationController now has ObjectLimiter capabilities, allowing control over the frequency of workload evictions within a certain period. It now supports namespace-level eviction throttling, providing more fine-grained control over evictions within a namespace. Additionally, the ObjectLimiter was moved from Arbitrator to inside the MigrationController, fixing potential throttling failures in concurrent scenarios.
   2. Added the EvictAllBarePods configuration option, allowing users to enable eviction of pods without OwnerRef, thus enhancing the flexibility of re-scheduling.
   3. Introduced the MaxMigratingGlobally configuration option, enabling the MigrationController to control the maximum number of pod evictions, thereby reducing stability risks.
   4. Optimized the calculation logic of the GetMaxUnavailable method. When the calculated maximum number of unavailable replicas rounds down to 0, it is adjusted to 1 by default, preventing unexpected loss of control over the number of unavailable replicas.

3. Added a global re-scheduling configuration parameter MaxNoOfPodsToEvictTotal to ensure the maximum number of pods that can be evicted globally by the re-scheduler, reducing the burden on the cluster and improving stability.

Sincere thanks to community developers @AdrianMachao, @songtao98, @LY-today, @zwForrest, @JBinin, @googs1025, @bogo-y for their contributions to the scheduler and re-scheduler optimizations!

## Future Plans
The Koordinator community will continue to focus on strengthening GPU resource management and scheduling capabilities, providing re-scheduling plugins to further address resource imbalance and GPU fragmentation issues. We plan to introduce more new features and functionalities in the next version to support more complex workload scenarios. We will also further optimize resource reservation and mixed deployment to support more detailed scenarios.

Currently, the following proposals are in planning:
- [Fine-grained device scheduling support for Ascend NPU](https://github.com/koordinator-sh/koordinator/issues/2335)
- [Rescheduling to address the imbalance of different types of resources on a single node](https://github.com/koordinator-sh/koordinator/issues/2332)
- [PreAllocation: Reservation support binding to scheduled pods](https://github.com/koordinator-sh/koordinator/issues/2150)

Key usage issues to be addressed include:
- [NRI Plugin Conflict: Duplicate CPU Pinning Attempt Detected](https://github.com/koordinator-sh/koordinator/issues/2334)

Long-term planned proposals include:

- [Provide an end-to-end evolvable device management solution](https://github.com/koordinator-sh/koordinator/issues/2181)

We encourage users to provide feedback on their experiences and welcome more developers to participate in the development of the Koordinator project, working together to advance the project!
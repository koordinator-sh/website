---
slug: release-v1.5.0
title: "Koordinator v1.5: continuous optimization, join CNCF Sandbox"
authors: [saintube, ZiMengSheng]
tags: [release]
---

## Background

[*Koordinator*](https://koordinator.sh/) is an open source project, born from the accumulated experience of the container scheduling industry in Alibaba for more than two years. It has been iterating continuously to provide comprehensive solutions for workload consolidation, co-located resource scheduling, mixed resource isolation and mixed performance tuning.
It aims to help users optimize container performance and improve the efficiency of cluster resource usage and management and optimization of latency-sensitive workloads and batch jobs.

Today, Koordinator v1.5.0 is released. It is the 13th major release of Koordinator since its officially open-sourced in April 2022. The Koordinator community is grateful to involve all the excellent engineers from Alibaba, Ant Technology Group, Intel, XiaoHongShu, Xiaomi, iQiyi, 360, YouZan, etc., who have contributed great ideas, code, and various scenarios.
In v1.5.0, Koordinator brings a lot of feature improvements, including Pod-level NUMA alignment strategy, network QoS, Core Scheduling, etc.

Besides, Koordinator has been accepted by the CNCF TOC members as a Sandbox project. CNCF (Cloud Native Computing Foundation) is an independent, non-profit organization that supports and promotes cloud native software like Kubernetes, Prometheus, and etc.

>![koordinator-aboard-cncf-sandbox-img](/img/koordinator-aboard-cncf-sandbox.jpg)
> Vote address: https://github.com/cncf/sandbox/issues/51

## Key Features

### Pod-level NUMA Policy

In the past version of v1.4.0, Koordinator supports users to set different NUMA alignment policies for different nodes in the cluster.
However, this means that users need to pre-split the nodes into different node pools with different NUMA alignment policies, which cause additional overhead of the node operations.

In v1.5.0, Koordinator introduces Pod-level NUMA alignment policies to solve this problem. For example, we can set `SingleNUMANode` for `pod-1`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-1
  annotations:
    scheduling.koordinator.sh/numa-topology-spec: |-
      {
        "numaTopologyPolicy": "SingleNUMANode",
      }
spec:
  containers:
    - name: container-1
      resources:
        requests:
          cpu: '1'
        limits:
          cpu: '1'
```

After introducing Pod-level NUMA policies, it is possible that there are multiple NUMA policies on the same node.
For example, `node-1` has two NUMA nodes, `pod-1` uses `SingleNUMANode` policy on `numa-0`, and `pod-2` uses `Restricted` policy on `numa-0` and `numa-1`.

Since setting the resource requirements for the Pods can only limit the maximum resources they can use on the machines, it cannot limit the resources they can use on a NUMA node.
So `pod-2` may use more resources than the resources allocated on `numa-0`. This leads to resource contention between `pod-2` and `pod-1` on `numa-0`.

To solve this problem, Koordinator supports configuring the exclusive policy for Pods with `SingleNUMANode` policy.
For example, we can configure `pod-1` to use `SingleNUMANode` policy and not co-exist with other Pods on the same machine:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-1
  annotations:
    scheduling.koordinator.sh/numa-topology-spec: |-
      {
        "numaTopologyPolicy": "SingleNUMANode",
        "singleNUMANodeExclusive": "Required", # Required or Preferred
      }
spec:
  containers:
    - name: container-1
      resources:
        requests:
          cpu: '1'
        limits:
          cpu: '1'
```

Moreover, the introduction of Pod-level NUMA policies does not mean that the Node-level NUMA policies will be deprecated. Instead, they are compatible.
If the Pod and Node-level NUMA policies are different, the Pod will not be scheduled to the node; if the Node-level NUMA policy is `""`, it means that the node can place any Pod; if the Pod-level NUMA policy is `""`, it means that the Pod can be scheduled to any node.

|                    | SingleNUMANode node | Restricted node | BestEffort node |
|--------------------|---------------------|-----------------|-----------------|
| SingleNUMANode pod | [✓]                 | [x]             | [x]             |
| Restricted pod     | [x]                 | [✓]             | [x]             |
| BestEffort pod     | [x]                 | [x]             | [✓]             |
| ""                 | [✓]                 | [✓]             | [✓]             |

For more information about Pod-level NUMA policies, please see [Proposal: Pod-level NUMA Policy](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20240131-pod-level-numa-policy.md).

### Terway Net QoS

In v1.5.0, Koordinator cooperates with the *Terway* community to build the Network QoS.

[Terway QoS](https://github.com/AliyunContainerService/terway-qos) is born to solve the network bandwidth contention problem in workload consolidation and co-location scenarios.
It supports limiting the bandwidth of Pods or QoS classes, which is different from other solutions:
1. It supports limiting the bandwidth according to the business type, which is suitable for workload consolidation scenarios where multiple applications can be co-located at the same node.
2. It supports dynamic adjustment of Pod bandwidth limits.
3. It can limit the whole machine bandwidth, supporting multiple network cards, supporting to limit the container network and HostNetwork Pods.

Terway QoS has 3 types of network bandwidth priority, and the corresponding Koordinator default QoS mapping is as follows:

| Koordinator QoS |    Kubernetes QoS    | Terway Net QoS |
|:---------------:|:--------------------:|:--------------:|
|     SYSTEM      |          --          |       L0       |
|       LSE       |      Guaranteed      |       L1       |
|       LSR       |      Guaranteed      |       L1       |
|       LS        | Guaranteed/Burstable |       L1       |
|       BE        |      BestEffort      |       L2       |

In the co-location scenario, we want to ensure the maximum bandwidth of online applications to avoid contention.
When the node is idle, offline jobs can also fully utilize all bandwidth resources.

Therefore, users can define business traffic as 3 priorities, from high to low, respectively as L0, L1, and L2.
We define the contention scenario as: when the sum of the bandwidth of L0, L1, and L2 exceeds the whole machine bandwidth.

L0's maximum bandwidth will be dynamically adjusted according to the real-time bandwidth of L1 and L2.
It can be high to the total machine bandwidth and low to "total machine bandwidth - L1 minimum bandwidth - L2 minimum bandwidth".
In any case, the bandwidth of L1 and L2 will not exceed their upper limits.
In the contention scenario, the bandwidth of L1 and L2 will not be lower than their lower limits, and the bandwidth will be limited in the order of L2, L1, and L0.
Since Terway QoS only has three priorities, only the total machine bandwidth limit can be set for LS and BE. The remaining of L0 can be calculated according to the upper bandwidth limit of the whole machine.

Here is an example of the configuration:

```yaml
# unit: bps
resource-qos-config: |
  {
    "clusterStrategy": {
      "policies": {"netQOSPolicy":"terway-qos"},
      "lsClass": {
        "networkQOS": {
          "enable": true,
          "ingressRequest": "50M",
          "ingressLimit": "100M",
          "egressRequest": "50M",
          "egressLimit": "100M"
        }
      },
      "beClass": {
        "networkQOS": {
          "enable": true,
          "ingressRequest": "10M",
          "ingressLimit": "200M",
          "egressRequest": "10M",
          "egressLimit": "200M"
        }
      }
    }
  }
system-config: |-
  {
    "clusterStrategy": {
      "totalNetworkBandwidth": "600M"
    }
  }
```

Besides, Koordinator supports Pod-level bandwidth limits through the following annotations:

| Key	                      | Value                                            |
|---------------------------|--------------------------------------------------|
| koordinator.sh/networkQOS | 	'{"IngressLimit": "10M", "EgressLimit": "20M"}' |

For more information about the Network QoS, please see [Network Bandwidth Limitation Using Terway QoS](/docs/best-practices/network-qos-with-terwayqos) and [Terway Community](https://github.com/AliyunContainerService/terway).

### Core Scheduling

In v1.5.0, Koordinator provides container-level Core Scheduling ability. It reduces the risk of Side Channel Attacks (SCA) in multi-tenant scenarios, and can be used as a CPU QoS enhancement for the co-location scenarios.

[Linux Core Scheduling](https://docs.kernel.org/admin-guide/hw-vuln/core-scheduling.html) supports defining a task group in user space that can share physical cores.
Tasks belonging to the same group are assigned the same cookie as an identifier. And only tasks of one cookie will be run on a physical core (SMT dimension) at the same time.
By applying this mechanism to security or performance scenarios, we can achieve the following things:

1. Isolate physical cores for tasks of different tenants.
2. Avoid the contention between offline jobs and online services.

Koordinator enables the kernel mechanism Core Scheduling to achieve container-level group isolation policies, and finally forms the following two capabilities:

1. Runtime isolation of physical core: Pods can be grouped by the tenants, so pods in different groups cannot share physical cores at the same time for multi-tenant isolation.
2. Next-gen CPU QoS policy: It can achieve a new CPU QoS policy which ensures both the CPU performance and the security.

#### Runtime Isolation of Physical Core

Koordinator provides Pod Label protocol to identify the Core Scheduling group of Pods.

| Key	                               | Value       |
|------------------------------------|-------------|
| koordinator.sh/coreSchedulingGroup | "xxx-group" |

Different groups of Pods are running exclusively at the physical core level, which can avoid some side channel attacks on the physical cores, L1 cache or L2 cache for multi-tenant scenarios.

![container-core-scheduling-img](/img/container-core-scheduling.svg)

Different from the cpuset scheduling, the scope of the running cpus of Pods is not fixed.
The physical cores can run Pods of different groups at different moments. Thus, the physical cores can be shared by time-division multiplexing.

#### Next-Gen CPU QoS Policy

Koordinator build a new CPU QoS policy based on the Core Scheduling and CGroup Idle mechanism provided by the [Anolis OS](https://openanolis.cn/anolisos) kernel.

- BE containers enable the CGroup Idle feature to lower scheduling weights and priorities.
- LSR/LS containers enable Core Scheduling feature to expel BE tasks of the same group on the physical cores.

Users can enable the Core Scheduling policy by specifying `cpuPolicy="coreSched"` in the slo-controller-config.

```yaml
# Example of the slo-controller-config ConfigMap.
apiVersion: v1
kind: ConfigMap
metadata:
  name: slo-controller-config
  namespace: koordinator-system
data:
  resource-qos-config: |
    {
      "clusterStrategy": {
        "policies": {
          "cpuPolicy": "coreSched"
        },
        "lsClass": {
          "cpuQOS": {
            "enable": true,
            "coreExpeller": true,
            "schedIdle": 0
          }
        },
        "beClass": {
          "cpuQOS": {
            "enable": true,
            "coreExpeller": false,
            "schedIdle": 1
          }
        }
      }
    }
```

For more information about the Core Scheduling, please see [CPU QoS](/docs/user-manuals/cpu-qos).

### Other Changes

Koordinator v1.5.0 also includes the following enhancements and reliability improvements:

1. Enhancements: Reservation Restricted mode supports controlling which resources strictly follow the Restricted semantic through Annotation. NUMA align policy adapts upstream; Coscheduling implements the fair scheduling queuing to ensure that Pods in the same GangGroup are dequeued together, and different Gangs and bare Pods are sorted by last scheduling time. NRI mode supports reconnection mechanism. Koordlet improves the monitoring metrics and adds performance metrics. BlkioReconcile updates the configurations.
2. BugFixes: Fix the memory leak of koordlet CPUSuppress feature. Fix the panic problem of runtimeproxy. Revise the calculation logic of CPICollector, BECPUEvict, and CPUBurst modules.
3. Environment compatibility: All components are upgraded to K8S 1.28. koordlet supports to run on a non-CUDA images. Koordlet adapts the kubelet 1.28 configuration and optimizes the compatibility logic for the cpu manager. Koordlet adapts cri-o runtime.
4. Refactoring and improvement: Koordlet improves the resctrl updating logic. Koordlet improves the eviction logic. Revise the GPU resources and card model reporting. Revise the Batch resource calculation logic.
5. CI/CD: Fix some flaky tests.

For more information about the v1.5.0 changes, please see [v1.5.0 Release](https://github.com/koordinator-sh/koordinator/releases/tag/v1.5.0).

## Contributors

Koordinator is an open source community. In v1.5.0, there are 10 new developers who contributed to Koordinator main repo. They are
@georgexiang, @googs1025, @l1b0k, @ls-2018, @PeterChg, @sjtufl, @testwill, @yangfeiyu20102011, @zhifanggao, @zwForrest.

Koordinator community now has many enterprise contributors, some of which became Maintainers and Members.
During the v1.5.0 release, the new Maintainers are

- @songzh215
- @j4ckstraw
- @lucming
- @kangclzjc

Thanks for the elders for their consistent efforts and the newbies for their active contributions.
We welcome more contributors to join the [*Koordinator community*](https://github.com/koordinator-sh/koordinator).

## Future Plan

In next versions, Koordinator plans the following works:

- Scheduling performance optimization: The scheduling performance is the key indicator of whether the scheduler can handle large-scale clusters. In the next version, Koordinator will provide a setup guide of the basic benchmark environment and common benchmark scenarios, and start to improve the scheduling performance of Koord-Scheduler.
- Device union allocation: In the LLC distributed training of AI scenarios, GPUs of different machines usually need to communicate with each other through high-performance network card, and GPU and high-performance network card are allocated near each other for better performance. Koordinator is working on the support of union allocation for multiple heterogeneous resources. The union allocation has been supported on the protocol and the scheduling logic. The single-node logic for reporting network card resources is being explored.
- Job-level quota preemption: In the large-scale cluster scenario, some quotas can be busy, while other quotas can be idle. In the ElasticQuota plugin, we have supported borrowing resources from the idle quotas. But the scheduler has not considered the Job information when the borrowed quotas expect to take back resources. For the Pods belonging to the same Job, the scheduler should do preempt in the Job-level to ensure the job scheduling and improve the efficiency.
- Load-aware scheduling for in-flight pods: Currently, the load-aware scheduling filters and scores nodes based on the resource utilization. It can improve the distribution of utilization to nodes, reduce the risks of scheduling pods to overload nodes. However, the accuracy of the utilization can be affected by the in-flight pods since the node metrics reporting has a lag. In the coming version, the load-aware scheduling will take consideration of the in-flight pods, guarantee pods not to schedule to overload nodes, and further improve the distribution of utilization to nodes.
- Fine-grained isolation strategy for last-level cache and memory bandwidth: Contention of the last-level cache and memory bandwidth between containers can cause performance degradation of the memory access. By isolating the last-level cache and memory bandwidth in the QoS-level without exceeding the capacity of the RDT groups, koordlet provides the Resctrl QoS to reduce the contention between the offline workloads with the online services. In the next version, koordlet will enhance the isolation strategy based on [NRI (Node Resource Interface) mode](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/20230608-nri-mode-resource-management.md) introduced in v1.3. It will provide the pod-level isolation capability, which greatly improves the feature's flexibility and timeliness.

## Acknowledgement

Since the project was open-sourced, Koordinator has been released for more than 19 versions, getting 80+ contributors involved to contribute.
The community is growing and has been continuously improving. We thank all the community members for their active participation and valuable feedback.
We also want to thank the CNCF organization and related community members for supporting the project.

Welcome more developers and end users to [**join us**](https://github.com/koordinator-sh/koordinator?tab=readme-ov-file#community)! It is your participation and feedback that make Koordinator keep improving.
Whether you are a beginner or an expert in the Cloud Native communities, we look forward to hearing your voice!

---
slug: release-v0.3.0
title: What's New in Koordinator v0.3.0?
authors: [jason]
tags: [koordinator, colocation, kubernetes, scheduling, orchestration, release]
---

We are happy to announce the v0.3.0 release of **Koordinator**. After starting small and learning what users needed, we
are able to adjust its path and develop features needed for a stable community release.

The release of Koordinator v0.3.0 brings in some notable changes that are most wanted by the community while continuing
to expand on experimental features.

## Install or Upgrade to Koordinator v0.3.0

### Install with helms

Koordinator can be simply installed by helm v3.5+, which is a simple command-line tool, and you can get it
from [here](https://github.com/helm/helm/releases).

```shell
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Install the latest version.
$ helm install koordinator koordinator-sh/koordinator --version 0.3.0
```

### Upgrade with helm

```shell
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Upgrade the latest version.
$ helm upgrade koordinator koordinator-sh/koordinator --version 0.3.0 [--force]
```

For more details, please refer to the [installation manual](/docs/installation).

## CPU Burst

CPU Burst is a service level objective (SLO)-aware resource scheduling feature provided by Koordinator. You can use CPU
Burst to improve the performance of latency-sensitive applications. CPU scheduling for
a container may be throttled by the kernel due to the CPU limit, which downgrades the performance of the application.
Koordlet automatically detects CPU throttling events and automatically adjusts the CPU limit to a
proper value. This greatly improves the performance of latency-sensitive applications.

### How CPU Burst works

Kubernetes allows you to specify CPU limits, which can be reused based on time-sharing. If you specify a CPU limit for a
container, the OS limits the amount of CPU resources that can be used by the container within a specific time period.
For example, you set the CPU limit of a container to 2. The OS kernel limits the CPU time slices that the container can
use to 200 milliseconds within each 100-millisecond period.

CPU utilization is a key metric that is used to evaluate the performance of a container. In most cases, the CPU limit is
specified based on CPU utilization. CPU utilization on a per-millisecond basis shows more spikes than on a per-second
basis. If the CPU utilization of a container reaches the limit within a 100-millisecond period, CPU throttling is
enforced by the OS kernel and threads in the container are suspended for the rest of the time period.

### How to use CPU Burst

- Use an annotation to enable CPU Burst

  Add the following annotation to the pod configuration to enable CPU Burst:

```yaml
annotations:
  # Set the value to auto to enable CPU Burst for the pod. 
  koordinator.sh/cpuBurst: '{"policy": "auto"}'
  # To disable CPU Burst for the pod, set the value to none. 
  #koordinator.sh/cpuBurst: '{"policy": "none"}'
```

- Use a ConfigMap to enable CPU Burst for all pods in a cluster

  Modify the slo-controller-config ConfigMap based on the
  following content to enable CPU Burst for all pods in a cluster:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: slo-controller-config
  namespace: koordinator-system
data:
  cpu-burst-config: '{"clusterStrategy": {"policy": "auto"}}'
  #cpu-burst-config: '{"clusterStrategy": {"policy": "cpuBurstOnly"}}'
  #cpu-burst-config: '{"clusterStrategy": {"policy": "none"}}'
```

- Advanced configurations

  The following code block shows the pod annotations and ConfigMap fields that you can use for advanced configurations:

```yaml
# Example of the slo-controller-config ConfigMap. 
data:
  cpu-burst-config: |
    {
      "clusterStrategy": {
        "policy": "auto",
        "cpuBurstPercent": 1000,
        "cfsQuotaBurstPercent": 300,
        "sharePoolThresholdPercent": 50,
        "cfsQuotaBurstPeriodSeconds": -1
      }
    }

  # Example of pod annotations. 
  koordinator.sh/cpuBurst: '{"policy": "auto", "cpuBurstPercent": 1000, "cfsQuotaBurstPercent": 300, "cfsQuotaBurstPeriodSeconds": -1}'
```

The following table describes the ConfigMap fields that you can use for advanced configurations of CPU Burst.

| Field                      | Data type | Description                                                                                                                                                                                                                                                                                                                                                                                                                             |
|----------------------------|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| policy                     | string    | <ul> <li> none: disables CPU Burst. If you set the value to none, the related fields are reset to their original values. This is the default value.</li> <li>cpuBurstOnly: enables the CPU Burst feature only for the kernel of Alibaba Cloud Linux 2. </li><li> cfsQuotaBurstOnly: enables automatic adjustment of CFS quotas of general kernel versions. </li> <li> auto: enables CPU Burst and all the related features. </li> </ul> |
| cpuBurstPercent            | int       | Default value:`1000`. Unit: %. This field specifies the percentage to which the CPU limit can be increased by CPU Burst. If the CPU limit is set to `1`, CPU Burst can increase the limit to 10 by default.                                                                                                                                                                                                                             |
| cfsQuotaBurstPercent       | int       | Default value: `300`. Unit: %. This field specifies the maximum percentage to which the value of cfs_quota in the cgroup parameters can be increased. By default, the value of cfs_quota can be increased to at most three times.                                                                                                                                                                                                       |
| cfsQuotaBurstPeriodSeconds | int       | Default value: `-1`. Unit: seconds. This indicates that the time period in which the container can run with an increased CFS quota is unlimited. This field specifies the time period in which the container can run with an increased CFS quota, which cannot exceed the upper limit specified by `cfsQuotaBurstPercent`.                                                                                                              |
| sharePoolThresholdPercent  | int       | Default value: `50`. Unit: %. This field specifies the CPU utilization threshold of the node. If the CPU utilization of the node exceeds the threshold, the value of cfs_quota in cgroup parameters is reset to the original value.                                                                                                                                                                                                     |

## L3 cache and MBA resource isolation

Pods of different priorities are usually deployed on the same machine. This may cause pods to compete for computing
resources. As a result, the quality of service (QoS) of your service cannot be ensured. The Resource Director
Technology (RDT) controls the Last Level Cache (L3 cache) that can be used by workloads of different priorities. RDT
also uses the Memory Bandwidth Allocation (MBA) feature to control the memory bandwidth that can be used by workloads.
This isolates the L3 cache and memory bandwidth used by workloads, ensures the QoS of high-priority workloads, and
improves overall resource utilization. This topic describes how to improve the resource isolation of pods with
different priorities by controlling the L3 cache and using the MBA feature.

### How to use L3 cache and MBA resource isolation

- Use a ConfigMap to enable L3 cache and MBA resource isolation for all pods in a cluster

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: slo-controller-config
  namespace: koordinator-system
data:
  resource-qos-config: |-
    {
      "clusterStrategy": {
        "lsClass": {
           "resctrlQoS": {
             "enable": true,
             "catRangeStartPercent": 0,
             "catRangeEndPercent": 100,
             "MBAPercent": 100
           }
         },
        "beClass": {
           "resctrlQoS": {
             "enable": true
             "catRangeStartPercent": 0,
             "catRangeEndPercent": 30,
             "MBAPercent": 100
           }
         }
      }
    }
```

## Memory QoS

The Koordlet provides the memory quality of service (QoS) feature for containers. You can use this
feature to optimize the performance of memory-sensitive applications while ensuring fair memory scheduling among
containers. This topic describes how to enable the memory QoS feature for containers.

### Background information

The following memory limits apply to containers:

- The memory limit of the container. If the amount of memory that a container uses, including the page cache, is about
  to reach the memory limit of the container, the memory reclaim mechanism of the OS kernel is triggered. As a result,
  the application in the container may not be able to request or release memory resources as normal.
- The memory limit of the node. If the memory limit of a container is greater than the memory request of the container,
  the container can overcommit memory resources. In this case, the available memory on the node may become insufficient.
  This causes the OS kernel to reclaim memory from containers. As a result, the performance of your application is
  downgraded. In extreme cases, the node cannot run as normal.

To improve the performance of applications and the stability of nodes, Koordinator provides the memory QoS feature for
containers. We recommend that you use Anolis OS as the node OS. For other OS, we will try our best to adapt, and users
can still enable it without side effects. After you enable the memory QoS feature for a container, Koordlet
automatically configures the memory control group (memcg) based on the configuration of the container. This helps you
optimize the performance of memory-sensitive applications while ensuring fair memory scheduling on the node.

### How to use Memory QoS

When you enable memory QoS for the containers in a pod, the memcg is automatically configured based on the specified
ratios and pod parameters. To enable memory QoS for the containers in a pod, perform the following steps:

1. Add the following annotations to enable memory QoS for the containers in a pod:

```yaml
annotations:
  # To enable memory QoS for the containers in a pod, set the value to auto. 
  koordinator.sh/memoryQoS: '{"policy": "auto"}'
  # To disable memory QoS for the containers in a pod, set the value to none. 
  #koordinator.sh/memoryQoS: '{"policy": "none"}'
```

2. Use a ConfigMap to enable memory QoS for all the containers in a cluster.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: slo-controller-config
  namespace: koordinator-system
data:
  resource-qos-config: |-
    {
      "clusterStrategy": {
        "lsClass": {
           "memoryQoS": {
             "enable": true
           }
         },
        "beClass": {
           "memoryQoS": {
             "enable": true
           }
         }
      }
    }
```

3. Optional. Configure advanced parameters.

   The following table describes the advanced parameters that you can use to configure fine-grained memory QoS
   configurations at the pod level and cluster level.

| Parameter         | Data type | Valid value                                                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
|-------------------|-----------|---------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| enable            | Boolean   | <ul> <li> true </li> <li> false </li> </ul>                   | <ul> <li> true: enables memory QoS for all the containers in a cluster. The default memory QoS settings for the QoS class of the containers are used. </li> <li> false: disables memory QoS for all the containers in a cluster. The memory QoS settings are restored to the original settings for the QoS class of the containers. </li> </ul>                                                                                                                                                                                                                                                                                                                                                             |
| policy            | String    | <ul> <li> auto </li> <li> default </li> <li> none </li> </ul> | <ul> <li> auto: enables memory QoS for the containers in the pod and uses the recommended memory QoS settings. The recommended memory QoS settings are prioritized over the cluster-wide memory QoS settings. </li> <li> default: specifies that the pod inherits the cluster-wide memory QoS settings. </li> <li> none: disables memory QoS for the pod. The relevant memory QoS settings are restored to the original settings. The original settings are prioritized over the cluster-wide memory QoS settings. </li> </ul>                                                                                                                                                                              |
| minLimitPercent   | Int       | 0~100                                                         | Unit: %. Default value: `0`. The default value indicates that this parameter is disabled. This parameter specifies the unreclaimable proportion of the memory request of a pod. This parameter is suitable for scenarios where applications are sensitive to the page cache. You can use this parameter to cache files to optimize read and write performance. For example, if you specify `Memory Request=100MiB` for a container, the default setting is `memory.min=104857600`.                                                                                                                                                                                                                          |
| lowLimitPercent   | Int       | 0~100                                                         | Unit: %. Default value: `0`. The default value indicates that this parameter is disabled. This parameter specifies the relatively unreclaimable proportion of the memory request of a pod. For example, if you specify `Memory Request=100MiB` for a container, the default setting is `memory.low=104857600`.                                                                                                                                                                                                                                                                                                                                                                                              |
| throttlingPercent | Int       | 0~100                                                         | Unit: %. Default value: `0`. The default value indicates that this parameter is disabled. This parameter specifies the memory throttling threshold for the ratio of the memory usage of a container to the memory limit of the container. If the usage of the memory limit of a container exceeds the threshold, the memory used by the container will be reclaimed. This parameter is suitable for container memory overcommitment scenarios. You can use this parameter to avoid OOM killers that are triggered by cgroups. For example, if you specify `Memory Request=100MiB` for a container, the default setting is `memory.high=83886080`.                                                           |
| wmarkRatio        | Int       | 0~100                                                         | Unit: %. Default value: `95`. A value of `0` indicates that this parameter is disabled. This parameter specifies the threshold of the usage of the memory limit or the value of `memory.high` that triggers asynchronous memory reclaim. If the usage of the memory limit or the value of memory.high exceeds the threshold, the memcg backend asynchronous reclaim feature is triggered. For example, if you specify `Memory Request=100MiB` for a container, the memory throttling setting is `memory.high=83886080`, the reclaim ratio setting is `memory.wmark_ratio=95`, and the reclaim threshold setting is `memory.wmark_high=79691776`.                                                            |
| wmarkMinAdj       | Int       | -25~50                                                        | Unit: %. The default value is `-25` for the `LS` QoS class and `50` for the `BE` QoS class. A value of 0 indicates that this parameter is disabled. This parameter specifies the adjustment to the global minimum watermark for a container. A negative value decreases the global minimum watermark and therefore postpones memory reclaim for the container. A positive value increases the global minimum watermark and therefore antedates memory reclaim for the container. For example, if you create a pod whose QoS class is LS, the default setting of this parameter is `memory.wmark_min_adj=-25`, which indicates that the minimum watermark is decreased by 25% for the containers in the pod. |

## What Comes Next

For more details, please refer to our [milestone](https://github.com/koordinator-sh/koordinator/milestones). Hope it
helps!

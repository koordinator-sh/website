---
slug: release-v0.4.0
title: What's New in Koordinator v0.4.0?
authors: [joseph]
tags: [release]
---

We are happy to announce the release of Koordinator v0.4.0. Koordinator v0.4.0 brings in some notable changes that are most wanted by the community while continuing to expand on experimental features. And in this version, we started to gradually enhance the capabilities of the scheduler.

## Install or Upgrade to Koordinator v0.4.0

### Install with helms

Koordinator can be simply installed by helm v3.5+, which is a simple command-line tool, and you can get it
from [here](https://github.com/helm/helm/releases).

```shell
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Install the latest version.
$ helm install koordinator koordinator-sh/koordinator --version 0.4.0
```

### Upgrade with helm

```shell
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Upgrade the latest version.
$ helm upgrade koordinator koordinator-sh/koordinator --version 0.4.0 [--force]
```

For more details, please refer to the [installation manual](/docs/installation).

## Enhanced node-side scheduling capabilities

### Custom memory evict threshold

In the Koordinator v0.2.0, an ability to improve the stability of the node side in the co-location scenario was introduced: [Active eviction mechanism based on memory safety thresholds](/blog/release-v0.2.0#active-eviction-mechanism-based-on-memory-safety-thresholds). The current memory utilization safety threshold default value is 70%, now in the v0.4.0 version, you can modify the `memoryEvictThresholdPercent` with 60% in ConfigMap `slo-controller-config` according to the actual situation:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: slo-controller-config
  namespace: koordinator-system
data:
  colocation-config: |
    {
      "enable": true
    }
  resource-threshold-config: |
    {
      "clusterStrategy": {
        "enable": true,
        "memoryEvictThresholdPercent": 60
      }
    }
```

### BE Pods eviction based on satisfaction

In order to ensure the runtime quality of different workloads in co-location scenarios, Koordinator uses the CPU Suppress mechanism provided by koordlet on the node side to suppress workloads of the best effort type when the load increases. Or increase the resource quota for best effort type workloads when the load decreases. 

However, it is not suitable if there are many best effort Pods on the node and they are frequently suppressed. Therefore, in version v0.4.0, Koordinator provides an eviction mechanism based on satisfaction of the requests for the best effort Pods. If the best effort Pods are frequently suppressed, the requests of the best effort Pods cannot be satisfied, and the satisfaction is generally less than 1; if the best effort Pods are not suppressed and more CPU resources are obtained when the node resources are idle, then the requests of the best effort Pods can be satisfied, and the satisfaction is greater than or equal to 1. If the satisfaction is less than the specified threshold, and the CPU utilization of the best effort Pods is close to 100%, `koordlet` will evict some best effort Pods to improve the runtime quality of the node. The priority with lower priority or with higher CPU utilization of the same priority is evicted.

You can modify the ConfigMap `slo-controller-config` according to the actual situation:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: slo-controller-config
  namespace: koordinator-system
data:
  colocation-config: |
    {
      "enable": true
    }
  resource-threshold-config: |
    {
      "clusterStrategy": {
        "enable": true,
        "cpuEvictBESatisfactionUpperPercent": 80,
        "cpuEvictBESatisfactionLowerPercent": 60
      }
    }
```

### Group identity

When latency-sensitive applications and best effort workloads are deployed on the same node, the Linux kernel scheduler must provide more scheduling opportunities to high-priority applications to minimize scheduling latency and the impacts of low-priority workloads on kernel scheduling. For this scenario, Koordinator integrated with the group identity allowing users to configure scheduling priorities to CPU cgroups. 

Alibaba Cloud Linux 2 with a kernel of the kernel-4.19.91-24.al7 version or later supports the group identity feature. The group identity feature relies on a dual red-black tree architecture. A low-priority red-black tree is added based on the red-black tree of the Completely Fair Scheduler (CFS) scheduling queue to store low-priority workloads. When the kernel schedules the workloads that have identities, the kernel processes the workloads based on their priorities. For more details, please refer to the [doc](https://www.alibabacloud.com/help/en/elastic-compute-service/latest/group-identity-feature).

Koordinator defines group identity default values for Pods of different QoS types:

| QoS | Default Value |
|-----|---------------|
| LSR | 2 |
| LS | 2 | 
| BE | -1 |

You can modify the ConfigMap `slo-controller-config` to set group identity values according to the actual situation:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: slo-controller-config
  namespace: koordinator-system
data:
  colocation-config: |
    {
      "enable": true
    }
  resource-qos-config: |
    {
      "clusterStrategy": {
        "lsrClass": {
            "cpuQOS": {
                "enable": "true",
                "groupIdentity": 2
            }
        },
        "lsClass": {
            "cpuQOS": {
                "enable": "true",
                "groupIdentity": 2
            }
        },
        "beClass": {
            "cpuQOS": {
                "enable": "true",
                "groupIdentity": -1
            }
        },
        "systemClass": {
            "cpuQOS": {
                "enable": "true",
                "groupIdentity": 2
            }
        }
      }
    }
```

To enable this feature, you need to update the kernel and configuration file, then install the new component `koord-runtime-proxy` of koordinator.

## koord-runtime-proxy (experimental)

`koord-runtime-proxy` acts as a proxy between kubelet and containerd(dockerd under dockershim scenario), which is designed to intercept CRI request, and apply some resource management policies, such as setting different cgroup parameters by pod priorities under hybrid workload orchestration scenario, applying new isolation policies for latest Linux kernel, CPU architecture, and etc.

There are two components involved, koord-runtime-proxy and RuntimePlugins.

![image](../../static/img/koord-runtime-proxy-architecture.svg)

### koord-runtime-proxy
koord-runtime-proxy is in charge of intercepting request during pod's lifecycle, such as RunPodSandbox, CreateContainer etc., and then calling RuntimePlugins to do resource isolation policies before transferring request to backend containerd(dockerd) and after transferring response to kubelet. koord-runtime-proxy provides an isolation-policy-execution framework which allows customized plugins registered to do specified isolation policies, these plugins are called RuntimePlugins. koord-runtime-proxy itself does NOT do any isolation policies.

### RuntimePlugins
RuntimePlugins register events(RunPodSandbox etc.) to koord-runtime-proxy and would receive notifications when events happen. RuntimePlugins should complete resource isolation policies basing on the notification message, and then response koord-runtime-proxy, koord-runtime-proxy would decide to transfer request to backend containerd or discard request according to plugins' response.

If no RuntimePlugins registered, koord-runtime-proxy would become a transparent proxy between kubelet and containerd.

For more details, please refer to the [design doc](https://github.com/koordinator-sh/koordinator/blob/main/docs/design-archive/runtime-manager-design-doc.md).

### Installation

When installing koord-runtime-proxy, you need to change the startup parameters of the kubelet, set the CRI parameters to point to the koord-runtime-proxy, and configure the CRI parameters of the corresponding container runtime when installing the koord-runtime-proxy. 

koord-runtime-proxy is in the Alpha experimental version stage. Currently, it provides a minimum set of extension points. At the same time, there may be some bugs. You are welcome to try it and give feedback.

For detailed installation process, please refer to the [manual](/docs/installation#install-koord-runtime-proxy-experimental).

## Load-Aware Scheduling

Although Koordinator provides the co-location mechanism to improve the resource utilization of the cluster and reduce costs, it does not yet have the ability to control the utilization level of the cluster dimension, Best Effort workloads may also interfere with latency-sensitive applications. Load-aware scheduling plugin helps Koordinator to achieve this capability.

The scheduling plugin filters abnormal nodes and scores them according to resource usage. This scheduling plugin extends the Filter/Score/Reserve/Unreserve extension points defined in the Kubernetes scheduling framework.

By default, abnormal nodes are filtered, and users can decide whether to enable or not by configuring as needed.
- Filter nodes where koordlet fails to update NodeMetric. 
- Filter nodes by utilization thresholds. If the configuration enables, the plugin will exclude nodes with *latestUsageUtilization >= utilizationThreshold*.

This plugin is dependent on NodeMetric's reporting period. Different reporting periods need to be set according to different scenarios and workloads. Therefore, NodeMetricSpec has been extended to support user-defined reporting period and aggregation period. Users can modify `slo-controller-config` to complete the corresponding configuration, and the controller in `koord-manager` will be responsible for updating the reporting period and aggregation period fields of NodeMetrics of related nodes.

Currently, the resource utilization thresholds of nodes are configured based on experience to ensure the runtime quality of nodes. But there are also ways to evaluate the workload running on the node to arrive at a more appropriate threshold for resource utilization. For example, in a time-sharing scenario, a higher threshold can be set to allow scheduling to run more best effort workloads during the valley of latency-sensitive applications. When the peak of latency-sensitive applications comes up, lower the threshold and evict some best effort workloads. In addition, 3-sigma can be used to analyze the utilization level in the cluster to obtain a more appropriate threshold.

The core logic of the scoring algorithm is to select the node with the smallest resource usage. However, considering the delay of resource usage reporting and the delay of Pod startup time, the resource requests of the Pods that have been scheduled and the Pods currently being scheduled within the time window will also be estimated, and the estimated values will be involved in the calculation.

At present, Koordinator does not have the ability to profile workloads. Different types of workloads have different ways of building profiles. For example, long-running pods need to be scheduled with long-period profiling, while short-period pods should be scheduled with short-period profiling.

For more details, please refer to the [proposal](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20220510-load-aware-scheduling.md).

## What Comes Next

For more details, please refer to our [milestone](https://github.com/koordinator-sh/koordinator/milestones). Hope it
helps!

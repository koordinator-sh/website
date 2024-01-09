---
slug: release-v0.2.0
title: Koordinator v0.2.0 - Enhanced node-side scheduling capabilities
authors: [joseph]
tags: [koordinator, colocation, kubernetes, scheduling, orchestration, release]
---


We’re pleased to announce the release of Koordinator v0.2.0.

## Overview

Koordinator v0.1.0 implements basic co-location scheduling capabilities, and after the project was released, it has received attention and positive responses from the community.
For some issues that everyone cares about, such as how to isolate resources for best-effort workloads, how to ensure the runtime stability of latency-sensitiv applications in co-location scenarios, etc., we have enhanced node-side scheduling capabilities in koordinator v0.2.0 to solve these problems.

## Install or Upgrade to Koordinator v0.2.0

### Install with helms

Koordinator can be simply installed by helm v3.5+, which is a simple command-line tool and you can get it from [here](https://github.com/helm/helm/releases).

```shell
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Install the latest version.
$ helm install koordinator koordinator-sh/koordinator --version 0.2.0
```

### Upgrade with helm

```shell
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Upgrade the latest version.
$ helm upgrade koordinator koordinator-sh/koordinator --version 0.2.0 [--force]
```

For more details, please refer to the [installation manual](/docs/installation).

## Isolate resources for best-effort workloads

In Koodinator v0.2.0, we refined the ability to isolate resources for best-effort worklods. 

`koordlet` will set the cgroup parameters according to the resources described in the Pod Spec. Currently supports setting CPU Request/Limit, and Memory Limit.

For CPU resources, only the case of `request == limit` is supported, and the support for the scenario of `request <= limit` will be supported in the next version.

## Active eviction mechanism based on memory safety thresholds

When latency-sensitiv applications are serving, memory usage may increase due to bursty traffic. Similarly, there may be similar scenarios for best-effort workloads, for example, the current computing load exceeds the expected resource Request/Limit. 

These scenarios will lead to an increase in the overall memory usage of the node, which will have an unpredictable impact on the runtime stability of the node side. For example, it can reduce the quality of service of latency-sensitiv applications or even become unavailable. Especially in a co-location environment, it is more challenging.

We implemented an active eviction mechanism based on memory safety thresholds in Koodinator. 

`koordlet` will regularly check the recent memory usage of node and Pods to check whether the safty threshold is exceeded. If it exceeds, it will evict some best-effort Pods to release memory. This mechanism can better ensure the stability of node and latency-sensitiv applications.

`koordlet` currently only evicts best-effort Pods, sorted according to the Priority specified in the Pod Spec. The lower the priority, the higher the priority to be evicted, the same priority will be sorted according to the memory usage rate (RSS), the higher the memory usage, the higher the priority to be evicted. This eviction selection algorithm is not static. More dimensions will be considered in the future, and more refined implementations will be implemented for more scenarios to achieve more reasonable evictions.

The current memory utilization safety threshold default value is 70%. You can modify the `memoryEvictThresholdPercent` in ConfigMap `slo-controller-config` according to the actual situation, 

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
        "memoryEvictThresholdPercent": 70
      }
    }
```

## CPU Burst - Improve the performance of latency-sensitive applications

CPU Burst is a service level objective (SLO)-aware resource scheduling feature. You can use CPU Burst to improve the performance of latency-sensitive applications. CPU scheduling for a container may be throttled by the kernel due to the CPU limit, which downgrades the performance of the application. Koordinator automatically detects CPU throttling events and automatically adjusts the CPU limit to a proper value. This greatly improves the performance of latency-sensitive applications. 

The code of CPU Burst has been developed and is still under review and testing. It will be released in the next version. If you want to use this ability early, you are welcome to participate in Koordiantor and improve it together. For more details, please refer to the PR [#73](https://github.com/koordinator-sh/koordinator/pull/73).

## More

For more details, please refer to the [Documentation](/docs). Hope it helps!

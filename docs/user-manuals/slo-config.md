# SLO Configuration

## Introduction

Koordinator uses a ConfigMap to manage the SLO configurations. The ConfigMap is used by the slo-controller, whose name
and namespace can be specified via the startup arguments of the koord-manager
(`koordinator-system/slo-controller-config` by default). It has the following keys respectively:

- `colocation-config`: The configuration for colocation. For example, whether to enable the colocated batch resources or not, the colocated watermark.
- `resource-threshold-config`: The configuration for threshold-based suppression or eviction. For example, the threshold for cpu suppression, the threshold for memory eviction.
- `resource-qos-config`: The configuration for QoS-based features. For example, Group Identity for BE pods, Memory QoS for LS pods, Last-Level-Cache partitioning for BE pods.
- `cpu-burst-config`: The configuration for the CPU Burst feature. For example, maximum burst ratio of the pod.
- `system-config`: The configuration for system-level settings. For example, the global minimum memory free factor (`min_free_kbytes`).

### Configuration Levels

Each config is defined in a pattern of both the cluster-level and the node-level.

e.g.

```go
type ColocationCfg struct {
	ColocationStrategy `json:",inline"`
	NodeConfigs        []NodeColocationCfg `json:"nodeConfigs,omitempty"`
}

type ResourceQOSCfg struct {
	ClusterStrategy *slov1alpha1.ResourceQOSStrategy `json:"clusterStrategy,omitempty"`
	NodeStrategies  []NodeResourceQOSStrategy        `json:"nodeStrategies,omitempty"`
}
```

The cluster-level config is for setting the global configurations, while the node-level is for users to adjust the
configurations of some nodes, especially for a gray-scale deployment.

Please note that most configured fields have default values inside the components (koordlet, koord-manager), so editing
the changed parameters is usually enough.

### NodeSLO

The data in SLO config is parsed by the koord-manager. The koord-manager checks if the config data is legal, and then
updates the parsed configs into NodeSLO objects for every node. If the parsing fails, the koord-manager records events
to the ConfigMap object to warn the unmarshal errors. For the agent component koordlet, it watches the specifications
in the NodeSLO and reconciles the node QoS features.

```yaml
apiVersion: slo.koordinator.sh/v1alpha1
kind: NodeSLO
metadata:
  name: test-node
spec:
  cpuBurstStrategy: {}
  extensions: {}
  resourceQOSStrategy: {}
  systemStrategy: {}
  # parsed from the `resource-threshold-config` data
  resourceUsedThresholdWithBE:
    cpuSuppressPolicy: cpuset
    cpuSuppressThresholdPercent: 65
    enable: true
    memoryEvictThresholdPercent: 70

```

## Configurations

> Referred version: Koordinator v1.2

The SLO Config template is as follows:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: slo-controller-config
  namespace: koordinator-system
data:
  # colocation-config is the configuration for colocation.
  # Related features: Dynamic resource over-commitment, Load-aware scheduling, Load-aware descheduling.
  # - enable: whether to enable the colocation. If false, the reclaimed resources of the node allocatable (e.g. `kubernetes.io/batch-cpu`) will be removed.
  # - metricAggregateDurationSeconds: the aggregated duration of node metrics reporting.
  # - metricReportIntervalSeconds: the reporting interval of the node metrics.
  # - metricAggregatePolicy: policies of reporting node metrics in different durations.
  # - cpuReclaimThresholdPercent: the reclaim threshold for calculating the reclaimed cpu resource. Basically, the reclaimed resource cannot reclaim the unused resources which are exceeding the threshold.
  # - memoryReclaimThresholdPercent: the reclaim threshold for calculating the reclaimed memory resource. Basically, the reclaimed resource cannot reclaim the unused resources which are exceeding the threshold.
  # - memoryCalculatePolicy: the policy for calculating the reclaimable memory resource. If set to `request`, only unallocated memory resource of high-priority pods are reclaimable, and no allocated memory can be reclaimed.
  # - degradeTimeMinutes: the threshold duration to degrade the colocation for which the node metrics has not been updated.
  # - updateTimeThresholdSeconds: the threshold duration to force updating the reclaimed resources with the latest calculated result.
  # - resourceDiffThreshold: the threshold to update the reclaimed resources than which the calculated reclaimed resources is different from the current.
  # - nodeConfigs: the node-level configurations which matches the nodes via the node selector and overrides the cluster configuration.
  colocation-config: |
    {
      "enable": false,
      "metricAggregateDurationSeconds": 300,
      "metricReportIntervalSeconds": 60,
      "metricAggregatePolicy": {
        "durations": [
          "5m",
          "10m",
          "15m"
        ]
      },
      "cpuReclaimThresholdPercent": 60,
      "memoryReclaimThresholdPercent": 65,
      "memoryCalculatePolicy": "usage",
      "degradeTimeMinutes": 15,
      "updateTimeThresholdSeconds": 300,
      "resourceDiffThreshold": 0.1,
      "nodeConfigs": [
        {
          "name": "anolis",
          "nodeSelector": {
            "matchLabels": {
              "kubernetes.io/kernel": "anolis"
            }
          },
          "updateTimeThresholdSeconds": 360,
          "resourceDiffThreshold": 0.2
        }
      ]
    }
  # The configuration for threshold-based strategies.
  # Related features: BECPUSuppress, BEMemoryEvict, BECPUEvict.
  # - clusterStrategy: the cluster-level configuration.
  # - nodeStrategies: the node-level configurations which matches the nodes via the node selector and overrides the cluster configuration.
  # - enable: whether to enable the threshold-based strategies or not. If false, all threshold-based strategies are disabled. If set to true, CPU Suppress and Memory Evict are enabled by default.
  # - cpuSuppressThresholdPercent: the node cpu utilization threshold to suppress BE pods' usage.
  # - cpuSuppressPolicy: the policy of cpu suppression. If set to `cpuset`, the BE pods' `cpuset.cpus` will be reconciled when suppression. If set to `cfsQuota`, the BE pods' `cpu.cfs_quota_us` will be reconciled.
  # - memoryEvictThresholdPercent: the node memory utilization threshold to evict BE pods.
  # - memoryEvictLowerPercent: the node memory utilization threshold to stop the memory eviction. By default, `lowerPercent = thresholdPercent - 2`.
  # - cpuEvictBESatisfactionLowerPercent: the cpu satisfaction threshold to start the cpu eviction (also require to meet the BE util threshold).
  # - cpuEvictBEUsageThresholdPercent: the BE utilization (BEUsage / BERealLimit) threshold to start the cpu eviction (also require to meet the cpu satisfaction threshold).
  # - cpuEvictBESatisfactionUpperPercent: the cpu satisfaction threshold to stop the cpu eviction.
  # - cpuEvictTimeWindowSeconds: the time window of the cpu metrics for the cpu eviction.
  resource-threshold-config: |
    {
      "clusterStrategy": {
        "enable": false,
        "cpuSuppressThresholdPercent": 65,
        "cpuSuppressPolicy": "cpuset",
        "memoryEvictThresholdPercent": 70,
        "memoryEvictLowerPercent": 65,
        "cpuEvictBESatisfactionUpperPercent": 90,
        "cpuEvictBESatisfactionLowerPercent": 60,
        "cpuEvictBEUsageThresholdPercent": 90
      },
      "nodeStrategies": [
        {
          "name": "anolis",
          "nodeSelector": {
            "matchLabels": {
              "kubernetes.io/kernel": "anolis"
            }
          },
          "cpuEvictBEUsageThresholdPercent": 80
        }
      ]
    }
  # The configuration for QoS-based features.
  # Related features: CPUQoS (GroupIdentity), MemoryQoS (CgroupReconcile), ResctrlQoS.
  # - clusterStrategy: the cluster-level configuration.
  # - nodeStrategies: the node-level configurations which matches the nodes via the node selector and overrides the cluster configuration.
  # - lsrClass/lsClass/beClass: the configuration for pods of QoS LSR/LS/BE respectively. 
  # - cpuQOS: the configuration of CPU QoS.
  #   - enable: whether to enable CPU QoS. If set to `false`, the related cgroup configs will be reset to the system default.
  #   - groupIdentity: the priority level of the Group Identity ([-1, 2]). `2` means the highest priority, while `-1` means the lowest priority. Anolis OS required.
  # - memoryQOS: the configuration of Memory QoS.
  #   - enable: whether to enable Memory QoS. If set to `false`, the related cgroup configs will be reset to the system default.
  #   - minLimitPercent: the scale percentage for setting the `memory.min` based on the container's request. It enables the memory protection from the Linux memory reclaim.
  #   - lowLimitPercent: the scale percentage for setting the `memory.low` based on the container's request. It enables the memory soft protection from the Linux memory reclaim.
  #   - throttlingPercent: the scale percentage for setting the `memory.high` based on the container's limit. It enables the memory throttling in cgroup level.
  #   - wmarkRatio: the ratio of container-level asynchronous memory reclaim based on the container's limit. Anolis OS required.
  #   - wmarkScalePermill: the per-mill of container memory to reclaim in once asynchronous memory reclaim. Anolis OS required.
  #   - wmarkMinAdj: the adjustment percentage of global memory min watermark. It affects the reclaim priority when the node memory free is quite a few. Anolis OS required.
  # - resctrlQOS: the configuration of Resctrl (Intel RDT) QoS.
  #   - enable: whether to enable Resctrl QoS.
  #   - catRangeStartPercent: the starting percentage of the L3 Cache way partitioning. L3 CAT required.
  #   - catRangeEndPercent: the ending percentage of the L3 Cache way partitioning. L3 CAT required.
  #   - mbaPercent: the allocation percentage of the memory bandwidth. MBA required.
  resource-qos-config: |
    {
      "clusterStrategy": {
        "lsrClass": {
          "cpuQOS": {
            "enable": false,
            "groupIdentity": 2
          },
          "memoryQOS": {
            "enable": false,
            "minLimitPercent": 0,
            "lowLimitPercent": 0,
            "throttlingPercent": 0,
            "wmarkRatio": 95,
            "wmarkScalePermill": 20,
            "wmarkMinAdj": -25,
            "priorityEnable": 0,
            "priority": 0,
            "oomKillGroup": 0
          },
          "resctrlQOS": {
            "enable": false,
            "catRangeStartPercent": 0,
            "catRangeEndPercent": 100,
            "mbaPercent": 100
          }
        },
        "lsClass": {
          "cpuQOS": {
            "enable": false,
            "groupIdentity": 2
          },
          "memoryQOS": {
            "enable": false,
            "minLimitPercent": 0,
            "lowLimitPercent": 0,
            "throttlingPercent": 0,
            "wmarkRatio": 95,
            "wmarkScalePermill": 20,
            "wmarkMinAdj": -25,
            "priorityEnable": 0,
            "priority": 0,
            "oomKillGroup": 0
          },
          "resctrlQOS": {
            "enable": false,
            "catRangeStartPercent": 0,
            "catRangeEndPercent": 100,
            "mbaPercent": 100
          }
        },
        "beClass": {
          "cpuQOS": {
            "enable": false,
            "groupIdentity": -1
          },
          "memoryQOS": {
            "enable": false,
            "minLimitPercent": 0,
            "lowLimitPercent": 0,
            "throttlingPercent": 0,
            "wmarkRatio": 95,
            "wmarkScalePermill": 20,
            "wmarkMinAdj": 50,
            "priorityEnable": 0,
            "priority": 0,
            "oomKillGroup": 0
          },
          "resctrlQOS": {
            "enable": false,
            "catRangeStartPercent": 0,
            "catRangeEndPercent": 30,
            "mbaPercent": 100
          }
        }
      },
      "nodeStrategies": [
        {
          "name": "anolis",
          "nodeSelector": {
            "matchLabels": {
              "kubernetes.io/kernel": "anolis"
            }
          },
          "beClass": {
            "memoryQOS": {
              "wmarkRatio": 90
            }
          }
        }
      ]
    }
  # The configuration for the CPU Burst.
  # Related features: CPUBurst.
  # - clusterStrategy: the cluster-level configuration.
  # - nodeStrategies: the node-level configurations which matches the nodes via the node selector and overrides the cluster configuration.
  # - policy: the policy of CPU Burst. If set to `none`, the CPU Burst is disabled. If set to `auto`, the CPU Burst is fully enabled. If set to `cpuBurstOnly`, only the Linux CFS Burst feature is enabled.
  # - cpuBurstPercent: the percentage of Linux CFS Burst. It affects the value of `cpu.cfs_burst_us` of pod/container cgroups. It specifies the percentage to which the CPU limit can be increased by CPU Burst.
  # - cfsQuotaBurstPercent: the percentage of cfs quota burst. It affects the scaled ratio of `cpu.cfs_quota_us` of pod/container cgroups. It specifies the maximum percentage to which the value of cfs_quota in the cgroup parameters can be increased.
  # - cfsQuotaBurstPeriodSeconds: the maximum period of once cfs quota burst. It indicates that the time period in which the container can run with an increased CFS quota is unlimited.
  # - sharePoolThresholdPercent: the threshold of share pool utilization. If the share pool utilization is too high, CPU Burst will be stopped and reset to avoid machine overload.
  cpu-burst-config: |
    {
      "clusterStrategy": {
        "policy": "none",
        "cpuBurstPercent": 1000,
        "cfsQuotaBurstPercent": 300,
        "cfsQuotaBurstPeriodSeconds": -1,
        "sharePoolThresholdPercent": 50
      },
      "nodeStrategies": [
        {
          "name": "anolis",
          "nodeSelector": {
            "matchLabels": {
              "kubernetes.io/kernel": "anolis"
            }
          },
          "policy": "cfsQuotaBurstOnly",
          "cfsQuotaBurstPercent": 400
        }
      ]
    }
  # The configuration for system-level settings.
  # Related features: SystemConfig.
  # - clusterStrategy: the cluster-level configuration.
  # - nodeStrategies: the node-level configurations which matches the nodes via the node selector and overrides the cluster configuration.
  # - minFreeKbytesFactor: the factor for calculating the global minimum memory free watermark `/proc/sys/vm/min_free_kbytes`. `min_free_kbytes = minFreeKbytesFactor * nodeTotalMemory / 10000`.
  # - watermarkScaleFactor: the reclaim factor `/proc/sys/vm/watermark_scale_factor` in once global memory reclaim.
  # - memcgReapBackGround: whether to enable the reaper for orphan memory cgroups.
  system-config: |-
    {
      "clusterStrategy": {
        "minFreeKbytesFactor": 100,
        "watermarkScaleFactor": 150,
        "memcgReapBackGround": 0
      }
      "nodeStrategies": [
        {
          "name": "anolis",
          "nodeSelector": {
            "matchLabels": {
              "kubernetes.io/kernel": "anolis"
            }
          },
          "minFreeKbytesFactor": 100,
          "watermarkScaleFactor": 150
        }
      ]
    }
```

For more information, please check the user manuals and designs of the related features.

## Quick Start

1. Check the current SLO configurations via the ConfigMap `koordinator-system/slo-controller-config`.

```bash
$ kubectl get configmap -n koordinator-system slo-controller-config -o yaml
apiVersion: v1
kind: ConfigMap
metadata:
  annotations:
    meta.helm.sh/release-name: koordinator
    meta.helm.sh/release-namespace: default
  labels:
    app.kubernetes.io/managed-by: Helm
  name: slo-controller-config
  namespace: koordinator-system
data:
  colocation-config: |
    {
      "enable": false,
      "metricAggregateDurationSeconds": 300,
      "metricReportIntervalSeconds": 60,
      "cpuReclaimThresholdPercent": 60,
      "memoryReclaimThresholdPercent": 65,
      "memoryCalculatePolicy": "usage",
      "degradeTimeMinutes": 15,
      "updateTimeThresholdSeconds": 300,
      "resourceDiffThreshold": 0.1
    }
  resource-threshold-config: |
    {
      "clusterStrategy": {
        "enable": false
      }
    }
```

2. Edit the ConfigMap `koordinator-system/slo-controller-config` to change the SLO config.

```bash
$ kubectl edit configmap -n koordinator-system slo-controller-config
```

For example, the configmap is edited as follows:

```yaml
data:
  # ...
  resource-threshold-config: |
    {
      "clusterStrategy": {
        "enable": true,
        "cpuSuppressThresholdPercent": 60,
        "cpuSuppressPolicy": "cpuset",
        "memoryEvictThresholdPercent": 60
      }
    }
```

3. Verify if the NodeSLO is successfully dispatched.

> NOTE: The default values will be omitted in the NodeSLO.

```bash
$ kubectl get nodeslo.slo.koordinator.sh test-node -o yaml
apiVersion: slo.koordinator.sh/v1alpha1
kind: NodeSLO
metadata:
  name: test-node
spec:
  # ...
  extensions: {}
  resourceUsedThresholdWithBE:
    cpuSuppressPolicy: cpuset
    cpuSuppressThresholdPercent: 60
    enable: true
    memoryEvictThresholdPercent: 60
```

# CPU Suppress

## Introduction
In order to ensure the runtime quality of different workloads in co-located scenarios, Koordinator uses the CPU Suppress
mechanism provided by koordlet on the node side to suppress workloads of the Best Effort type when the load increases. 
Or increase the resource quota for Best Effort type workloads when the load decreases.

In the [Dynamic resource overcommitment model](/architecture/resource-model.md) that is provided by 
Koordinator, the total amount of reclaimed resources dynamically changes based on the actual amount of resources used 
by latency-sensitive (LS/LSR/LSE) pods. Reclaimed resources can be used by BE pods. You can use the dynamic resource 
overcommitment feature to improve the resource utilization of a cluster by deploying both LS pods and BE pods in the 
cluster. To ensure sufficient CPU resources for the LS pods on a node, you can use koordinator to limit the CPU 
usage of the BE pods on the node. The elastic resource limit feature can maintain the resource utilization of a node 
below a specified threshold and limit the amount of CPU resources that can be used by BE pods. This ensures the 
stability of the containers on the node.

CPU Threshold indicates the CPU utilization threshold of a node. Pod (LS).Usage indicates the CPU usage of LS pods. 
CPU Restriction for BE indicates the CPU usage of BE pods. The amount of CPU resources that can be used by BE pods 
is adjusted based on the increase or decrease of the CPU usage of LS pods. We recommend that you use the same value 
for CPU Threshold and the reserved CPU watermark in the dynamic resource overcommitment model. 
This ensures a consistent level of CPU resource utilization.

![CPU-Suppress](/img/cpu-suppress-demo.svg)

## Setup

### Prerequisite

- Kubernetes >= 1.18
- Koordinator >= 0.6

### Installation

Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to 
[Installation](/docs/installation).

### Configurations
When installing through the helm chart, the ConfigMap slo-controller-config will be created in the koordinator-system 
namespace, and the CPU Suppress mechanism is enabled by default. If it needs to be closed, refer to the configuration 
below, and modify the configuration of the resource-threshold-config section to take effect.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: slo-controller-config
  namespace: {{ .Values.installation.namespace }}
data:
  ...
  resource-threshold-config: |
    {
      "clusterStrategy": {
        "enable": true,
        "cpuSuppressThresholdPercent": 65
      }
    }
```

#### (Optional) Advanced Settings
Also, the `CPU Suppress` feature allows you to configure the CPU utilization threshold in a fine-grained manner.
The following table describes the parameters.

| Parameter | Data type | Valid value | Description |
| --------- | --------- | ----------- | ----------- |
| enable	| Boolean	| true; false | true: enables the elastic resource limit feature; false: disables the elastic resource limit feature. |
| cpuSuppressThresholdPercent | Int | 0~100	| The CPU utilization threshold of the node. Unit: %. Default value: 65. |

## Use CPU Suppress

1. Create a configmap.yaml file based on the following ConfigMap content:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: slo-controller-config
  namespace: koordinator-system
data:
  # Enable the elastic resource limit feature. 
  resource-threshold-config: |
    {
      "clusterStrategy": {
        "enable": true   
      }
    }
```

2. Run the following command to update the ConfigMap.
To avoid changing other settings in the ConfigMap, we commend that you run the kubectl patch command to update the ConfigMap.

```bash
kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"
```

3. Run the following command to query the CPU cores that are allocated to the BE pods on the node:
```bash
cat /sys/fs/cgroup/cpuset/kubepods.slice/kubepods-besteffort.slice/cpuset.cpus
```
Expected output:
```bash
10-25,35-51,62-77,87-103 
```
The output shows that the following CPU cores are allocated to the BE pods on the node: 10-25, 35-51, 62-77, and 87-103,
which will be changed dynamically according to the load of latency-sensitve pods. 
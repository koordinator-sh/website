# CPU Burst

## Introduction

CPU Burst is a service level objective (SLO)-aware resource scheduling feature provided by Koordinator. You can use CPU Burst to improve the performance of latency-sensitive applications. CPU scheduling for a container may be throttled by the kernel due to the CPU limit, which downgrades the performance of the application. The koordlet component automatically detects CPU throttling events and automatically adjusts the CPU limit to a proper value. This greatly improves the performance of latency-sensitive applications.

### How CPU Burst works

Kubernetes allows you to specify CPU limits, which can be reused based on time-sharing. If you specify a CPU limit for a container, the OS limits the amount of CPU resources that can be used by the container within a specific time period. For example, you set the CPU limit of a container to 2. The OS kernel limits the CPU time slices that the container can use to 200 milliseconds within each 100-millisecond period.

CPU utilization is a key metric that is used to evaluate the performance of a container. In most cases, the CPU limit is specified based on CPU utilization. CPU utilization on a per-millisecond basis shows more spikes than on a per-second basis. If the CPU utilization of a container reaches the limit within a 100-millisecond period, CPU throttling is enforced by the OS kernel and threads in the container are suspended for the rest of the time period, as shown in the following figure.

![image](/img/cpu-throttles.png)

The following figure shows the thread allocation of a web application container that runs on a node with four vCPUs. The CPU limit of the container is set to 2. The overall CPU utilization within the last second is low. However, Thread 2 cannot be resumed until the third 100-millisecond period starts because CPU throttling is enforced somewhere in the second 100-millisecond period. This increases the response time (RT) and causes long-tail latency problems in containers.

![image](/img/cpu-throttles-1.png)

Upstream Linux kernel >=5.14 and Anolis OS both provide [Burstable CFS Controller](https://github.com/torvalds/linux/commit/f4183717b370ad28dd0c0d74760142b20e6e7931#diff-cc1a82129952a910fdc4292448c2a097a2ba538bebefcf3c06381e45639ae73e), namely *CPU Burst* feature. It allows a container to accumulate CPU time slices when the container is idle. The container can use the accumulated CPU time slices to burst above the CPU limit when CPU utilization spikes. This improves performance and reduces the RT of the container.

![image](/img/cpu-throttles-2.png)

For kernel versions that do not support CPU Burst, koordlet detects CPU throttling events and dynamically adjusts the CPU limit to achieve the same effect as CPU Burst.

For more information about CPU Burst, see the presentation at KubeCon 2021: [CPU Burst: Getting Rid of Unnecessary Throttling, Achieving High CPU Utilization and Application Performance at the Same Time](https://kccncosschn21.sched.com/event/pcdF?spm=a2c63.p38356.0.0.2ec3731dhQbCIe&iframe=no).

## Setup

### Prerequisite

- Kubernetes >= 1.18
- Koordinator >= 0.3

### Installation

Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to
[Installation](/docs/installation).

### Configurations

Koordlet has already enabled CPU Burst feature (`-feature-gates=AllAlpha=true`). If not, please enable it manually by updating the feature gate in the koordlet daemonset.

NOTE: CPU Burst is not available for `LSR` and `BE` pods since it targets on burstable cpu usages.

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: koordlet
spec:
  selector:
    matchLabels:
      koord-app: koordlet
  template:
    metadata:
      labels:
        koord-app: koordlet
    spec:
      containers:
        - command:
            - /koordlet
          args:
            - -CgroupRootDir=/host-cgroup/
            - -feature-gates=XXXX,CPUBurst=true # enable CPU Burst feature
            ...
```

## Use CPU Burst

### Use an annotation to enable CPU Burst for the pod

Add the following annotation to the pod configuration to enable CPU Burst:

```yaml
apiVersion: apps/v1
kind: Pod
metadata:
  name: demo-pod-xxx
  annotations:
    # Set the value to auto to enable CPU Burst for the pod.
    koordinator.sh/cpuBurst: '{"policy": "auto"}'
    # To disable CPU Burst for the pod, set the value to none.
    #koordinator.sh/cpuBurst: '{"policy": "none"}'
```

### Use a ConfigMap to enable CPU Burst for all pods in a cluster

Modify the slo-controller-config ConfigMap based on the following content to enable CPU Burst for all pods in a cluster:

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

### (Optional) Advanced Settings

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

| Field                      | Data type | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| policy                     | string    | <ul> <li> none: disables CPU Burst. If you set the value to none, the related fields are reset to their original values. This is the default value.</li> <li>cpuBurstOnly: enables the CPU Burst feature only for the kernel of Anolis OS or upstream linux kernel >= 5.14. </li><li> cfsQuotaBurstOnly: enables automatic adjustment of CFS quotas of general kernel versions. </li> <li> auto: enables CPU Burst and all the related features. </li> </ul> |
| cpuBurstPercent            | int       | Default value:`1000`. Unit: %. This field specifies the percentage to which the CPU limit can be increased by CPU Burst. If the CPU limit is set to `1`, CPU Burst can increase the limit to 10 by default.                                                                                                                                                                                                                                                  |
| cfsQuotaBurstPercent       | int       | Default value:`300`. Unit: %. This field specifies the maximum percentage to which the value of cfs_quota in the cgroup parameters can be increased. By default, the value of cfs_quota can be increased to at most three times.                                                                                                                                                                                                                             |
| cfsQuotaBurstPeriodSeconds | int       | Default value:`-1`. Unit: seconds. This indicates that the time period in which the container can run with an increased CFS quota is unlimited. This field specifies the time period in which the container can run with an increased CFS quota, which cannot exceed the upper limit specified by `cfsQuotaBurstPercent`.                                                                                                                                    |
| sharePoolThresholdPercent  | int       | Default value:`50`. Unit: %. This field specifies the CPU utilization threshold of the node. If the CPU utilization of the node exceeds the threshold, the value of cfs_quota in cgroup parameters is reset to the original value.                                                                                                                                                                                                                           |

### Verify CPU Burst

1. Use the following YAML template to create an apache-demo.yaml file.

> To enable CPU Burst for a pod, specify an annotation in the annotations parameter of the metadata section of the pod configuration.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: apache-demo
  annotations:
    koordinator.sh/cpuBurst: '{"policy": "auto"}'   # Use this annotation to enable or disable CPU Burst.
spec:
  containers:
  - command:
    - httpd
    - -D
    - FOREGROUND
    image: koordinatorsh/apache-2-4-51-for-slo-test:v0.1
    imagePullPolicy: Always
    name: apache
    resources:
      limits:
        cpu: "4"
        memory: 10Gi
      requests:
        cpu: "4"
        memory: 10Gi
  nodeName: # $nodeName Set the value to the name of the node that you use.
  hostNetwork: False
  restartPolicy: Never
  schedulerName: default-scheduler
```

2. Run the following command to create an application by using Apache HTTP Server.

```bash
kubectl apply -f apache-demo.yaml
```

3. Use the wrk2 tool to perform stress tests.

```bash
# Download, decompress, and then install the wrk2 package.
# The Gzip module is enabled in the configuration of the Apache application. The Gzip module is used to simulate the logic of processing requests on the server.
# Run the following command to send requests. Replace the IP address in the command with the IP address of the application.
./wrk -H "Accept-Encoding: deflate, gzip" -t 2 -c 12 -d 120 --latency --timeout 2s -R 24 http://$target_ip_address:8010/static/file.1m.test
```

4. Check the results of CPU Burst enabled and disabled.

e.g. We may have the following results:

| CentOS 7                    | Disabled  | Enabled           |
| ----------------------------- | ----------- | ------------------- |
| apache RT-p99               | 111.69 ms | 71.30 ms (-36.2%) |
| CPU Throttled Ratio         | 33%       | 0%                |
| Average pod CPU utilization | 32.5%     | 33.8%             |

The preceding metrics indicate the following information:

- After CPU Burst is enabled, the P99 latency of apache is greatly reduced.
- After CPU Burst is enabled, CPU throttling is stopped and the average pod CPU utilization remains approximately at the same value.

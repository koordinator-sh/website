# Memory QoS

## Introduction

The Koordlet provides the *Memory Quality of Service* (QoS) feature for containers. You can use this feature to
optimize the performance of memory-sensitive applications while ensuring fair memory scheduling among containers. This
topic describes how to enable the memory QoS feature for containers.

### Background

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

Memory QoS provides the following optimizations to improve the memory utilization of pods:

- When the memory used by a pod is about to reach the memory limit of the pod, the memcg performs asynchronous reclaim for a specific amount of memory. This prevents the reclaim of all the memory that the pod uses and therefore minimizes the adverse impact on the application performance caused by direct memory reclaim.
- Memory reclaim is performed in a fairer manner among pods. When the available memory on a node becomes insufficient, memory reclaim is first performed on pods that use more memory than their memory requests. This ensures sufficient memory on the node when a pod applies for a large amount of memory.
- If the BestEffort pods on a node use more memory than their memory requests, the system prioritizes the memory requirements of Guaranteed pods and Burstable pods over the memory requirements of BestEffort pods.

![image](/img/memory-qos.png)

## Setup

### Prerequisite

- Kubernetes >= 1.18
- Koordinator >= 0.3

### Installation

Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to
[Installation](/docs/installation).

### Configurations

Koordlet has already enabled Memory QoS feature (`-feature-gates=AllAlpha=true`).
If not, please enable it manually by updating the feature gate in the koordlet daemonset.

> NOTE: Memory QoS is controlled by the `CgroupReconcile` feature-gate.

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
            - -feature-gates=XXXX,CgroupReconcile=true # enable CPU Burst feature
            ...
```

## Use Memory QoS

When you enable memory QoS for the containers in a pod, the memcg is automatically configured based on the specified
ratios and pod parameters. To enable memory QoS for the containers in a pod, perform the following steps.

### Use an annotation to enable Memory QoS for the pod

Add the following annotations to enable memory QoS for the containers in a pod:

```yaml
annotations:
  # To enable memory QoS for the containers in a pod, set the value to auto.
  koordinator.sh/memoryQOS: '{"policy": "auto"}'
  # To disable memory QoS for the containers in a pod, set the value to none.
  #koordinator.sh/memoryQOS: '{"policy": "none"}'
```

### Use a ConfigMap to enable memory QoS for all the containers in a cluster

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
           "memoryQOS": {
             "enable": true
           }
         },
        "beClass": {
           "memoryQOS": {
             "enable": true
           }
         }
      }
    }
```

### (Optional) Advanced Settings

The following table describes the advanced parameters that you can use to configure fine-grained memory QoS
configurations at the pod level and cluster level.

| Parameter         | Data type | Valid value                                                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------- | ----------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| enable            | Boolean   | <ul> <li> true </li> <li> false </li> </ul>                   | <ul> <li> true: enables memory QoS for all the containers in a cluster. The default memory QoS settings for the QoS class of the containers are used. </li> <li> false: disables memory QoS for all the containers in a cluster. The memory QoS settings are restored to the original settings for the QoS class of the containers. </li> </ul>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| policy            | String    | <ul> <li> auto </li> <li> default </li> <li> none </li> </ul> | <ul> <li> auto: enables memory QoS for the containers in the pod and uses the recommended memory QoS settings. The recommended memory QoS settings are prioritized over the cluster-wide memory QoS settings. </li> <li> default: specifies that the pod inherits the cluster-wide memory QoS settings. </li> <li> none: disables memory QoS for the pod. The relevant memory QoS settings are restored to the original settings. The original settings are prioritized over the cluster-wide memory QoS settings. </li> </ul>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| minLimitPercent   | Int       | 0~100                                                         | Unit: %. Default value:`0`. The default value indicates that this parameter is disabled. This parameter specifies the unreclaimable proportion of the memory request of a pod. The amount of unreclaimable memory is calculated based on the following formula: `Value of memory.min = Memory request × Value of minLimitPercent/100`. This parameter is suitable for scenarios where applications are sensitive to the page cache. You can use this parameter to cache files to optimize read and write performance. For example, if you specify Memory `Request=100MiB` and `minLimitPercent=100` for a container, `the value of memory.min is 104857600`.                                                                                                                                                                                                                                                                                                                                                                                                             |
| lowLimitPercent   | Int       | 0~100                                                         | Unit: %. Default value:`0`. The default value indicates that this parameter is disabled. This parameter specifies the relatively unreclaimable proportion of the memory request of a pod. The amount of relatively unreclaimable memory is calculated based on the following formula: `Value of memory.low = Memory request × Value of lowLimitPercent/100`. For example, if you specify `Memory Request=100MiB` and `lowLimitPercent=100` for a container, `the value of memory.low is 104857600`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| throttlingPercent | Int       | 0~100                                                         | Unit: %. Default value:`0`. The default value indicates that this parameter is disabled. This parameter specifies the memory throttling threshold for the ratio of the memory usage of a container to the memory limit of the container. The memory throttling threshold for memory usage is calculated based on the following formula: `Value of memory.high = Memory limit × Value of throttlingPercent/100`. If the memory usage of a container exceeds the memory throttling threshold, the memory used by the container will be reclaimed. This parameter is suitable for container memory overcommitment scenarios. You can use this parameter to cgroups from triggering OOM. For example, if you specify `Memory Limit=100MiB` and `throttlingPercent=80` for a container, `the value of memory.high is 83886080`, which is equal to 80 MiB.                                                                                                                                                                                                                     |
| wmarkRatio        | Int       | 0~100                                                         | Unit: %. Default value:`95`. A value of `0` indicates that this parameter is disabled. This parameter specifies the threshold of the usage of the memory limit or the value of `memory.high` that triggers asynchronous memory reclaim. If `throttlingPercent` is disabled, the asynchronous memory reclaim threshold for memory usage is calculated based on the following formula: `Value of memory.wmark_high = Memory limit × wmarkRatio/100`. If `throttlingPercent` is enabled, the asynchronous memory reclaim threshold for memory usage is calculated based on the following formula: `Value of memory.wmark_high = Value of memory.high × wmarkRatio/100`. If the usage of the memory limit or the value of memory.high exceeds the threshold, the memcg backend asynchronous reclaim feature is triggered. For example, if you specify `Memory Limit=100MiB`for a container, the memory throttling setting is`memory.high=83886080`, the reclaim ratio setting is `memory.wmark_ratio=95`, and the reclaim threshold setting is `memory.wmark_high=79691776`. |
| wmarkMinAdj       | Int       | -25~50                                                        | Unit: %. The default value is `-25` for the `LS`/ `LSR` QoS class and `50` for the `BE` QoS class. A value of 0 indicates that this parameter is disabled. This parameter specifies the adjustment to the global minimum watermark for a container. A negative value decreases the global minimum watermark and therefore postpones memory reclaim for the container. A positive value increases the global minimum watermark and therefore antedates memory reclaim for the container. For example, if you create a pod whose QoS class is LS, the default setting of this parameter is `memory.wmark_min_adj=-25`, which indicates that the minimum watermark is decreased by 25% for the containers in the pod.                                                                                                                                                                                                                                                                                                                                                       |

### Example

0. The testing environment is shown below:

- Kubernetes: 1.20
- Nodes:
  - Stress Node: an ECS instance (8 vCPU, 32GB RAM) for performing stress tests.
  - Tested Node: an ECS instance (8 vCPU, 32GB RAM) runs the workload and serves.

1. Create a file named redis-demo.yaml with the following YAML template:

```yaml
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-demo-config
data:
  redis-config: |
    appendonly yes
    appendfsync no
---
apiVersion: v1
kind: Pod
metadata:
  name: redis-demo
  labels:
    name: redis-demo
  annotations:
    koordinator.sh/memoryQOS: '{"policy": "auto"}' # Add this annotation to enable memory QoS
    koordinator.sh/qosClass: 'LS' # Set the QoS class of the Redis pod to LS
spec:
  containers:
  - name: redis
    image: redis:5.0.4
    command:
      - redis-server
      - "/redis-master/redis.conf"
    env:
    - name: MASTER
      value: "true"
    ports:
    - containerPort: 6379
    resources:
      limits:
        cpu: "2"
        memory: "6Gi"
      requests:
        cpu: "2"
        memory: "2Gi"
    volumeMounts:
    - mountPath: /redis-master-data
      name: data
    - mountPath: /redis-master
      name: config
  volumes:
    - name: data
      emptyDir: {}
    - name: config
      configMap:
        name: redis-demo-config
        items:
        - key: redis-config
          path: redis.conf
  nodeName: # Set nodeName to the name of the tested node
---
apiVersion: v1
kind: Service
metadata:
  name: redis-demo
spec:
  ports:
  - name: redis-port
    port: 6379
    protocol: TCP
    targetPort: 6379
  selector:
    name: redis-demo
  type: ClusterIP
```

2. Run the following command to deploy Redis Server as the test application.

You can access the redis-demo Service from within the cluster.

```bash
kubectl apply -f redis-demo.yaml
```

3. Simulate the scenario of memory overcommitment.

Use the Stress tool to increase the load on memory and trigger memory reclaim. The sum of the memory limits of all pods
on the node exceeds the physical memory of the node.

    a. Create a file named stress-demo.yaml with the following YAML template:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: stress-demo
  labels:
    name: stress-demo
  annotations:
    koordinator.sh/memoryQOS: '{"policy": "auto"}' # Add this annotation to enable memory QoS
    koordinator.sh/qosClass: 'BE' # Set the QoS class of the Stress pod to BE
spec:
  containers:
    - args:
        - '--vm'
        - '2'
        - '--vm-bytes'
        - 11G
        - '-c'
        - '2'
        - '--vm-hang'
        - '2'
      command:
        - stress
      image: polinux/stress
      imagePullPolicy: Always
      name: stress
  restartPolicy: Always
  nodeName: # Set nodeName to the name of the tested node, which is the node on which the Redis pod is deployed
```

    b. Run the following command to deploy stress-demo:

```bash
kubectl apply -f stress-demo.yaml
```

4. Run the following command to query the global minimum watermark of the node:

> Note In memory overcommitment scenarios, if the global minimum watermark of the node is set to a low value, OOM
> killers may be triggered for all pods on the node even before memory reclaim is performed. Therefore, we recommend
> that you set the global minimum watermark to a high value. In this example, the global minimum watermark is set
> to 4,000,000 KB for the tested node that has 32 GiB of memory.

```bash
cat /proc/sys/vm/min_free_kbytes
```

Expected output:

```bash
4000000
```

5. Use the following YAML template to deploy the memtier-benchmark tool to send requests to the tested node:

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    name: memtier-demo
  name: memtier-demo
spec:
  containers:
    - command:
        - memtier_benchmark
        - '-s'
        - 'redis-demo'
        - '--data-size'
        - '200000'
        - "--ratio"
        - "1:4"
      image: 'redislabs/memtier_benchmark:1.3.0'
      name: memtier
  restartPolicy: Never
  nodeName: # Set nodeName to the name of the stress node that is used to send requests.
```

6. Run the following command to query the test results from memtier-benchmark:

```bash
kubectl logs -f memtier-demo
```

7. Use the following YAML template to disable memory QoS for the Redis pod and Stress pod. Then, perform stress tests
again and compare the results.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: redis-demo
  labels:
    name: redis-demo
  annotations:
    koordinator.sh/memoryQOS: '{"policy": "none"}' # Disable memory QoS.
    koordinator.sh/qosClass: 'LS'
spec:
  ...

---
apiVersion: v1
kind: Pod
metadata:
  name: stress-demo
  labels:
    name: stress-demo
  annotations:
    koordinator.sh/memoryQOS: '{"policy": "none"}' # Disable memory QoS.
    koordinator.sh/qosClass: 'BE'
```

8. Check the results of Memory QoS enabled and disabled.

- Disabled: Set the memory QoS policy of the pod to `none`.
- Enabled: Set the memory QoS policy of the pod to `auto` (the recommended parameters of memory QoS are used).

| Metric            | Disabled      | Enabled       |
| ----------------- | ------------- | ------------- |
| Latency-avg       | 51.32 ms      | 47.25 ms      |
| Throughput-avg    | 149.0 MB/s    | 161.9 MB/s    |

The table shows that the latency of the Redis pod is reduced by 7.9% and the throughput of the Redis pod is increased
by 8.7% after memory QoS is enabled. This indicates that the memory QoS feature can optimize the performance of
applications in memory overcommitment scenarios.

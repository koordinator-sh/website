# Eviction Strategy base on CPU Satisfaction

## Introduction
Koordinator supports [CPU Suppress](/docs/user-manuals/cpu-suppress) strategy, which is used for limiting the available
CPU Cores of low-priority Pods (BE) according to the usage of high-priority Pods (LS) under during co-location. When the
resource usage of LS Pods increases, `Koordlet` will reduce the CPU cores that can be used by BE Pods. However, when the
LS Pod utilization increases suddenly, large number of BE Pods could be suppressed on small number of CPUs, resulting in
the low resource satisfaction of BE pods, moreover, there might be some additional competition on kernel resources. 

In fact, most BE pods are batch computing type, which have well failover abilities, and the eviction is acceptable for
them since they can retry with better resource quality on other nodes. `Koordlet` provides an eviction strategy based 
on CPU resource satisfaction. When the utilization and resource satisfaction exceed the threshold at the same time,
pods with lower priority and higher CPU utilization will be evicted first until the CPU satisfaction has returned 
above the threshold.

![image](/img/cpu-evict.svg)

### Prerequisite
Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to 
[Installation](/docs/installation).
Batch resource overcommitment and cpu suppress strategy must be enabled first, see this [manual](/docs/user-manuals/cpu-suppress) 
for more details.

| Component | Version Requirement |
| --- | ------- |
| Kubernetes | ≥v1.18 |
| koordinator | ≥v0.3.0 |

The eviction strategy is provided by `Koordlet`, which is disabled by default in feature-gate.
Please make sure the `BECPUEvict=true` field has been added in the `-feature-gates` arguments of `Koordlet`
as the [example](https://github.com/koordinator-sh/charts/blob/main/versions/v1.2.0/templates/koordlet.yaml#L36)。

## Use Eviction Strategy base on CPU Satisfaction

1. Create a configmap.yaml file based on the following ConfigMap content:
   ```yaml
   #ConfigMap slo-controller-config example。
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: slo-controller-config # name should be set as the configuration of koord-manager, e.g. ack-slo-config 
     namespace: koordinator-system # namespace should be set as the configuration of installation, e.g. kube-system
   data:
     # enable the eviction strategy base on CPU satisfaction
     resource-threshold-config: |
       {
         "clusterStrategy": {
           "enable": true,
           "cpuEvictBESatisfactionLowerPercent": 60,
           "cpuEvictBESatisfactionUpperPercent": 80,
           "cpuEvictBEUsageThresholdPercent": 90,
           "CPUEvictTimeWindowSeconds": 60
         }
       }
   ```
   
   | Configuration item | Parameter | Valid values | Description                                                  |
   | :-------------- | :------ | :-------- | :----------------------------------------------------------- |
   | `enable`        | Boolean | true; false | true：enable the eviction.; false(default): disable the eviction. |
   | `cpuEvictBESatisfactionLowerPercent` | Int     | 0~60      | eviction threshold percent of BE CPU satisfaction. BE pods will be evicted if the satisfaction less than the threshold. |
   | `cpuEvictBESatisfactionUpperPercent` | Int     | cpuEvictBESatisfactionLowerPercent~100      | threshold percent of BE CPU satisfaction. eviction will be stopped if the satisfaction greater than the threshold. |
   | `cpuEvictBEUsageThresholdPercent` | Int     | 0~100      | threshold of BE CPU utilization. Pods will be evicted if the BE utilization under the suppressed CPU greater than the threshold. default value is 90. |
   | `cpuEvictTimeWindowSeconds` | Int     | >=2      | time window by seconds during calculating the CPU satisfaction and BE CPU utilization. |

2. Check whether a ConfigMap named `slo-controller-config` exists in the `koordinator-system` namespace.

  - If a ConfigMap named  `slo-controller-config`  exists, we commend that you run the kubectl patch command to update the ConfigMap. This avoids changing other settings in the ConfigMap.

    ```bash
    kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"
    ```

  - If no ConfigMap named `slo-controller-config`  exists, run the kubectl patch command to create a ConfigMap named ack-slo-config:

    ```bash
    kubectl apply -f configmap.yaml
    ```
    
3. Create a file named be-pod-demo.yaml based on the following YAML content:
   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: be-pod-demo
     labels:
       koordinator.sh/qosClass: 'BE' # set Pod QoS as BE
   spec:
     containers:
       - args:
           - '-c'
           - '4'
           - '--vm'
           - '1'
         command:
           - stress
         image: polinux/stress
         imagePullPolicy: Always
         name: stress
         resources:
           limits:
             kubernetes.io/batch-cpu: 4k
             kubernetes.io/batch-memory: 4Gi
           requests:
             kubernetes.io/batch-cpu: 4k
             kubernetes.io/batch-memory: 4Gi
     restartPolicy: Always
     schedulerName: default-scheduler
   ```
   
4. Run the following command to deploy the be-pod-demo pod in the cluster:

   ```bash
   kubectl apply -f be-pod-demo.yaml
   ```
   
5. Run the following command to check the be-pod-demo pod in Running state:

   ```bash
   $ kubectl get pod be-pod-demo
   NAME          READY   STATUS    RESTARTS   AGE
   be-pod-demo   1/1     Running   0          7s
   
6. Run the following command through [stress tool](https://linux.die.net/man/1/stress)
make sure the memory usage of node is above the threshold config, and the argument `--cpu`
means the process will consume 10 cores, this should be adjusted according to the node capacity.

   ```bash
   $ stress --cpu 1 --vm 1 --vm-bytes 10G --vm-keep
   ```
   
7. Check the running state of be-pod-demo, then you can find the be-pod-demo pod is not exist,
and the eviction information can be found in events.

   ```bash
   $ kubectl get pod be-pod-demo
   Error from server (NotFound): pods "be-pod-demo" not found
   
   $ kubectl get event
   LAST SEEN   TYPE      REASON            OBJECT              MESSAGE
   44s         Normal    Killing           pod/be-pod-demo                     Stopping container stress
   44s         Warning   evictPodSuccess   ${your-pod-object}   evict Pod:be-pod-demo, reason: EvictPodByBECPUSatisfaction, message: killAndEvictBEPodsRelease for node(${your-node-id}), need realase CPU : 1200
   ```

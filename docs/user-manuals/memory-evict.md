# Eviction Strategy base on Memory Usage

## Introduction

Koordinator supports the dynamic overcommitment from idle resources on node to low-priority
Pods as Batch priority. In co-location scenarios, the actual memory resource usage of 
nodes is constantly changing. For incompressible resources such as memory, high resource 
usage of node may cause OOM, which results in the high-priority Pod got killed. Koordinator 
provides an eviction strategy based on the memory usage node. `Koordlet` will continuously 
detect the memory usage of node (Total-Available) in second-level granularity. 
When the resource memory usage of node is high, it will evict low-priority BE Pods to 
ensure the QoS of high-priority pods until the memory usage of node reduces below to the 
threshold (evictThreshold). During the eviction process, Pods with lower priority(Pod.Spec.Priority)
will be selected first, and if the priority is the same, Pods which consume more memory will be 
evicted first.


![image](/img/memory-evict.svg)

### Prerequisite
Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to 
[Installation](/docs/installation).

| Component | Version Requirement |
| --- | ------- |
| Kubernetes | ≥v1.18 |
| koordinator | ≥v0.3.0 |

The eviction strategy is provided by `Koordlet`, which is disabled by default in feature-gate.
Please make sure the `BEMemoryEvict=true` field has been added in the `-feature-gates` arguments of `Koordlet`
as the [example](https://github.com/koordinator-sh/charts/blob/main/versions/v1.2.0/templates/koordlet.yaml#L36)。

## Use Eviction Strategy base on Memory Usage

1. Create a configmap.yaml file based on the following ConfigMap content:
   ```yaml
   #ConfigMap slo-controller-config example。
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: slo-controller-config # name should be set as the configuration of koord-manager, e.g. ack-slo-config 
     namespace: koordinator-system # namespace should be set as the configuration of installation, e.g. kube-system
   data:
     # enable the eviction strategy base on Memory Usage
     resource-threshold-config: |
       {
         "clusterStrategy": {
           "enable": true,
           "memoryEvictThresholdPercent": 70
         }
       }
   ```
   
   | Configuration item | Parameter | Valid values | Description                                                  |
   | :-------------- | :------ | :-------- | :----------------------------------------------------------- |
   | `enable`        | Boolean | true; false | true：enable the eviction.; false（default）：disable the eviction. |
   | `memoryEvictThresholdPercent` | Int     | 0~100      | eviction threshold percent of node memory usage, default is 70. |
   
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
           - '1'
           - '--vm'
           - '1'
         command:
           - stress
         image: polinux/stress
         imagePullPolicy: Always
         name: stress
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
   ```
6. Run the following command through [stress tool](https://linux.die.net/man/1/stress)
make sure the memory usage of node is above the threshold config, and the argument `--vm-bytes`
means the process will consume 10GB memory, this should be adjusted according to the node capacity.

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
   46s         Normal    Killing           pod/be-pod-demo     Stopping container stress
   48s         Warning   evictPodSuccess   ${your-pod-object}     evict Pod:be-pod-demo, reason: EvictPodByNodeMemoryUsage, message: killAndEvictBEPods for node(${your-node-id}), need to release memory: 8077889699
   ```
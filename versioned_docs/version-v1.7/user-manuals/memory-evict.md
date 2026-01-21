# Memory Resource Eviction Strategy

## Introduction
### Usage-Based Strategy
Koordinator supports dynamically overselling idle node resources to low-priority Pods. In co-location scenarios, the actual memory resource usage of nodes is constantly changing. For incompressible resources such as memory, when node resource usage is high, it may cause node-wide memory OOM, leading to high-priority Pod processes being killed. To prevent this situation, Koordinator provides an eviction strategy based on single-node memory usage (BEMemoryEvict/MemoryEvict).
The single-node component Koordlet continuously detects the entire node's memory usage (Total-Available) at second-level granularity. When the entire node's memory usage is high, enabling BEMemoryEvict will evict low-priority BE type Pods,
while enabling MemoryEvict will select Pods for eviction based on slo-config priority configuration to ensure the service quality of high-priority Pods. During the eviction process, Pods with lower priority (Pod.Spec.Priority) will be evicted first.
If priorities are the same, Pods with higher memory resource usage will be evicted preferentially until the entire node's memory usage drops below the configured safety watermark (evictThreshold).

![image](/img/memory-evict.svg)

### Allocated-Based Strategy
Koordinator supports statically specifying node logical resources (mid) and dynamically overselling idle node resources to low-priority Pods. In co-location scenarios, the actual memory resource usage of nodes is constantly changing. When slo-config configuration changes or node resource usage spikes, it will cause the mid/batch account calculated by slo-manager to decrease significantly. If eviction based on satisfaction and usage is not timely enough, it may cause node crashes. To prevent this situation, Koordinator provides an eviction strategy based on single-node account allocated usage (MemoryAllocatableEvict).
The single-node component Koordlet calculates the usage of the entire node's mid-memory/batch-memory accounts. When the request usage reaches the set threshold, it will evict Pods according to priority to ensure the service quality of high-priority Pods. During the eviction process, Pods with lower priority (Pod.Spec.Priority) will be evicted first.
If priorities are the same, Pods with higher memory request usage will be evicted preferentially until the entire node's memory usage drops below the configured safety watermark (evictThreshold).

## Prerequisites
### Components
Please ensure Koordinator is correctly installed in your cluster. If not, refer to the [Installation Documentation](https://koordinator.sh/docs/installation). The version requirements are as follows:

| Component | Version Requirement |
| --- | ------- |
| Kubernetes | ≥v1.18 |
| koordinator | ≥v1.18.0 |

This feature is provided by the single-node component Koordlet. The corresponding feature-gate is disabled by default. Before use, ensure that `BEMemoryEvict/MemoryEvict/MemoryAllocatableEvict=true` has been added to the koordlet startup parameter `-feature-gates`.
See [reference example](https://github.com/koordinator-sh/charts/blob/main/versions/v1.8.0/templates/koordlet.yaml#L36). 

In summary:
- **BEMemoryEvict / MemoryEvict** is triggered based on actual memory utilization of the entire node
- **MemoryAllocatableEvict** is triggered based on the allocated amount of logical resource accounts (such as mid-memory / batch-memory)

**Recommendations:**
- All co-location production environments should enable **MemoryEvict** as the last line of defense against node OOM to prevent high-priority (LS) Pods from being killed by the kernel.
- If BE Pod types are clearly defined and there is no need to evict other low-priority Pods, **BEMemoryEvict** can be used as a lightweight alternative.
- If logical resource partitioning such as mid-memory / batch-memory is used (i.e., SLO resource model is enabled), it is recommended to enable **MemoryAllocatableEvict** to prevent account oversubscription.
- When multiple features are enabled simultaneously, they target different Pod sets (no duplicate eviction targets), and the overall resource release effect is cumulative, which will be considered together in scheduling and capacity planning.
### Pod
Since the pods affected by MemoryEvict/MemoryAllocatableEvict are limited by priority (Pod.Spec.Priority), to avoid evicting certain low-priority but important pods, only pods with the label `koordinator.sh/eviction-enabled: "true"`
are allowed to be evicted. In addition, when other conditions and priorities are the same, pods can be further evicted from low to high based on the label `koordinator.sh/priority`. When multiple features are enabled, you can configure
the pod's annotation `koordinator.sh/eviction-policy: '["BEMemoryEvict","MemoryEvict"]'` to limit which features can act on it. If not configured, there are no restrictions.

## Operation Steps
### Usage
1. Use the following ConfigMap to create a configmap.yaml file
   ```yaml
   # ConfigMap slo-controller-config example.
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: slo-controller-config # name should be based on the actual koord-manager configuration, e.g. slo-controller-config
     namespace: koordinator-system # namespace should be based on the actual installation, e.g. kube-system
   data:
     # Enable eviction feature based on memory usage
     resource-threshold-config: |
       {
         "clusterStrategy": {
           "enable": true,
           "memoryEvictThresholdPercent": 70
         }
       }
   ```
   
   | Parameter                     | Type    | Value Range | Description                                                                                                                                    |
   |:------------------------------|:--------|:------------|:-----------------------------------------------------------------------------------------------------------------------------------------------|
   | `enable`                      | Boolean | true; false | true: Enable single-node memory eviction strategy globally for the cluster. false (default): Disable the strategy globally.                    |
   | `memoryEvictThresholdPercent` | Int     | 0~100       | Memory usage percentage threshold that triggers eviction for the entire node. Required when BEMemoryEvict/MemoryEvict is enabled. Default: 70. |

2. Check whether a ConfigMap named `slo-controller-config` exists in the `koordinator-system` namespace. The namespace and ConfigMap name are examples and should be based on the actual installation configuration.

   - If a ConfigMap named `slo-controller-config` exists, use the PATCH method to update it to avoid interfering with other configuration items in the ConfigMap.

     ```bash
     kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"
     ```

   - If no ConfigMap named `slo-controller-config` exists, run the following command to create the ConfigMap.

     ```bash
     kubectl apply -f configmap.yaml
     ```

3. Use the following YAML content to create a be-pod-demo.yaml file.

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: be-pod-demo
     labels:
       koordinator.sh/qosClass: 'BE' # Specify Pod QoS level as BE.
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
     # priorityClassName is required when ColocationProfile feature is enabled (default)
     priorityClassName: koord-batch
   ```

4. Run the following command to deploy be-pod-demo to the cluster.

   ```bash
   $ kubectl apply -f be-pod-demo.yaml
   ```
   
5. Run the following command to check the be-pod-demo status and wait for the Pod to start.

   ```bash
   $ kubectl get pod be-pod-demo
   NAME          READY   STATUS    RESTARTS   AGE
   be-pod-demo   1/1     Running   0          7s
   ```
   
6. Run the following command on the node using the [stress tool](https://linux.die.net/man/1/stress) to start a process that elevates the entire node's memory usage above the eviction watermark. The `--vm-bytes` parameter specifies that the stress process will consume 10GB of memory; adjust this value according to your node's capacity.

   ```bash
   $ stress --cpu 1 --vm 1 --vm-bytes 10G --vm-keep
   ```
   
7. Observe the be-pod-demo running status. You will find that be-pod-demo has been evicted and no longer exists. The eviction information can be viewed in the events.

   ```bash
   $ kubectl get pod be-pod-demo
   Error from server (NotFound): pods "be-pod-demo" not found
   
   $ kubectl get event
   LAST SEEN   TYPE      REASON            OBJECT              MESSAGE
   46s         Normal    Killing           pod/be-pod-demo     Stopping container stress
   48s         Warning   evictPodSuccess   ${your-pod-object}  evict Pod:koordinator-system/be-pod-demo, reason: evicted, message: trigger by koordlet feature BEMemoryEvict, kill pod: be-pod-demo
   ```

### Allocated

1. Use the following ConfigMap to create a configmap.yaml file
   ```yaml
   # ConfigMap slo-controller-config example.
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: slo-controller-config # name should be based on the actual koord-manager configuration, e.g. slo-controller-config
     namespace: koordinator-system # namespace should be based on the actual installation, e.g. kube-system
   data:
     # Provide batch account
     colocation-config: |
      {
         "enable": true,
         "batchCPUThresholdPercent": 100,
         "batchMemoryThresholdPercent": 100
       }
     # Enable eviction feature based on memory allocated
     resource-threshold-config: |
       {
         "clusterStrategy": {
           "enable": true,
           "memoryAllocatableEvictThresholdPercent": 110,
           "memoryAllocatableEvictLowerPercent": 100,
           "allocatableEvictPriorityThreshold": 5999
         }
       }
   ```

   | Parameter                                | Type    | Value Range                            | Description                                                                                                                                                                    |
   |:-----------------------------------------|:--------|:---------------------------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
   | `enable`                                 | Boolean | true; false                            | true: Enable the strategy globally for the cluster. false (default): Disable the strategy globally for the cluster.                                                            |
   | `memoryAllocatableEvictThresholdPercent` | Int     | memoryAllocatableEvictLowerPercent~100 | Memory resource allocated eviction threshold. Eviction of related Pods will be triggered when above this value. This field is required when MemoryAllocatableEvict is enabled. |
   | `memoryAllocatableEvictLowerPercent`     | Int     | 0~100                                  | Memory resource allocated safety threshold. Eviction of Pods will stop when at or below this value. This field is required when MemoryAllocatableEvict is enabled.             |
   | `allocatableEvictPriorityThreshold`      | Int     | /                                      | Upper limit of pod priority that can be evicted. This field is required when MemoryAllocatableEvict is enabled.                                                                |

2. Deploy the ConfigMap slo-controller-config as described above.
3. Create and deploy several BE pods to the cluster, then wait for the pods to start.
4. Modify the slo-controller-config to set the batch memory account to zero.
   ```yaml
   # ConfigMap slo-controller-config example.
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: slo-controller-config # name should be based on the actual koord-manager configuration, e.g. slo-controller-config
     namespace: koordinator-system # namespace should be based on the actual installation, e.g. kube-system
   data:
     # Provide batch account
     colocation-config: |
      {
         "enable": true,
         "batchCPUThresholdPercent": 100,
         "batchMemoryThresholdPercent": 0
       }
     # resource-threshold-config keep the same
   ```
5. Observe the running status of the pods. After a short while, you will find that the pods have been evicted. The eviction information can be viewed in the events.

   ```bash
   $ kubectl get pod be-pod-demo
   Error from server (NotFound): pods "be-pod-demo" not found
   
   $ kubectl get event
   LAST SEEN   TYPE      REASON            OBJECT              MESSAGE
   44s         Normal    Killing           pod/be-pod-demo                     Stopping container stress
   44s         Warning   evictPodSuccess   ${your-pod-object}   evict Pod:koordinator-system/be-pod-demo, reason: evicted, message: trigger by koordlet feature MemoryAllocatableEvict, kill pod: be-pod-demo
   ```
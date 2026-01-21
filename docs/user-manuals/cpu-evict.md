# CPU Resource Eviction Strategy

## Introduction
### Satisfaction-Based Strategy
Koordinator provides [CPU dynamic suppression capability](/docs/user-manuals/cpu-suppress). In co-location scenarios, it can dynamically adjust the CPU resource upper limit that low-priority Pods (BE) can use based on the resource usage of high-priority Pods (LS). When the resource usage of LS Pods increases, koordlet will reduce the CPU cores available to BE Pods. However, when LS Pod load surges, it may cause a large number of BE Pods to be suppressed on a small number of CPUs, resulting in low resource satisfaction for these Pods, extremely slow application performance, and even additional competition for kernel resources.

In fact, most offline tasks in BE Pods have good retry capabilities and can accept a certain degree of eviction in exchange for higher resource quality. Koordlet provides an eviction strategy based on CPU resource satisfaction (BECPUEvict). It calculates the CPU utilization and resource satisfaction of the suppressed portion. When both utilization and resource satisfaction exceed the configured thresholds simultaneously, BE Pods will be evicted sequentially according to lower priority and higher Pod CPU utilization until CPU resource satisfaction returns above the threshold.

![image](/img/cpu-evict.svg)

### Usage-Based Strategy
Koordinator supports dynamically overselling idle node resources to low-priority Pods. In co-location scenarios, the actual CPU resource usage of nodes is constantly changing. When node resource usage is high, it may cause node crashes, leading to high-priority Pod processes being killed. To prevent this situation, Koordinator provides an eviction strategy based on single-node CPU usage (CPUEvict).
The single-node component Koordlet continuously detects the entire node's CPU usage (Total-Available) at second-level granularity. When the entire node's CPU usage is high, it will select Pods for eviction based on slo-config priority configuration to ensure the service quality of high-priority Pods. During the eviction process, Pods with lower priority (Pod.Spec.Priority) will be evicted first. If priorities are the same, Pods with higher CPU resource usage will be evicted preferentially until the entire node's CPU usage drops below the configured safety watermark (evictThreshold).

### Allocated-Based Strategy
Koordinator supports statically specifying node logical resources (mid) and dynamically overselling idle node resources to low-priority Pods. In co-location scenarios, the actual CPU resource usage of nodes is constantly changing. When slo-config configuration changes or node resource usage spikes, it will cause the mid/batch account calculated by slo-manager to decrease significantly. If eviction based on satisfaction and usage is not timely enough, it may cause node crashes. To prevent this situation, Koordinator provides an eviction strategy based on single-node account allocated usage (CPUAllocatableEvict).
The single-node component Koordlet calculates the usage of the entire node's mid-cpu/batch-cpu accounts. When the request usage reaches the set threshold, it will evict Pods according to priority to ensure the service quality of high-priority Pods. During the eviction process, Pods with lower priority (Pod.Spec.Priority) will be evicted first. If priorities are the same, Pods with higher CPU request usage will be evicted preferentially until the entire node's CPU usage drops below the configured safety watermark (evictThreshold).

## Prerequisites
### Components
Please ensure Koordinator is correctly installed in your cluster. If not, refer to the [Installation Documentation](https://koordinator.sh/docs/installation). The version requirements are as follows:

| Component   | Version Requirement |
|-------------|---------------------|
| Kubernetes  | ≥v1.18              |
| koordinator | ≥v1.18.0            |

This feature is provided by the single-node component Koordlet. The corresponding feature-gate is disabled by default. Before use, ensure that `BECPUEvict/CPUEvict/CPUAllocatableEvict=true` has been added to the koordlet startup parameter `-feature-gates`.
See [reference example](https://github.com/koordinator-sh/charts/blob/main/versions/v1.8.0/templates/koordlet.yaml#L36). 

**Note:** BECPUEvict requires enabling Batch resource dynamic overselling and works in conjunction with CPU dynamic suppression capability. Please refer to the [Usage Documentation](/docs/user-manuals/cpu-suppress).

In summary:
- **BECPUEvict** focuses on "resource satisfaction" of low-priority (BE) Pods
- **CPUEvict** focuses on the actual CPU utilization of the entire node
- **CPUAllocatableEvict** focuses on the total allocated amount of logical resource accounts

**Recommendations:**
- All co-location production environments should enable **CPUEvict** to ensure node safety.
- If BE tasks can tolerate eviction, it is strongly recommended to enable **BECPUEvict** to improve resource efficiency.
- If extended resources such as mid/batch-cpu are used and pods are allowed to be evicted, it is recommended to enable **CPUAllocatableEvict** to prevent account oversubscription.
- When multiple features are enabled simultaneously, they target different Pod sets (no duplicate eviction targets), and the overall resource release effect is cumulative, which will be considered together in scheduling and capacity planning.

### Pod
Since the pods affected by CPUEvict/CPUAllocatableEvict are limited by priority (Pod.Spec.Priority), to avoid evicting certain low-priority but important pods, only pods with the label `koordinator.sh/eviction-enabled: "true"`
are allowed to be evicted. In addition, when other conditions and priorities are the same, pods can be further evicted from low to high based on the label `koordinator.sh/priority`. When multiple features are enabled, you can configure
the pod's annotation `koordinator.sh/eviction-policy: '["BECPUEvict","CPUEvict"]'` to limit which features can act on it. If not configured, there are no restrictions.

## Operation Steps

### Satisfaction
1. Use the following ConfigMap to create a configmap.yaml file:
   ```yaml
   # ConfigMap slo-controller-config example
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
     # Enable eviction feature based on CPU resource satisfaction
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
   
   | Parameter                            | Type    | Value Range                            | Description                                                                                                                                                                                                                   |
   |:-------------------------------------|:--------|:---------------------------------------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
   | `enable`                             | Boolean | true; false                            | true: Enable the strategy globally for the cluster. false (default): Disable the strategy globally for the cluster.                                                                                                           |
   | `cpuEvictBESatisfactionLowerPercent` | Int     | 0~60                                   | Eviction threshold for BE CPU resource satisfaction. Eviction of BE Pods will be triggered when below this value. This field is required when BECPUEvict is enabled.                                                          |
   | `cpuEvictBESatisfactionUpperPercent` | Int     | cpuEvictBESatisfactionLowerPercent~100 | Safety threshold for BE CPU resource satisfaction. Eviction of BE Pods will stop when above this value. This field is required when BECPUEvict is enabled.                                                                    |
   | `cpuEvictBEUsageThresholdPercent`    | Int     | 0~100                                  | BE CPU utilization threshold. Eviction will be triggered only when the BE Pod utilization within the CPU suppression range is higher than this value. This field is optional when BECPUEvict is enabled, default value is 90. |
   | `cpuEvictTimeWindowSeconds`          | Int     | >=2                                    | Time window in seconds for calculating CPU resource satisfaction and BE CPU utilization. This field is optional when BECPUEvict is enabled, default value is 1s.                                                              |

2. Check whether a ConfigMap named `slo-controller-config` exists in the `koordinator-system` namespace. The namespace and ConfigMap name are examples and should be based on the actual installation configuration.

   - If a ConfigMap named `slo-controller-config` exists, use the PATCH method to update it to avoid interfering with other configuration items in the ConfigMap.

     ```bash
     kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"
     ```

   - If no ConfigMap named `slo-controller-config` exists, run the following command to create the ConfigMap.

     ```bash
     kubectl apply -f configmap.yaml
     ```

3. Use the following YAML content to create a be-pod-demo.yaml file:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: be-pod-demo
     labels:
       koordinator.sh/qosClass: 'BE' # Specify Pod QoS level as BE
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
   
6. Run the following command on the node using the [stress tool](https://linux.die.net/man/1/stress) to start a process,
ensuring the entire node's CPU resource usage is elevated above the eviction watermark. The `--cpu` parameter indicates the stress process occupies 10 CPU cores, which can be adjusted according to the actual node capacity.

   ```bash
   $ stress --cpu 10 --vm 1
   ```
7. Observe the be-pod-demo running status. You will find that be-pod-demo has been evicted, and the eviction information can be viewed in the events.

   ```bash
   $ kubectl get pod be-pod-demo
   Error from server (NotFound): pods "be-pod-demo" not found
   
   $ kubectl get event
   LAST SEEN   TYPE      REASON            OBJECT               MESSAGE
   44s         Normal    Killing           pod/be-pod-demo      Stopping container stress
   44s         Warning   evictPodSuccess   ${your-pod-object}   evict Pod:koordinator-system/be-pod-demo, reason: evicted, message: trigger by koordlet feature BECPUEvict, kill pod: be-pod-demo
   ```
### Usage

1. Use the following ConfigMap to create a configmap.yaml file:
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
     # Enable eviction feature based on CPU usage
     resource-threshold-config: |
       {
         "clusterStrategy": {
           "enable": true,
           "cpuEvictThresholdPercent": 60,
           "cpuEvictLowerPercent": 40,
           "evictEnabledPriorityThreshold": 5999  
         }
       }
   ```

   | Parameter                       | Type    | Value Range                            | Description                                                                                                                                                                                  |
      |:--------------------------------|:--------|:---------------------------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
   | `enable`                        | Boolean | true; false                            | true: Enable the strategy globally for the cluster. false (default): Disable the strategy globally for the cluster.                                                                          |
   | `cpuEvictThresholdPercent`      | Int     | cpuEvictBESatisfactionLowerPercent~100 | CPU resource usage eviction threshold. Eviction of related Pods will be triggered when above this value. This field is required when CPUEvict is enabled.                                    |
   | `cpuEvictLowerPercent`          | Int     | 0~100                                  | CPU resource usage safety threshold. Eviction of Pods will stop when at or below this value. This field is optional when CPUEvict is enabled, default value is cpuEvictThresholdPercent - 2. |
   | `evictEnabledPriorityThreshold` | Int     | /                                      | Upper limit of pod priority that can be evicted. This field is required when CPUEvict is enabled.                                                                                            |

2. Deploy the ConfigMap slo-controller-config as shown above.
3. Create and deploy several BE pods to the cluster, attempting to bring the node watermark above 60%, and wait for the pods to start.
4. Observe the running status of the pods. You will find that some pods have been evicted. If pods still exist, it indicates the physical watermark has reached 40% or below; otherwise, eviction information can be viewed in the events.

   ```bash
   $ kubectl get pod be-pod-demo
   Error from server (NotFound): pods "be-pod-demo" not found
   
   $ kubectl get event
   LAST SEEN   TYPE      REASON            OBJECT              MESSAGE
   44s         Normal    Killing           pod/be-pod-demo                     Stopping container stress
   44s         Warning   evictPodSuccess   ${your-pod-object}   evict Pod:koordinator-system/be-pod-demo, reason: evicted, message: trigger by koordlet feature CPUEvict, kill pod: be-pod-demo
   ```

### Allocated

1. Use the following ConfigMap to create a configmap.yaml file:
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
     # Enable eviction feature based on CPU allocated
     resource-threshold-config: |
       {
         "clusterStrategy": {
           "enable": true,
           "cpuAllocatableEvictThresholdPercent": 110,
           "cpuAllocatableEvictLowerPercent": 100,
           "allocatableEvictPriorityThreshold": 5999
         }
       }
   ```

   | Parameter                             | Type    | Value Range                         | Description                                                                                                                                                              |
   |:--------------------------------------|:--------|:------------------------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
   | `enable`                              | Boolean | true; false                         | true: Enable the strategy globally for the cluster. false (default): Disable the strategy globally for the cluster.                                                      |
   | `cpuAllocatableEvictThresholdPercent` | Int     | cpuAllocatableEvictLowerPercent~100 | CPU resource allocated eviction threshold. Eviction of related Pods will be triggered when above this value. This field is required when CPUAllocatableEvict is enabled. |
   | `cpuAllocatableEvictLowerPercent`     | Int     | 0~100                               | CPU resource allocated safety threshold. Eviction of Pods will stop when at or below this value. This field is required when CPUAllocatableEvict is enabled.             |
   | `allocatableEvictPriorityThreshold`   | Int     | /                                   | Upper limit of pod priority that can be evicted. This field is required when CPUAllocatableEvict is enabled.                                                             |

2. Deploy the ConfigMap slo-controller-config as shown above.
3. Create and deploy several BE pods to the cluster and wait for the pods to start.
4. Modify the slo-controller-config to set the batch CPU account to zero.
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
         "batchCPUThresholdPercent": 0,
         "batchMemoryThresholdPercent": 100
       }
     # resource-threshold-config keep the same
   ```
5. Observe the running status of the pods. You will find that after a while, the pods have been evicted, and the eviction information can be viewed in the events.

   ```bash
   $ kubectl get pod be-pod-demo
   Error from server (NotFound): pods "be-pod-demo" not found
   
   $ kubectl get event
   LAST SEEN   TYPE      REASON            OBJECT              MESSAGE
   44s         Normal    Killing           pod/be-pod-demo                     Stopping container stress
   44s         Warning   evictPodSuccess   ${your-pod-object}   evict Pod:koordinator-system/be-pod-demo, reason: evicted, message: trigger by koordlet feature CPUAllocatableEvict, kill pod: be-pod-demo
   ```

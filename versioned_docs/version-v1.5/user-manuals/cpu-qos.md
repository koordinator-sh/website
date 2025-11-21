# CPU QoS

## Introduction

Kubernetes allows you to deploy various types of containerized applications on the same node. This causes applications with different priorities to compete for CPU resources. As a result, the performance of the applications with high priorities cannot be guaranteed.
Koordinator allows you to use quality of service (QoS) classes to guarantee CPU resources for applications with high priorities by leveraging the Group Identity feature or the Core Scheduling feature. The Core Scheduling feature is also useful to mitigate the Side Channel Attack (SCA) for multi-tenant scenarios.
This topic describes how to configure the CPU QoS feature for pods.

## Background

To fully utilize computing resources, workloads of different priorities are usually deployed on the same node. For example, latency-sensitive (LS) workloads (with high priorities) and best-effort (BE) workloads (with low priorities) can be deployed on the same node. However, this may cause these workloads to compete for computing resources. In Kubernetes, CPU requests and CPU limits are used to control the amount of CPU resources that pods can use. However, pods may still compete for CPU resources. For example, BE pods and LS pods can share CPU cores or vCPU cores. When the loads of the BE pods increase, the performance of the LS pods is compromised. As a result, the response latency of the application that uses the LS pods increases.

To reduce the performance impact on the BE pods in this scenario, you can use the CPU QoS feature provided by Koordinator to limit the CPU usage of the LS pods. The CPU QoS feature is based on Alibaba Cloud Linux 2 and Anolis OS. Koordinator allows you to use the group identity feature available in Alibaba Cloud Linux 2 to configure Linux scheduling priorities for pods. In an environment where both LS pods and BE pods are deployed, you can set the priority of LS pods to high and the priority of BE pods to low to avoid resource contention. The LS pods are prioritized to use the limited CPU resources to ensure the service quality of the corresponding application. For more information, see [Group identity feature](https://www.alibabacloud.com/help/en/elastic-compute-service/latest/group-identity-feature).

You can gain the following benefits after you enable the CPU QoS feature:

- The wake-up latency of tasks for LS workloads is minimized.
- Waking up tasks for BE workloads does not adversely impact the performance of LS pods.
- Tasks for BE workloads cannot use the simultaneous multithreading (SMT) scheduler to share CPU cores. This further reduces the impact on the performance of LS pods.
- If the Core Scheduling feature is enabled, the pods with different group IDs will exclusively use the SMT cores.

## Setup

### Prerequisites

- Kubernetes >= 1.18
- Koordinator >= 0.4
- Operating System which supports Group Identity:
    - Alibaba Cloud Linux（For more information, see [Group identity feature](https://www.alibabacloud.com/help/en/elastic-compute-service/latest/group-identity-feature)）
    - Anolis OS >= 8.6
    - CentOS 7.9 (Need to install the CPU Co-location scheduler plug-in from OpenAnolis community, see [best practice](../best-practices/anolis_plugsched.md)).
- (Optional) Operating System which supports [Core Scheduling](https://docs.kernel.org/admin-guide/hw-vuln/core-scheduling.html):
    - Alibaba Cloud Linux 3, kernel >= 5.10.134-16.1
    - Anolis OS 8, kernel >= 5.10.134-16.1

### Installation

Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to [Installation](https://koordinator.sh/docs/installation).

## Use CPU QoS (based on Group Identity)

1. Create a configmap.yaml file based on the following ConfigMap content:

The CPU QoS uses the Group Identity feature by default.

   ```yaml
   # Example of the slo-controller-config ConfigMap.
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: slo-controller-config
     namespace: koordinator-system
   data:
     # Enable the CPU QoS feature based on the Group Identity.
     resource-qos-config: |
       {
         "clusterStrategy": {
           "lsClass": {
             "cpuQOS": {
               "enable": true,
               "groupIdentity": 2
             }
           },
           "beClass": {
             "cpuQOS": {
               "enable": true,
               "groupIdentity": -1
             }
           }
         }
       }
   ```

Specify `lsClass` and `beClass` to assign the LS and BE classes to different pods. `cpuQOS` includes the CPU QoS parameters. The following table describes the parameters.

| Configuration item | Parameter | Valid values                | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
|:-------------------|:----------|:----------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `enable`           | Boolean   | true false                  | true: enables the CPU QoS feature for all containers in the cluster.false: disables the CPU QoS feature for all containers in the cluster.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `groupIdentity`    | Int       | -1~2                        | Specify group identities for CPU scheduling. By default, the group identity of LS pods is 2 and the group identity of BE pods is -1. A value of 0 indicates that no group identity is assigned.A greater `group identity` value indicates a higher priority in CPU scheduling. For example, you can set `cpu.bvt_warp_ns=2` for LS pods and set `cpu.bvt_warp_ns=-1` for BE pods because the priority of LS pods is higher than that of BE pods. For more information, see [Group identity feature](https://www.alibabacloud.com/help/en/elastic-compute-service/latest/group-identity-feature#task-2129392). |
| `cpuPolicy`        | String    | "groupIdentity" "coreSched" | Specify the CPU QoS policy. groupIdentity or not specified: use the Group Identity feature for CPU QoS.  coreSched: use the Core Scheduling feature for CPU QoS.                                                                                                                                                                                                                                                                                                                                                                                                                                              |

**Note** If `koordinator.sh/qosClass` is not specified for a pod, Koordinator configures the pod based on the original QoS class of the pod. The component uses the BE settings in the preceding ConfigMap if the original QoS class is BE. The component uses the LS settings in the preceding ConfigMap if the original QoS class is not BE.

2. Check whether a ConfigMap named `slo-controller-config` exists in the `koordinator-system` namespace.

    - If a ConfigMap named  `slo-controller-config`  exists, we commend that you run the kubectl patch command to update the ConfigMap. This avoids changing other settings in the ConfigMap.

      ```bash
	  kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"
	  ```

    - If no ConfigMap named `slo-controller-config`  exists, run the kubectl patch command to create a ConfigMap named ack-slo-config:

      ```bash
	  kubectl apply -f configmap.yaml
	  ```

3. Create a file named ls-pod-demo.yaml based on the following YAML content:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: ls-pod-demo
     labels:
       koordinator.sh/qosClass: 'LS' # Set the QoS class of the pod to LS
   spec:  
     containers:
     - command:
       - "nginx"
       - "-g"
       - "daemon off; worker_processes 4;"
       image: docker.io/koordinatorsh/nginx:v1.18-koord-example
       imagePullPolicy: Always
       name: nginx
       resources:
         limits:
           cpu: "4"
           memory: 10Gi
         requests:
           cpu: "4"
           memory: 10Gi
     restartPolicy: Never
     schedulerName: default-scheduler
   ```

4. Run the following command to deploy the ls-pod-demo pod in the cluster:

   ```bash
   kubectl apply -f ls-pod-demo.yaml
   ```

5. Run the following command to check whether the CPU group identity of the LS pod in the control group (cgroup) of the node takes effect:

   ```bash
   cat /sys/fs/cgroup/cpu/kubepods.slice/kubepods-pod1c20f2ad****.slice/cpu.bvt_warp_ns
   ```

   Expected output:

   ```bash
   #The group identity of the LS pod is 2 (high priority). 
   2
   ```

6. Create a file named be-pod-demo.yaml based on the following content:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: be-pod-demo
     labels:
       koordinator.sh/qosClass: 'BE' # Set the QoS class of the pod to BE. 
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
     # priorityClassName is required when ColocationProfile enabled (default).
     priorityClassName: koord-batch
   ```

7. Run the following command to deploy the be-pod-demo pod in the cluster:

   ```bash
   kubectl apply -f be-pod-demo.yaml
   ```

8. Run the following command to check whether the CPU group identity of the BE pod in the cgroup of the node takes effect:

   ```bash
   cat /sys/fs/cgroup/cpu/kubepods.slice/kubepods-besteffort.slice/kubepods-besteffort-pod4b6e96c8****.slice/cpu.bvt_warp_ns
   ```

   Expected output:

   ```bash
   #The group identity of the BE pod is -1 (low priority). 
   -1
   ```

   The output shows that the priority of the LS pod is high and the priority of the BE pod is low. CPU resources are preferably scheduled to the LS pod to ensure the service quality.

## Use CPU QoS (based on Core Scheduling)

1. Create a configmap.yaml file based on the following ConfigMap content:

By default, the CPU QoS bases on the Group Identity feature instead of the Core Scheduling feature.
If you want to use the Core Scheduling feature, you can specify `cpuPolicy` as `coreSched` in the ConfigMap.

   ```yaml
   # Example of the slo-controller-config ConfigMap.
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: slo-controller-config
     namespace: koordinator-system
   data:
     # Enable the CPU QoS feature based on the Core Scheduling.
    resource-qos-config: |
       {
          "clusterStrategy": {
            "policies": {
              "cpuPolicy": "coreSched"
             },
            "lsClass": {
              "cpuQOS": {
                "enable": true,
                "coreExpeller": true,
                "schedIdle": 0
              }
            },
            "beClass": {
              "cpuQOS": {
                "enable": true,
                "coreExpeller": false,
                "schedIdle": 1
              }
            }
          }
       }
   ```

Specify `lsClass` and `beClass` to assign the LS and BE classes to different pods. `cpuQOS` includes the CPU QoS parameters. The following table describes the parameters.

| Configuration item | Parameter | Valid values                | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
|:-------------------|:----------|:----------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `enable`           | Boolean   | true false                  | true: enables the CPU QoS feature for all containers in the cluster.false: disables the CPU QoS feature for all containers in the cluster.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `cpuPolicy`        | String    | "groupIdentity" "coreSched" | Specify the CPU QoS policy. groupIdentity or not specified: use the Group Identity feature for CPU QoS.  coreSched: use the Core Scheduling feature for CPU QoS.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `coreExpeller`     | Boolean   | true false                  | true: enables the Core Expeller capability, which means the expeller pods can evict the schedIdle pods when running on the same SMT cores. false: disables the Core Expeller capability.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `schedIdle`        | Int       | 0~1                         | Specify the cpu.idle for the QoS level. 0: Set the cpu.idle=0 to mark the pods as the high priority. 1: Set the cpu.idle=1 to mark the pods as the low priority. For more information, see [Cgroup SCHED_IDLE support](https://lore.kernel.org/lkml/162971078674.25758.15464079371945307825.tip-bot2@tip-bot2/)                                                                                                                                                                                                                                                                                               |

**Note** If `koordinator.sh/qosClass` is not specified for a pod, Koordinator configures the pod based on the original QoS class of the pod. The component uses the BE settings in the preceding ConfigMap if the original QoS class is BE. The component uses the LS settings in the preceding ConfigMap if the original QoS class is not BE.

2. Check whether a ConfigMap named `slo-controller-config` exists in the `koordinator-system` namespace.

    - If a ConfigMap named  `slo-controller-config`  exists, we commend that you run the kubectl patch command to update the ConfigMap. This avoids changing other settings in the ConfigMap.

      ```bash
	  kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"
	  ```

    - If no ConfigMap named `slo-controller-config`  exists, run the kubectl patch command to create a ConfigMap named ack-slo-config:

      ```bash
	  kubectl apply -f configmap.yaml
	  ```

3. Create a file named ls-pod-demo.yaml based on the following YAML content:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: ls-pod-demo
     labels:
       koordinator.sh/qosClass: 'LS' # Set the QoS class of the pod to LS
       # Set the core scheduling group ID of the pod. It is recommended to be a UUID.
       # When the Core Scheduling is enabled, the pods of the same group ID and the same CoreExpeller statuses can share the same SMT cores.
       # To be more specific, the linux core scheduling cookies is grouping according to the group ID. And setting the CoreExpeller will add a special suffix to the group ID to enable it to suppress the CPUIdle pods.
       koordinator.sh/core-sched-group-id: "xxx-yyy-zzz"
       # (Optional) Set the Core Scheduling policy to change the grouping rule.
       # - "": Default. The pod follows the node-level grouping rules. If the Core Sched is enabled, the pod is set the core scheduling cookie according to its group ID.
       # - "none": The pod disables the core scheduling. If the node enables, the pod is reset to the system default cookie '0'.
       # - "exclusive": The group ID of the pod is set according to its pod UID.
       #koordinator.sh/core-sched-policy: 'exclusive'
   spec:  
     containers:
     - command:
       - "nginx"
       - "-g"
       - "daemon off; worker_processes 4;"
       image: docker.io/koordinatorsh/nginx:v1.18-koord-example
       imagePullPolicy: Always
       name: nginx
       resources:
         limits:
           cpu: "4"
           memory: 10Gi
         requests:
           cpu: "4"
           memory: 10Gi
     restartPolicy: Never
     schedulerName: default-scheduler
   ```

4. Run the following command to deploy the ls-pod-demo pod in the cluster:

   ```bash
   kubectl apply -f ls-pod-demo.yaml
   ```

5. Run the following command to check whether the LS pod's core scheduling cookie is assigned:

   ```bash
   curl localhost:9316/metrics | grep koordlet_container_core_sched_cookie | grep ls-pod-demo
   ```

   Expected output:

   ```bash
   % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
   Dload  Upload   Total   Spent    Left  Speed
   0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
   koordlet_container_core_sched_cookie{container_id="containerd://126a20******",container_name="",core_sched_cookie="254675461",core_sched_group="",node="",pod_name="ls-pod-demo",pod_namespace="default",pod_uid="beee25******"} 1
   ```

   The output shows that the LS pod's core scheduling is enabled, and its cookie is set to 254675461.

6. Create a file named be-pod-demo.yaml based on the following content:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: be-pod-demo
     labels:
       koordinator.sh/qosClass: 'BE' # Set the QoS class of the pod to BE.
       # Set the core scheduling group ID of the pod. It is recommended to be a UUID.
       koordinator.sh/core-sched-group-id: "xxx-yyy-zzz"
       # (Optional) Set the Core Scheduling policy to change the grouping rule.
       #koordinator.sh/core-sched-policy: 'exclusive'
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
     # priorityClassName is required when ColocationProfile enabled (default).
     priorityClassName: koord-batch
   ```

7. Run the following command to deploy the be-pod-demo pod in the cluster:

   ```bash
   kubectl apply -f be-pod-demo.yaml
   ```

8. Run the following command to check whether the BE pod's core scheduling cookie is assigned:

   ```bash
   curl localhost:9316/metrics | grep koordlet_container_core_sched_cookie | grep be-pod-demo
   ```

   Expected output:

   ```bash
   % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
   Dload  Upload   Total   Spent    Left  Speed
   0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
   koordlet_container_core_sched_cookie{container_id="containerd://66b600******",container_name="",core_sched_cookie="4121597395",core_sched_group="",node="",pod_name="be-pod-demo",pod_namespace="default",pod_uid="0507a1d******"} 1
   ```

   The output shows that the BE pod's core scheduling is enabled, and its cookie is set to 4121597395. It is different from the cookie of the LS pod, which means they are isolated at the SMT level.

9. Run the following command to check whether the CPU Idle of the BE cgroup of the node takes effect:

   ```bash
   cat /sys/fs/cgroup/cpu/kubepods.slice/cpu.idle
   ```

   Expected output:

   ```bash
   # The CPU Idle of the LS pod is 0 (high priority). 
   0
   ```

   ```bash
   cat /sys/fs/cgroup/cpu/kubepods.slice/kubepods-besteffort.slice/cpu.idle
   ```

   Expected output:

   ```bash
   # The CPU Idle of the BE pod is 1 (low priority). 
   1
   ```

   The output shows that the priority of the LS pod is high and the priority of the BE pod is low. CPU resources are preferably scheduled to the LS pod to ensure the service quality.

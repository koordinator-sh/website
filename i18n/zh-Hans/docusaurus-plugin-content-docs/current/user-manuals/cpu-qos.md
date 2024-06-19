# CPU QoS

## 简介

Kubernetes支持将多种类型的应用以容器化的方式部署在同一台宿主机上运行，不同优先级的应用可能会竞争CPU资源，导致应用服务受损。Koordinator支持基于容器的QoS等级，优先保障高优先级应用的CPU性能。本文介绍如何使用容器CPU QoS功能。

## 背景

为了充分利用机器中的资源，通常会将高优先延迟敏感性LS（Latency-Sensitive）和低优先级BE（Best-Effort）的任务部署在同一台机器上，导致两种不同优先级任务之间存在资源竞争问题。Kubernetes根据应用的CPU Request/Limit，为容器设置物理资源限制，但仍存在容器间对CPU资源的竞争。例如，BE应用和LS应用共享物理核或逻辑核时，当BE应用负载较高时，会干扰LS应用的运行，导致服务响应延迟变高。

为了提高LS应用使用CPU资源的稳定性，降低BE应用的干扰，Koordinator基于Alibaba Cloud Linux 2和Anolis OS，提供了容器CPU QoS功能。Koordinator基于Group Identity或Core Scheduling特性提供的Linux调度优先级，差异化保障不同优先级应用的CPU调度，将LS应用标识为高优，BE应用标识为低优，在混合部署场景中有效改善LS应用的服务质量。Core Scheduling特性也可以用于在多租户场景中抵御侧信道攻击。 更多信息，请参见[Group Identity功能说明](https://help.aliyun.com/document_detail/338407.htm#task-2129392)。

通过启用CPU QoS功能，您可以获取以下功能特性：

- LS应用的任务唤醒延迟最小化。
- BE应用的任务唤醒不会对LS容器造成性能影响。
- BE应用的任务不会通过同时多线程SMT（Simultaneous MultiThreading）调度器共享物理核而对LS应用造成性能影响。
- 如果启用了Core Scheduling特性，不同分组ID的Pods将互斥地使用物理核。

## 设置

### 前提条件

- Kubernetes >= 1.18

- Koordinator >= 0.4

- 支持Group Identity的操作系统

  - Alibaba Cloud Linux（版本号详情，请参见[Group Identity功能说明](https://help.aliyun.com/document_detail/338407.htm#task-2129392)）
  - Anolis OS >= 8.6
  - CentOS 7.9 (需要安装龙蜥社区的 CPU 混部调度器插件，请参阅[最佳实践](../best-practices/anolis_plugsched.md))

- （可选）支持Core Scheduling的操作系统

  - Alibaba Cloud Linux 3, kernel >= 5.10.134-16.1
  - Anolis OS 8, kernel >= 5.10.134-16.1

### 安装

请确保Koordinator组件已正确安装在你的集群中。如果没有，请参考[安装文档](https://koordinator.sh/docs/installation)。

## 使用CPU QoS（基于Group Identity）

1. 使用以下ConfigMap，创建configmap.yaml文件。

CPU QoS默认使用的是Group Identity特性。

   ```yaml
   #ConfigMap slo-controller-config 样例。
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: slo-controller-config
     namespace: koordinator-system
   data:
     #开启基于Group Identity的容器CPU QoS功能。
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

   `lsClass`、`beClass`分别用于配置QoS等级为LS、BE的Pod，`cpuQOS`用于配置容器CPU QoS功能。关键参数说明如下：

| 参数              | 类型      | 取值范围                        | 说明                                                                                                                                                                                                                                                                            |
|:----------------|:--------|:----------------------------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `enable`        | Boolean | true false                  | true：集群全局开启容器CPU QoS功能。false：集群全局关闭容器CPU QoS功能。                                                                                                                                                                                                                               |
| `groupIdentity` | Int     | -1~2                        | 表示CPU Group Identity的优先级。默认值依据QoS，LS对应2，BE对应-1。0表示关闭。`groupIdentity`值越大，表示容器在内核调度的优先级越高。例如，按默认配置，QoS等级为LS的容器Group Identity接口配置为`cpu.bvt_warp_ns=2`，BE容器配置为`cpu.bvt_warp_ns=-1`。更多信息，请参见[Group Identity功能说明](https://help.aliyun.com/document_detail/338407.htm#task-2129392)。 |
| `cpuPolicy`     | String  | "groupIdentity" "coreSched" | 指定CPU QoS的策略。"groupIdentity"或不填时：CPU QoS使用Group Identity特性。"coreSched"：CPU QoS使用Core Scheduling特性。                                                                                                                                                                            |
   
   **说明** 对于未指定`koordinator.sh/qosClass`的Pod，Koordinator将参考Pod原生的QoSClass来设置参数，其中Besteffort使用ConfigMap中BE的配置，其他QoSClass使用ConfigMap中LS的配置。

2. 查看命名空间`koordinator-system`下是否存在ConfigMap `slo-controller-config`。

   - 若存在ConfigMap `slo-controller-config`，请使用PATCH方式进行更新，避免干扰ConfigMap中其他配置项。

     ```bash
     kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"
     ```

   - 若不存在ConfigMap  `slo-controller-config`，请执行以下命令进行创建Configmap。

     ```bash
     kubectl apply -f configmap.yaml
     ```

3. 使用以下YAML内容，创建ls-pod-demo.yaml文件。

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: ls-pod-demo
     labels:
       koordinator.sh/qosClass: 'LS' #指定Pod的QoS级别为LS。
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

4. 执行以下命令，将ls-pod-demo部署到集群。

   ```bash
   kubectl apply -f ls-pod-demo.yaml
   ```

5. 执行以下命令，在单机端的Cgroup分组中查看LS Pod的内核Group Identity生效情况。

   ```bash
   cat /sys/fs/cgroup/cpu/kubepods.slice/kubepods-pod1c20f2ad****.slice/cpu.bvt_warp_ns
   ```

   预期输出：

   ```bash
   #LS Pod的Group Identity优先级为2（高优）。
   2
   ```

6. 使用以下YAML内容，创建be-pod-demo.yaml文件。

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: be-pod-demo
     labels:
       koordinator.sh/qosClass: 'BE' #指定Pod的QoS级别为BE。
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
     # 当ColocationProfile功能开启时（默认启用），priorityClassName是必填的
     priorityClassName: koord-batch
   ```

7. 执行以下命令，将be-pod-demo部署到集群。

   ```bash
   kubectl apply -f be-pod-demo.yaml
   ```

8. 执行以下命令，在单机端的Cgroup分组中查看BE Pod的内核Group Identity生效情况。

   ```bash
   cat /sys/fs/cgroup/cpu/kubepods.slice/kubepods-besteffort.slice/kubepods-besteffort-pod4b6e96c8****.slice/cpu.bvt_warp_ns
   ```

   预期输出：

   ```bash
   #BE Pod的Group Identity优先级为-1（低优）。
   -1
   ```

   由预期输出得到，LS容器为Group Identity高优先级，BE容器为Group Identity低优先级，表示LS容器的CPU服务质量将被优先保障。

## 使用CPU QoS（基于Core Scheduling）

1. 使用以下ConfigMap，创建configmap.yaml文件。

CPU QoS默认使用Group Identity特性，如果需要使用Core Scheduling特性，请在ConfigMap中将`cpuPolicy`设置为`coreSched`。

   ```yaml
   #ConfigMap slo-controller-config 样例。
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: slo-controller-config
     namespace: koordinator-system
   data:
       #开启基于Core Scheduling的容器CPU QoS功能。
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

`lsClass`、`beClass`分别用于配置QoS等级为LS、BE的Pod，`cpuQOS`用于配置容器CPU QoS功能。关键参数说明如下：

| 参数             | 类型      | 取值范围                        | 说明                                                                                                                                                                                                |
|:---------------|:--------|:----------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `enable`       | Boolean | true false                  | true：集群全局开启容器CPU QoS功能。false：集群全局关闭容器CPU QoS功能。                                                                                                                                                   |
| `cpuPolicy`    | String  | "groupIdentity" "coreSched" | 指定CPU QoS的策略。"groupIdentity"或不填时：CPU QoS使用Group Identity特性。"coreSched"：CPU QoS使用Core Scheduling特性。                                                                                                |
| `coreExpeller` | Boolean | true false                  | true：启用物理核驱逐者能力，物理驱逐者的Pods可以驱逐运行在同一物理核上SchedIdle的Pods。false：关闭物理核驱逐能力。                                                                                                                            |
| `schedIdle`    | Int     | 0~1                         | 指定该QoS等级的cpu.idle。0：设置cpu.idle=0，以标记Pods为高优。1：设置cpu.idle=1，以标记Pods为低优。更多信息，请见[Cgroup SCHED_IDLE support](https://lore.kernel.org/lkml/162971078674.25758.15464079371945307825.tip-bot2@tip-bot2/) |

**说明** 对于未指定`koordinator.sh/qosClass`的Pod，Koordinator将参考Pod原生的QoSClass来设置参数，其中Besteffort使用ConfigMap中BE的配置，其他QoSClass使用ConfigMap中LS的配置。

2. 查看命名空间`koordinator-system`下是否存在ConfigMap `slo-controller-config`。

    - 若存在ConfigMap `slo-controller-config`，请使用PATCH方式进行更新，避免干扰ConfigMap中其他配置项。

      ```bash
	  kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"
	  ```

    - 若不存在ConfigMap  `slo-controller-config`，请执行以下命令进行创建Configmap。

      ```bash
	  kubectl apply -f configmap.yaml
	  ```

3. 使用以下YAML内容，创建ls-pod-demo.yaml文件。

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: ls-pod-demo
     labels:
       koordinator.sh/qosClass: 'LS' #指定Pod的QoS级别为LS。
       # 设置Pod的core scheduling分组ID。推荐设置一个UUID。
       # 当Core Scheduling启用时，相同分组ID并且相同CoreExpeller状态的Pods可以共享同一SMT核。
       # 更具体地说，Linux core scheduling的cookies是根据ID分组的，而设置CoreExpeller会在分组ID上追加一个特殊的后缀来实现对CPUIdle Pods的压制。
       koordinator.sh/core-sched-group-id: "xxx-yyy-zzz"
       # （可选）设置Core Scheduling策略来改变分组规则。
       # - ""：默认。Pod遵循节点级别的分组规则。如果启用Core Sched，则根据分组ID设置core scheduling cookie。
       # - "none"：Pod禁用核心调度。如果节点启用，则pod重置为系统默认的cookie '0'。
       # - "exclusive：分组ID根据Pod UID设置。
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

4. 执行以下命令，将ls-pod-demo部署到集群。

   ```bash
   kubectl apply -f ls-pod-demo.yaml
   ```

5. 执行以下命令，检查LS Pod的core scheduling cookie是否已经分配。

   ```bash
   curl localhost:9316/metrics | grep koordlet_container_core_sched_cookie | grep ls-pod-demo
   ```

   预期输出：

   ```bash
   % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
   Dload  Upload   Total   Spent    Left  Speed
   0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
   koordlet_container_core_sched_cookie{container_id="containerd://126a20******",container_name="",core_sched_cookie="254675461",core_sched_group="",node="",pod_name="ls-pod-demo",pod_namespace="default",pod_uid="beee25******"} 1
   ```

   输出说明，LS Pod的core scheduling已经启用，其cookie为254675461。

6. 使用以下YAML内容，创建be-pod-demo.yaml文件。

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: be-pod-demo
     labels:
       koordinator.sh/qosClass: 'BE' #指定Pod的QoS级别为BE。
       # 设置Pod的core scheduling分组ID。推荐设置一个UUID。
       koordinator.sh/core-sched-group-id: "xxx-yyy-zzz"
       # （可选）设置Core Scheduling策略来改变分组规则。
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
     # 当ColocationProfile功能开启时（默认启用），priorityClassName是必填的
     priorityClassName: koord-batch
   ```

7. 执行以下命令，将be-pod-demo部署到集群。

   ```bash
   kubectl apply -f be-pod-demo.yaml
   ```

8. 执行以下命令，检查BE Pod的core scheduling cookie是否已经分配。

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

   输出说明，BE Pod的core scheduling已经启用，其cookie为4121597395。

8. 执行以下命令，在单机端的Cgroup分组中查看BE Pod的内核CPU Idle生效情况。

   ```bash
   cat /sys/fs/cgroup/kubepods.slice/cpu.idle
   ```

   预期输出：

   ```bash
   #LS Pod的CPU Idle级别为0（高优）。
   0
   ```

   ```bash
   cat /sys/fs/cgroup/kubepods.slice/kubepods-besteffort.slice/cpu.idle
   ```

   预期输出：

   ```bash
   #BE Pod的CPU Idle级别为1（低优）。
   1
   ```

由预期输出得到，LS容器为CPU Idle高优先级，BE容器为CPU Idle低优先级，表示LS容器的CPU服务质量将被优先保障。

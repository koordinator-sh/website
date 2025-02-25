---
slug: release-v1.6.0
title: "Koordinator v1.6: 支持 AI/ML 领域的典型调度场景！资源预留、混部、调度重调度等领域持续优化！"
authors: [ZiMengSheng,saintube,songtao98]
tags: [release]
---


## 背景
在过去的两年中，Koordinator 持续致力于为 Kubernetes 社区提供高效的混部工作负载编排和资源调度解决方案，同时也为支持更多的工作负载和更多的资源类型做出许多努力。继 v0.7 发布精细化 GPU 共享调度能力以来，社区同学一直在持续增强 Koordinator 的设备调度能力。在 Koordinator v1.6 版本迭代中，我们完善了 Koordinator 的设备拓扑调度能力，支持感知更多机型的 GPU 拓扑，加速 AI 应用内的 GPU 互联；同时，我们跟社区其它开源项目合作，提供了端到端的 GPU & RDMA 联合分配能力和 GPU 强隔离能力，加速典型 AI 训练任务间的跨机互联和提高 AI 推理任务的部署密度，更好地保障了应用性能和提高了集群资源利用率。

在此，我们很高兴地向大家宣布 Koordinator v1.6.0 版本的发布。这个版本除了上述提到的设备调度能力的增强外，同时增强了 Kubernetes 社区的资源插件，使其可以对不同资源配置不同的节点打分策略，该功能在 GPU 任务和 CPU 任务混部在一个集群中时能有效降低 GPU 碎片率。最后，我们在资源预留、混部、调度和重调度等领域也包含了一系列功能优化。

这是自 2022 年 4 月正式开源以来，Koordinator 迭代发布的第 14 个大版本。在两年多的时间里，Koordinator 很荣幸吸引了包括阿里巴巴、蚂蚁科技、Intel、小红书、小米、爱奇艺、360、有赞等众多企业的优秀工程师参与，贡献了众多的想法、代码和场景。在 v1.6.0 版本中，共有 10 位新加入的开发者参与到了 Koordinator 社区的建设，他们是 @LY-today、@AdrianMachao、@TaoYang526、@dongjiang1989、@chengjoey、@JBinin、@clay-wangzhi、@ferris-cx、@nce3xin、@lijunxin559，感谢期间各位社区同学的积极参与和贡献，也感谢所有同学在社区的持续投入。

## 版本功能特性解读
### AI 应用内的 GPU 互联加速：GPU 拓扑感知调度
随着深度学习和高性能计算（HPC）等领域的快速发展，GPU 成为许多计算密集型工作负载的核心资源。在 Kubernetes 集群中，GPU 的高效利用对于提升应用性能和资源利用率至关重要。然而，GPU 资源的性能表现并不均衡，受到硬件拓扑结构和资源配置的影响。例如
1. 在多 NUMA 节点的系统中，GPU、CPU 和内存之间的物理连接可能会影响数据传输速度和计算效率。
2. 对于 NVIDIA 的 L20、L40S 等卡型，GPU 之间的通信效率取决于它们是否属于同一个 PCIE 或者同一个 NUMANode。
3. 对于华为的晟腾 NPU 以及虚拟化环境中采用 SharedNVSwitch 模式的 NVIDIA H系列机器，GPU 的分配需要遵守一些预定义的 Partition 规则。

Koordinator 针对上述设备场景，提供了丰富的设备拓扑调度 API 来满足 Pod 对于 GPU 拓扑的诉求。下面是这些 API 的使用举例：

1. GPU、CPU、内存等分配在同一个 NUMA Node
    ```yaml
    apiVersion: v1
    kind: Pod
    metadata:
    annotations:
        scheduling.koordinator.sh/numa-topology-spec: '{"numaTopologyPolicy":"Restricted", "singleNUMANodeExclusive":"Preferred"}'
    spec:
    containers:
    - resources:
        limits:
            koordinator.sh/gpu: 200
            cpu: 64
            memory: 500Gi
        requests:
            koordinator.sh/gpu: 200
            cpu: 64
            memory: 500Gi
    ```
2. GPU 分配在同一个 PCIE
    ```yaml
    apiVersion: v1
    kind: Pod
    metadata:
    annotations: 
        scheduling.koordinator.sh/device-allocate-hint: |-
        {
            "gpu": {
            "requiredTopologyScope": "PCIe"
            }
        }
    spec:
    containers:
    - resources:
        limits:
            koordinator.sh/gpu: 200
    ```
3. GPU 分配在同一个 NUMA Node
    ```yaml
    apiVersion: v1
    kind: Pod
    metadata:
    annotations: 
        scheduling.koordinator.sh/device-allocate-hint: |-
        {
            "gpu": {
            "requiredTopologyScope": "NUMANode"
            }
        }
    spec:
    containers:
    - resources:
        limits:
            koordinator.sh/gpu: 400
    ```
4. GPU 需按照预定义的 Partition 分配
    
通常，GPU 预定义 Partition 规则由特定的 GPU 型号或系统配置决定，也可能受到具体节点上的 GPU 配置的影响。调度器无法洞悉硬件型号或 GPU 类型的具体信息；相反，它依靠节点级别的组件将这些预定义规则上报给设备自定义资源 (CR) 来知晓，如下所示：
```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Device
metadata:
  annotations:
    scheduling.koordinator.sh/gpu-partitions: |
      {
        "1": [
            "NVLINK": {
                {
                  # Which GPUs are included
                  "minors": [
                      0
                  ],
                  # GPU Interconnect Type
                  "gpuLinkType": "NVLink",
                  # Here we take the bottleneck bandwidth between GPUs in the Ring algorithm. BusBandwidth can be referenced from https://github.com/NVIDIA/nccl-tests/blob/master/doc/PERFORMANCE.md
                  "ringBusBandwidth": 400Gi
                  # Indicate the overall allocation quality for the node after the partition has been assigned away.
                  "allocationScore": "1",
                },
                ...
            }
            ...
        ],
        "2": [
            ...
        ],
        "4": [
            ...
        ],
        "8": [
            ...
        ]
      }
  labels:
    // 指示 Partition 规则是否必须遵守
    node.koordinator.sh/gpu-partition-policy: "Honor"
  name: node-1
```
当同时有多个可选的 Partition 方案时，Koordinator 允许用户决定是否按照最优 Partition 分配:
```yaml
kind: Pod
metadata:
  name: hello-gpu
  annotations:
    scheduling.koordinator.sh/gpu-partition-spec: |
      {
        # BestEffort|Restricted
        "allocatePolicy": "Restricted", 
      }
spec:
  containers:
    - name: main
      resources:
        limits:
          koordinator.sh/gpu: 100
```
当用户不需要按照最优 Partition 分配时，调度器将会按照尽可能 Binpack 的方式分配。
想要了解更多关于 GPU 拓扑感知调度的更多细节，请参考如下设计文档：
- [NUMA Topology Scheduling](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20230415-numa-topology-scheduling.md)
- [Device Allocate Hint API](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20230803-device-allocate-hint-apis.md)
- [GPU Partition APIs](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20241008-gpu-partition-api.md)
  
由衷感谢社区开发者 @eahydra 对该特性的贡献！

### 训练任务间的跨机互联加速：端到端的 GDR 方案

在 AI 模型训练场景中，GPU 之间需要进行集合通信。单机的集合通信问题 Koordinator 已经提供了上述的 GPU 拓扑感知调度能力，多机的集合通信则需要 Koordinator 能够感知到 RDMA。自 v1.5.0 版本以来，Koordinator 实现了 GPU 和 RDMA 的联合调度能力。在 v1.6.0 版本中，Koordinator 提供了一个端到端的解决方案。整体架构如下：

![image](/img/gpu-rdma-joint-allocation.jpg)

1. Koordlet 检测节点上的 GPU 和 RDMA 设备，并将相关信息上报给 Device CR。
2. Koord-Manager 从设备 CR 同步资源到 node.status.allocatable。
3. Koord-Scheduler 根据设备拓扑为 Pod 分配 GPU 和 RDMA，并将分配结果注解到 Pods 上。
4. Multus-CNI 访问 Koordlet PodResources Proxy 以获取分配给 Pods 的 RDMA 设备，并将相应的 NIC 附加到 Pods 的网络命名空间中。
5. Koordlet 提供 NRI 插件，将设备挂载到容器中。

由于涉及到众多组件和复杂的环境，Koordinator v1.6.0 提供了[最佳实践](https://koordinator.sh/docs/next/best-practices/gpu-and-rdma-joint-allocation/)来展示如何一步步部署 Koordinator、Multus-CNI 和 SRIOV-CNI。在部署好相关组件之后，用户可以简单采用如下的 Pod 协议来请求调度器为它申请的 GPU 和 RDMA 进行联合分配：
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-vf01
  namespace: kubeflow
  annotations:
    scheduling.koordinator.sh/device-joint-allocate: |-
      {
        "deviceTypes": ["gpu","rdma"]
      }
    scheduling.koordinator.sh/device-allocate-hint: |-
      {
       "rdma": {
         "vfSelector": {} //apply VF
       }
      }
spec:
  schedulerName: koord-scheduler
  containers:
  - name: container-vf
    resources:
      requests:
        koordinator.sh/gpu: 100
        koordinator.sh/rdma: 100
      limits:
        koordinator.sh/gpu: 100
        koordinator.sh/rdma: 100
```
想要更进一步地采用 Koordinator 端到端地测试 GDR 任务，大家可以参考[最佳实践](https://koordinator.sh/docs/next/best-practices/gpu-and-rdma-joint-allocation/)中的样例一步步进行，在此也由衷感谢社区开发者 @ferris-cx 对该特性的贡献！

### 提高推理任务资源利用率：GPU 共享强隔离

GPU 是如今大模型训练和推理不可或缺的设备，可以为 AI 应用提供强大的算力支撑。然而如此强大的算力背后是昂贵的价格。Koordinator 观察到有些推理任务往往用不到满载的 GPU，而只使用了比如50%的算力或者 GPU 内存。因此，将一个 GPU 给多个 Pod 共享可以显著提高 GPU 资源利用率。

HAMi 是 CNCF Sandbox 项目，旨在为 Kubernetes 提供一个设备管理中间件。HAMi-Core 是它的核心模块，通过劫持 CUDA-Runtime（libcudart.so）和 CUDA-Driver（libcuda.so）之间的 API 调用提供 GPU 共享隔离能力。在 v1.6.0 版本中，Koordinator 利用 HAMi-Core 的 GPU 隔离功能，提供端到端的 GPU 共享解决方案。

大家可以通过下面的 YAML 文件部署 DaemonSet 直接在对应节点上安装 HAMi-core。
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: hami-core-distribute
  namespace: default
spec:
  selector:
    matchLabels:
      koord-app: hami-core-distribute
  template:
    metadata:
      labels:
        koord-app: hami-core-distribute
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: node-type
                operator: In
                values:
                - "gpu"
      containers:
      - command:
        - /bin/sh
        - -c
        - |
          cp -f /k8s-vgpu/lib/nvidia/libvgpu.so /usl/local/vgpu && sleep 3600000
        image: docker.m.daocloud.io/projecthami/hami:v2.4.0
        imagePullPolicy: Always
        name: name
        resources:
          limits:
            cpu: 200m
            memory: 256Mi
          requests:
            cpu: "0"
            memory: "0"
        volumeMounts:
        - mountPath: /usl/local/vgpu
          name: vgpu-hook
        - mountPath: /tmp/vgpulock
          name: vgpu-lock
      tolerations:
      - operator: Exists
      volumes:
      - hostPath:
          path: /usl/local/vgpu
          type: DirectoryOrCreate
        name: vgpu-hook
     # https://github.com/Project-HAMi/HAMi/issues/696
      - hostPath:
          path: /tmp/vgpulock
          type: DirectoryOrCreate
        name: vgpu-lock
```
Koordinator 调度器的 GPU Binpack 能力是默认开启状态，在安装好 Koordinator 和 HAMi-Core 之后，用户可以通过如下方式申请 GPU 共享卡并启用 HAMI-Core 隔离。
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-example
  namespace: default
  labels:
    koordinator.sh/gpu-isolation-provider: hami-core
spec:
  schedulerName: koord-scheduler
  containers:
  - command:
    - sleep
    - 365d
    image: busybox
    imagePullPolicy: IfNotPresent
    name: curlimage
    resources:
      limits:
        cpu: 40m
        memory: 40Mi
        koordinator.sh/gpu-shared: 1
        koordinator.sh/gpu-core: 50
        koordinator.sh/gpu-memory-ratio: 50
      requests:
        cpu: 40m
        memory: 40Mi
        koordinator.sh/gpu-shared: 1
        koordinator.sh/gpu-core: 50
        koordinator.sh/gpu-memory-ratio: 50
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
```
关于在 Koordinator 启用 HAMi GPU 共享隔离能力的使用指导，请参考：
- [Device Scheduling - GPU Share With HAMi](https://koordinator.sh/docs/next/user-manuals/device-scheduling-gpu-share-with-hami/)

由衷感谢 HAMi 社区同学 @wawa0210 对该特性的支持！

### GPU 资源差异化调度策略：一种简单有效的降低 GPU 碎片率的办法
Kubernetes 原生的 NodeResourcesFit 插件目前对不同资源只支持配置同样的打分策略，举例如下：
```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
profiles:
  - pluginConfig:
      - name: NodeResourcesFit
        args:
          apiVersion: kubescheduler.config.k8s.io/v1
          kind: NodeResourcesFitArgs
          scoringStrategy:
            type: LeastAllocated
            resources:
              - name: cpu
                weight: 1
              - name: memory
                weight: 1
              - name: nvidia.com/gpu
                weight: 1
```
但在生产实践中，有些场景并不适用这种设计。例如：在 AI 场景中，申请 GPU 的业务希望优先占用整个 GPU 机器，防止 GPU 碎片化；申请 CPU&MEM 的业务希望优先 Spread，以降低 CPU 热点。Koordinator 在 v1.6.0 版本中引入了 NodeResourceFitPlus 插件以支持为不同资源配置差异化的打分策略，用户在安装 Koordinator 调度器时可配置如下：
```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
profiles:
- pluginConfig:
  - args:
      apiVersion: kubescheduler.config.k8s.io/v1
      kind: NodeResourcesFitPlusArgs
      resources: 
        nvidia.com/gpu:
          type: MostAllocated
          weight: 2
        cpu:
          type: LeastAllocated
          weight: 1
        memory:
          type: LeastAllocated
          weight: 1
    name: NodeResourcesFitPlus
  plugins:
    score:
      enabled:
      - name: NodeResourcesFitPlus
        weight: 2
  schedulerName: koord-scheduler
```
另外，申请 CPU&MEM 的业务会希望优先分散到非 GPU 机器，防止 GPU 机器上 CPU&MEM 消耗过大，导致真正的申请 GPU 任务因非 GPU 资源不足而处于 Pending 状态。Koordinator 在 v1.6.0 当中引入了 ScarceResourceAvoidance 插件以支持该需求，用户可配置调度器如下，表示 nvidia.com/gpu 是稀缺资源，当 Pod 没有申请该稀缺资源时尽量避免调度到上面。
```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
profiles:
- pluginConfig:
  - args:
      apiVersion: kubescheduler.config.k8s.io/v1
      kind: ScarceResourceAvoidanceArgs
      resources: 
      - nvidia.com/gpu
    name: ScarceResourceAvoidance
  plugins:
    score:
      enabled:
      - name: NodeResourcesFitPlus
        weight: 2
      - name: ScarceResourceAvoidance
        weight: 2
      disabled:
      - name: "*"
  schedulerName: koord-scheduler
```
关于 GPU 资源差异化调度策略的详细设计和使用指导，请参考：
- [设计文档](https://koordinator.sh/docs/next/designs/node-resource-fit-plus-scoring/)
- [用户手册](http://koordinator.sh/docs/next/user-manuals/node-resource-fit-plus-scoring)

由衷感谢社区开发者  @LY-today 对该特性的贡献。
### 更精细化的资源预留
资源预留（Resource Reservation）旨在解决 Kubernetes 集群中的资源确定性问题，它允许我们提交一个自定义资源 Reservation 来预留节点资源，以供特定的 Pod 消费。在异构资源场景中，预留资源有更多精细化、灵活性的诉求。对此，在该特性在 v1.6 版本中带来了以下功能增强和性能优化：
1. 支持精细化 CPU、GPU 资源的预留和抢占。
2. 支持 Pod 对预留资源量的精确匹配。
3. 资源预留亲和性支持指定预留名称和污点容忍属性。
4. 资源预留支持 Pods 数限制。
5. 支持资源预留抢占低优先级 Pod。

插件扩展接口变动：
1. 预留资源校验接口 ReservationFilterPlugin 从 PreScore 阶段前置到 Filter 阶段以确保过滤结果更准确。
2. 预留资源账本归还接口 ReservationRestorePlugin 废弃了不需要的方法以提升调度效率。

以下是新功能的使用示例：
1. 预留资源量精确匹配（Exact-Match Reservation）
指定 Pod 精确匹配预留资源量，可以用于缩小一组 Pod 和一组预留资源的匹配关系，让预留资源的分配更可控。
```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    # 指定Pod精确匹配预留的资源类别，Pod只能匹配在这些资源类别下预留资源量和Pod规格完全相等的Reservation对象；比如指定"cpu","memory","nvidia.com/gpu"
    scheduling.koordinator.sh/exact-match-reservation: '{"resourceNames":{"cpu","memory","nvidia.com/gpu"}}'
```
2. 忽略资源预留（reservation-ignored）
指定 Pod 忽略资源预留，可以让 Pod 填充已预留但未分配的节点空闲资源，配合抢占使用可以更减少资源碎片。
```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    # 指定Pod的调度可以忽略掉资源预留
    scheduling.koordinator.sh/reservation-ignored: "true"
```
3. 指定资源预留名称的亲和性（ReservationAffinity）
```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    # 指定Pod匹配的资源预留名称
    scheduling.koordinator.sh/reservation-affinity: '{"name":"test-reservation"}'
```
4. 指定资源预留的污点和容忍
```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Reservation
metadata:
  name: test-reservation
spec:
  # 指定Reservation的Taints，其预留资源只能分配给容忍该污点的Pod
  taints:
  - effect: NoSchedule
    key: test-taint-key
    value: test-taint-value
  # ...
---
apiVersion: v1
kind: Pod
metadata:
  annotations:
    # 指定Pod对资源预留的污点容忍
    scheduling.koordinator.sh/reservation-affinity: '{"tolerations":[{"key":"test-taint-key","operator":"Equal","value":"test-taint-value","effect":"NoSchedule"}]}'
```
5. 开启 reservation 抢占

> 注：当前不支持高优 Pod 抢占低优 Reservation 的用法。

```yml
apiVersion: kubescheduler.config.k8s.io/v1beta3
kind: KubeSchedulerConfiguration
profiles:
- pluginConfigs:
  - name: Reservation
    args:
      apiVersion: kubescheduler.config.k8s.io/v1beta3
      kind: ReservationArgs
      enablePreemption: true
  # ...
  plugins:
    postFilter:
    # 调度器配置中，关闭DefaultPreemption插件的抢占，开启Reservation插件的抢占
    - disabled:
      - name: DefaultPreemption
      # ...
    - enabled:
      - name: Reservation
```
由衷感谢社区开发者 @saintube 对该特性的贡献！
### 混部：Mid tier 支持空闲资源再分配，增强 Pod 级别 QoS 配置
Koordinator v1.6.0 版本在资源超卖和混部 QoS 方面包含了一些功能优化和 bugfixes：
1. Mid 资源超卖和节点画像特性优化计算逻辑，支持超卖节点未分配资源，避免二次超卖节点资源。
2. 负载感知调度优化指标降级逻辑。
3. CPU QoS、Resctrl QoS 支持 pod 维度配置。
4. 带外负载管理补充 prometheus metrics，以增强可观测性。
5. Blkio QoS、资源放大等特性的 bugfixes。

Mid 资源超卖从 Koordinator v1.3 版本开始引入，提供基于节点画像的动态资源超卖能力。但是，为了确保超卖资源的稳定性，Mid 资源完全从节点上已分配的 Prod pods 中获取，意味着空节点一开始是没有 Mid 资源的，这对一些工作负载使用 Mid 资源带来了诸多不便，Koordinator 社区也收到了一些企业用户的反馈和贡献。

在 v1.6 版本中，Koordinator 更新了超卖计算公式，如下：
```
MidAllocatable := min(ProdReclaimable, NodeAllocatable * thresholdRatio) + ProdUnallocated * unallocatedRatio
ProdReclaimable := min(max(0, ProdAllocated - ProdPeak * (1 + safeMargin)), NodeUnused)
```
计算逻辑有2点变化：
1. 支持了对未分配资源按一个静态比例的超卖，以改善冷启动问题。
2. 不允许超卖真实已使用的节点资源，避免一些二次超卖场景产生过大的预估值；比如一些用户使用了 Koordinator 的节点资源放大能力以调度更多 Prod pods，使得节点上 ProdAllocated > NodeAllocatable，导致 MidAllocatable 的预估值已经偏离真实的节点负载。

此外，在混部 QoS 方面，Koordinator v1.6 增强了 Pod 粒度的 QoS 策略配置能力，适合比如混部节点上加黑干扰 Pod 以及灰度调整混部 QoS 的使用场景：
1. 支持 Pod 维度的 LLC 和内存带宽隔离能力

借助容器运行时的节点资源接口 NRI，Resctrl 特性允许用户对节点上单个 Pod 设置 LLC 和内存带宽的划分策略。该特性可通过以下方式启用：
1. 在 Koordlet 中 feature-gate 中启用 Resctrl 特性。
2. 通过 Pod Annotation 协议node.koordinator.sh/resctrl，配置 LLC 及内存带宽（MB）限制策略。例如，
```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    node.koordinator.sh/resctrl: '{"llc": {"schemata": {"range": [0, 30]}}, "mb": {"schemata": {"percent": 20}}}'
```
1. 支持 Pod 维度的 CPU QoS 配置

该特性可通过以下方式启用：
1. 启用 CPU QoS，请参照：https://koordinator.sh/docs/user-manuals/cpu-qos/
2. 通过 Pod Annotation 协议koordinator.sh/cpuQOS，配置 Pod 的 CPU QoS 策略。例如，
```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    koordinator.sh/cpuQOS: '{"groupIdentity": 1}'
```
由衷感谢 @kangclzjc,@j4ckstraw, @lijunxin559,@tan90github,@yangfeiyu20102011 等社区开发者在混部相关特性上的贡献！

### 调度重调度优化
在 v1.6.0 版本中，我们持续优化了调度器和重调度器。调度器主要在性能方面有如下优化：

1. 将 PodGroup 的 MinMember 检查提前到 PreEnqueue，减少不必要的调度周期。
2. 将 Reservation 的资源归还延迟到 AfterPreFilter 阶段，只在 PreFilterResult 允许的节点上做资源归还，降低算法复杂度。
3. 优化 NodeNUMAResource、DeviceShare、Reservation 等插件的 CycleState 分布，降低内存开销。
4. 为 Koordinator 额外增加的扩展点如 BeforePreFilter、AfterPreFilter 新增延迟指标。

随着集群规模的不断扩大，以及多租户环境下资源竞争的加剧，集群稳定性已成为重调度和资源管理中的核心关注点。频繁的驱逐可能导致工作负载在不同节点之间反复调度，进而增加额外的系统负担并带来稳定性风险。为应对这一挑战，在 v1.6.0 版本中，重调度器在负载感知重调度插件、驱逐控制器等方面发布了多项特性增强和规则优化。这些改进进一步提升了重调度过程的稳定性和合理性：

1. LowNodeLoad插件优化：
  a. LowNodeLoad插件现在支持配置ProdHighThresholds和ProdLowThresholds，结合Koordinator优先级（Priority）对工作负载的资源利用率进行差异化管理，能够减少生产应用引起的热点问题，从而实现更细粒度的负载均衡；
  b. 优化了对待驱逐Pod的排序逻辑，通过分段函数打分算法选出最适合驱逐的Pod，确保合理的资源分配，避免因驱逐资源利用率最大的Pod而造成的稳定性问题；
  c. 优化了Pod驱逐前的检查逻辑，LowNodeLoad在驱逐Pod前逐一检查目标节点是否会因重调度成为新的热点节点，这一优化有效避免了反复重调度的发生。
2. 驱逐控制器MigrationController增强：
  a. MigrationController具有ObjectLimiter的能力，能够控制某段时间内工作负载的驱逐频率。现在支持配置namespace级别的驱逐限流，对namespace下的驱逐进行更加精细化的控制；同时将ObjectLimiter从Arbitrator迁移到MigrationController内部，修复了在并发场景下可能出现的限流失效问题；
  b. 新增EvictAllBarePods配置项，允许用户开启驱逐没有OwnerRef的Pod，从而提高了重调度的灵活性；
  c. 新增MaxMigratingGlobally配置项，MigrationController可以单独控制Pod的最大驱逐数量，从而降低了稳定性风险；
  d. 优化了GetMaxUnavailable方法的计算逻辑，当计算工作负载的最大不可用副本数向下取整为0时，默认将其调整为1，避免导致用户对副本不可用数的控制失去预期的准确性和一致性。
4. 新增重调度全局配置参数MaxNoOfPodsToEvictTotal，可以确保重调度器全局的Pod最大驱逐数量，减少对集群的负担并提升稳定性；

由衷感谢社区开发者 @AdrianMachao,@songtao98,@LY-today,@zwForrest,@JBinin,@googs1025,@bogo-y 在调度重调度优化上的贡献！

## 未来计划
Koordinator 社区将继续专注于加强 GPU 资源管理和调度功能，提供重调度插件进一步解决资源分配不均衡导致的 GPU 碎片问题，并计划在下一个版本中引入更多新的功能和特性，以支持更复杂的工作负载场景；同时在资源预留和混部方面我们也将进一步优化，支持更细化的场景。

目前社区已经在规划的 Proposal 如下：
- [精细化设备调度支持晟腾 NPU](https://github.com/koordinator-sh/koordinator/issues/2335)
- [提供重调度插件解决资源不均衡问题](https://github.com/koordinator-sh/koordinator/issues/2332)
- [Reservation 支持绑定已分配 Pod](https://github.com/koordinator-sh/koordinator/issues/2150)

着重解决的使用问题如下：
- [NRI 插件冲突](https://github.com/koordinator-sh/koordinator/issues/2334)

长期规划的 Proposal 如下：
- [提供一个端到端可演进的设备管理方案](https://github.com/koordinator-sh/koordinator/issues/2181)

我们鼓励用户反馈使用体验，并欢迎更多开发者参与到 Koordinator 项目的建设中来，共同推动项目的前进！



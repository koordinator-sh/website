---
slug: release-v1.7.0
title: "Koordinator v1.7: 基于网络拓扑感知调度和作业级抢占赋能大规模 AI 训练"
authors: [saintube, ZiMengSheng]
tags: [release]
---

## 背景

随着人工智能技术的持续演进,AI 模型训练的规模和复杂度呈指数级增长。大语言模型(LLM)和分布式 AI 训练场景对集群资源调度提出了前所未有的挑战。高效的跨节点通信、智能的资源抢占以及统一的异构设备管理成为生产环境必须解决的关键问题。

自 2022 年 4 月正式开源以来,Koordinator 已迭代发布了 15 个大版本,持续为工作负载编排、资源调度、隔离和性能优化提供全面的解决方案。Koordinator 社区感谢来自阿里巴巴、蚂蚁科技、Intel、小红书、小米、爱奇艺、360、有赞等众多企业的优秀工程师的贡献,他们带来了宝贵的想法、代码和实际应用场景。

今天,我们很高兴地宣布 Koordinator v1.7.0 正式发布。本版本针对大规模 AI 训练场景引入了突破性能力,包括**网络拓扑感知调度**、**作业级抢占**、全面的 **API 参考文档**以及完整的**开发者指南**。此外,v1.7.0 通过支持华为昇腾 NPU 和寒武纪 MLU 增强了异构设备调度能力,提供了端到端的设备管理解决方案。

在 v1.7.0 版本中,共有 14 位新开发者积极参与到 Koordinator 社区的建设中,他们是 @ditingdapeng、@Rouzip、@ClanEver、@zheng-weihao、@cntigers、@LennonChin、@ZhuZhezz、@dabaooline、@bobsongplus、@yccharles、@qingyuanz、@yyrdl、@hwenwur 和 @hkttty2009。由衷感谢所有社区成员的积极参与和持续支持!

## 核心亮点功能

### 1. 网络拓扑感知调度:加速分布式 AI 训练中的通信

在大规模 AI 训练场景中,特别是大语言模型(LLM)训练,高效的跨节点通信对训练性能至关重要。张量并行(TP)、流水线并行(PP)和数据并行(DP)等模型并行技术需要跨 GPU 进行频繁的高带宽数据交换——通常跨越多个节点。在这类工作负载下,网络拓扑成为关键的性能瓶颈,通信延迟和带宽受物理网络层次结构(如 NVLink、block、spine)的严重影响。

为了优化训练效率,Koordinator v1.7.0 提供了**网络拓扑感知调度**能力,确保:
- 当集群资源充足时,具有网络拓扑要求的 Pod 将根据用户指定的策略调度到性能更好的拓扑域(如更低延迟、更高带宽)。
- 当集群资源不足时,调度器将基于网络拓扑约束通过作业级抢占为 GangGroup 抢占资源,并在 `.status.nominatedNode` 字段中记录资源提名以确保一致的放置。

#### 集群网络拓扑配置

管理员首先使用 NVIDIA 的 [topograph](https://github.com/NVIDIA/topograph/blob/main/docs/k8s.md) 等工具为节点标记其网络拓扑位置:

```yaml
apiVersion: v1
kind: Node
metadata:
  name: node-0
  labels:
    network.topology.nvidia.com/block: b1
    network.topology.nvidia.com/spine: s1
```

然后通过 `ClusterNetworkTopology` CR 定义拓扑层次结构:

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: ClusterNetworkTopology
metadata:
  name: default
spec:
  networkTopologySpec:
    - labelKey:
      - network.topology.nvidia.com/spine
      topologyLayer: SpineLayer
    - labelKey:
      - network.topology.nvidia.com/block
      parentTopologyLayer: SpineLayer
      topologyLayer: BlockLayer
    - parentTopologyLayer: BlockLayer
      topologyLayer: NodeTopologyLayer
```

#### 配置拓扑感知的 Gang 调度

要利用网络拓扑感知能力,创建 `PodGroup` 并使用拓扑要求进行注解:

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: training-job
  namespace: default
  annotations:
    gang.scheduling.koordinator.sh/network-topology-spec: |-
      {
        "topologyLayers": ["BlockLayer"],
        "topologyPolicy": "BestEffort"
      }
spec:
  minMember: 8
  scheduleTimeoutSeconds: 300
```

调度属于此 PodGroup 的 Pod 时,调度器将尝试将所有成员 Pod 放置在同一个 `BlockLayer` 拓扑域内,以最小化节点间通信延迟。

更多关于网络拓扑感知调度的信息,请参见[网络拓扑感知调度](https://koordinator.sh/docs/user-manuals/network-topology-aware-scheduling)。

### 2. 作业级抢占:确保全有或全无的资源获取

在大规模集群环境中,高优先级作业(如关键 AI 训练任务)在资源不足时通常需要从低优先级工作负载抢占资源。然而,Kubernetes 中传统的**Pod 级抢占**无法保证分布式作业的所有成员 Pod 一起获取资源,导致无效抢占和资源浪费。

为解决这一问题,Koordinator v1.7.0 提供了**作业级抢占**,确保:
- 在作业(GangGroup)级别触发抢占。
- 只有当所有成员 Pod 在驱逐后都能被共同调度时才会发生抢占。
- 通过 `nominatedNode` 为所有成员保留资源以保持调度一致性。

#### 抢占算法

作业级抢占工作流程包括以下步骤:

1. **无法调度的 Pod 检测**:当 Pod 无法调度时,进入 PostFilter 阶段。
2. **作业识别**:调度器检查 Pod 是否属于 PodGroup/GangGroup 并获取所有成员 Pod。
3. **抢占资格检查**:验证 `pods.spec.preemptionPolicy` ≠ Never 并确保当前提名节点上不存在正在终止的受害者。
4. **候选节点选择**:通过模拟移除潜在受害者(低优先级 Pod)来找到抢占可能有帮助的节点。
5. **作业感知成本模型**:基于作业感知成本模型选择最优节点和最小成本受害者集。
6. **执行抢占**:删除受害者并为所有成员 Pod 设置 `status.nominatedNode`。

#### 使用示例

为抢占者和受害者定义优先级类:

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 1000000
preemptionPolicy: PreemptLowerPriority
description: "用于可以抢占其他作业的关键 AI 训练任务。"
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: low-priority
value: 1000
preemptionPolicy: PreemptLowerPriority
description: "用于可以被抢占的非关键任务。"
```

创建高优先级 gang 作业:

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: hp-training-job
  namespace: default
spec:
  minMember: 2
  scheduleTimeoutSeconds: 300
---
apiVersion: v1
kind: Pod
metadata:
  name: hp-worker-1
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: hp-training-job
spec:
  schedulerName: koord-scheduler
  priorityClassName: high-priority
  preemptionPolicy: PreemptLowerPriority
  containers:
  - name: worker
    resources:
      limits:
        cpu: 3
        memory: 4Gi
      requests:
        cpu: 3
        memory: 4Gi
```

当高优先级作业无法调度时,调度器将跨多个节点抢占低优先级 Pod,为作业的所有成员 Pod 腾出空间。

更多关于作业级抢占的信息,请参见[作业级抢占](https://koordinator.sh/docs/user-manuals/job-level-preemption)。

### 3. 全面的 API 参考和开发者指南

为了改善开发者体验并促进社区贡献,Koordinator v1.7.0 引入了全面的 **API 参考文档**和完整的**开发者指南**。

#### API 参考

新的 API 参考提供了详细文档:
- **自定义资源定义 (CRD)**:所有 Koordinator CRD 的全面架构定义、字段描述、验证规则和使用模式,包括 Recommendation、ClusterColocationProfile、ElasticQuota、Reservation、Device、NodeMetric 等。
- **客户端库**:使用 Go、Python 和其他语言的 Koordinator 客户端库指南。
- **指标端点**:Koordinator 组件暴露的 Prometheus 指标的完整文档。
- **Webhook 端点**:用于扩展 Koordinator 功能的 webhook 端点的详细规范。

自定义资源定义文档示例:

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Device
metadata:
  name: worker01
  labels:
    node.koordinator.sh/gpu-model: NVIDIA-H20
    node.koordinator.sh/gpu-vendor: nvidia
spec:
  devices:
  - health: true
    id: GPU-a43e0de9-28a0-1e87-32f8-f5c4994b3e69
    minor: 0
    resources:
      koordinator.sh/gpu-core: "100"
      koordinator.sh/gpu-memory: 97871Mi
      koordinator.sh/gpu-memory-ratio: "100"
    topology:
      busID: 0000:0e:00.0
      nodeID: 0
      pcieID: pci0000:0b
    type: gpu
```

#### 开发者指南

开发者指南为贡献者提供全面资源,包括:
- **组件指南**:Koordinator 组件的架构和设计。
- **指标收集**:如何添加和暴露新指标。
- **可扩展性**:扩展点和插件开发模式。
- **插件开发**:开发自定义插件的分步指南。
- **自定义调度策略**:如何实现自定义调度策略。
- **Webhook 扩展**:开发用于验证和变更的 webhook 扩展。
- **自定义重调度插件**:构建自定义重调度插件。

这些资源显著降低了新贡献者的准入门槛,使开发者能够更轻松地扩展 Koordinator 的能力。

更多信息,请参见 [API 参考](https://koordinator.sh/docs/api-reference/custom-resource-definitions)和[开发者指南](https://koordinator.sh/docs/developer-guide/component-guide)。

### 4. 增强的架构文档:作业和设备管理

Koordinator v1.7.0 通过两个新章节增强了架构文档:**作业**和**设备**,提供了作业调度语义和异构设备管理的全面解释。

#### 作业架构

作业架构文档介绍:
- **PodGroup**:描述如何批量调度必须一起调度的同构 Pod。
- **GangGroup**:解释如何关联不同的 PodGroup 以形成异构 gang 调度的 GangGroup。
- **作业级抢占**:详细说明抢占算法及其优势。
- **网络拓扑感知调度**:解释如何基于网络层次结构优化 Pod 放置。

包含两个 PodGroup 的 GangGroup 示例:

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: gang-example1
  namespace: default
  annotations:
    gang.scheduling.koordinator.sh/groups: "[\"default/gang-example1\", \"default/gang-example2\"]"
spec:
  minMember: 1
---
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: gang-example2
  namespace: default
  annotations:
    gang.scheduling.koordinator.sh/groups: "[\"default/gang-example1\", \"default/gang-example2\"]"
spec:
  minMember: 2
```

#### 设备架构

设备架构文档提供:
- **设备定义**:解释 Device CRD 及其在异构设备管理中的作用。
- **设备调度架构**:详细说明从设备上报到设备分配的工作流程。
- **异构设备适配扩展机制**:指导开发者如何集成新设备类型。
- **支持的设备**:列出端到端支持的设备(NVIDIA GPU、华为昇腾 NPU、寒武纪 MLU、通用 RDMA)。

Device 抽象使 Koordinator 能够为异构设备提供全局优化的调度,克服了传统 Kubernetes 设备插件方法的功能限制,后者的设备分配由 kubelet 处理。

更多信息,请参见[作业架构](https://koordinator.sh/docs/architecture/job)和[设备架构](https://koordinator.sh/docs/architecture/device)。

### 5. 异构设备调度:支持华为昇腾 NPU 和寒武纪 MLU

在 v1.6 强大的 GPU 调度基础上,Koordinator v1.7.0 将异构设备调度扩展到支持**华为昇腾 NPU** 和**寒武纪 MLU**,为多厂商提供统一的设备管理和调度能力。

#### 华为昇腾 NPU 支持

Koordinator v1.7.0 通过 `koord-device-daemon` 和 `koordlet` 组件支持昇腾虚拟化模板和整卡。主要特性包括:

- **设备上报**:自动检测昇腾 NPU 信息并上报到 Device CR。
- **分区感知调度**:遵守 HCCS 亲和性的预定义 GPU 分区规则。
- **拓扑调度**:基于 PCIe 和 NUMA 拓扑分配 NPU。

昇腾 NPU 的 Device CR 示例:

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Device
metadata:
  labels:
    node.koordinator.sh/gpu-model: Ascend-910B3
    node.koordinator.sh/gpu-vendor: huawei
  annotations:
    scheduling.koordinator.sh/gpu-partitions: |
      {
        "4": [
          {
            "minors": [0,1,2,3],
            "gpuLinkType": "HCCS",
            "allocationScore": "1"
          }
        ]
      }
  name: node-1
spec:
  devices:
    - health: true
      id: GPU-fd971b33-4891-fd2e-ed42-ce6adf324615
      minor: 0
      resources:
        huawei.com/npu-core: "20"
        huawei.com/npu-cpu: "7"
        huawei.com/npu-dvpp: "100"
        koordinator.sh/gpu-core: "100"
        koordinator.sh/gpu-memory: 64Gi
      topology:
        busID: 0000:3b:00.0
        nodeID: 0
        pcieID: pci0000:3a
      type: gpu
```

#### 寒武纪 MLU 支持

Koordinator v1.7.0 在整卡和虚拟化(dynamic-smlu)模式下都支持寒武纪 MLU 卡。主要特性包括:

- **设备上报**:检测并上报寒武纪 MLU 信息。
- **虚拟化支持**:通过 dynamic-smlu 模式启用 GPU 共享。
- **统一资源命名**:使用 `koordinator.sh/gpu-*` 资源进行一致调度。

请求寒武纪虚拟卡的 Pod 示例:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: test-cambricon-partial
  namespace: default
spec:
  schedulerName: koord-scheduler
  containers:
  - name: demo-sleep
    image: ubuntu:18.04
    resources:
      limits:
        koordinator.sh/gpu.shared: "1"
        koordinator.sh/gpu-memory: "1Gi"
        koordinator.sh/gpu-core: "10"
        cambricon.com/mlu.smlu.vcore: "10"
        cambricon.com/mlu.smlu.vmemory: "4"
      requests:
        koordinator.sh/gpu.shared: "1"
        koordinator.sh/gpu-memory: "1Gi"
        koordinator.sh/gpu-core: "10"
        cambricon.com/mlu.smlu.vcore: "10"
        cambricon.com/mlu.smlu.vmemory: "4"
```

更多信息,请参见[设备调度 - 昇腾 NPU](https://koordinator.sh/docs/user-manuals/device-scheduling-ascend-npu) 和[设备调度 - 寒武纪 MLU](https://koordinator.sh/docs/user-manuals/device-scheduling-cambricon-mlu)。

### 6. 最佳实践:批量混部快速入门

为了帮助用户快速上手 Koordinator 的混部能力,v1.7.0 引入了新的最佳实践指南:**批量混部快速入门**。该指南提供分步说明:

- 在 Kubernetes 集群中部署 Koordinator。
- 为在线和批量工作负载配置混部配置文件。
- 通过批量资源超卖观察资源利用率改进。
- 监控和故障排除混部场景。

该指南补充了现有的 Spark 作业混部、Hadoop YARN 混部和细粒度 CPU 编排等最佳实践,为生产部署提供全面的资源库。

更多信息,请参见[批量混部快速入门](https://koordinator.sh/docs/best-practices/batch-colocation-quick-start)。

### 7. 其他增强和改进

Koordinator v1.7.0 还包含众多增强和 bug 修复:

1. **调度增强**:改进调度性能,优化插件生命周期管理,增强 Coscheduling 插件的公平排队和网络拓扑感知能力。
2. **设备调度**:增强设备拓扑感知,改进 GPU 分区调度,优化设备分配算法。
3. **混部**:优化 Mid 资源超卖计算,增加 Pod 级 QoS 配置支持,改进 CPU QoS 和 Resctrl QoS 能力。
4. **重调度**:增强 LowNodeLoad 插件的 Prod 感知阈值,改进 MigrationController 的命名空间级节流,添加全局驱逐限制。
5. **可观测性**:添加全面的 Prometheus 指标,改进日志和调试能力。
6. **兼容性**:升级到 Kubernetes 1.28,改进与各种容器运行时和设备插件的兼容性。

完整的变更列表,请参见 [v1.7.0 Release](https://github.com/koordinator-sh/koordinator/releases/tag/v1.7.0)。

## 贡献者

Koordinator 是一个开源社区。在 v1.7.0 中,有 14 位新开发者为 Koordinator 主仓库做出了贡献:

@ditingdapeng 在 #2353 中首次贡献  
@Rouzip 在 #2005 中首次贡献  
@ClanEver 在 #2405 中首次贡献  
@zheng-weihao 在 #2409 中首次贡献  
@cntigers 在 #2434 中首次贡献  
@LennonChin 在 #2449 中首次贡献  
@ZhuZhezz 在 #2423 中首次贡献  
@dabaooline 在 #2483 中首次贡献  
@bobsongplus 在 #2524 中首次贡献  
@yccharles 在 #2474 中首次贡献  
@qingyuanz 在 #2584 中首次贡献  
@yyrdl 在 #2597 中首次贡献  
@hwenwur 在 #2621 中首次贡献  
@hkttty2009 在 #2641 中首次贡献

感谢长期以来持续努力的贡献者和新加入的积极贡献者。我们欢迎更多贡献者加入 [*Koordinator 社区*](https://github.com/koordinator-sh/koordinator)。

## 未来计划

在下一个版本中,Koordinator 计划以下工作:

- **更多异构设备的细粒度设备调度**:继续扩展对异构设备的支持,包括 FPGA、自定义 ASIC 和其他加速器。
- **GPU 碎片化的重调度插件**:提供重调度插件以解决由资源分配不均衡导致的 GPU 碎片化问题。
- **增强资源预留**:支持将已分配的 Pod 绑定到预留,为批量和可抢占工作负载实现更灵活的资源管理。
- **NRI 插件兼容性**:解决 NRI 插件冲突,提高与其他基于 NRI 的解决方案的兼容性。
- **端到端可演化设备管理解决方案**:提供随硬件创新而演化的综合设备管理解决方案。
- **多集群调度**:探索大规模部署的联邦和多集群调度能力。

我们鼓励用户反馈使用体验,欢迎更多开发者参与 Koordinator 项目,共同推动其发展!

## 致谢

自项目开源以来,Koordinator 已发布超过 15 个版本,有 90 多位贡献者参与其中。社区持续成长和改进。我们感谢所有社区成员的积极参与和宝贵反馈。我们也要感谢 CNCF 组织和相关社区成员对项目的支持。

欢迎更多开发者和终端用户[**加入我们**](https://github.com/koordinator-sh/koordinator?tab=readme-ov-file#community)!正是你们的参与和反馈使 Koordinator 不断改进。无论你是云原生社区的初学者还是专家,我们都期待听到你的声音!

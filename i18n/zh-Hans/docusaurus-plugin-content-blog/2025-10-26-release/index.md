---
slug: release-v1.7.0
title: "Koordinator v1.7: 基于网络拓扑感知调度和作业级抢占赋能大规模 AI 训练"
authors: [ZiMengSheng, saintube, zqzten, ZhuZhezz]
tags: [release]
---

## 背景

随着人工智能技术的持续演进，AI 模型训练的规模和复杂度呈指数级增长。大语言模型（LLM）和分布式 AI 训练场景对集群资源调度提出了前所未有的挑战。高效的跨节点通信、智能的资源抢占以及统一的异构设备管理成为生产环境必须解决的关键问题。

自 2022 年 4 月正式开源以来，Koordinator 已迭代发布了 15 个大版本，持续为工作负载编排、资源调度、隔离和性能优化提供全面的解决方案。Koordinator 社区感谢来自阿里巴巴、蚂蚁科技、Intel、小红书、小米、爱奇艺、360、有赞等众多企业的优秀工程师的贡献，他们带来了宝贵的想法、代码和实际应用场景。

今天，我们很高兴地宣布 Koordinator v1.7.0 正式发布。本版本针对大规模 AI 训练场景引入了突破性能力，包括**网络拓扑感知调度**和**作业级抢占**。此外，v1.7.0 通过支持华为昇腾 NPU 和寒武纪 MLU 增强了异构设备调度能力，提供了端到端的设备管理解决方案。该版本还包含了全面的 **API 参考文档**和完整的**开发者指南**，以改善开发者体验。

在 v1.7.0 版本中，共有 14 位新开发者积极参与到 Koordinator 社区的建设中，他们是 @ditingdapeng、@Rouzip、@ClanEver、@zheng-weihao、@cntigers、@LennonChin、@ZhuZhezz、@dabaooline、@bobsongplus、@yccharles、@qingyuanz、@yyrdl、@hwenwur 和 @hkttty2009。由衷感谢所有社区成员的积极参与和持续支持！

## 核心亮点功能

### 1. 网络拓扑感知调度：加速分布式 AI 训练中的通信

在大规模 AI 训练场景中，特别是大语言模型（LLM）训练，高效的跨节点通信对训练性能至关重要。张量并行（TP）、流水线并行（PP）和数据并行（DP）等模型并行技术需要跨 GPU 进行频繁的高带宽数据交换——通常跨越多个节点。在这类工作负载下，网络拓扑成为关键的性能瓶颈，通信延迟和带宽受物理网络层次结构（如 NVLink、block、spine）的严重影响。

![image](/img/networktopo-1.png)

为了优化训练效率，Koordinator v1.7.0 提供了**网络拓扑感知调度**能力，确保：
- 当集群资源充足时，具有网络拓扑要求的 Pod 将根据用户指定的策略调度到性能更好的拓扑域（如更低延迟、更高带宽）。
- 当集群资源不足时，调度器将基于网络拓扑约束通过作业级抢占为 GangGroup 抢占资源，并在 `.status.nominatedNode` 字段中记录资源提名以确保一致的放置。

#### 集群网络拓扑配置

管理员首先使用 NVIDIA 的 [topograph](https://github.com/NVIDIA/topograph/blob/main/docs/k8s.md) 等工具为节点标记其网络拓扑位置：

```yaml
apiVersion: v1
kind: Node
metadata:
  name: node-0
  labels:
    network.topology.nvidia.com/block: b1
    network.topology.nvidia.com/spine: s1
```

然后通过 `ClusterNetworkTopology` CR 定义拓扑层次结构：

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

要利用网络拓扑感知能力，创建 `PodGroup` 并使用拓扑要求进行注解：

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: training-job
  namespace: default
  annotations:
    gang.scheduling.koordinator.sh/network-topology-spec: |
      {
        "gatherStrategy": [
          {
            "layer": "BlockLayer",
            "strategy": "PreferGather"
          }
        ]
      }
spec:
  minMember: 8
  scheduleTimeoutSeconds: 300
```

调度属于此 PodGroup 的 Pod 时，调度器将尝试将所有成员 Pod 放置在同一个 `BlockLayer` 拓扑域内，以最小化节点间通信延迟。

更多关于网络拓扑感知调度的信息，请参见[网络拓扑感知调度](https://koordinator.sh/docs/user-manuals/network-topology-aware-scheduling)。

### 2. 作业级抢占：确保全有或全无的资源获取

在大规模集群环境中，高优先级作业（如关键 AI 训练任务）在资源不足时通常需要从低优先级工作负载抢占资源。然而，Kubernetes 中传统的**Pod 级抢占**无法保证分布式作业的所有成员 Pod 一起获取资源，导致无效抢占和资源浪费。

为解决这一问题，Koordinator v1.7.0 提供了**作业级抢占**，确保：
- 在作业（GangGroup）级别触发抢占。
- 只有当所有成员 Pod 在驱逐后都能被共同调度时才会发生抢占。
- 通过 `nominatedNode` 为所有成员保留资源以保持调度一致性。

#### 抢占算法

作业级抢占工作流程包括以下步骤：

1. **无法调度的 Pod 检测**：当 Pod 无法调度时，进入 PostFilter 阶段。
2. **作业识别**：调度器检查 Pod 是否属于 PodGroup/GangGroup 并获取所有成员 Pod。
3. **抢占资格检查**：验证 `pods.spec.preemptionPolicy` ≠ Never 并确保当前提名节点上不存在正在终止的受害者。
4. **候选节点选择**：通过模拟移除潜在受害者（低优先级 Pod）来找到抢占可能有帮助的节点。
5. **作业感知成本模型**：基于作业感知成本模型选择最优节点和最小成本受害者集。
6. **执行抢占**：删除受害者并为所有成员 Pod 设置 `status.nominatedNode`。

#### 使用示例

为抢占者和受害者定义优先级类：

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

创建高优先级 gang 作业：

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

当高优先级作业无法调度时，调度器将跨多个节点抢占低优先级 Pod，为作业的所有成员 Pod 腾出空间。

更多关于作业级抢占的信息，请参见[作业级抢占](https://koordinator.sh/zh-Hans/docs/user-manuals/job-level-preemption)。

### 3. 异构设备调度：支持华为昇腾 NPU 和寒武纪 MLU

在 v1.6 强大的 GPU 调度基础上，Koordinator v1.7.0 将异构设备调度扩展到支持**华为昇腾 NPU** 和**寒武纪 MLU**，为多厂商提供[统一的设备管理和调度能力](https://koordinator.sh/zh-Hans/docs/architecture/device/#device-scheduling-architecture)。

![Device Scheduling Architecture](/img/device-scheduling-architecture.jpg)

#### 华为昇腾 NPU 支持

Koordinator v1.7.0 通过 `koord-device-daemon` 和 `koordlet` 组件支持昇腾虚拟化模板和整卡。主要特性包括：

- **设备上报**：自动检测昇腾 NPU 信息并上报到 Device CR。
- **分区感知调度**：遵守 HCCS 亲和性的预定义 GPU 分区规则。
- **拓扑调度**：基于 PCIe 和 NUMA 拓扑分配 NPU。

昇腾 NPU 的 Device CR 示例：

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
        koordinator.sh/gpu-memory: 64Gi
      topology:
        busID: 0000:3b:00.0
        nodeID: 0
        pcieID: pci0000:3a
      type: gpu
```

#### 寒武纪 MLU 支持

Koordinator v1.7.0 在整卡和虚拟化（dynamic-smlu）模式下都支持寒武纪 MLU 卡。主要特性包括：

- **设备上报**：检测并上报寒武纪 MLU 信息。
- **虚拟化支持**：通过 dynamic-smlu 模式启用 GPU 共享。
- **统一资源命名**：使用 `koordinator.sh/gpu-*` 资源进行一致调度。

请求寒武纪虚拟卡的 Pod 示例：

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

更多信息，请参见[设备调度 - 昇腾 NPU](https://koordinator.sh/zh-Hans/docs/user-manuals/device-scheduling-ascend-npu) 和[设备调度 - 寒武纪 MLU](https://koordinator.sh/zh-Hans/docs/user-manuals/device-scheduling-cambricon-mlu)。

### 4. 其他增强和改进

Koordinator v1.7.0 还包含以下关键增强：
1. **GPU Share 与 HAMi 增强**： 
   - 升级到 HAMi v2.6.0 并支持 NVIDIA 570 以上驱动。
   - 引入基于 Helm 的 `hami-daemon` chart（版本 0.1.0）安装方式替代手动 DaemonSet 部署，便于管理。
   - 新增 **vGPUmonitor** 组件提供全面的 GPU 监控，支持 Prometheus 指标包括 `HostGPUMemoryUsage`、`HostCoreUtilization`、`vGPU_device_memory_usage_in_bytes`、`vGPU_device_memory_limit_in_bytes` 以及容器级设备指标。
2. **负载感知调度优化**： 
   - 新增 PreFilter 扩展点通过缓存计算结果显著提升调度性能。
   - 引入新配置选项包括 `dominantResourceWeight` 支持主导资源公平性、`prodUsageIncludeSys` 用于全面的 Prod 使用率计算、`enableScheduleWhenNodeMetricsExpired` 处理过期指标、`estimatedSecondsAfterPodScheduled` 和 `estimatedSecondsAfterInitialized` 实现精确的资源估算时机、`allowCustomizeEstimation` 支持 Pod 级估算自定义以及 `supportedResources` 扩展资源类型支持。
3. **增强 ElasticQuota 的 Quota Hook Plugin 框架**：
   - 允许自定义配额验证和执行逻辑
   - 支持在 ReplaceQuotas 和 OnQuotaUpdate 方法中使用 hook 插件
   - 增强的 pod 更新 hook，无论已使用资源是否发生变化都会运行

完整的变更列表，请参见 [v1.7.0 Release](https://github.com/koordinator-sh/koordinator/releases/tag/v1.7.0)。

### 5. 全面的 API 参考和开发者指南

为了改善开发者体验并促进社区贡献，Koordinator v1.7.0 引入了全面的 **API 参考文档**和完整的**开发者指南**。

#### API 参考

新的 API 参考提供了详细文档：
- **自定义资源定义 (CRD)**：所有 Koordinator CRD 的全面架构定义、字段描述、验证规则和使用模式，包括 Recommendation、ClusterColocationProfile、ElasticQuota、Reservation、Device、NodeMetric 等。
- **客户端库**：使用 Go、Python 和其他语言的 Koordinator 客户端库指南。
- **指标端点**：Koordinator 组件暴露的 Prometheus 指标的完整文档。
- **Webhook 端点**：用于扩展 Koordinator 功能的 webhook 端点的详细规范。

自定义资源定义文档示例：

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

开发者指南为贡献者提供全面资源，包括：
- **组件指南**：Koordinator 组件的架构和设计。
- **指标收集**：如何添加和暴露新指标。
- **可扩展性**：扩展点和插件开发模式。
- **插件开发**：开发自定义插件的分步指南。
- **自定义调度策略**：如何实现自定义调度策略。
- **Webhook 扩展**：开发用于验证和变更的 webhook 扩展。
- **自定义重调度插件**：构建自定义重调度插件。

这些资源显著降低了新贡献者的准入门槛，使开发者能够更轻松地扩展 Koordinator 的能力。

更多信息，请参见 [API 参考](https://koordinator.sh/zh-Hans/docs/api-reference/custom-resource-definitions)和[开发者指南](https://koordinator.sh/zh-Hans/docs/developer-guide/component-guide)。

### 5. 最佳实践：批量混部快速入门

为了帮助用户快速上手 Koordinator 的混部能力，v1.7.0 引入了新的最佳实践指南：**批量混部快速入门**。该指南提供分步说明：

- 在 Kubernetes 集群中部署 Koordinator。
- 为在线和批量工作负载配置混部配置文件。
- 通过批量资源超卖观察资源利用率改进。
- 监控和故障排除混部场景。

该指南补充了现有的 Spark 作业混部、Hadoop YARN 混部和细粒度 CPU 编排等最佳实践，为生产部署提供全面的资源库。

更多信息，请参见[批量混部快速入门](https://koordinator.sh/zh-Hans/docs/best-practices/batch-colocation-quick-start)。

## 贡献者

Koordinator 是一个开源社区。在 v1.7.0 中，有 14 位新开发者为 Koordinator 主仓库做出了贡献：

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

在下一个版本中，Koordinator 计划以下工作：


- **队列和配额管理**：将 Kube-Queue 与 Koordinator 集成，提供全面的队列调度支持 ([#2662](https://github.com/koordinator-sh/koordinator/issues/2662))
- **队列和配额管理**：在配额插件中支持 PreEnqueue 和 QueueHint ([#2581](https://github.com/koordinator-sh/koordinator/issues/2581))
- **队列和配额管理**：通过 PDB 感知增强配额资源回收 ([#2651](https://github.com/koordinator-sh/koordinator/issues/2651))
- **任务调度**：与上游开发者讨论如何支持协同调度，并寻找更优雅的方式解决以下问题
  - 解决 Gang Pod 的 PreEnqueue 拦截阻止 Pod 事件生成直到 Gang MinMember 要求满足的问题 ([#2480](https://github.com/koordinator-sh/koordinator/issues/2480))
  - 解决 GatedMetric 负值问题 ([kubernetes#133464](https://github.com/kubernetes/kubernetes/issues/133464))
- **异构调度策略**：考虑在重调度中进行 GPU 分配以实现集群资源整合 ([#2332](https://github.com/koordinator-sh/koordinator/issues/2332))
- **异构资源调度**：引入动态资源分配 (DRA) 框架支持
- **异构资源调度**：扩展对更多类型异构资源的支持
- **基础设施和兼容性**：升级到 Kubernetes 1.33
- **工具**：在预留中支持预分配 ([#2150](https://github.com/koordinator-sh/koordinator/issues/2150))
- **工具**：为调度队列中的 Pod 实现调度审计 ([#2552](https://github.com/koordinator-sh/koordinator/issues/2552))
- **工具**：提供 Pod 调度审计分析工具

我们鼓励用户反馈使用体验，欢迎更多开发者参与 Koordinator 项目，共同推动其发展！

## 致谢

自项目开源以来，Koordinator 已发布超过 15 个版本，有 110 多位贡献者参与其中。社区持续成长和改进。我们感谢所有社区成员的积极参与和宝贵反馈。我们也要感谢 CNCF 组织和相关社区成员对项目的支持。

欢迎更多开发者和终端用户[**加入我们**](https://github.com/koordinator-sh/koordinator?tab=readme-ov-file#community)!正是你们的参与和反馈使 Koordinator 不断改进。无论你是云原生社区的初学者还是专家，我们都期待听到你的声音！

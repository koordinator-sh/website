# 自定义调度策略

## 目录
- [自定义调度策略](#自定义调度策略)
  - [目录](#目录)
  - [简介](#简介)
  - [调度框架扩展点](#调度框架扩展点)
  - [关键调度策略实现](#关键调度策略实现)
    - [协同调度策略实现](#协同调度策略实现)
    - [设备共享策略实现](#设备共享策略实现)
    - [弹性配额策略实现](#弹性配额策略实现)
  - [策略集成与配置](#策略集成与配置)
  - [常见开发挑战与解决方案](#常见开发挑战与解决方案)
  - [总结](#总结)

## 简介
Koordinator 提供了一个可扩展的调度框架，用于开发满足特定工作负载需求的自定义策略。本文档详细介绍了现有插件实现（协同调度、设备共享、弹性配额）作为构建新策略的示例。该框架通过良好定义的接口扩展 Kubernetes 调度，实现与 Koordinator 无缝集成的复杂资源管理策略。

## 调度框架扩展点
Koordinator 的框架提供扩展点，使自定义插件能够在各个阶段参与调度。框架扩展器工厂管理插件注册,使插件能够通过 ExtendedHandle 接口访问 Koordinator 特定资源。

插件通过 PluginFactoryProxy 注册，它将 FrameworkExtender 作为句柄参数传递。关键扩展接口包括 SchedulingTransformer（修改调度状态）、ReservationRestorePlugin（管理保留资源）和 AllocatePlugin（细粒度资源分配）。框架还支持 ResizePodPlugin（在 assume 之前修改 pod 资源）和 PreBindExtensions（在绑定期间应用补丁）。

框架为每个 profile 维护一个插件注册表，允许为不同场景配置不同的插件集。当调度开始时，为特定 profile 创建框架扩展器，并在适当的扩展点初始化插件。

**章节来源**
- [framework_extender_factory.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/frameworkext/framework_extender_factory.go#L103-L390)
- [interface.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/frameworkext/interface.go#L37-L268)

## 关键调度策略实现

### 协同调度策略实现
协同调度策略确保相关的 Pod 作为一组一起调度，防止部分部署。通过 Pod 注解实现，定义 gang 成员、最小可用数量和调度模式（严格/非严格）。

利用 Permit 和 PreBind 扩展点协调 gang 成员调度。在 Permit 阶段，调度器检查是否有足够的资源满足最小所需 Pod 数量。如果资源不足，所有 gang 成员的调度将被延迟，直到资源可用或超时。支持网络拓扑感知以满足连接需求。

处理部分失败和动态成员变更。在严格模式下，Pod 失败将中止整个 gang 调度。非严格模式使用减少的 Pod 数量继续，平衡可靠性和资源效率。

**章节来源**
- [coscheduling.go](https://github.com/koordinator-sh/koordinator/tree/main/apis/extension/coscheduling.go#L0-L166)

### 设备共享策略实现
设备共享策略通过允许多个 Pod 共享这些资源来实现专用硬件（GPU、FPGA、RDMA）的高效利用。通过注解提供细粒度控制，指定分配策略、拓扑要求和独占策略。

组件：
- **PreFilter**：分析 Pod 请求并从注解提取设备需求
- **Filter**：根据可用设备和拓扑评估节点适用性
- **Reserve**：分配特定设备并更新节点缓存
- **PreBind**：将设备分配注入 Pod 注解供设备插件使用

支持多种设备类型的联合分配，确保相关设备（GPU 和内存）从同一物理单元分配以获得最佳性能。支持分层拓扑范围（设备、PCIe、NUMA、节点）的分配约束。

**设备共享插件类结构：**

核心类和关系：

- **DeviceSharePlugin** (设备共享插件)
  - 方法：`Name()`, `PreFilter()`, `Filter()`, `Reserve()`, `PreBind()`
  - 管理 DeviceAllocations
  - 使用 DeviceAllocateHints

- **DeviceAllocations** (设备分配集合)
  - 字段：`DeviceType[]`, `Resources ResourceList`, `ID string`
  - 包含 DeviceAllocation (单个设备分配)

- **DeviceAllocateHints** (设备分配提示)
  - 字段：`Selector LabelSelector`
  - `AllocateStrategy DeviceAllocateStrategy` (分配策略)
  - `RequiredTopologyScope DeviceTopologyScope` (拓扑范围)

**图表来源**
- [device_share.go](https://github.com/koordinator-sh/koordinator/tree/main/apis/extension/device_share.go#L0-L394)
- [plugin.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/plugins/deviceshare/plugin.go#L0-L727)

**章节来源**
- [device_share.go](https://github.com/koordinator-sh/koordinator/tree/main/apis/extension/device_share.go#L0-L394)
- [plugin.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/plugins/deviceshare/plugin.go#L0-L727)

### 弹性配额策略实现
弹性配额策略提供分层配额管理，跨团队和应用程序实现灵活的资源分配。与传统 Kubernetes 配额不同，支持同级配额之间的资源借用和基于使用模式的动态调整。

使用树状结构，父配额管理子配额的总限制。每个配额可指定最小保证资源和最大限制，能够将未使用的资源借给子树中的其他配额。跟踪已分配和实际使用情况，用于准确的准入控制和回收。

通过 PreFilter 和 Reserve 扩展点集成。PreFilter 检查资源是否在 Pod 的配额内可用，考虑保证和可借用资源。Reserve 更新配额使用统计并防止过度分配。包括配额生命周期管理和资源回收的控制器。

**弹性配额插件类结构：**

核心类和关系：

- **ElasticQuotaPlugin** (弹性配额插件)
  - 方法：`Name()`, `PreFilter()`, `PostFilter()`, `Reserve()`, `Unreserve()`
  - 使用 GroupQuotaManager
  - 访问 QuotaInfo

- **GroupQuotaManager** (组配额管理器)
  - 方法：`GetQuotaInfoByName()`, `ReservePod()`, `UnreservePod()`, `InitHookPlugins()`
  - 管理 QuotaInfo

- **QuotaInfo** (配额信息)
  - 字段：`Name string`
  - `Min ResourceList` (最小保证资源)
  - `Max ResourceList` (最大限制资源)
  - `Used ResourceList` (已使用资源)
  - `NonPreemptibleUsed ResourceList` (不可抢占资源)

**图表来源**
- [elastic_quota.go](https://github.com/koordinator-sh/koordinator/tree/main/apis/extension/elastic_quota.go#L0-L232)
- [plugin.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/plugins/elasticquota/plugin.go#L0-L377)

**章节来源**
- [elastic_quota.go](https://github.com/koordinator-sh/koordinator/tree/main/apis/extension/elastic_quota.go#L0-L232)
- [plugin.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/plugins/elasticquota/plugin.go#L0-L377)

## 策略集成与配置
集成自定义策略需要仔细配置和参数调优。策略通过调度器的组件配置进行配置，支持启用/禁用控制和特定参数。配置支持静态和动态重载，无需重启调度器。

关键参数包括资源评分策略、超时值和拓扑约束。设备共享配置 GPU 模板和拓扑对齐。弹性配额配置最小扩展和系统配额限制。根据集群特征和工作负载需求调整参数。

遵循既定的错误处理和日志记录模式。提供清晰的错误消息解释调度决策。使用框架工具进行诊断和指标以便故障排除。

**章节来源**
- [framework_extender_factory.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/frameworkext/framework_extender_factory.go#L103-L390)
- [interface.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/frameworkext/interface.go#L37-L268)

## 常见开发挑战与解决方案
开发自定义策略面临几个常见挑战：

1. **竞态条件**：并发调度期间，使用框架的状态管理和原子资源更新
2. **部分失败**：组件不可用时，实施重试机制和回退策略
3. **性能优化**：最小化关键路径中的昂贵操作并利用缓存
4. **向后兼容**：在功能门后引入新功能并维护废弃功能

利用框架机制并行化操作和优化资源过滤。确保全面测试，包括单元、集成和端到端测试以验证策略正确性和性能。

**章节来源**
- [framework_extender_factory.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/frameworkext/framework_extender_factory.go#L103-L390)
- [interface.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/frameworkext/interface.go#L37-L268)

## 总结
Koordinator 的可扩展调度框架为开发满足特定工作负载需求的自定义策略提供了坚实基础。通过理解现有策略实现（协同调度、设备共享、弹性配额），开发者可以创建与 Kubernetes 无缝集成的复杂资源管理解决方案。框架的良好定义扩展点、全面接口和模块化架构使策略能够提高资源利用率、改善性能并简化集群管理。

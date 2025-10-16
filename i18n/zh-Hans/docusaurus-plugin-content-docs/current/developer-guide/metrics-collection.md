# 指标收集

:::info 文档说明
This document is generated with assistance from Qoder AI.
:::

## 目录
1. [简介](#简介)
2. [Metrics Advisor 框架](#metrics-advisor-框架)
3. [Collector 接口与扩展点](#collector-接口与扩展点)
4. [现有 Collector 实现](#现有-collector-实现)
5. [自定义 Collector 开发](#自定义-collector-开发)
6. [Prometheus 集成](#prometheus-集成)
7. [配置与管理](#配置与管理)
8. [总结](#总结)

## 简介
Koordinator 的指标收集系统为节点/Pod 资源使用、性能特征和系统健康提供全面监控。Metrics advisor 框架从各种系统组件和专用设备收集、处理和导出指标。本文档详细介绍指标收集架构、扩展接口和 Prometheus 集成。该框架通过定期收集资源配置文件和检测容器干扰（CPU 调度延迟、内存分配延迟、PSI）实现资源优化。

**章节来源**
- [metrics_advisor.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/metricsadvisor/metrics_advisor.go#L1-L136)
- [metrics_advisor.md](https://github.com/koordinator-sh/koordinator/tree/main/docs/design-archive/koordlet-architecture.md#L45-L50)

## Metrics Advisor 框架
Metrics advisor 实现了基于插件的架构，用于从系统组件和专用设备收集和处理指标。框架通过集中式编排管理 collector 生命周期，使用共享状态机制在 collector 之间协调，实现派生指标计算（系统资源使用 = 节点使用 - Pod 使用 - 主机应用使用）。

设计易于扩展，可为额外指标或设备类型添加新 collector。与 statesinformer 集成以获取 Pod 元数据，与 metriccache 集成以存储指标。Advisor 在可配置间隔协调收集，同时管理 collector 依赖关系。

**指标顾问框架类结构：**

核心类和关系：

- **MetricAdvisor** (指标顾问)
  - 方法：`Run(stopCh <-chan struct{}) error`, `HasSynced() bool`
  - 使用 framework.Options
  - 管理 framework.Context

- **framework.Options** (框架选项)
  - 字段：`Config *Config`, `StatesInformer StatesInformer`, `MetricCache MetricCache`, `CgroupReader CgroupReader`, `PodFilters map[string]PodFilter`

- **framework.Context** (框架上下文)
  - 字段：`DeviceCollectors map[string]DeviceCollector`, `Collectors map[string]Collector`, `State *SharedState`
  - 包含 Collector 集合
  - 包含 SharedState

- **framework.Collector** (收集器接口)
  - 方法：`Enabled() bool`, `Setup(*Context)`, `Run(<-chan struct{})`, `Started() bool`

- **framework.SharedState** (共享状态)
  - 方法：`GetNodeUsage() (*CPUQuantity, *MemoryQuantity)`, `GetPodsUsageByCollector() (map[string]*CPUQuantity, map[string]*MemoryQuantity)`, `GetHostAppUsage() (*CPUQuantity, *MemoryQuantity)`

**图表来源**
- [metrics_advisor.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/metricsadvisor/metrics_advisor.go#L1-L136)
- [framework](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/metricsadvisor/framework)

**章节来源**
- [metrics_advisor.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/metricsadvisor/metrics_advisor.go#L1-L136)
- [pod_cpu_satisfaction_collector.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/metricsadvisor/collectors/podcpusatisfaction/pod_cpu_satisfaction_collector.go#L1-L295)

## Collector 接口与扩展点
Metrics advisor 框架提供良好定义的接口，用于从节点和 Pod 收集新指标。核心扩展机制是定义所有 collector 生命周期方法的 Collector 接口。该接口是 Pod 级和设备级指标收集的基础。

支持两种特殊类型：用于 Pod 特定指标的 PodCollector 和用于设备特定指标的 DeviceCollector。这些扩展基础 Collector 接口，添加了针对特定用例的方法。框架提供工厂函数（CollectorFactory 和 DeviceFactory）用于基于配置创建 collector。

**收集器接口和扩展点类结构：**

核心类和关系：

- **Collector** (基础收集器接口)
  - 方法：`Enabled() bool`, `Setup(s *Context)`, `Run(stopCh <-chan struct{})`, `Started() bool`
  - 注：所有指标收集器的基础接口，提供生命周期管理方法

- **PodCollector** (特化 Pod 指标收集器)
  - 继承： Collector
  - 额外方法：`PodFilter`, `GetPodMetric(uid, podParentDir string, cs []corev1.ContainerStatus) []metriccache.MetricSample`
  - 注：实现 PodFilter 接口

- **DeviceCollector** (特化设备指标收集器)
  - 继承： Collector
  - 额外方法：`Shutdown()`, `Infos() metriccache.Devices`, `GetNodeMetric() []metriccache.MetricSample`, `GetContainerMetric(containerID, podParentDir string, c *corev1.ContainerStatus) []metriccache.MetricSample`
  - 注：提供设备特定信息

- **CollectorFactory** (收集器工厂)
  - 方法：`Create(opt *Options) Collector`
  - 创建 Collector

- **DeviceFactory** (设备收集器工厂)
  - 方法：`Create(opt *Options) DeviceCollector`
  - 创建 DeviceCollector

**图表来源**
- [plugin.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/metricsadvisor/framework/plugin.go)

**章节来源**
- [plugin.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/metricsadvisor/framework/plugin.go)

## 现有 Collector 实现
Koordinator 包含演示框架监控系统资源能力的内置 collector。

### Node Resource Collector
从节点级别收集 CPU 和内存使用指标，收集累积的 CPU 时钟周期和内存使用信息以计算时间间隔内的使用率。与设备 collector 集成以收集专用硬件指标。使用共享状态更新节点资源使用信息，供其他 collector 访问。

### Performance Collector
监控容器和 Pod 的 CPU 性能指标（CPI）和压力失速信息（PSI）。启用 Libpfm4 功能时使用 perf 事件收集 CPI 指标，否则使用替代方法。PSI 收集监控容器和 Pod 的 CPU、内存和 I/O 压力，提供资源争用和瓶颈洞察。功能门控允许基于系统能力启用/禁用。

### System Resource Collector
通过计算系统级资源使用：系统使用 = 节点使用 - Pod 使用 - 主机应用使用。依赖其他 collector 提供必要的输入指标，演示框架对 collector 依赖关系的支持。在执行计算之前验证输入指标的新鲜度，确保派生指标基于最新信息。

**节点资源收集器交互流程：**

```
参与者：
- NodeResourceCollector (节点资源收集器)
- StatesInformer (状态通知器)
- MetricCache (指标缓存)
- DeviceCollector (设备收集器)
- SharedState (共享状态)

流程：

1. NodeResourceCollector → StatesInformer: GetAllPods()

2. NodeResourceCollector → MetricCache: Get(NodeCPUInfoKey)

3. NodeResourceCollector → DeviceCollector: GetNodeMetric()

4. NodeResourceCollector → MetricCache: Appender().Append()

5. NodeResourceCollector → MetricCache: Appender().Commit()

6. NodeResourceCollector → SharedState: UpdateNodeUsage()
```

**图表来源**
- [node_resource_collector.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/metricsadvisor/collectors/noderesource/node_resource_collector.go)
- [performance_collector_linux.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/metricsadvisor/collectors/performance/performance_collector_linux.go)
- [system_resource_collector.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/metricsadvisor/collectors/sysresource/system_resource_collector.go)

**章节来源**
- [node_resource_collector.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/metricsadvisor/collectors/noderesource/node_resource_collector.go)
- [performance_collector_linux.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/metricsadvisor/collectors/performance/performance_collector_linux.go)
- [system_resource_collector.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/metricsadvisor/collectors/sysresource/system_resource_collector.go)

## 自定义 Collector 开发
开发自定义 collector 需要实现 Collector 接口并向框架注册。遵循以下标准模式：

1. **实现生命周期方法**：Enabled、Setup、Run、Started
   - Enabled：根据配置/能力确定激活
   - Setup：使用共享资源初始化（context、states informer、metric cache）
   - Run：在可配置间隔的循环中执行主收集逻辑
   - Started：指示 collector 是否成功开始

2. **遵循依赖模式**：验证输入数据新鲜度并优雅处理错误

3. **使用共享状态**：与其他 collector 协调并共享中间结果

4. **考虑性能**：最小化资源消耗，使间隔可配置

自定义 collector 应通过适当的错误处理确保稳定性并避免过度开销。

**章节来源**
- [plugin.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/metricsadvisor/framework/plugin.go)
- [node_resource_collector.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/metricsadvisor/collectors/noderesource/node_resource_collector.go)

## Prometheus 集成
Koordinator 与 Prometheus 集成，通过标准端点暴露收集的指标。集成遵循 Kubernetes 最佳实践，组件通过 Prometheus 抓取的 HTTP 端点暴露指标。通过 `monitor.yaml` 管理配置，为 Prometheus operator 定义 ServiceMonitor 资源。

使用 Prometheus 客户端库注册指标，通过合并的内部和外部注册表暴露。这允许收集详细的调试指标和高级运维指标，并可基于环境控制。koordlet 通过专用 HTTP 服务器暴露指标：
- `/metrics`：合并指标
- `/internal/metrics`：内部调试指标
- `/external/metrics`：外部运维指标

**Prometheus 集成架构：**

```
Prometheus Server (监控服务器)
  ↓ (抽取)
ServiceMonitor (服务监控)
  ↓ (目标)
  ├── koordlet
  │   └── 暴露 /metrics
  ├── SLO Controller
  │   └── 暴露 /metrics
  └── Descheduler
      └── 暴露 /metrics

/metrics 端点
  └── 返回 Metric Data (指标数据)
```

**图表来源**
- [monitor.yaml](https://github.com/koordinator-sh/koordinator/tree/main/config/prometheus/monitor.yaml)
- [main.go](https://github.com/koordinator-sh/koordinator/tree/main/cmd/koordlet/main.go)

**章节来源**
- [monitor.yaml](https://github.com/koordinator-sh/koordinator/tree/main/config/prometheus/monitor.yaml)
- [metrics.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/metrics/metrics.go)

## 配置与管理
指标收集系统高度可配置，设置控制收集间隔、启用的 collector 和运维参数。通过 MetricsAdvisorConfig 结构管理。

关键参数：
- **CollectResUsedInterval**：资源使用指标收集间隔
- **CollectSysMetricOutdatedInterval**：系统指标数据有效期
- **CollectNodeCPUInfoInterval**：节点 CPU 信息收集间隔
- **CollectNodeStorageInfoInterval**：节点存储信息收集间隔
- **CPICollectorInterval/TimeWindow**：CPI 指标收集设置
- **PSICollectorInterval**：PSI 指标收集间隔
- **ColdPageCollectorInterval**：冷页收集间隔
- **EnablePageCacheCollector**：启用页缓存收集标志
- **EnableResctrlCollector**：启用 resctrl 收集标志

这些选项允许基于需求进行微调，平衡监控粒度与系统性能。功能门提供基于能力的额外 collector 启用控制。

**指标顾问配置类结构：**

配置参数：

- **MetricsAdvisorConfig** (指标顾问配置)
  - `CollectResUsedInterval` (duration): 资源使用采集间隔
  - `CollectSysMetricOutdatedInterval` (duration): 系统指标过期间隔
  - `CollectNodeCPUInfoInterval` (duration): 节点 CPU 信息采集间隔
  - `CollectNodeStorageInfoInterval` (duration): 节点存储信息采集间隔
  - `CPICollectorInterval` (duration): CPI 指标采集间隔
  - `PSICollectorInterval` (duration): PSI 指标采集间隔
  - `CPICollectorTimeWindow` (duration): CPI 收集器时间窗口
  - `ColdPageCollectorInterval` (duration): 冷页采集间隔
  - `ResctrlCollectorInterval` (duration): Resctrl 采集间隔
  - `EnablePageCacheCollector` (bool): 启用页缓存收集器
  - `EnableResctrlCollector` (bool): 启用 Resctrl 收集器

**图表来源**
- [pkg/koordlet/metricsadvisor/framework/config.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/metricsadvisor/framework/config.go#L1-L72)

**章节来源**
- [pkg/koordlet/metricsadvisor/framework/config.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/metricsadvisor/framework/config.go#L1-L72)

## 总结
Koordinator 的指标收集框架为监控节点/Pod 资源使用、性能特征和系统健康提供了强大且可扩展的系统。基于插件的架构通过内置 collector 实现全面监控，同时为自定义指标收集提供清晰的扩展点。Prometheus 集成确保收集的指标可供标准监控和告警系统访问，使运维人员能够深入了解集群性能和资源利用率。通过遵循现有 collector 的模式并利用框架的共享状态和依赖管理，开发者可以创建自定义 collector，为特定用例和硬件配置增强 Koordinator 的监控能力。

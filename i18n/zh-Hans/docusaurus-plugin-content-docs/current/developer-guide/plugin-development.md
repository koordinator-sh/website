# 插件开发

:::info 文档说明
This document is generated with assistance from Qoder AI.
:::

## 目录
1. [简介](#简介)
2. [调度器插件架构](#调度器插件架构)
3. [QoS Manager 插件架构](#qos-manager-插件架构)
4. [插件接口要求](#插件接口要求)
5. [插件注册机制](#插件注册机制)
6. [调度器插件实现示例](#调度器插件实现示例)
7. [QoS Manager 插件实现示例](#qos-manager-插件实现示例)
8. [开发工作流](#开发工作流)
9. [生命周期方法与回调机制](#生命周期方法与回调机制)
10. [常见陷阱与调试策略](#常见陷阱与调试策略)

## 简介

Koordinator 为扩展调度器和 koordlet 组件提供全面的插件系统。本文档详细介绍架构、接口要求和创建自定义插件的开发工作流。插件系统使开发者能够通过良好定义的扩展点扩展调度决策和 QoS 策略。

调度器插件架构通过 FrameworkExtender 模式扩展 Kubernetes 调度框架。QoS manager 插件系统提供基于功能门的注册，用于在节点级别实现自定义 QoS 策略。两个系统都遵循插件注册、生命周期管理和组件集成的一致模式。

## 调度器插件架构

Koordinator 的调度器插件通过 FrameworkExtender 接口扩展 Kubernetes 调度框架，增强基础框架以支持 Koordinator 能力。扩展器模式允许插件访问 Koordinator 资源，同时参与标准调度。

FrameworkExtender 关键能力：
- 访问 Koordinator 的自定义 clientset 以进行 CRD 交互
- 预留提名和恢复工作流
- 自定义错误处理过滤器
- Pod 遗忘处理器用于清理
- 调度转换器以修改 pod/节点信息

插件在初始化期间注册并在特定扩展点被调用。FrameworkExtender 管理插件生命周期并协调跨调度阶段的执行。

**章节来源**
- [interface.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/frameworkext/interface.go#L37-L55)

## QoS Manager 插件架构

QoS manager 通过基于功能门的注册提供插件系统，用于实现自定义 QoS 策略，允许动态插件启用/禁用。

组件：
- **ExtensionPlugin 接口**：QoS 插件契约（InitFlags、Setup、Run 方法）
- **RegisterQOSExtPlugin**：向系统注册插件
- **SetupPlugins**：使用依赖项初始化插件
- **StartPlugins**：基于功能门启动启用的插件

插件使用功能门注册以实现动态控制。QoS manager 编排插件生命周期，确保正确初始化和启动。

**章节来源**
- [extension.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/qosmanager/framework/extension.go)

## 插件接口要求

Koordinator 插件必须根据组件和功能实现特定接口。调度器插件和 QoS manager 插件的接口要求不同。

### 调度器插件接口

调度器插件实现扩展 Kubernetes 调度框架的接口，对应调度周期的不同阶段：

| 扩展点 | 接口 | 用途 |
|----------------|---------|--------|
| **PreEnqueue** | PreEnqueuePlugin | 调度开始前的早期验证 |
| **PreFilter** | PreFilterPlugin | 预处理 pod 并初始化周期状态 |
| **Filter** | FilterPlugin | 评估节点是否满足 pod 要求 |
| **Score** | ScorePlugin | 为 pod 放置对节点进行排名 |
| **Reserve** | ReservePlugin | 为 pod 预留资源 |
| **PreBind** | PreBindPlugin | 绑定前的最终检查 |
| **PostBind** | PostBindPlugin | 绑定后操作 |

此外，Koordinator 定义了用于预留处理的专用接口：
- **ReservationFilterPlugin**：确定哪些预留可用
- **ReservationScorePlugin**：为 pod 放置对预留进行排名
- **ReservationRestorePlugin**：恢复预留持有的资源
- **ReservationNominator**：为 pod 选择最合适的预留

### QoS Manager 插件接口

QoS manager 插件必须实现 ExtensionPlugin 接口，定义以下方法：
- **InitFlags**：初始化插件的命令行标志
- **Setup**：使用所需依赖项设置插件（clientset、metric cache、states informer）
- **Run**：启动插件的主执行循环

插件通过 RegisterQOSExtPlugin 函数注册，由 QOSManager 管理其生命周期。

**章节来源**
- [extension.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/qosmanager/framework/extension.go)
- [register.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/qosmanager/plugins/register.go)

## 插件注册机制

Koordinator 对调度器插件和 QoS manager 插件使用不同的注册机制。

### 调度器插件注册

调度器插件通过 koord-scheduler 组件的 main.go 文件注册。注册过程包括：

1. 定义插件名称到工厂函数的映射
2. 将插件映射展平为调度器命令的选项
3. 在调度器初始化期间注册插件

**调度器插件注册流程：**

```
1. 插件注册 (Plugin Registration)
   ↓
2. 定义插件映射 (Define Plugin Map)
   ↓
3. 展开为选项 (Flatten to Options)
   ↓
4. 向调度器注册 (Register with Scheduler)
   ↓
5. 启动时初始化 (Initialize During Startup)
   ↓
6. 插件就绪 (Plugins Ready)
```

**图表来源**
- [main.go](https://github.com/koordinator-sh/koordinator/tree/main/cmd/koord-scheduler/main.go#L43-L79)
- [server.go](https://github.com/koordinator-sh/koordinator/tree/main/cmd/koord-scheduler/app/server.go#L357-L391)

### QoS Manager 插件注册

QoS manager 插件通过基于功能门的系统注册，允许动态启用和禁用。注册过程包括：

1. 使用插件实现调用 RegisterQOSExtPlugin
2. 配置功能门以启用/禁用特定插件
3. 在 koordlet 启动期间初始化插件
4. 根据配置启动启用的插件

注册系统使用全局注册表存储插件实现，并通过 QOSManager 组件管理其生命周期。

**章节来源**
- [register.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/qosmanager/plugins/register.go)
- [extension.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/qosmanager/framework/extension.go)

## 调度器插件实现示例

在 Koordinator 中创建自定义调度器插件遵循标准模式，确保与现有调度基础设施兼容。

### 插件结构

典型的 Koordinator 调度器插件遵循此结构：

```go
type Plugin struct {
    handle framework.Handle
    // 插件特定字段
}

func New(args runtime.Object, handle framework.Handle) (framework.Plugin, error) {
    // 使用配置和 handle 初始化插件
}

func (p *Plugin) Name() string {
    return "PluginName"
}

// 实现调度周期接口
func (p *Plugin) PreFilter(...) {...}
func (p *Plugin) Filter(...) {...}
func (p *Plugin) Score(...) {...}
func (p *Plugin) Reserve(...) {...}
```

### 状态管理

插件使用周期状态在不同调度阶段之间维护数据。周期状态是线程安全的存储机制，允许插件共享信息。

最佳实践包括使用唯一键、实施适当的同步、在适当的阶段清理状态以及在必要时克隆状态以防止意外修改。

**章节来源**
- [load_aware.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/plugins/loadaware/load_aware.go#L71-L79)
- [elasticquota/plugin.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/plugins/elasticquota/plugin.go#L74-L93)

## QoS Manager 插件实现示例

创建自定义 QoS manager 插件需要实现 ExtensionPlugin 接口并向 QoS manager 系统注册插件。

QoS manager 插件必须实现 ExtensionPlugin 接口，包含以下方法：

```go
type ExtensionPlugin interface {
    InitFlags(fs *flag.FlagSet)
    Setup(client clientset.Interface, metricCache metriccache.MetricCache, statesInformer statesinformer.StatesInformer)
    Run(stopCh <-chan struct{})
}
```

每个方法在插件生命周期中都有特定目的：
- **InitFlags**：注册插件特定的命令行标志
- **Setup**：使用 koordlet 的依赖项初始化插件
- **Run**：在 goroutine 中执行插件的主逻辑

插件通过 RegisterQOSExtPlugin 函数注册，该函数将插件添加到全局注册表。插件通过 koordlet 配置中的功能门启用或禁用。

**章节来源**
- [extension.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/qosmanager/framework/extension.go)
- [register.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/qosmanager/plugins/register.go)

## 开发工作流

在 Koordinator 中创建自定义插件的完整开发工作流从创建到部署包含多个阶段。

### 插件创建

1. **定义插件结构**：创建保存插件状态和依赖项的结构
2. **实现所需接口**：为插件类型实现适当的接口
3. **创建工厂函数**：实现初始化插件的 New 函数
4. **注册插件**：将插件添加到适当的注册系统

### 测试

Koordinator 为调度器和 QoS manager 插件提供全面的测试工具：
- 单个插件方法的单元测试
- 完整调度周期的集成测试
- 完整工作流的端到端测试
- 性能评估的基准测试

### 部署

插件作为 koord-scheduler 或 koordlet 组件的一部分部署：
- 调度器插件包含在 koord-scheduler 二进制文件中
- QoS manager 插件包含在 koordlet 二进制文件中
- 通过组件配置文件管理配置
- 功能门控制插件启用

**章节来源**
- [main.go](https://github.com/koordinator-sh/koordinator/tree/main/cmd/koord-scheduler/main.go#L43-L79)
- [server.go](https://github.com/koordinator-sh/koordinator/tree/main/cmd/koord-scheduler/app/server.go#L419-L489)

## 生命周期方法与回调机制

Koordinator 插件具有良好定义的生命周期方法和回调机制，使它们能够参与系统操作的各个阶段。

### 调度器插件生命周期

调度器插件通过扩展点回调参与调度周期：
- **PreEnqueue**：在调度过程早期调用以进行验证
- **PreFilter**：调用以预处理 pod 信息并初始化状态
- **Filter**：调用以评估节点是否满足 pod 要求
- **Score**：调用以对适合的节点进行排名以放置 pod
- **Reserve**：调用以在选定节点上临时预留资源
- **PreBind**：调用以在绑定前进行最终验证
- **PostBind**：调用以进行绑定后操作和清理

### QoS Manager 插件生命周期

QoS manager 插件遵循不同的生命周期模式：
- **InitFlags**：在 koordlet 启动期间调用以注册命令行标志
- **Setup**：调用以使用依赖项初始化插件
- **Run**：调用以启动插件的主执行循环
- **Stop**：在关闭期间调用以清理资源

**章节来源**
- [interface.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/frameworkext/interface.go#L37-L55)
- [extension.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/koordlet/qosmanager/framework/extension.go)

## 常见陷阱与调试策略

为 Koordinator 开发插件需要注意常见陷阱和有效的调试策略，以确保可靠和高性能的操作。

### 常见开发陷阱

1. **状态管理问题**：不当的状态管理可能导致竞态条件和内存泄漏
2. **错误处理**：不充分的错误处理可能导致调度器中的静默失败
3. **资源泄漏**：未能清理资源可能导致内存耗尽
4. **线程安全**：在没有适当同步的情况下并发访问共享数据结构
5. **配置验证**：插件配置参数的验证不足

### 调试策略

1. **日志记录**：在开发期间为特定插件启用详细日志记录
2. **指标**：监控 Prometheus 指标以识别性能瓶颈
3. **诊断信息**：分析 PostFilter 中的失败原因以了解调度拒绝
4. **事件跟踪**：使用事件跟踪了解插件执行序列
5. **单元测试**：为所有插件方法编写全面的单元测试
6. **集成测试**：在模拟生产工作负载的集成环境中测试插件

最佳调试实践包括：
- 使用周期状态存储调试信息
- 在不同详细级别实施全面日志记录
- 监控插件特定指标以进行性能分析
- 使用框架的内置调试工具和实用程序
- 彻底测试边缘情况和失败场景

**章节来源**
- [plugin.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/plugins/reservation/plugin.go)
- [load_aware.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/plugins/loadaware/load_aware.go)
- [elasticquota/plugin.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/plugins/elasticquota/plugin.go)

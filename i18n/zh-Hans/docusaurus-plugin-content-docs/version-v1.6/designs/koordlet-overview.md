# Koordlet


## 摘要
Koordlet 是部署在 Kubernetes 节点中的 DaemonSet，用于混部资源超卖、干扰检测、QoS 保障等。它由几个模块组成，分别负责信息收集、数据分析和 QoS 管理。
一些模块还提供了框架脚手架，提供了一组插件进行扩展（如"QoS Manager"），以便于添加新策略。


## 架构
![image](/img/koordlet-arch.svg)

## 模块

### Metrics Advisor
Metric Advisor 提供节点、Pod 和容器的资源使用和性能特征的基本信息。
它是一个独立的模块，定期收集、处理和导出资源画像。它还检测运行容器的干扰，例如 CPU 调度、内存分配延迟和压力阻塞信息（Pressure Stall Information, PSI）。
该信息将广泛用于资源超卖和 QoS 保障插件。

### Storage
Storage 管理来自 Metrics Advisor 和 States Informer 的信息，提供一系列增删改查的API，并对过期数据定期清理。
它有两种类型的数据：静态和时间序列。时间序列类型存储历史数据用于统计目的，例如 CPU 和内存使用情况。静态类型包括节点、Pod 和容器的状态信息，例如节点的 CPU 信息、Pod 的元数据。

### States Informer
States Informer 从 kube-apiserver 和 kubelet 同步节点和 Pod 状态，并将数据作为 `static` 类型保存到 Storage 中。与其他模块相比，该模块在开发迭代中应该保持相对稳定。

### QoS Manager
QoS Manager 协调一组插件，这些插件负责按优先级保障 SLO，减少 Pod 之间的干扰。插件根据资源分析、干扰检测以及 SLO 策略配置，在不同场景下动态调整资源参数配置。通常来说，每个插件都会在资源调参过程中生成对应的执行计划。

QoS Manager 可能是迭代频率最高的模块，扩展了新的插件，更新了策略算法并添加了策略执行方式。
一个新的插件应该实现包含一系列标准API的接口，确保 QoS Manager 的核心部分简单且具有较好的可维护性。
高级插件（例如用于干扰检测的插件）会随着时间的推移变得更加复杂，在孵化已经稳定在 QoS Manager 中之后，它可能会成为一个独立的模块。

### Metrics Reporter
Metrics Reporter 从 Storage 中读取历史指标和状态数据，然后将它们合并并发送到 ApiServer，这些数据将被 Koordinator Manager 用于资源超卖模型管理。
Metrics Reporter 还支持针对不同混部场景的多种处理算法。

### Runtime Hooks
Runtime Hooks 充当运行时 Hook 管理器的后端服务器。 Runtime Hook 管理器是一个 CRI 代理，它拦截CRI请求，调用后端服务器注入策略，如通过 Pod 优先级设置资源隔离参数，应用资源分配策略。
Runtime Hooks 提供了一个框架来维护不同类型的策略，并在容器的生命周期中提供灵活的扩展点。

#### 例如 Pod 生命周期中的 LLC 隔离注入
![image](/img/llc-isolation.svg)

# 概述

本节描述了 Koordinator 部署到 Kubernetes 集群相关的架构、组件和核心概念。Koordinator 由两个控制面（[Koordinator Scheduler](#koordinator-scheduler)/[Koordinator Manager](#koordinator-manager)）和一个 DaemonSet 组件([Koordlet](#koordlet))组成。
Koordinator 在 Kubernetes 原有的能力基础上增加了混部功能，并兼容了 Kubernetes 原有的工作负载。

![架构](/img/architecture.png)

## Koordinator Scheduler

Koordinator Scheduler以 Deployment 的形式部署，用于增强 Kubernetes 在混部场景下的资源调度能力，包括:

- 更多的场景支持，包括弹性配额调度、资源超发(resource overcommitment)、资源预留(resource reservation)、Gang调度、异构资源调度。
- 更好的性能，包括动态索引优化、等价 class 调度、随机算法优化。
- 更安全的 descheduling，包括工作负载感知、确定性的 pod 迁移、细粒度的流量控制和变更审计支持。

## Koordinator Manager

Koordinator Manager 以 Deployment 的形式部署，通常由两个实例组成，一个 leader 实例和一个 backup 实例。Koordinator Manager 由几个控制器和 webhooks 组成，用于协调混部场景下的工作负载，资源超发(resource overcommitment)和 SLO 管理。

目前，提供了三个组件:

- Colocation Profile，用于支持混部而不需要修改工作负载。用户只需要在集群中做少量的配置，原来的工作负载就可以在混部模式下运行，了解更多关于[Colocation Profile](../user-manuals/colocation-profile.md)。
- SLO控制器，用于资源超发(resource overcommitment)管理，根据节点混部时的运行状态，动态调整集群的超发(overcommit)配置比例。该控制器的核心职责是管理混部时的 SLO，如智能识别出集群中的异常节点并降低其权重，动态调整混部时的水位和压力策略，从而保证集群中 pod 的稳定性和吞吐量。
- Recommender（即将推出），它使用 histograms 来统计和预测工作负载的资源使用细节，用来预估工作负载的峰值资源需求，从而支持更好地分散热点，提高混部的效率。此外，资源 profiling 还将用于简化用户资源规范化配置的复杂性，如支持 VPA。

## Koordlet

Koordlet 以 DaemonSet 的形式部署在 Kubernetes 集群中，用于支持混部场景下的资源超发(resource overcommitment)、干扰检测、QoS 保证等。

在Koordlet内部，它主要包括以下模块:

- 资源 Profiling，估算 Pod 资源的实际使用情况，回收已分配但未使用的资源，用于低优先级 Pod 的 overcommit。
- 资源隔离，为不同类型的 Pod 设置资源隔离参数，避免低优先级的 Pod 影响高优先级 Pod 的稳定性和性能。
- 干扰检测，对于运行中的 Pod，动态检测资源争夺，包括 CPU 调度、内存分配延迟、网络、磁盘 IO 延迟等。
- QoS管理器，根据资源剖析、干扰检测结果和 SLO 配置，动态调整混部节点的水位，抑制影响服务质量的 Pod。
- 资源调优，针对混部场景进行容器资源调优，优化容器的 CPU Throttle、OOM 等，提高服务运行质量。


## 下一步

以下是推荐下一步阅读的内容:

- 学习Koordinator的[资源模型](./resource-model)。
- 学习Koordinator的[Priority](./priority)。
- 学习Koordinator的[QoS](./qos)。

# 概述

本节描述了 Koordinator 部署到 Kubernetes 集群相关的架构、组件和核心概念。Koordinator 由两个控制面（[Koordinator Scheduler](#koordinator-scheduler)/[Koordinator Manager](#koordinator-manager)）和一个 DaemonSet 组件([Koordlet](#koordlet))组成。
Koordinator 在 Kubernetes 原有的能力基础上增加了混部功能，并兼容了 Kubernetes 原有的工作负载。

![架构](/img/architecture.png)

## Koord-Scheduler

Koord-Scheduler 以 Deployment 的形式部署在集群中，用于增强 Kubernetes 在 QoS-aware，差异化 SLO 以及任务调度场景的资源调度能力，具体包括:

- QoS-aware 调度，包括负载感知调度让节点间负载更佳平衡，资源超卖的方式支持运行更多的低优先级工作负载。
- 差异化 SLO，包括 CPU 精细化编排，为不同的工作负载提供不同的 QoS 隔离策略（cfs，LLC，memory 带宽，网络带宽，磁盘io）。
- 任务调度，包括弹性额度管理，Gang 调度，异构资源调度等，以支持更好的运行大数据和 AI 工作负载。

为了更好的支持不同类型的工作负载，Koord-scheduler 还包括了一些通用性的能力增强：

- Reservation，支持为特定的 Pod 或者工作负载预留节点资源。资源预留特性广泛应用于重调度，资源抢占以及节点碎片整理等相关优化过程。
- Node Reservation，支持为 kubernetes 之外的工作负载预留节点资源，一般应用于节点上运行着非容器化的负载场景。

## Koord-Descheduler

Koord-Decheduler 以 Deployment 的形式部署在集群中，它是 kubernetes 上游社区的增强版本，当前包含:

- 重调度框架, Koord-Decheduler 重新设计了全新重调度框架，在可扩展性、资源确定性以及安全性上增加了诸多的加强，更多的[细节](../designs/descheduler-framework).
- 负载感知重调度，基于新框架实现的一个负载感知重调度插件，支持用户配置节点的安全水位，以驱动重调度器持续优化集群编排，从而规避集群中出现局部节点热点.

## Koord-Manager

Koord-Manager 以 Deployment 的形式部署，通常由两个实例组成，一个 leader 实例和一个 backup 实例。Koordinator Manager 由几个控制器和 webhooks 组成，用于协调混部场景下的工作负载，资源超卖(resource overcommitment)和 SLO 管理。

目前，提供了三个组件:

- Colocation Profile，用于支持混部而不需要修改工作负载。用户只需要在集群中做少量的配置，原来的工作负载就可以在混部模式下运行，了解更多关于[Colocation Profile](../user-manuals/colocation-profile.md)。
- SLO 控制器，用于资源超卖(resource overcommitment)管理，根据节点混部时的运行状态，动态调整集群的超发(overcommit)配置比例。该控制器的核心职责是管理混部时的 SLO，如智能识别出集群中的异常节点并降低其权重，动态调整混部时的水位和压力策略，从而保证集群中 pod 的稳定性和吞吐量。
- Recommender（即将推出），它使用 histograms 来统计和预测工作负载的资源使用细节，用来预估工作负载的峰值资源需求，从而支持更好地分散热点，提高混部的效率。此外，资源 profiling 还将用于简化用户资源规范化配置的复杂性，如支持 VPA。

## Koordlet

Koordlet 以 DaemonSet 的形式部署在 Kubernetes 集群中，用于支持混部场景下的资源超卖(resource overcommitment)、干扰检测、QoS 保证等。

在Koordlet内部，它主要包括以下模块:

- 资源 Profiling，估算 Pod 资源的实际使用情况，回收已分配但未使用的资源，用于低优先级 Pod 的 overcommit。
- 资源隔离，为不同类型的 Pod 设置资源隔离参数，避免低优先级的 Pod 影响高优先级 Pod 的稳定性和性能。
- 干扰检测，对于运行中的 Pod，动态检测资源争夺，包括 CPU 调度、内存分配延迟、网络、磁盘 IO 延迟等。
- QoS 管理器，根据资源剖析、干扰检测结果和 SLO 配置，动态调整混部节点的水位，抑制影响服务质量的 Pod。
- 资源调优，针对混部场景进行容器资源调优，优化容器的 CPU Throttle、OOM 等，提高服务运行质量。

## Koord-RuntimeProxy

Koord-RuntimeProxy 以 systemd service 的形式部署在 Kubernetes 集群的节点上，用于代理 Kubelet 与 containerd/docker 之间的 CRI 请求。这一个代理被设计来支持精细化的资源管理策略，比如为不同 QoS Pod 设置不同的 cgroup 参数，包括内核 cfs quota，resctl 等等技术特性，以改进 Pod 的运行时质量。。

## 下一步

以下是推荐下一步阅读的内容:

- 学习 Koordinator 的[资源模型](./resource-model)。
- 学习 Koordinator 的[Priority](./priority)。
- 学习 Koordinator 的[QoS](./qos)。

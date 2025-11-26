---
title: 简介
slug: /
---

# 简介

欢迎来到 Koordinator！

## 概述

Koordinator 是一个基于 QoS 的 Kubernetes 混合工作负载调度系统。它旨在提高对延迟敏感的工作负载和批处理作业的运行时效率和可靠性，简化与资源相关的配置调整的复杂性，并增加 Pod 部署密度以提高资源利用率。


## 关键特性

Koordinator 通过提供以下功能增强了在 Kubernetes 中管理工作负载的用户体验：

- 精心设计的优先级和 QoS 机制，可将不同类型的工作负载混跑在集群中，并在单个节点上运行不同类型的 Pod 。
- 允许资源超卖以实现高资源利用率，但仍通过利用应用程序分析机制来满足 QoS 保证。
- 细粒度的资源协调和隔离机制，以提高延迟敏感的工作负载和批处理作业的效率。
- 灵活的作业调度机制，支持特定领域的工作负载，例如大数据、人工智能、音频和视频。
- 一整套用于监控、故障排除和操作的工具。


## Koordinator vs 其他概念

### Koordinator QoS vs Kubernetes QoS

Kubernetes 提供三种类型的 QoS： Guaranteed/Burstable/BestEffort，其中 Guaranteed/Burstable 被广泛使用 BestEffort 很少使用。Koordinator 与 Kubernetes QoS 兼容，并且对每种类型都有许多增强功能。为了避免干扰原生 QoS 语义，Koordinator 引入了一个独立的字段 `koordinator.sh/qosClass` 来描述混部 QoS。该 QoS 描述了在混部场景中节点上运行的 Pod 的服务质量。它是混合系统最关键的语义。

Koordinator 与 Kubernetes QoS 兼容，并且对每种类型都有许多增强功能。

### Koordinator scheduler vs kube-scheduler

Koordinator 调度器并非旨在取代 kube-scheduler，而是为了让混部的工作负载在 kubernetes 上运行得 **更好**。

Koordinator 调度器是基于 schedule-framework 开发的，在原生调度能力之上增加了与混部和优先级抢占相关的调度插件。Koordinator 将致力于推动相关的增强进入 Kubernetes 的上游社区，推动混部技术的标准化。


## 接下来

推荐后续步骤：

- 开始 [安装 Koordinator ](/docs/installation).
- 学习 Koordinator 的 [架构](/docs/architecture/overview).



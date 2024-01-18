---
slug: release-v1.0.0
title: "Koordinator v1.0: 正式发布"
authors: [joseph]
tags: [release]
---

Koordinator 今年3月份开源以来，先后发布了7个版本，逐步的把阿里巴巴&阿里云内部的混部系统的核心能力输出到开源社区，并在中间过程中逐渐的被 Kubernetes、大数据、高性能计算、机器学习领域或者社区的关注，Koordinator 社区也逐步获得了一些贡献者的支持，并有一些企业开始逐步的在生产环境中使用 Koordinator 解决实际生产中遇到的成本问题、混部问题等。 经过 Koordinator 社区的努力，我们怀着十分激动的心情向大家宣布 Koordinator 1.0 版本正式发布。

Koordinator 项目早期着重建设核心混部能力 -- 差异化 SLO，并且为了让用户更容易的使用 Koordinator 的混部能力，Koordinator 提供了 ClusterColocationProfile 机制帮助用户可以不用修改存量代码完成不同工作负载的混部，让用户逐步的熟悉混部技术。随后 Koordinaor 逐步在节点侧 QoS 保障机制上做了增强，提供了包括但不限于 CPU Suppress、CPU Burst、 Memory QoS、L3 Cache/MBA 资源隔离机制和基于满足度驱逐机制等多种能力，解决了大部分节点侧工作负载的稳定性问题。配合使用 Koordinator Runtime Proxy 组件，可以更好的兼容 Kubernetes kubelet 原生管理机制。

并且 Koordinator 在任务调度和 QoS 感知调度以及重调度等方面也都提供了一些创新方案，建设了全面兼容 Kubernetes CPU 管理机制的精细化 CPU 调度能力，面向节点实际负载的均衡调度能力。为了更好的让用户管理好资源， Koordinator 还提供了资源预留能力（Reservation)，并且 Koordinator 基于 Kubernetes 社区已有的Coscheduling、ElasticQuota Scheduling 能力做了进一步的增强，为任务调度领域注入了新的活力。Koordinator 提供了全新的重调度器框架，着重建设 Descheduler 的扩展性和安全性问题。

# 安装或升级 Koordinator v1.0.0

## 使用 Helm 安装

您可以通过 helm v3.5+ 非常方便的安装 Koordinator，Helm 是一个简单的命令行工具，您可以从 [这里](https://github.com/helm/helm/releases) 获取它。

```shell
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Install the latest version.
$ helm install koordinator koordinator-sh/koordinator --version 1.0.0
```

# 版本功能特性解读

Koordinator v1.0 整体新增的特性并不多，主要有以下一些变化

## 独立 API Repo

为了更方便集成和使用 Koordiantor 定义的 API，并避免因依赖 Koordiantor 引入额外的依赖或者依赖冲突问题，我们建立了独立的 API Repo: [koordinator-sh/apis](https://github.com/koordinator-sh/apis)

## 新增 ElasticQuota Webhook

在 Koordinator v0.7 版本中，我们基于 Kubernetes sig-scheduler 提供的 ElasticQuota 做了诸多增强，提供了树形管理机制，并提供了公平性保障机制等，可以很好的帮助您解决使用 ElasticQuota 遇到的问题。在 Koordinator v1.0 版本中，我们进一步提供了 ElasticQuota Webhook，帮助您在使用 ElasticQuota 树形管理机制时，保障新的 ElasticQuota 对象遵循 Koordinator 定义的规范或约束：

1. 除了根节点，其他所有子节点的 min 之和要小于父节点的 min。
2. 不限制子节点 max，允许子节点的 max 大于父节点的 max。考虑以下场景，集群中有 2 个 ElasticQuota 子树：dev-parent 和 production-parent，每个子树都有几个子 ElasticQuota。 当 production-parent 忙时，我们可以通过只降低 dev-parent 的 max 限制  dev-parent 整颗子树的资源使用量，而不是降低 dev-parent 子树的每个子 ElasticQuota 的max限制用量。
3. Pod 不能使用父节点ElasticQuota。如果放开这个限制，会导致整个弹性 Quota 的机制变的异常复杂，暂时不考虑支持这种场景。
4. 只有父节点可以挂子节点，不允许子节点挂子节点
5. 暂时不允许改变 ElasticQuota 的 `quota.scheduling.koordinator.sh/is-parent`属性

## 进一步完善 ElasticQuota Scheduling

在 Koordinator v0.7 版本中，koord-scheduler 的主副 Pod 都会启动 ElasticQuota Controller 并都会更新 ElasticQuota 对象。在 Koordinator v1.0 中我们修复了该问题，确保只有主 Pod 可以启动 Controller 并更新 ElasticQuota 对象。 还优化了 ElasticQuota Controller 潜在的频繁更新 ElasticQuota 对象的问题，当检查到 ElasticQuota 各维度数据发生变化时才会更新，降低频繁更新给 APIServer 带来的压力。

## 进一步完善 Device Share Scheduling

Koordinator v1.0 中 koordlet 会上报 GPU 的型号和驱动版本到 Device CRD 对象中，并会由 koord-manager 同步更新到 Node 对象，追加相应的标签。

```yaml
apiVersion: v1
kind: Node
metadata:
  labels:
    kubernetes.io/gpu-driver: 460.91.03
    kubernetes.io/gpu-model: Tesla-T4
    ...
  name: cn-hangzhou.10.0.4.164
spec:
  ...
status:
  ...
```

## Koordinator Runtime Proxy 增强兼容性

在 Koordinator 之前的版本中，koord-runtime-proxy 和 koordlet 一起安装后，如果 koordlet 异常或者 koordlet 卸载/重装等场景下，会遇到新调度到节点的 Pod 无法创建容器的问题。为了解决这个问题，koord-runtime-proxy 会感知 Pod 是否具有特殊的 label `runtimeproxy.koordinator.sh/skip-hookserver=true`，如果 Pod 存在该标签，koord-runtime-proxy 会直接把 CRI 请求转发给 containerd/docker 等 runtime。

## 其他改动

你可以通过 [Github release](https://github.com/koordinator-sh/koordinator/releases/tag/v1.0.0) 页面，来查看更多的改动以及它们的作者与提交记录。

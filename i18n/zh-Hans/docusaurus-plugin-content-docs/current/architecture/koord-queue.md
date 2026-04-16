# Koord-Queue

## 概述

Koord-Queue 是 Koordinator 生态系统的原生 Kubernetes 作业队列管理系统。它提供作业级别的队列管理能力，与 Koordinator 的 ElasticQuota 系统深度集成，实现资源公平性、通过预调度减少调度器压力，并支持 Priority/Block 排队策略。专为多租户 AI/ML 和批处理工作负载而设计。

![架构](/img/koord-queue-architecture.jpg)

## 架构

Koord-Queue 遵循微服务设计，以可扩展性为优先。整个系统由三个主要部分组成：

### Queue Controller

Queue Controller 以 `Deployment` 形式部署。它监听 Kubernetes APIServer 并管理 `QueueUnit` 资源的生命周期。主要职责包括：

- 监控 `QueueUnit` 状态转换（例如，当所有准入检查通过时从 `Reserved` 转为 `Dequeued`）。
- 处理准入检查结果并相应更新 `QueueUnit` 状态。
- 管理队列项目排序和位置跟踪。

### Queue Scheduler

Queue Scheduler 监控多个队列并决定哪个作业（由 `QueueUnit` 表示）应该被释放。调度过程使用基于插件的框架，内置以下插件：

- **Priority 插件**：在队列内按优先级（高优先）和创建时间（早创建优先）对 `QueueUnit` 排序。
- **ElasticQuota 插件**：使用 `ElasticQuotaTree` CRD (scheduling.sigs.k8s.io/v1beta1) 以单个树结构定义整个配额层级。它监听 `kube-system` 命名空间中的 `ElasticQuotaTree` 资源，构建内存配额树用于过滤/预留决策。通过 `queueGroupPlugin: elasticquota` 选择。
- **ElasticQuotaV2 插件**：与 Koordinator 的独立 `ElasticQuota` CRD (scheduling.sigs.k8s.io/v1alpha1) 集成，实现资源公平性、弹性分配和层级配额树支持。通过 `queueGroupPlugin: elasticquotav2` 选择（默认）。
- **ResourceQuota 插件**：与 Kubernetes 原生 `ResourceQuota` 集成，实现命名空间级别的资源限制。
- **DefaultGroup 插件**：为没有显式配额标签的 `QueueUnit` 分配默认配额组。

每个队列的调度周期如下：

1. **Filter** - 通过过滤插件检查是否有足够的可用资源。
2. **Reserve** - 通过预留插件预留资源并记录分配。
3. **Dequeue** - 将 `QueueUnit` 转换为出队状态并通知作业扩展。

### Extension Servers

Extension Servers（作业扩展）监控实际的作业 CR（如 TFJob、PyTorchJob、MPIJob、Spark、Argo Workflow 和原生 Kubernetes Job）并将它们与队列系统桥接。当创建新作业时：

1. Extension Server 在 APIServer 中创建对应的 `QueueUnit`。
2. 作业被暂停：Kubernetes Job 使用 `spec.suspend: true`，其他作业类型（TFJob、PyTorchJob 等）使用 `scheduling.x-k8s.io/suspend: "true"` 注解。
3. 当 `QueueUnit` 被出队时，Extension Server 移除暂停标志（设置 `spec.suspend: false` 或移除注解），允许作业运行。

## 核心概念

### Queue

`Queue` 是一个命名空间范围的 CRD，定义了具有特定排队策略的逻辑作业队列。**所有 Queue 资源必须创建在 `koord-queue` 命名空间下**，即 Koord-Queue 控制器所部署的命名空间。每个队列可以配置：

- **QueuePolicy**：`Priority`（基于优先级排序）或 `Block`（严格阻塞模式）。
- **Priority**：用于多队列调度的数值优先级（优先级更高的队列优先调度）。
- **AdmissionChecks**：`QueueUnit` 在出队前必须通过的准入检查列表。

### QueueUnit

`QueueUnit` 是一个命名空间范围的 CRD，表示等待被调度的作业。与 `Queue` 不同，`QueueUnit` 可以创建在任意命名空间中（通常与其包装的作业在同一命名空间）。它是对实际作业（TFJob、PyTorchJob 等）的包装，携带排队决策所需的信息：

- **ConsumerRef**：对原始作业 CR 的引用。
- **Priority**：该单元在其队列中的优先级。
- **Queue**：该单元所属队列的名称。
- **Resource/Request**：作业的总资源需求。
- **PodSets**：作业中同质 Pod 组的描述。

### QueueUnit 生命周期

`QueueUnit` 经历以下阶段：

```
Enqueued → Reserved → Dequeued → Running → Succeed/Failed
              ↓                ↓
        TimeoutBackoff    SchedReady → SchedSucceed/SchedFailed
     （准入检查失败或被拒绝）     （仅严格出队模式）
```

| 阶段 | 描述 |
|------|------|
| `Enqueued` | `QueueUnit` 已创建，在队列中等待。 |
| `Reserved` | 资源已暂时预留；准入检查正在进行中。 |
| `Dequeued` | 所有准入检查已通过；作业被释放运行。 |
| `Running` | 作业的 Pod 正在运行。 |
| `Succeed` | 作业成功完成。 |
| `Failed` | 作业失败。 |
| `SchedReady` | （严格出队模式）所有准入检查已通过，等待调度器确认。 |
| `SchedSucceed` | （严格出队模式）调度器已确认作业可调度。 |
| `SchedFailed` | （严格出队模式）调度器确认作业无法调度。 |
| `TimeoutBackoff` | 准入检查失败、被拒绝或超时；该单元将被重试。 |

## 插件框架

Koord-Queue 的调度决策由一个插件框架驱动，其设计理念类似于 Kubernetes Scheduler Framework。插件在插件注册表中注册，并在定义的阶段中执行：

| 插件阶段 | 描述 |
|---------|------|
| **MultiQueueSort** | 确定队列的处理顺序。 |
| **QueueSort** | 确定队列内 `QueueUnit` 的顺序。 |
| **QueueUnitMapping** | 将 `QueueUnit` 映射到目标队列/配额组。 |
| **Filter** | 检查 `QueueUnit` 是否有可用资源。 |
| **Reserve** | 预留资源并记录分配。 |

### ElasticQuota 集成

Koord-Queue 支持两种 ElasticQuota 插件模式，可通过 `queueGroupPlugin` Helm 值选择：

#### ElasticQuota 插件（树模式）

ElasticQuota 插件 (v1) 使用单个 `ElasticQuotaTree` CRD 定义整个配额层级。树是嵌套结构，每个节点指定其名称、命名空间、min/max 资源和子节点：

```yaml
apiVersion: scheduling.sigs.k8s.io/v1beta1
kind: ElasticQuotaTree
metadata:
  name: default
  namespace: kube-system
spec:
  root:
    name: root
    min:
      cpu: "100"
      memory: 200Gi
    max:
      cpu: "100"
      memory: 200Gi
    children:
      - name: team-a
        namespaces: ["team-a"]
        min:
          cpu: "40"
          memory: 80Gi
        max:
          cpu: "60"
          memory: 120Gi
      - name: team-b
        namespaces: ["team-b"]
        min:
          cpu: "60"
          memory: 120Gi
        max:
          cpu: "80"
          memory: 160Gi
```

主要特性：

- `ElasticQuotaTree` 必须创建在 `kube-system` 命名空间中。
- 每个配额节点通过 `namespaces` 字段映射到一个或多个命名空间。这些命名空间中的 `QueueUnit` 自动关联到对应的配额。
- `QueueUnit` 也可以通过 `quota.scheduling.koordinator.sh/name` 标签关联到配额。
- 支持**饥饿配额检查**（`checkQuotaOversold`）：阻止超卖配额组在其他组仍低于其 min 时借用资源。
- 支持**可抢占/不可抢占作业**：可抢占作业（标记 `quota.scheduling.koordinator.sh/preemptible: "true"`）按 max 配额检查；不可抢占作业按 min 配额检查，并可以抢占低优先级的可抢占作业。
- 支持**借用限制**，通过 `alibabacloud.com/lendlimit` 属性控制多少 min 配额可以借给其他组。当配额组的实际用量低于 `min - lendlimit` 时，剩余资源可被其他组借用，从而确保每个组保留一个最低保证量。属性值为 JSON 对象格式指定资源限制，例如：`alibabacloud.com/lendlimit: '{"cpu":"2","memory":"4Gi"}'`。对于一个 `min: {cpu: "4", memory: "8Gi"}` 且 `lendlimit: {cpu: "2", memory: "4Gi"}` 的配额组，该组至少保留 `cpu: 2, memory: 4Gi`，最多可借出 `cpu: 2, memory: 4Gi`。
- 可以为每个配额组自动创建和管理 `Queue` 资源（默认通过 `ElasticQuotaTreeBuildQueueForQuota` 特性门控启用）。
- 特性门控：`ElasticQuota`（默认：true）、`ElasticQuotaTreeDecoupledQueue`（默认：true）、`ElasticQuotaTreeBuildQueueForQuota`（默认：true）、`ElasticQuotaTreeCheckAvailableQuota`（默认：false，alpha）。

#### ElasticQuotaV2 插件（独立 CR 模式）

ElasticQuotaV2 插件与 Koordinator 的独立 `ElasticQuota` CRD (scheduling.sigs.k8s.io/v1alpha1) 集成，每个配额组是一个单独的资源。这是默认模式（`queueGroupPlugin: elasticquotav2`）。

`QueueUnit` 通过标签（例如 `quota.scheduling.koordinator.sh/name`）关联到 ElasticQuota 组。在调度过程中，插件会在允许 `QueueUnit` 出队之前检查配额组是否有足够的可用资源（考虑 min/max 和借用资源）。

独立 ElasticQuota CR 示例：

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: team-a
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/parent: koordinator-root-quota
spec:
  min:
    cpu: "40"
    memory: 80Gi
  max:
    cpu: "60"
    memory: 120Gi
```

主要特性：

- 每个 ElasticQuota 是独立的 CR，通常创建在用户的命名空间中。
- 插件会为每个 ElasticQuota 自动在 `koord-queue` 命名空间创建对应的 `Queue` 资源。
- 父子关系通过 `quota.scheduling.koordinator.sh/parent` 标签建立。无此标签时，默认父配额为 `koordinator-root-quota`。
- 支持弹性借用：min 内的请求始终允许；超过 min 但在 max 内的请求可以借用其他组的空闲资源。

有关 ElasticQuota CRD 的详细使用方法，请参阅[弹性配额管理](../user-manuals/capacity-scheduling.md)。

### 准入检查 *(开发中)*

> **注意**：准入检查控制器尚未包含在本版本中，此部分描述的是未来计划中的 API。

Koord-Queue 支持准入检查框架（兼容 Kueue 的 `AdmissionCheck` API）。队列可以定义一个准入检查列表，所有检查必须通过后 `QueueUnit` 才能从 `Reserved` 转换为 `Dequeued`。每个准入检查具有以下状态之一：

| 状态 | 描述 |
|------|------|
| `Pending` | 检查仍在进行中。 |
| `Ready` | 检查已成功通过。 |
| `Retry` | 检查需要重试。 |
| `Rejected` | 检查被拒绝。 |

## 部署架构

Koord-Queue 通过 Helm charts 部署，包含以下组件：

| 组件 | 类型 | 描述 |
|------|------|------|
| `koord-queue-controller` | Deployment | 主控制器和调度器。`admissioncheck-controller` 作为 sidecar 容器运行在此 Deployment 中。 |
| `job-extensions` | Deployment | 独立的 Deployment，处理作业框架集成（TFJob、PyTorchJob 等）。 |

## 下一步

- [Koord-Queue 用户指南](../user-manuals/koord-queue.md)：了解如何安装和使用 Koord-Queue 进行作业队列管理。
- [弹性配额管理](../user-manuals/capacity-scheduling.md)：了解 Koordinator 的 ElasticQuota 管理。

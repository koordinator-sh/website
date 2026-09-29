# Koord-Queue

## 概述

Koord-Queue 是 Koordinator 生态系统的原生 Kubernetes 作业队列管理系统。它提供作业级别的队列管理能力，与 Koordinator 的 ElasticQuota 系统深度集成，实现资源公平性、通过预调度减少调度器压力，并支持 Priority、Block 与 Intelligent 排队策略。专为多租户 AI/ML 和批处理工作负载而设计。

![架构](/img/koord-queue-architecture.png)

## 架构

整个系统由三个主要部分组成：

### Queue Controller

Queue Controller 以 `Deployment` 形式部署。它监听 Kubernetes APIServer 并管理 `QueueUnit` 资源的生命周期。主要职责包括：

- 监控 `QueueUnit` 状态转换（例如，当所有准入检查通过时从 `Reserved` 转为 `Dequeued`）。
- 处理准入检查结果并相应更新 `QueueUnit` 状态。
- 管理队列项目排序和位置跟踪。

### Queue Scheduler

Queue Scheduler 监控多个队列并决定哪个作业（由 `QueueUnit` 表示）应该被释放。调度过程使用基于插件的框架，内置以下插件：

- **Priority 插件**：实现两个排序扩展点。队列之间按 `Queue.spec.priority` 排序（高者优先）；队列内部按优先级（高者优先）与首次调度尝试时间（早者优先）对 `QueueUnit` 排序。
- **ElasticQuotaV2 插件**：默认的分组插件。与 Koordinator 的独立 `ElasticQuota` CRD（`scheduling.sigs.k8s.io/v1alpha1`）集成，实现资源公平性与弹性分配；根据 `QueueUnit` 的标签解析其所属配额，并为每份配额维护一个 `Queue`。
- **ResourceQuota 插件**：可选的分组插件，以命名空间的 `ResourceQuota` 而非 `ElasticQuota` 作为准入依据，适用于未部署 Koordinator 的场景。

`KoordQueueConfiguration` 的 `plugins` 列表中启用一个分组插件，并与 `Priority` 插件配合使用。

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

- **QueuePolicy**：`Priority`（基于优先级排序）、`Block`（严格阻塞模式，并按配额维护阻塞记账）或 `Intelligent`（以优先级阈值划分的双子队列）。API 与插件代码中还存在常量 `FIFO` 与 `Round`，但它们未在队列工厂中注册，因此无法被选用。
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

### 准入检查

Koord-Queue 实现了准入检查框架的队列侧能力，该框架兼容 Kueue 的 `AdmissionCheck` API。队列可以定义一组准入检查，全部通过后 `QueueUnit` 才能从 `Reserved` 转换为 `Dequeued`。每项检查具有以下状态之一：

| 状态 | 描述 |
|------|------|
| `Pending` | 检查仍在进行中。 |
| `Ready` | 检查已成功通过。 |
| `Retry` | 检查需要重试。 |
| `Rejected` | 检查被拒绝。 |

属于 Koord-Queue 的部分：`QueueUnit` API、将队列所要求的检查复制到 `status.admissionChecks` 的状态机、由 `Retry`、`Rejected` 与超时触发的状态转换、CRD `admissionchecks.kueue.x-k8s.io` 与 `provisioningrequestconfigs.kueue.x-k8s.io`，以及读写它们所需的 RBAC。不属于 Koord-Queue 的部分：决定检查结果的控制器（例如 ProvisioningRequest 控制器），它需要单独部署，是 `status.admissionChecks` 的写入方。当某项检查报告 `Retry` 或 `Rejected`、或检查超时时，`QueueUnit` 会进入 `TimeoutBackoff`，其预留被释放并重新入队。


## 特性开关

特性开关通过 `koord-queue` 二进制的 `--feature-gates` 参数指定。`koord-queue-controllers` 二进制未提供该参数，因此在作业扩展内求值的开关始终保持默认值。

| 特性开关 | 默认值 | 阶段 | 用途 |
|----------|--------|------|------|
| `ElasticQuota` | 开启 | Beta | 解析 `QueueUnit` 所属配额时采用显式配额标签。 |
| `ElasticQuotaTreeDecoupledQueue` | 开启 | Beta | 未显式指定队列时，将 `QueueUnit` 路由到为其配额创建的队列。 |
| `ElasticQuotaTreeBuildQueueForQuota` | 开启 | Beta | 为每份配额构建一个队列。 |
| `ElasticQuotaTreeCheckAvailableQuota` | 关闭 | Alpha | 额外要求所指配额在作业所在命名空间中可用。 |
| `QueueUnitConditions` | 开启 | Beta | 将 `status.phase` 映射为 `status.conditions`。 |
| `QueueUnitActive` | 关闭 | Alpha | 准入时遵循 `spec.active`。 |
| `QueueUnitRequeueState` | 关闭 | Alpha | 在 `status.requeueState` 中记录结构化退避。 |
| `MaximumExecutionTime` | 关闭 | Alpha | 停用执行时长超过 `spec.maximumExecutionTimeSeconds` 的 `QueueUnit`；在作业扩展中求值。 |

## 支持的作业类型

Koord-Queue 通过作业扩展架构支持多种作业框架。每个扩展以一个名称注册，仅当该名称出现在 `koord-queue-controllers` 的 `--enabled-extensions` 参数中时才会启动，并由一个 Helm 取值控制：

| 作业类型 | 扩展名 | Helm Value | 描述 |
|----------|--------|-----------|-------------|
| Kubernetes Job | `job` | `extension.batchjob.enable` | Kubernetes 原生 `batch/v1` Job；Pod 数量由 `spec.parallelism` 与 `spec.completions` 推导 |
| TFJob | `tfjob` | `extension.tf.enable` | TensorFlow 训练作业，`kubeflow.org/v1` |
| PyTorchJob | `pytorchjob` | `extension.pytorch.enable` | PyTorch 训练作业，`kubeflow.org/v1` |
| Argo Workflow | `workflow` | `extension.argo.enable` | Argo Workflow，通过 `koord-queue-suspend` 模板挂起 |
| SparkApplication | `sparkapp` | `extension.spark.enable` | Spark 应用，`sparkoperator.k8s.io/v1beta2`，通过注解 `scheduling.x-k8s.io/suspend` 挂起 |
| RayJob | `rayjob`、`rayjobv1alpha1` | `extension.ray.enable` | Ray 作业，`ray.io/v1` 与 `ray.io/v1alpha1`；Chart 仅启用 `rayjob` |
| RayCluster | `raycluster` | 仅有 RBAC，未启用 | Ray 集群；代码中已注册且 Chart 授予了 RBAC，但不会将其加入 `--enabled-extensions` |
| MPIJob | 无 | `extension.mpi.enable` | 该取值存在，但未注册 MPI 扩展，也没有模板读取它；Chart 仅为 `mpijobs` 授予了 RBAC |

## 部署架构

Koord-Queue 通过 Helm charts 部署，包含以下组件：

| 组件 | 类型 | 描述 |
|------|------|------|
| `koord-queue` | Deployment | 队列控制器与调度器，仅包含一个名为 `controller` 的容器。它在 `10259` 端口提供 Prometheus 指标，在 `8082` 端口提供可选的 Visibility API，在 `19876` 端口提供可选的调试 API。驱动准入检查状态机、Condition 与退避的 `QueueUnit` 控制器运行在该进程内部，不存在 sidecar 容器。 |
| `koord-queue-controllers` | Deployment | 独立的 Deployment，处理作业框架集成（TFJob、PyTorchJob 等）。 |

## 下一步

- [Koord-Queue 用户指南](../user-manuals/queue-management.md)：了解如何安装和使用 Koord-Queue 进行作业队列管理。
- [ElasticQuota 与 Queue 的映射关系](../user-manuals/queue-quota-mapping.md)：作业如何关联到配额与队列。
- [排队策略与调优](../user-manuals/queue-policies-and-tuning.md)：策略行为与调优注解。
- [队列级抢占](../user-manuals/queue-preemption.md)：从低优先级作业回收配额。
- [工作负载生命周期控制](../user-manuals/queue-workload-lifecycle.md)：激活、执行时长预算、Condition 与退避。
- [Koord-Queue 可观测性](../user-manuals/queue-observability.md)：指标、大盘、Visibility API 与事件。
- [弹性配额管理](../user-manuals/capacity-scheduling.md)：了解 Koordinator 的 ElasticQuota 管理。

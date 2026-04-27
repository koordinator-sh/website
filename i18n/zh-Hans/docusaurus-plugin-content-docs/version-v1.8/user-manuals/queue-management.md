# Koord-Queue

## 介绍

Koord-Queue 是 Koordinator 生态系统的原生 Kubernetes 作业队列管理系统。它管理多个队列间的作业准入和排序，与 Koordinator 的 ElasticQuota 深度集成，实现资源公平性和多租户隔离。主要功能包括：

- **多队列管理**，支持 Priority、Block 和 Intelligent 排队策略。
- **深度 ElasticQuota 集成**，避免重复配额配置，实现弹性资源共享。
- **预调度**，通过在作业创建 Pod 之前排队来减少调度器压力。
- **多框架支持**，包括 TFJob、PyTorchJob、Spark、Argo Workflow、Ray 和原生 Kubernetes Job。
- **准入检查框架**，兼容 Kueue 的 AdmissionCheck API。

## 配置

### 前置要求

- Kubernetes >= 1.22
- Koordinator >= 1.5（用于 ElasticQuota 集成）

### 安装

使用 Helm 安装 Koord-Queue：

```bash
# 方式一：从 Helm 仓库安装
helm repo add koordinator-sh https://koordinator-sh.github.io/charts/
helm install koord-queue koordinator-sh/koord-queue --version 1.8.0 \
  --namespace koord-queue \
  --create-namespace


```

验证安装：

```bash
$ kubectl get deployment -n koord-queue
NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
koord-queue-controllers    1/1     1            1           30s
koord-queue                1/1     1            1           30s

$ kubectl get crd | grep scheduling.x-k8s.io
queues.scheduling.x-k8s.io          2024-01-01T00:00:00Z
queueunits.scheduling.x-k8s.io      2024-01-01T00:00:00Z
```

### 配置项

Koord-Queue 默认使用 ElasticQuotaV2 模式。

#### 默认配置

```yaml
# 镜像仓库（默认：阿里云北京）
global:
  imagePrefix: registry.cn-beijing.aliyuncs.com

controller:
  image:
    repository: koordinator-sh/koord-queue
    tag: v1.8.0

extension:
  koord-queue-controllers:
    repository: koordinator-sh/koord-queue-controllers
    tag: v1.8.0
  batchjob:
    enable: true    # 原生 Kubernetes Job 支持
  tf:
    enable: false
  pytorch:
    enable: false
  argo:
    enable: false
  spark:
    enable: false
  ray:
    enable: false
  mpi:
    enable: false

pluginConfigs:
  apiVersion: scheduling.k8s.io/v1
  kind: KoordQueueConfiguration
  plugins:
    - name: Priority
    - name: ElasticQuotaV2
```

#### ElasticQuotaV2 模式（默认）

使用独立的 `ElasticQuota` CR（`scheduling.sigs.k8s.io/v1alpha1`）。这是 Koordinator 用户的推荐模式。

## 使用 Koord-Queue

### 使用 ElasticQuota 快速开始

此示例使用 Koordinator 的 ElasticQuota 进行弹性资源管理。

#### 创建 ElasticQuota

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: team-a
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/parent: ""
    quota.scheduling.koordinator.sh/is-parent: "false"
spec:
  max:
    cpu: "4"
    memory: 8Gi
  min:
    cpu: "4"
    memory: 8Gi
```

```bash
$ kubectl apply -f elastic-quota.yaml
```

##### Queue 自动创建

使用 ElasticQuotaV2 时，插件会为每个 ElasticQuota 资源**自动创建 `Queue` CR**，位于 `koord-queue` 命名空间中。自动创建的 Queue 与 ElasticQuota 同名（例如 `team-a`），默认 `priority: 1000`、`queuePolicy: Priority`。**无需**为每个 ElasticQuota 手动创建 Queue。

如需自定义 Queue 策略，可在 ElasticQuota 上设置 `koord-queue/queue-policy` 标签：

```yaml
metadata:
  labels:
    koord-queue/queue-policy: Priority  # 选项：Priority、Block、Intelligent
```

##### 提交作业并验证排队行为

Koord-Queue 的 Job Extensions 会自动为提交的作业创建 `QueueUnit` 资源。要提交一个由 Koord-Queue 管理的 Kubernetes Job，需设置 `spec.suspend: true` 并添加配额标签。将以下双文档 YAML 保存为 `jobs.yaml` 并一次性提交：

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: my-job
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/name: team-a
spec:
  suspend: true
  template:
    spec:
      containers:
      - name: test
        image: busybox:stable
        command: ["/bin/sh", "-c", "sleep 30"]
        resources:
          requests:
            cpu: "4"
            memory: 8Gi
          limits:
            cpu: "4"
            memory: 8Gi
      restartPolicy: Never
---
apiVersion: batch/v1
kind: Job
metadata:
  name: my-job-blocked
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/name: team-a
spec:
  suspend: true
  template:
    spec:
      containers:
      - name: test
        image: busybox:stable
        command: ["/bin/sh", "-c", "sleep 30"]
        resources:
          requests:
            cpu: "4"
            memory: 8Gi
          limits:
            cpu: "4"
            memory: 8Gi
      restartPolicy: Never
```

```bash
$ kubectl apply -f jobs.yaml
```

`team-a` 配额的 `max.cpu` 为 `"4"`、`max.memory` 为 `"8Gi"`，正好供一个作业使用。ElasticQuotaV2 插件**基于 Pod 实际运行时的资源消耗**来统计配额用量。当 `my-job` 的 Pod 进入 Running 状态并占满配额后，`my-job-blocked` 将被阻塞在队列中：

```bash
# 先等待 my-job 的 Pod 进入 Running 状态
$ kubectl wait --for=condition=Ready pod -l job-name=my-job -n default --timeout=120s

$ kubectl get queueunit my-job-blocked -n default
NAME             PHASE   PRIORITY   ADMISSIONS   JOBTYPE
my-job-blocked                                   Job
```

`QueueUnit` 保持 `Enqueued` 状态，因为 `team-a` 已达到 `max` 配额上限。当 `my-job` 完成并释放资源后，`my-job-blocked` 将自动出队执行。

对于其他作业类型（TFJob、PyTorchJob 等），请使用 `scheduling.x-k8s.io/suspend: "true"` 注解代替 `spec.suspend`。

## 使用 Queue

### Queue Spec

| 字段 | 类型 | 描述 |
|------|------|------|
| `queuePolicy` | `string` | 排队策略：`Priority`、`Block` 或 `Intelligent`。 |
| `priority` | `*int32` | 用于多队列排序的队列优先级。 |
| `priorityClassName` | `string` | Kubernetes PriorityClass 名称。 |
| `admissionChecks` | `[]AdmissionCheckWithSelector` | 所需的准入检查列表。 |

### Queue 优先级

默认情况下，Koord-Queue 的 Job Extensions 会自动从作业的 Pod 模板中派生 `QueueUnit` 的优先级：它读取 `spec.template.spec.priorityClassName` 和 `spec.template.spec.priority`。如果找到 `PriorityClass` 对象，则使用其 `.value` 作为 `QueueUnit` 的优先级；否则使用 `spec.template.spec.priority` 中的原始整数值。

你也可以在 `QueueUnit` 创建后手动修改其 `spec.priority` 来覆盖默认值，从而影响出队顺序。

#### Priority Queue

优先级值更高的作业优先出队。优先级相同的作业中，较早创建的作业优先出队：

设置 `QueueUnit` 的优先级：

```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: QueueUnit
metadata:
  name: high-priority-job
  namespace: default
spec:
  queue: priority-queue
  priority: 200
  consumerRef:
    apiVersion: batch/v1
    kind: Job
    name: important-job
    namespace: default
  resource:
    cpu: "2"
    memory: 4Gi
```

### 队列策略

Koord-Queue 支持三种队列策略来控制作业的出队和调度。

#### Priority 策略（优先级策略）

**排序规则**：队列单元按优先级值（降序）排序，然后按创建时间戳（升序）排序。优先级高的作业总是优先出队。相同优先级的作业按 FIFO 顺序处理。

**行为特点**：
- 优先级值更高的作业优先出队
- 相同优先级时，较早创建的作业先调度
- 失败的作业会被重新加入队列并重试
- **支持抢占**：低优先级作业可以被抢占，为高优先级作业腾出空间

**调度行为**：
Priority 策略**不是严格的优先级调度**。当高优先级作业被阻塞（如配额耗尽）时，调度器会跳过它们继续扫描。可调度的低优先级作业可以在被阻塞的高优先级作业之前出队。这提高了吞吐量并防止调度器停滞。

**与 Block 策略的关键区别**：
- **Priority**：乐观调度 - 配额接近限制时仍继续调度，阻塞的作业会被跳过
- **Block**：保守调度 - 配额达到限制时严格阻塞作业

**适用场景**：
- 多租户环境，不同优先级级别
- 生产作业应该抢占开发作业

**配置示例**：
```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: priority-queue
  labels:
    koord-queue/queue-policy: Priority
spec:
  max:
    cpu: "10"
    memory: 20Gi
```

#### Block 策略（阻塞策略）

**排序规则**：与 Priority 策略相同 - 按优先级（降序）然后时间戳（升序）排序。

**行为特点**：
- **严格资源阻塞**：当配额达到限制时，使用该配额的后续作业会被阻塞
- 与 Priority 策略（会跳过阻塞的高优先级作业，让后面的可调度作业先出队）不同，Block 策略严格执行优先级顺序
- 防止资源过度分配
- 被阻塞的队列单元在调度时会被跳过，直到资源可用

**关键区别**：
- Priority 策略：不是严格的优先级调度 - 允许低优先级作业在被阻塞的高优先级作业之前出队
- Block 策略：严格的优先级调度 - 被阻塞的高优先级作业必须等待，防止低优先级作业绕过它们

**适用场景**：
- 资源受限的环境
- 需要保证资源可用性的生产工作负载
- 需要严格执行资源限制的多租户隔离场景

**配置示例**：
```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: block-queue
  labels:
    koord-queue/queue-policy: Block
spec:
  max:
    cpu: "10"
    memory: 20Gi
```

#### Intelligent 策略（智能策略）

**排序规则**：使用 **双队列机制**，配置优先级阈值（默认：4）：

- **高优先级队列**：优先级 >= 阈值的作业
  - 按优先级（降序）然后时间戳（升序）排序
  - **重试行为**：失败时，重试同一作业（FIFO 模式）
  
- **低优先级队列**：优先级 < 阈值的作业
  - 按优先级（降序）然后时间戳（升序）排序
  - **重试行为**：失败时，移动到下一作业（Round-Robin 模式）

**行为特点**：
- 优先处理高优先级作业：高优先级队列总是先被检查
- **高优先级作业获得重试保证**：失败的高优先级作业立即重试
- **低优先级作业使用轮询**：失败的低优先级作业让出给下一个作业
- 可通过 annotation 配置阈值：`koord-queue/priority-threshold`

**适用场景**：
- 混合负载，既有关键作业又有批量作业
- 需要既执行优先级又保证公平调度的环境

**配置示例**：
```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: intelligent-queue
  labels:
    koord-queue/queue-policy: Intelligent
  annotations:
    koord-queue/priority-threshold: "5"
spec:
  max:
    cpu: "10"
    memory: 20Gi
```

#### 策略对比

| 特性 | Priority | Block | Intelligent |
|------|----------|-------|-------------|
| 排序规则 | 优先级 + 时间戳 | 优先级 + 时间戳 | 双队列：高优先级（FIFO）+ 低优先级（Round-Robin） |
| 重试行为 | 重试失败作业 | 重试失败作业 | 高：重试同一作业；低：移动到下一作业 |
| 资源阻塞 | 乐观 | 严格/保守 | 平衡 |
| 抢占支持 | 是 | 否 | 是（针对高优先级作业） |
| 适用场景 | 优先级调度 | 严格资源隔离 | 混合关键 + 批量工作负载 |

#### 配置队列策略

可以通过两种方式设置队列策略：

1. **通过 ElasticQuota 标签**（推荐）：
```yaml
metadata:
  labels:
    koord-queue/queue-policy: Priority  # 选项：Priority、Block、Intelligent
```

2. **通过 Queue CR**（高级配置）：
```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: Queue
metadata:
  name: my-queue
  namespace: koord-queue
spec:
  queuePolicy: Intelligent
  priority: 1000
  annotations:
    koord-queue/priority-threshold: "5"
```

**高级调优 Annotations**：
- `koord-queue/priority-threshold`：设置 Intelligent 策略的阈值（默认：4）
- `koord-queue/max-depth`：限制调度时考虑的最大作业数量
- `koord-queue/wait-for-pods-running`：等待 Pod 进入 Running 状态后再出队下一作业

## 使用 QueueUnit

### QueueUnit Spec

| 字段 | 类型 | 描述 |
|------|------|------|
| `consumerRef` | `ObjectReference` | 原始作业 CR 的引用。 |
| `priority` | `*int32` | 队列内的优先级。 |
| `queue` | `string` | 目标队列名称。 |
| `resource` | `ResourceList` | 总资源需求。 |
| `podSet` | `[]PodSet` | Pod 组定义（最多 8 个）。 |
| `priorityClassName` | `string` | Kubernetes PriorityClass 名称。 |
| `request` | `ResourceList` | 从作业解析的实际资源请求。 |

### QueueUnit Status

| 字段 | 类型 | 描述 |
|------|------|------|
| `phase` | `QueueUnitPhase` | 当前生命周期阶段。 |
| `attempts` | `int64` | 调度尝试次数。 |
| `message` | `string` | 人类可读的状态消息。 |
| `lastUpdateTime` | `Time` | 上次状态更新时间戳。 |
| `admissionChecks` | `[]AdmissionCheckState` | 每个准入检查的状态。 |
| `podState` | `PodState` | Running/Pending Pod 计数。 |
| `admissions` | `[]Admission` | 每个 PodSet 准入的资源分配和状态。 |

## 使用 AdmissionCheck

### 准入检查 *（开发中）*

> **注意**：准入检查控制器尚未包含在本版本中。本节描述了未来使用的计划 API。

Queue 可以要求在 `QueueUnit` 释放之前必须通过准入检查。这对于与外部资源供应系统集成非常有用。

```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: Queue
metadata:
  name: checked-queue
  namespace: koord-queue
spec:
  queuePolicy: Priority
  admissionChecks:
    - name: prov-req-check
      labelSelector:
        matchLabels:
          requires-provisioning: "true"
```

当 `QueueUnit` 被预留时，准入检查控制器会处理每个配置的检查。`QueueUnit` 仅在所有检查报告 `Ready` 状态时才转换为 `Dequeued`。

## 可观测性

### 监控

Koord-Queue 暴露 Prometheus 指标用于监控：

```bash
# 端口转发到控制器
$ kubectl port-forward -n koord-queue svc/koord-queue 10259:10259

# 获取指标
$ curl http://localhost:10259/metrics
```

如果启用了可视化服务器（`enableVisibilityServer: true`），可以通过 REST API 查询队列状态：

```bash
$ curl http://koord-queue-visibility:8090/api/queues
```

### 调试

查看控制器日志了解调度决策：

```bash
$ kubectl logs -n koord-queue deployment/koord-queue-controller -f --tail=100
```

检查 `QueueUnit` 状态获取调度详情：

```bash
$ kubectl describe queueunit <name> -n <namespace>
```

查看 Kubernetes 事件获取调度相关消息：

```bash
$ kubectl get events -n <namespace> --field-selector reason=Scheduling
```

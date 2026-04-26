# Koord-Queue

## 介绍

Koord-Queue 是 Koordinator 生态系统的原生 Kubernetes 作业队列管理系统。它管理多个队列间的作业准入和排序，与 Koordinator 的 ElasticQuota 深度集成，实现资源公平性和多租户隔离。主要功能包括：

- **多队列管理**，支持 Priority 和 Block 排队策略。
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
helm install koord-queue ./charts/v1.2.0 \
  --namespace koord-queue \
  --create-namespace
```

验证安装：

```bash
$ kubectl get deployment -n koord-queue
NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
koord-queue-controller     1/1     1            1           30s

$ kubectl get crd | grep scheduling.x-k8s.io
queues.scheduling.x-k8s.io          2024-01-01T00:00:00Z
queueunits.scheduling.x-k8s.io      2024-01-01T00:00:00Z
```

### 配置项

Koord-Queue 默认使用 ElasticQuotaV2 模式。`queueGroupPlugin` 字段控制激活哪个插件（以环境变量 `QueueGroupPlugin` 的形式传入控制器）。

#### ElasticQuotaV2 模式（默认）

使用独立的 `ElasticQuota` CR（`scheduling.sigs.k8s.io/v1alpha1`）。这是 Koordinator 用户的推荐模式。

```yaml
controller:
  queueGroupPlugin: elasticquotav2
  enableResourceCheckWithScheduler: false
  enableStrictPriority: false
  defaultPreemptible: true

extension:
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

pluginConfigs:
  apiVersion: scheduling.k8s.io/v1
  kind: KoordQueueConfiguration
  plugins:
    - name: Priority
    - name: ElasticQuotaV2
```

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
    koord-queue/queue-policy: Priority
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
NAME               PHASE     PRIORITY
my-job-blocked     Enqueued  1000
```

`QueueUnit` 保持 `Enqueued` 状态，因为 `team-a` 已达到 `max` 配额上限。当 `my-job` 完成并释放资源后，`my-job-blocked` 将自动出队执行。

对于其他作业类型（TFJob、PyTorchJob 等），请使用 `scheduling.x-k8s.io/suspend: "true"` 注解代替 `spec.suspend`。

### 队列策略

Koord-Queue 支持三种队列策略来控制作业的出队和调度。每种策略定义了不同的排序和重试行为。

#### Priority 策略（优先级策略）

**排序规则**：队列单元按优先级值（降序）排序，然后按创建时间戳（升序）排序。优先级高的作业总是优先出队。相同优先级的作业按 FIFO 顺序处理。

**行为特点**：
- 优先级值更高的作业优先出队
- 相同优先级时，较早创建的作业先调度
- 失败的作业会被重新加入队列并重试
- **支持抢占**：低优先级作业可以被抢占，为高优先级作业腾出空间

**适用场景**：
- 多租户环境，不同优先级级别
- 生产作业应该抢占开发作业
- 具有明确优先级区分的工作负载

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

**调度行为**：
Priority 策略**不是严格的优先级调度**。当高优先级作业被阻塞（如配额耗尽）时，调度器会跳过它们继续扫描。可调度的低优先级作业可以在被阻塞的高优先级作业之前出队。这提高了吞吐量并防止调度器停滞。

**与 Block 策略的关键区别**：
- **Priority**：乐观调度 - 配额接近限制时仍继续调度，阻塞的作业会被跳过
- **Block**：保守调度 - 配额达到限制时严格阻塞作业，防止过度分配
```

#### Block 策略（阻塞策略）

**排序规则**：与 Priority 策略相同 - 按优先级（降序）然后时间戳（升序）排序。

**行为特点**：
- **严格资源阻塞**：当配额达到限制时，使用该配额的后续作业会被阻塞
- 与 Priority 策略（会跳过阻塞的高优先级作业，让后面的可调度作业先出队）不同，Block 策略严格执行优先级顺序
- 防止资源过度分配
- 被阻塞的队列单元在调度时会被跳过，直到资源可用
- 适合需要严格资源隔离的环境

**关键区别**：
- Priority 策略：不是严格的优先级调度 - 允许低优先级作业在被阻塞的高优先级作业之前出队
- Block 策略：严格的优先级调度 - 被阻塞的高优先级作业必须等待，防止低优先级作业绕过它们  max:
    cpu: "10"
    memory: 20Gi
```

**关键区别**：
- Priority 策略：即使配额接近限制，仍继续调度作业（乐观调度）
- Block 策略：配额达到限制时严格阻塞作业（保守调度）

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
- 更平衡的优先级执行和吞吐量方法
- 可通过 annotation 配置阈值：`koord-queue/priority-threshold`

**适用场景**：
- 混合负载，既有关键作业又有批量作业
- 需要既执行优先级又保证公平调度的环境
- 高优先级作业必须完成，但低优先级作业不应饥饿的场景

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
- `koord-queue/wait-for-pods-running`：等待 Pod 进入 Running 状态后再出队下一作业- 被阻塞的队列单元在调度时会被跳过，直到资源可用
- 适合需要严格资源隔离的环境

**适用场景**：
- 资源受限的环境
- `koord-queue/max-depth`：限制调度时考虑的最大作业数量
- `koord-queue/wait-for-pods-running`：等待 Pod 进入 Running 状态后再出队下一作业
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

默认情况下，Koord-Queue 的 Job Extensions 会自动从作业的 Pod 模板中派生 `QueueUnit` 的优先级：读取 `spec.template.spec.priorityClassName` 和 `spec.template.spec.priority`。若找到对应的 `PriorityClass` 对象，则使用其 `.value` 作为 `QueueUnit` 的优先级；否则直接使用 `spec.template.spec.priority` 中的整数值。

你也可以在 `QueueUnit` 创建后手动修改其 `spec.priority`，以覆盖默认值并影响出队顺序。

#### Priority 队列

优先级值更高的作业优先出队。相同优先级的作业中，创建时间更早的优先出队：

```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: Queue
metadata:
  name: priority-queue
  namespace: koord-queue
spec:
  queuePolicy: Priority
  priority: 100
```

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

### 准入检查 *(开发中)*

> **注意**：准入检查控制器尚未包含在本版本中，此部分描述的是未来计划中的 API。

队列可以配置准入检查，`QueueUnit` 在被释放之前必须通过所有检查。这对于与外部资源预置系统集成非常有用。

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

当 `QueueUnit` 被预留时，准入检查控制器处理每个配置的检查。只有当所有检查报告 `Ready` 状态时，`QueueUnit` 才会转换为 `Dequeued`。

### 支持的作业类型

Koord-Queue 通过 Extension Server 架构支持多种作业框架。每种支持的类型需要在 Helm values 中启用对应的扩展：

| 作业类型 | Helm 配置值 | 描述 |
|---------|------------|------|
| Kubernetes Job | `extension.batchjob.enable` | 原生 Kubernetes batch/v1 Job |
| TFJob | `extension.tf.enable` | TensorFlow 训练作业 |
| PyTorchJob | `extension.pytorch.enable` | PyTorch 训练作业 |
| Argo Workflow | `extension.argo.enable` | Argo 工作流作业 |
| Spark | `extension.spark.enable` | Spark 应用作业 |
| Ray | `extension.ray.enable` | Ray 集群/作业 |

### CRD 参考

#### Queue Spec

| 字段 | 类型 | 描述 |
|------|------|------|
| `queuePolicy` | `string` | 排队策略：`Priority` 或 `Block`。 |
| `priority` | `*int32` | 多队列排序的队列优先级。 |
| `priorityClassName` | `string` | Kubernetes PriorityClass 名称。 |
| `admissionChecks` | `[]AdmissionCheckWithSelector` | 所需准入检查列表。 |

#### QueueUnit Spec

| 字段 | 类型 | 描述 |
|------|------|------|
| `consumerRef` | `ObjectReference` | 对原始作业 CR 的引用。 |
| `priority` | `*int32` | 在队列中的优先级。 |
| `queue` | `string` | 目标队列名称。 |
| `resource` | `ResourceList` | 总资源需求。 |
| `podSet` | `[]PodSet` | Pod 组定义（最多 8 个）。 |
| `priorityClassName` | `string` | Kubernetes PriorityClass 名称。 |
| `request` | `ResourceList` | 从作业解析的实际资源请求。 |

#### QueueUnit Status

| 字段 | 类型 | 描述 |
|------|------|------|
| `phase` | `QueueUnitPhase` | 当前生命周期阶段。 |
| `attempts` | `int64` | 调度尝试次数。 |
| `message` | `string` | 可读状态信息。 |
| `lastUpdateTime` | `Time` | 最后状态更新时间。 |
| `admissionChecks` | `[]AdmissionCheckState` | 每个准入检查的状态。 |
| `podState` | `PodState` | Running/Pending Pod 计数。 |
| `admissions` | `[]Admission` | 每个 PodSet 准入的资源分配和状态。 |

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

查看控制器日志以了解调度决策：

```bash
$ kubectl logs -n koord-queue deployment/koord-queue-controller -f --tail=100
```

检查 `QueueUnit` 状态以了解调度详情：

```bash
$ kubectl describe queueunit <name> -n <namespace>
```

查看 Kubernetes 事件中的调度相关消息：

```bash
$ kubectl get events -n <namespace> --field-selector reason=Scheduling
```

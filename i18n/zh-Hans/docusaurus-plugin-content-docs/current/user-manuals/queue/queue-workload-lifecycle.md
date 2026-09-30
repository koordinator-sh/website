# 工作负载生命周期控制

## 引言

`QueueUnit` 是作业在 Koord-Queue 中的表示形式。除描述作业在队列中所处位置的 phase 之外，`QueueUnit` API 还提供了一组字段，允许运维人员或外部控制器介入作业的生命周期：作业可以在不被删除的前提下暂停与恢复、其执行时长可以被限定、其状态可以通过标准的 Kubernetes Condition 对外提供、其重试可以遵循结构化的退避计划。

| 能力 | 字段 | 用途 |
|------|------|------|
| 暂停与恢复 | `spec.active` | 阻止作业被准入；若已准入则释放其配额，且不删除任何对象。 |
| 执行时长预算 | `spec.maximumExecutionTimeSeconds`、`status.accumulatedPastExecutionTimeSeconds` | 限定作业可执行的时长，预算耗尽后将其停用。 |
| 标准化状态 | `status.conditions` | 将权威的 `status.phase` 映射为 `metav1.Condition`，供用户与外部工具消费。 |
| 结构化重试 | `status.requeueState` | 记录作业被重新入队的次数以及下一次尝试的可开始时间。 |

## 可用性

本文所述字段是在 v1.8.0 发布之后加入 `QueueUnit` API 的，因此存在两个前提条件。

1. **`QueueUnit` CRD 必须包含这些新字段。** v1.8.0 Helm Chart 附带的 CRD 未声明 `spec.active`、`spec.maximumExecutionTimeSeconds`、`status.conditions`、`status.requeueState`、`status.reclaimablePods` 与 `status.accumulatedPastExecutionTimeSeconds`，而 APIServer 会裁剪未声明的字段。请应用仓库中的 CRD（`pkg/crd/scheduling.x-k8s.io_queueunits.yaml`），或安装高于 v1.8.0 的 Chart。
2. **必须开启对应的特性开关。** 特性开关通过 `--feature-gates` 参数指定，例如 `--feature-gates=QueueUnitActive=true,QueueUnitRequeueState=true`。

| 特性开关 | 默认值 | 阶段 | 生效组件 |
|----------|--------|------|----------|
| `QueueUnitConditions` | 开启 | Beta | `koord-queue` 与 `koord-queue-controllers` |
| `QueueUnitActive` | 关闭 | Alpha | 准入拦截由 `koord-queue` 执行；注解同步与作业停用由 `koord-queue-controllers` 执行 |
| `QueueUnitRequeueState` | 关闭 | Alpha | `koord-queue` |
| `MaximumExecutionTime` | 关闭 | Alpha | `koord-queue-controllers` |

`--feature-gates` 参数仅由 `koord-queue` 二进制接受；运行作业扩展的 `koord-queue-controllers` 二进制并未提供该参数，因此在标准部署下，作业扩展进程内求值的特性开关始终为默认值。下文在描述每项能力时会说明由此产生的实际影响。

## 暂停与恢复作业

`spec.active` 决定 `QueueUnit` 是否可以被准入，未设置时按 `true` 处理。将其置为 `false` 会产生两个效果，且分别由两个组件实现：

- **单元停止被调度，并停止占用配额。** 队列仍保留非活跃单元在排序中的位置，但不会将其交给调度器。取值发生变化时，单元的缓存副本会被刷新，队列的扫描游标被回退并唤醒队列，因此两个方向的变化都无需重启即可生效。该部分由 `koord-queue` 完成。
- **已被准入的单元会被驱逐。** 作业重新挂起，phase 回到 `Enqueued`，已消耗的执行时长被累计进 `status.accumulatedPastExecutionTimeSeconds`，`Evicted` 条件以原因 `Deactivated` 记录，并发出同名 `Normal` 事件。该部分由作业扩展完成，因此需要在 `koord-queue-controllers` 二进制中开启该开关，而该二进制不接受 `--feature-gates`，详见[可用性](#可用性)。

集成测试套件 `pkg/test/integration/workloadapi` 验证了如下行为：

- 以 `spec.active: false` 创建的 `QueueUnit` 永远不会被准入：其 phase 不会进入 `Reserved` 或 `Dequeued`，`status.admissions` 保持为空，且整份配额仍可被其他单元使用。
- 将同一 `QueueUnit` 的 `spec.active` 更新为 `true` 后，它重新具备准入资格，并在配额允许时被准入。

```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: QueueUnit
metadata:
  name: training-job
  namespace: default
spec:
  active: false
  queue: team-a
  priority: 10
  consumerRef:
    apiVersion: batch/v1
    kind: Job
    name: training-job
    namespace: default
  podSet:
    - name: training-job
      count: 1
      template:
        spec:
          containers:
            - name: main
              image: busybox:stable
              resources:
                requests:
                  cpu: "2"
```

准入拦截由 `koord-queue` 二进制内部的各队列实现完成，因此只需在该 Deployment 上开启 `QueueUnitActive`，暂停与恢复即可生效：

```bash
$ kubectl -n koord-queue patch deployment koord-queue --type=json \
    -p='[{"op":"add","path":"/spec/template/spec/containers/0/command/-","value":"--feature-gates=QueueUnitActive=true"}]'
```

另有两项相关机制实现于作业扩展中，因此除非该二进制也获得相应开关，否则不会生效：

- 作业上的注解 `scheduling.x-k8s.io/active`，它会被同步到对应 `QueueUnit` 的 `spec.active`，从而可以直接在作业对象上暂停作业。
- 驱逐路径：挂起作业、将 phase 重置为 `Enqueued`、以原因 `Deactivated` 记录 `Evicted` 条件、把已消耗的执行时长累计进 `status.accumulatedPastExecutionTimeSeconds`，并发出原因为 `Deactivated` 的 `Normal` 事件。

对于仍在被抢占回收的非活跃 `QueueUnit`，系统会等待回收完成后再处理，因此暂停作业不会与正在进行的抢占产生竞争。

## 限定作业的执行时长

`spec.maximumExecutionTimeSeconds` 用于限定作业可执行的时长。计时从作业 Pod 上报运行时开始，即 `PodsReady` 条件所记录的时刻，因此等待准入与等待 Pod 启动的时间不计入预算。预算耗尽后，该 `QueueUnit` 会被停用：`spec.active` 置为 `false`，`status.accumulatedPastExecutionTimeSeconds` 被重置，`Evicted` 条件以原因 `MaximumExecutionTimeExceeded` 记录，并发出同名 `Warning` 事件。此后重新激活该单元将获得一份全新的预算。

作业侧对应的注解为 `scheduling.x-k8s.io/max-exec-time-seconds`。

该逻辑实现于作业扩展（`pkg/jobext/framework/activation.go`），需要在 `koord-queue-controllers` 二进制中开启 `MaximumExecutionTime`。由于该二进制未提供 `--feature-gates`，当前发布版本的标准部署无法启用执行时长预算：API 会接受该字段，但不会产生实际效果。

## 通过 Condition 消费状态

`status.phase` 仍是 `QueueUnit` 的权威状态；`status.conditions` 将其映射为标准的 `metav1.Condition` 表示，且不参与任何调度决策，因此可供遵循 Kubernetes 约定的外部工具安全消费。特性开关 `QueueUnitConditions` 默认开启。

| Condition 类型 | 为 True 的条件 |
|----------------|----------------|
| `QuotaReserved` | 队列已为该单元预留配额，即 phase 处于 `Reserved` 及之后且未处于退避状态。 |
| `Admitted` | 全部准入检查通过、作业已被放行，即 phase 处于 `Dequeued` 及之后。 |
| `PodsReady` | 作业的 Pod 正在运行。 |
| `Finished` | 作业成功或失败，原因为 `Succeeded` 或 `Failed`。 |
| `Evicted` | 该单元失去准入资格，原因字段说明具体缘由。 |

`Evicted` 条件可能出现的原因：

| 原因 | 含义 |
|------|------|
| `Deactivated` | `spec.active` 被置为 `false`。 |
| `Preempted` | 该单元被队列级抢占选为受害者。 |
| `BackoffTimeout` | 单元退避期间预留被释放，例如准入检查被拒绝或超时。 |
| `MaximumExecutionTimeExceeded` | 作业执行时长超过 `spec.maximumExecutionTimeSeconds`。 |

同一集成测试套件验证的行为是：已被准入的单元会带有 `QuotaReserved=True` 与 `Admitted=True`，且 reason 非空、`lastTransitionTime` 已填充；准入检查被拒绝的单元会进入 `TimeoutBackoff` 阶段，并带有 `Evicted=True`（原因 `BackoffTimeout`）与 `QuotaReserved=False`，即不再对外声明预留。

```bash
$ kubectl get queueunit training-job -n default \
    -o custom-columns='PHASE:.status.phase,CONDITIONS:.status.conditions[*].type'
```

## 基于 requeueState 的结构化退避

当 `QueueUnit` 需要重新入队时（例如准入检查被拒绝或超时），控制器会在 `status.requeueState` 中记录结构化退避信息：

| 字段 | 说明 |
|------|------|
| `count` | 该单元被重新入队的次数，首次退避记为 `1`。 |
| `requeueAt` | 该单元可以开始下一次尝试的时间点。 |

退避时长按尝试次数指数增长：基准为 10 秒，每次翻倍，上限为 15 分钟；并叠加 10% 的对称抖动，以避免整条队列被饿死时大量单元同时退避、又同时重试。当特性开关 `QueueUnitRequeueState` 关闭时，控制器退化为固定退避时长，且不写入 `status.requeueState`。

已验证的行为是：首次拒绝会记录 `count: 1`，其 `requeueAt` 晚于 `status.lastUpdateTime`；第二次拒绝会记录 `count: 2`，其 `requeueAt` 晚于第一次。

```bash
$ kubectl get queueunit training-job -n default \
    -o jsonpath='{.status.phase}{"\t"}{.status.requeueState.count}{"\t"}{.status.requeueState.requeueAt}{"\n"}'
```

## 参考

| 关注点 | [koord-queue](https://github.com/koordinator-sh/koord-queue) 中的位置 |
|--------|------------------|
| API 字段、Condition 与驱逐原因常量 | `pkg/apis/scheduling/v1alpha1/type.go` |
| Condition 映射 | `pkg/utils/conditions.go` |
| 退避计算与记录 | `pkg/utils/requeue.go` |
| 激活、停用与执行时长预算 | `pkg/jobext/framework/activation.go` |
| 非活跃单元的准入拦截 | `pkg/queue/queuepolicies/schedulingqueuev2/schedulingqueuev2.go`、`pkg/queue/queuepolicies/basequeue/basequeue.go`、`pkg/queue/queuepolicies/intelligentqueue/methods.go` |
| 准入检查失败时的退避与条件处理 | `pkg/controllers/queueunitcontroller.go` |
| 特性开关与默认值 | `pkg/features/features.go` |
| 验证套件 | `pkg/test/integration/workloadapi` |

## 后续阅读

- [Koord-Queue 使用指南](./queue-management.md)：安装、排队策略与 `QueueUnit` API。
- [队列级抢占](./queue-preemption.md)：`Preempted` 驱逐原因的产生过程。
- [Koord-Queue 可观测性](./queue-observability.md)：指标、Visibility API 与排查命令。

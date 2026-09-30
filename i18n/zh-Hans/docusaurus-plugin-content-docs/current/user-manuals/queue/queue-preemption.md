# 队列级抢占

## 引言

Koord-Queue 在允许作业创建 Pod 之前，会先为其预留配额。已预留配额的作业，在其 Pod 真正运行之前会持续占用配额，运行期间同样占用配额。当某个队列的配额被“已准入但 Pod 尚未启动”的作业占满时，随后提交的高优先级作业通常必须等待这些 Pod 启动，极端情况下还需等待其执行完毕，而在此期间集群并未因这部分预留配额产出任何有效算力。

队列级抢占用于消除这种队头阻塞。当高优先级 `QueueUnit` 无法被准入时，Koord-Queue 会将同一队列中优先级较低的 `QueueUnit` 里“已准入但尚未运行”的副本标记为待回收；随后由作业扩展删除对应的 Pod 并上报资源释放情况，被释放的配额将在后续调度周期中授予该高优先级作业。

在启用该机制之前，有两点特性需要明确：

- **Koord-Queue 不会删除正在运行的 Pod。** 仅回收尚未绑定到节点的 Pod 所占用的副本。因此抢占的作用是加速高优先级作业的准入，而不是驱逐已在执行的工作负载。若需回收运行中工作负载的资源，请使用 koord-scheduler 的[Job 级别抢占](../job-level-preemption.md)或重调度能力。
- **抢占是异步的。** 抢占者不会在标记受害者的那个调度周期内被准入，而是在作业扩展完成 Pod 回收并上报配额释放之后，由后续调度周期完成准入。

## 概念

| 术语 | 说明 |
|------|------|
| 抢占者（Preemptor） | 优先级较高、但在所属队列配额内无法被准入的 `QueueUnit`。 |
| 假定集合（Assumed set） | 队列中已预留配额、但 Pod 尚未全部运行的 `QueueUnit` 集合。只有该集合的成员才可能成为受害者。 |
| 受害者（Victim） | 假定集合中优先级低于抢占者、且至少存在一个可回收准入项的 `QueueUnit`。 |
| `ReclaimState` | 受害者 `status.admissions[i].reclaimState.replicas` 字段。写入该字段即为抢占决策，作业扩展据此删除 Pod。 |
| 回收保护期 | 自 `status.lastAllocateTime` 起算的一段时间，在此期间刚获得配额分配的 `QueueUnit` 不可被回收。 |

## 支持范围

| 维度 | 支持情况 |
|------|----------|
| 队列策略 | `Priority` 与 `Block`。`Intelligent` 策略未实现抢占，对此类队列发起抢占会返回错误且不标记任何受害者。 |
| 配额插件 | `ElasticQuotaV2`（默认插件）。其 Filter 在配额耗尽时返回不可调度，正是该结果将调度流程导向抢占路径。 |
| 可回收状态 | 已准入副本中，Pod 既未处于终态、也未绑定节点的部分。 |

## 抢占的触发方式

Koord-Queue 在调度周期的两个位置评估抢占。二者都要求队列开启 `koord-queue/wait-for-pods-running`，因为正是该注解将“已准入但未运行”的 `QueueUnit` 保留在假定集合中。

1. **预留之前（`Reserve`）。** 当某个 `QueueUnit` 即将被准入、而队列的假定集合非空时，会逐一检查假定集合中排序位于其后的成员。若其中至少一个存在可回收资源，则标记这些受害者，并且本次调度周期不准入该 `QueueUnit`；若均不可回收，则队列返回“不允许继续调度”的结论，该 `QueueUnit` 继续等待。
2. **配额过滤失败之后（`Preempt`）。** 当过滤插件判定该 `QueueUnit` 无法放入可用配额时，调度器调用队列的抢占逻辑。该路径额外受 `koord-queue/enable-queueunit-preemption` 控制。试算过程按优先级升序遍历假定集合，逐次累加受害者，直至可释放的资源在抢占者请求的每一种资源维度上都不低于其请求量；随后标记受害者并将抢占者重新入队。

```
高优先级 QueueUnit 创建
  -> 出队（优先级高者先出）
  -> Reserve：假定集合非空且其中存在优先级更低、可回收的成员
        -> 标记受害者（ReclaimState），并将抢占者重新入队
     或
  -> Filter：配额耗尽 -> Preempt（需开启 enable-queueunit-preemption）
        -> 按优先级升序试算假定集合
        -> 标记受害者，直至释放量覆盖请求量
        -> 将抢占者重新入队
  -> 作业扩展感知 ReclaimState，删除受害者的 Pending Pod 并上报资源变化
  -> 队列发出 Reclaimed 事件，受害者恢复可调度
  -> 后续调度周期准入抢占者
```

同一队列在同一时刻只允许进行一轮抢占。若上一轮尚未结束即收到新的抢占请求，该请求会被拒绝，以避免对同一批受害者重复标记。

## 开启队列级抢占

抢占通过两个注解配置，二者都必须为 `"true"`。

| 注解 | 作用 |
|------|------|
| `koord-queue/wait-for-pods-running` | 将“已准入但 Pod 未全部运行”的 `QueueUnit` 保留在假定集合中，使其对抢占逻辑可见；同时使队列在这些 Pod 启动之前保持等待。未开启该注解时抢占不可用。 |
| `koord-queue/enable-queueunit-preemption` | 开启“配额过滤失败后”的抢占路径。 |

上述注解在队列创建时读取，并在 `Queue` 对象更新时重新读取，因此无需重启组件。

### 方式一：在 ElasticQuota 上添加注解（推荐）

使用 `ElasticQuotaV2` 插件时，每个 `ElasticQuota` 都会自动创建对应的 `Queue`，且 `ElasticQuota` 上所有 `koord-queue/` 前缀的注解都会被同步到该 `Queue`。队列策略标签本身不会被同步，因为它会被转换为 `spec.queuePolicy`。

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: team-a
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/parent: ""
    quota.scheduling.koordinator.sh/is-parent: "false"
    koord-queue/queue-policy: Priority
  annotations:
    koord-queue/wait-for-pods-running: "true"
    koord-queue/enable-queueunit-preemption: "true"
spec:
  min:
    cpu: "4"
    memory: 8Gi
  max:
    cpu: "4"
    memory: 8Gi
```

### 方式二：在 Queue 上添加注解

对于人工维护的 `Queue`，可直接在该对象上设置相同注解。所有 `Queue` 对象都位于 Koord-Queue 组件所在的命名空间，默认为 `koord-queue`。

```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: Queue
metadata:
  name: team-a
  namespace: koord-queue
  annotations:
    koord-queue/wait-for-pods-running: "true"
    koord-queue/enable-queueunit-preemption: "true"
spec:
  queuePolicy: Priority
  priority: 1000
```

若 `Queue` 是由 `ElasticQuota` 自动创建的，直接写入 `Queue` 的注解会被协调逻辑保留，但从配置意图上讲，`ElasticQuota` 才是用户应当维护的对象。

## 配置回收保护期

刚被准入的作业往往正处于拉取镜像或初始化运行时的阶段，此时立即回收会浪费已完成的工作。回收保护期用于在 `QueueUnit` 完成配额分配（即 `status.lastAllocateTime`）之后的一段时间内禁止回收。

该取值属于组件配置项，需通过 Helm 的 `pluginConfigs` 设置：

```yaml
pluginConfigs:
  apiVersion: scheduling.k8s.io/v1
  kind: KoordQueueConfiguration
  defaultReclaimProtectTime: 5m
  plugins:
    - name: Priority
    - name: ElasticQuotaV2
```

默认值为 `0`，即不启用保护。分配时间距当前时刻小于该时长的 `QueueUnit`，在受害者选择过程中会被跳过，试算路径与预留路径均遵循这一规则。

## 受害者选择规则

假定集合中的 `QueueUnit` 需同时满足以下条件才会被选为受害者：

1. 按队列的排序函数位于抢占者之后，即优先级更低，或优先级相同但创建时间更晚。
2. 至少存在一个准入项的 `replicas` 与 `running` 不相等，即仍有已准入副本尚未开始运行。
3. 该准入项尚未携带 `reclaimState`，因此同一受害者不会被重复标记。
4. 自 `status.lastAllocateTime` 起已超过回收保护期。

在“过滤失败后”的抢占路径中，受害者按优先级升序依次累加，直至可释放资源在抢占者请求的每一种资源维度上都不低于其请求量；在预留路径中，一轮即标记所有优先级低于当前 `QueueUnit` 的假定成员。

标记受害者时，Koord-Queue 会写入 `status.admissions[i].reclaimState.replicas`，将 `status.message` 置为 `Waiting job extension to reclaim resources.`，并在每个受害者上记录一条原因为 `Preempted` 的 `Warning` 事件。已完全出队或未预留任何资源的 `QueueUnit` 会被跳过。

## 作业扩展的处理动作

对于每一个携带 `reclaimState` 的准入项，作业扩展会在对应 PodSet 中选取至多 `reclaimState.replicas` 个 Pod 并删除，选取时跳过处于终态的 Pod 以及已绑定节点的 Pod；随后将资源使用情况回写至 `QueueUnit`。当该 `QueueUnit` 不再预留任何资源、且其请求不再被满足时，队列会释放与之相关的内部记账状态，记录一条原因为 `Reclaimed` 的 `Normal` 事件，该单元重新变为可调度。

由于已绑定节点的 Pod 不会被选中，Pod 已全部完成调度的作业无法通过该机制被回收，也就不再是合格的受害者。

`status.admissions[i].reclaimState` 是一个瞬态字段：对应 Pod 被回收后，作业扩展会立即将其清除，在空闲集群上
这一过程通常只有数秒。因此抢占的持久证据是成对出现的 `Preempted` 与 `Reclaimed` 事件，而不是该字段本身。

## 示例

以下示例使用一个保障配额与上限均为 2 核 CPU 的配额组，因此单个 2 核作业即可耗尽配额。两个作业均以 `spec.suspend: true` 提交，这是其被 Koord-Queue 接管的前提。

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: low-priority-job
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/name: team-a
spec:
  suspend: true
  template:
    spec:
      priorityClassName: low-priority
      containers:
        - name: main
          image: busybox:stable
          command: ["/bin/sh", "-c", "sleep 3600"]
          resources:
            requests:
              cpu: "2"
            limits:
              cpu: "2"
      restartPolicy: Never
```

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: high-priority-job
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/name: team-a
spec:
  suspend: true
  template:
    spec:
      priorityClassName: high-priority
      containers:
        - name: main
          image: busybox:stable
          command: ["/bin/sh", "-c", "sleep 3600"]
          resources:
            requests:
              cpu: "2"
            limits:
              cpu: "2"
      restartPolicy: Never
```

预期的状态变化顺序如下。

1. `low-priority-job` 被准入：其 `QueueUnit` 进入 `Dequeued` 阶段，`status.admissions[0].replicas` 为 `1`，`status.admissions[0].reclaimState` 为空，作业被恢复执行。只要该作业的 Pod 尚未绑定节点，其 `QueueUnit` 就保留在队列的假定集合中。
2. 提交 `high-priority-job`。由于配额已耗尽，其 `QueueUnit` 无法被准入，抢占逻辑随即标记低优先级单元：`low-priority-job` 的 `status.admissions[0].reclaimState.replicas` 变为 `1`，`status.message` 变为 `Waiting job extension to reclaim resources.`。
3. 作业扩展删除 `low-priority-job` 处于 Pending 状态的 Pod 并上报配额释放，受害者上出现 `Reclaimed` 事件。
4. 在后续调度周期中，`high-priority-job` 被准入并进入 `Dequeued` 阶段。

可使用如下命令查看两个单元的状态。

```bash
# 查看单个作业的准入与回收状态
$ kubectl get queueunit low-priority-job -n default \
    -o jsonpath='{.status.phase}{"\t"}{.status.admissions[0].replicas}{"\t"}{.status.admissions[0].reclaimState.replicas}{"\n"}'

# 查看某个 QueueUnit 的抢占与回收事件
$ kubectl get events -n default --field-selector involvedObject.name=low-priority-job \
    -o custom-columns='REASON:.reason,TYPE:.type,MESSAGE:.message'
```

## 可观测性

| 信号 | 查看位置 |
|------|----------|
| 受害者已被标记 | 受害者 `QueueUnit` 上原因为 `Preempted` 的 `Warning` 事件；`status.admissions[i].reclaimState`；`status.message`。 |
| 资源已被回收 | 受害者 `QueueUnit` 上原因为 `Reclaimed` 的 `Normal` 事件。 |
| 抢占者未能准入 | `status.phase` 保持 `Enqueued`，`status.message` 中包含过滤结果与抢占尝试是否成功，`status.attempts` 递增。 |
| 队列调度压力 | 指标 `job_schedule_attempts{queue,result="unschedulable"}` 与 `queueunits_in_active_queue{queue}`。 |
| 决策细节日志 | 控制器日志（`--v=2` 及以上）。受害者选择、保护期跳过与抢占轮次完成情况均会带队列名与 `QueueUnit` 引用输出。 |

## 限制与排查

| 现象 | 原因 | 处理方式 |
|------|------|----------|
| 始终没有受害者被标记 | `koord-queue/wait-for-pods-running` 未设为 `"true"`，假定集合为空。 | 在 `ElasticQuota` 或 `Queue` 上设置该注解。 |
| 配额过滤失败后从不触发抢占 | `koord-queue/enable-queueunit-preemption` 未设为 `"true"`。 | 在 `ElasticQuota` 或 `Queue` 上设置该注解。 |
| 每次抢占均返回错误 | 队列使用 `Intelligent` 策略，该策略未实现抢占。 | 需要抢占的队列请改用 `Priority` 或 `Block`。 |
| 运行中的作业未被回收 | 回收仅考虑未绑定节点的 Pod。 | 请使用[Job 级别抢占](../job-level-preemption.md)或重调度回收运行中工作负载的资源。 |
| 刚准入的作业始终不被选中 | 回收保护期尚未结束。 | 调小 `defaultReclaimProtectTime`，或等待保护期结束。 |
| 受害者已被标记，但抢占者仍为 `Enqueued` | 抢占为异步过程，需待作业扩展上报配额释放后方可准入抢占者。 | 检查受害者的 Pod、`Reclaimed` 事件以及作业扩展日志。 |
| 队列不再准入任何作业 | 所有已准入 `QueueUnit` 都在假定集合中且均不可回收，队列在等待其 Pod 启动。 | 这是 `wait-for-pods-running` 的预期行为，应排查已准入作业的 Pod 为何未启动。 |

## 参考

本文所述行为在 [koord-queue](https://github.com/koordinator-sh/koord-queue) 仓库中的实现位置如下。

| 关注点 | 位置 |
|--------|------|
| 过滤失败后的抢占、试算与受害者标记 | `pkg/queue/queuepolicies/schedulingqueuev2/preempt.go` |
| 预留前的抢占、假定集合、注解处理 | `pkg/queue/queuepolicies/schedulingqueuev2/schedulingqueuev2.go` |
| 可回收资源与保护期 | `pkg/utils/util.go` 中的 `GetResourcesCanReclaim` |
| 回收保护期配置 | `pkg/apis/config/types.go` 中的 `DefaultReclaimProtectTime` |
| 调度器入口 | `pkg/scheduler/scheduler.go` |
| 依据 `reclaimState` 删除 Pod | `pkg/jobext/framework/resource_report_controller.go` 中的 `reconcileReclaim` |
| 注解从 `ElasticQuota` 同步至 `Queue` | `pkg/framework/plugins/elasticquotav1alpha1/elasticquota_handler.go` |
| 端到端验证套件 | `pkg/test/integration/elasticquotav1alpha1preemption` |

## 后续阅读

- [Koord-Queue 使用指南](./queue-management.md)：安装、排队策略与 `QueueUnit` API。
- [排队策略与调优](./queue-policies-and-tuning.md)：队列的排序、阻塞行为与调优注解。
- [Job 级别抢占](../job-level-preemption.md)：由 koord-scheduler 对运行中工作负载实施抢占。
- [容量调度](../capacity-scheduling.md)：Koordinator 中的 ElasticQuota 配置。

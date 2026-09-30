# 排队策略与调优

## 引言

Koord-Queue 在两个层级上进行排序。队列之间由 `Priority` 插件按 `Queue.spec.priority` 排序，优先级更高的队列先被服务；队列内部则由排队策略（即 `Queue.spec.queuePolicy`）决定排序方式与资源竞争下的行为。

本文说明可供选择的三种策略、它们各自适用的排序规则、用于调优的注解，以及组件虽接受但当前并不参与决策的配置项。

## 策略总览

| 策略 | 实现 | 队列内排序 | 抢占支持 | 该策略评估的调优注解 |
|------|------|------------|----------|----------------------|
| `Priority` | 与 `Block` 共用同一实现 | 优先级降序，其次首次尝试时间升序 | 支持 | `wait-for-pods-running`、`enable-queueunit-preemption`、`max-depth` |
| `Block` | 与 `Priority` 共用同一实现 | 优先级降序，其次首次尝试时间升序 | 支持 | `wait-for-pods-running`、`enable-queueunit-preemption`、`max-depth` |
| `Intelligent` | 双子队列实现 | 高优先级子队列优先，两个子队列内部均按优先级与时间排序 | 不支持 | 仅 `priority-threshold` |

上表最后一列省略了调优注解共有的 `koord-queue/` 前缀，完整键名见[调优注解](#调优注解)。

代码中还存在另外两个策略名，但无法使用。`FIFO` 是 `Queue` API 中声明的常量，`Round` 会被 `ElasticQuotaV2` 插件的策略匹配逻辑接受，但二者均未在队列工厂中注册。选择其中之一会导致队列构造失败，并在 `Queue` 上产生原因为 `AddQueueFail` 的 `Warning` 事件，该队列不会服务任何作业。

## 排序规则

两个层级的排序都由 `Priority` 插件实现。

| 比较对象 | 规则 |
|----------|------|
| 两个队列之间 | `spec.priority` 更大者在前；未设置时按 `0` 处理。 |
| 同一队列内两个 `QueueUnit` 之间 | `spec.priority` 更大者在前；优先级相同时，首次调度尝试更早者在前；未设置时按 `0` 处理。 |

`QueueUnit` 的优先级由作业扩展从作业中推导：读取 Pod 模板中的 priorityClassName 与 priority 取值，并在作业变更时同步更新；也可以直接在 `QueueUnit` 上设置。

## Priority 策略

`Priority` 是默认策略。队列将单元保存在有序列表中，并按顺序交给调度器。当没有任何单元可被调度时，行为取决于当前是否存在被标记为阻塞的配额：

- 若存在被阻塞的配额，则清空阻塞记账并立即重试；
- 否则队列进入等待，并设置一分钟的定时器唤醒自身，以避免因限流而无限期停滞。

未处于阻塞配额的单元会被逐个重试，因此单个放不下的单元不会阻止其后单元被考虑。

## Block 策略

`Block` 与 `Priority` 使用相同的排序与相同的实现，区别在于队列对资源竞争的反应方式。它维护一个按配额维度的阻塞集合：当某个单元无法被调度、且调度周期内资源状况未发生变化时，该单元所属配额被标记为阻塞；后续扫描会跳过阻塞配额的单元，而不是逐个重试。当该配额有新单元加入，或该配额有单元被预留、出队时，配额会脱离阻塞集合。

三个定时器共同决定其行为：

| 定时器 | 时长 | 用途 |
|--------|------|------|
| 阻塞状态下的唤醒定时器 | 30 秒 | 在没有事件到达时重新评估队列。 |
| 陈旧状态重置 | 3 分钟 | 当三分钟内没有任何调度成功时清空阻塞集合，避免队列因陈旧记账而挂起。 |
| 同一单元限流 | 5 秒 | 防止同一单元在 5 秒内被重复选取。 |

`Block` 是偏保守的选择：它避免对已知耗尽的配额反复尝试，代价是对小幅资源变化的反应较粗。

## Intelligent 策略

`Intelligent` 以优先级阈值为界，将队列中的单元划分到两个子队列：

- 优先级大于或等于阈值的单元进入高优先级子队列；
- 优先级低于阈值的单元进入低优先级子队列。

两个子队列均按优先级与时间排序，且高优先级子队列先被服务。二者的重试行为不同：高优先级单元无法被调度时会重试同一单元，从而保证关键作业不会被越过；低优先级单元无法被调度时会推进到下一个单元，形成轮转行为，避免单个大批量作业饿死队列中的其他作业。

阈值默认为 `4`，通过 `Queue` 上的注解 `koord-queue/priority-threshold` 配置。

`Intelligent` 未实现抢占。对此类队列发起抢占会返回错误且不标记任何受害者，详见[队列级抢占](./queue-preemption.md)。

## 选择与变更策略

对于由 `ElasticQuota` 自动创建的队列，策略取自标签 `koord-queue/queue-policy`。若取值不属于 `Priority`、`Block`、`Round`、`Intelligent`，则被忽略，策略回落为 `Priority`。

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: team-a
  labels:
    koord-queue/queue-policy: Block
spec:
  min:
    cpu: "4"
  max:
    cpu: "8"
```

对于人工维护的队列，策略在 `Queue` 的 `spec.queuePolicy` 中设置：

```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: Queue
metadata:
  name: team-a
  namespace: koord-queue
  annotations:
    koord-queue/priority-threshold: "10"
spec:
  queuePolicy: Intelligent
  priority: 1000
```

调优注解属于 `metadata.annotations`。`Queue.spec` 只声明 `admissionChecks`、`priority`、`priorityClassName`
与 `queuePolicy` 四个字段，写在 `spec` 之下的注解会被 API Server 直接丢弃且不报错。

直接写入自动创建的 `Queue` 的策略，会在 `ElasticQuota` 下一次协调时被回退，详见 [ElasticQuota 与 Queue 的映射关系](./queue-quota-mapping.md)。

策略变更在运行时生效，既不需要重启，也不会丢失正在等待的单元：

- `Priority` 与 `Block` 之间的切换就地生效，因为二者共用同一实现，仅切换阻塞行为；
- 切换到 `Intelligent` 或从其切出会替换实现，已有单元会被迁移并重新加入新实现，因此既不会丢弃单元，也不会重建单元。

## 调优注解

下列注解均从 `Queue` 对象读取，且都使用 `koord-queue/` 前缀。对于自动创建的队列，这些注解也可以设置在 `ElasticQuota` 上，由协调过程复制到 `Queue`，详见 [ElasticQuota 与 Queue 的映射关系](./queue-quota-mapping.md)。

| 注解 | 适用策略 | 默认值 | 作用 |
|------|----------|--------|------|
| `koord-queue/wait-for-pods-running` | `Priority`、`Block` | 缺失，即关闭 | 将已准入但 Pod 尚未运行的单元保留在假定集合中：队列会等待已准入作业的 Pod 启动后再放行下一个作业，同时这些单元可被抢占逻辑纳入考虑。 |
| `koord-queue/enable-queueunit-preemption` | `Priority`、`Block` | 缺失，即关闭 | 开启“配额过滤失败后”的抢占路径。 |
| `koord-queue/max-depth` | `Priority`、`Block` | `-1`，即不限制 | 限制队列扫描与调度的深度，`-1` 表示不限制。 |
| `koord-queue/priority-threshold` | `Intelligent` | `4` | 划分高、低优先级子队列的阈值。 |
| `koord-queue/queue-items-refresh-interval` | 全部策略 | `15s` | `Queue.status.queueItemDetails` 中队列排序的刷新间隔，取值为 Go 时长格式，例如 `30s` 或 `2m`。 |
| `koord-queue/disable-show-queue-items` | 全部策略 | 缺失，即开启发布 | 停止刷新 `Queue.status.queueItemDetails` 的周期作业，最后一次发布的值会被保留。起作用的是该键是否存在，而非其取值。 |
| `koord-queue/queue-args` | 全部策略均接受 | 空 | 会被解析为字符串映射并传入队列实现，但当前各实现不读取任何参数，因此不产生效果。 |

`Intelligent` 策略只评估 `koord-queue/priority-threshold`。在 `Intelligent` 队列上设置
`koord-queue/wait-for-pods-running`、`koord-queue/enable-queueunit-preemption` 或 `koord-queue/max-depth`
不会产生效果，因此限制扫描深度需要使用 `Priority` 或 `Block`。

上述注解在 `Queue` 对象变更时会被重新读取，因此调优无需重启组件。

## 队列排序的对外发布

每个队列都会在 `Queue.status.queueItemDetails` 中发布其服务顺序。该字段是“队列种类 → 有序条目列表”的映射，三种策略的键均为 `active`；每个条目包含单元的命名空间、名称、优先级与从 1 开始的位置。列表中只包含仍在队列中等待的单元，因此空闲队列发布的是空值。该列表由周期作业刷新，默认间隔 15 秒。

```bash
$ kubectl -n koord-queue get queue team-a -o jsonpath='{.status.queueItemDetails}' | jq .
{
  "active": [
    { "name": "job-a", "namespace": "default", "priority": 100, "position": 1 },
    { "name": "job-b", "namespace": "default", "priority": 10,  "position": 2 }
  ]
}
```

对于 `Intelligent` 策略的队列，发布列表中先给出高优先级子队列的单元，再给出低优先级子队列的单元，位置在两者之间连续编号。

对于持有大量单元的队列，可以通过 `koord-queue/disable-show-queue-items` 关闭发布，或通过 `koord-queue/queue-items-refresh-interval` 延长间隔，以降低对 APIServer 的写入压力。关闭发布只会停止刷新，不会清空该字段，因此此前发布的排序会一直保留，直到发布恢复。

## 被接受但未参与决策的配置

组件接受了若干当前不被任何决策读取的配置项。列出它们是为了避免被误当作可用开关。

| 配置项 | 接受位置 | 状态 |
|--------|----------|------|
| `--enableParentLimit` | `koord-queue` | 启动时解析并打印日志，但没有任何决策读取它，队列中用于施加父级限制的方法也是空实现。父级配额实际通过层级用量检查生效，详见 [ElasticQuota 与 Queue 的映射关系](./queue-quota-mapping.md)。 |
| `--default-queue-policy` | `koord-queue` | 已注册为参数，并由环境变量 `StrictPriority`、`StrictConsistency` 初始化，但其取值从未被读取。实际生效的默认策略来自 `ElasticQuota` 的协调结果，为 `Priority`。 |
| `--defaultPreemptible` | `koord-queue` | 已注册为参数。队列级抢占的受害者选择依据优先级与资源是否可回收，不依据任何“可抢占”属性，也不会读取可抢占标签。 |
| `--podInitialBackoffSeconds`、`--podMaxBackoffSeconds` | `koord-queue` | 用于填充队列的参数映射，而各实现并不读取该映射。 |
| `koord-queue/queue-args` | `Queue` 注解 | 解析进同一参数映射，结果相同。 |
| `Intelligent` 队列上的 `koord-queue/wait-for-pods-running`、`koord-queue/enable-queueunit-preemption` 与 `koord-queue/max-depth` | `ElasticQuota` 或 `Queue` 注解 | 会被保存在 `Queue` 上，但 `Intelligent` 实现不读取。 |

## 策略选型建议

| 场景 | 建议 |
|------|------|
| 优先级混合的通用队列 | `Priority`：逐个重试，对资源释放的反应最快。 |
| 配额经常耗尽，反复尝试属于浪费 | `Block`：不再对已知耗尽的配额重试，改为依赖事件与定时器。 |
| 同一队列中既有关键作业又有大量长时批量作业 | `Intelligent`：达到阈值的关键作业会被持续重试直至放下，低于阈值的批量作业按轮转服务。 |
| 需要抢占已准入作业 | `Priority` 或 `Block`；`Intelligent` 未实现抢占。 |
| 需要限制扫描深度 | `Priority` 或 `Block`，并配置 `koord-queue/max-depth`。 |

## 排障

| 现象 | 原因 | 处理方式 |
|------|------|----------|
| `Queue` 上出现 `AddQueueFail` 事件 | 策略未注册，`FIFO` 与 `Round` 即属此类。 | 改用 `Priority`、`Block` 或 `Intelligent`。 |
| 队列完全不服务作业 | 队列构造失败，或没有单元解析到该队列。 | 检查 `Queue` 的事件与单元的 `QueueNotFound` 事件，详见 [ElasticQuota 与 Queue 的映射关系](./queue-quota-mapping.md)。 |
| `Block` 队列对资源释放反应缓慢 | 阻塞配额依靠事件、30 秒定时器重新评估，陈旧状态需三分钟后清理。 | 属预期行为。若反应速度比尝试次数更重要，请改用 `Priority`。 |
| `Intelligent` 队列的阈值不生效 | 注解使用了 `koord-queue/priority-threshold` 以外的键名，或被设置在作业上而非 `ElasticQuota`、`Queue` 上。 | 在 `ElasticQuota` 或 `Queue` 上设置 `koord-queue/priority-threshold`。 |
| `Intelligent` 队列从不抢占 | 该策略未实现抢占。 | 需要抢占的队列改用 `Priority` 或 `Block`。 |
| `max-depth` 不生效 | 队列使用 `Intelligent` 策略，该策略不读取 `koord-queue/max-depth`。 | 改用 `Priority` 或 `Block`。 |
| `status.queueItemDetails` 中的排序陈旧 | 发布已被关闭（关闭只停止刷新、保留最后一次的值），或刷新间隔过长。 | 移除 `koord-queue/disable-show-queue-items`，或调小 `koord-queue/queue-items-refresh-interval`。 |
| `status.queueItemDetails` 为空 | 队列中没有等待中的单元；已出队的单元不会被列出。 | 属预期行为，可改为查看该队列下的 `QueueUnit` 对象。 |

## 参考

| 关注点 | [koord-queue](https://github.com/koordinator-sh/koord-queue) 中的位置 |
|--------|------------------|
| 队列与单元的排序 | `pkg/framework/plugins/priority/priority.go` |
| `Priority` 与 `Block` 实现、阻塞配额记账、定时器 | `pkg/queue/queuepolicies/schedulingqueuev2/schedulingqueuev2.go` |
| `Intelligent` 实现、阈值与重试行为 | `pkg/queue/queuepolicies/intelligentqueue/intelligentqueue.go`、`pkg/queue/queuepolicies/intelligentqueue/methods.go` |
| 注解常量 | `pkg/queue/queuepolicies/schedulingqueuev2/schedulingqueuev2.go`、`pkg/queue/queuepolicies/basequeue/basequeue.go`、`pkg/queue/queuepolicies/types.go` |
| 策略注册与构造 | `pkg/queue/factory.go`、`pkg/queue/types.go` |
| 队列排序的发布 | `pkg/queue/types.go` 中的 `sync`，以及各实现的 `SortedList` 方法 |
| 验证套件 | `pkg/test/integration/schedulingqueuev2`、`pkg/test/integration/intelligentqueue` |

## 后续阅读

- [Koord-Queue 使用指南](./queue-management.md)：安装与端到端使用。
- [ElasticQuota 与 Queue 的映射关系](./queue-quota-mapping.md)：配额与队列的关联方式。
- [队列级抢占](./queue-preemption.md)：从低优先级作业回收配额。
- [Koord-Queue 可观测性](./queue-observability.md)：指标、Visibility API 与事件。

# ElasticQuota 与 Queue 的映射关系

## 引言

Koord-Queue 对其接管的每个作业都需要独立回答两个问题：该作业计入哪一份配额，以及它在哪个队列中等待。在默认的 `ElasticQuotaV2` 插件下，两个答案都来自同一个值——某个 `ElasticQuota` 的名称。这使得常见场景完全自动化，也使特殊场景易于推理。

本文说明该解析规则、插件代用户维护的对象，以及配额层级如何参与准入判定。有关 `ElasticQuota` 对象本身的配置，请参见[容量调度](../capacity-scheduling.md)。

## 解析总览

```
Job（其标签会被复制到 QueueUnit）
  -> 配额名    取自标签 quota.scheduling.koordinator.sh/name
  -> 队列名    与配额名相同
  -> Queue 对象 位于命名空间 koord-queue，由插件自动创建与维护
```

作业扩展会将其所创建 `QueueUnit` 对应作业的标签与注解复制到该 `QueueUnit` 上。插件从 `QueueUnit` 读取配额名，而队列名即为同一字符串。因此每个配额恰好对应一个队列，二者都使用 `ElasticQuota` 的名称。

## 第 1 步：确定配额

插件从标签 `quota.scheduling.koordinator.sh/name` 读取配额名，该标签由作业扩展从作业复制到 `QueueUnit` 上。

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: training-job
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/name: team-a
spec:
  suspend: true
```

由该规则可以推出三点，值得明确说明：

- **不存在基于命名空间的回退。** 未携带该标签的作业不会解析到任何配额，也就不会解析到任何队列。其 `QueueUnit` 会被创建，随后被留在控制器的待处理列表中并周期性重试映射；该单元永远不会被准入，且不会产生任何事件，因此这类配置错误是静默的，只能通过检查作业标签发现。
- **标签指向不存在的配额时会被上报。** 队列名在查找配额之前就已由标签推导得出，因此标签指向未知配额的 `QueueUnit` 会解析到一个并不存在的队列。此时会在该单元上记录一次原因为 `QueueNotFound` 的 `Warning` 事件，消息形如 `queue <name> not found for queueUnit <namespace>/<name>`，并持续重试映射，直到出现同名 `ElasticQuota`。
- **`ElasticQuota` 所在的命名空间与映射无关。** 插件监听所有命名空间中的 `ElasticQuota` 并按名称建立索引，而作业上的标签携带的是名称而非引用。因此配额名在集群范围内必须唯一：不同命名空间中同名的两个 `ElasticQuota` 会被视为同一份配额，以最后被协调的对象为准。

## 第 2 步：确定队列

队列名等于配额名，且 `Queue` 对象由插件维护：

| `ElasticQuota` 上的事件 | 插件的动作 |
|-------------------------|------------|
| 创建 | 在命名空间 `koord-queue` 中创建同名 `Queue`。 |
| 更新 | 协调该 `Queue`：更新策略、父级标签与被同步的注解。 |
| 删除 | 删除该 `Queue`。 |

所有 `Queue` 对象都位于 Koord-Queue 部署所在的命名空间，默认为 `koord-queue`。自动创建的 `Queue` 内容如下：

| 字段 | 取值 |
|------|------|
| `metadata.name` | `ElasticQuota` 的名称。 |
| `metadata.namespace` | `koord-queue`。 |
| `spec.priority` | `1000`。 |
| `spec.queuePolicy` | 标签 `koord-queue/queue-policy` 的取值，前提是该取值属于 `Priority`、`Block`、`Round`、`Intelligent` 之一；否则为 `Priority`。 |
| `metadata.labels["quota.scheduling.koordinator.sh/parent"]` | 从 `ElasticQuota` 复制。 |
| `metadata.annotations` | `ElasticQuota` 上所有以 `koord-queue/` 为前缀的注解，但队列策略键本身除外（它被转换为 `spec.queuePolicy`）。 |

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
    cpu: "8"
    memory: 16Gi
```

上述 `ElasticQuota` 会生成如下 `Queue`：

```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: Queue
metadata:
  name: team-a
  namespace: koord-queue
  labels:
    quota.scheduling.koordinator.sh/parent: ""
  annotations:
    koord-queue/wait-for-pods-running: "true"
    koord-queue/enable-queueunit-preemption: "true"
spec:
  priority: 1000
  queuePolicy: Priority
```

## 协调语义

插件在每次协调时都会依据 `ElasticQuota` 重新推导 `Queue` 的内容，由此产生三点实际影响：

1. **排队策略必须配置在 `ElasticQuota` 上。** 直接写入自动创建的 `Queue` 的 `spec.queuePolicy`，会在下一次协调时被恢复为按配额标签推导出的值；若标签缺失，则恢复为 `Priority`。
2. **直接写入 `Queue` 的注解会被保留。** 协调过程只新增与更新来自 `ElasticQuota` 的注解，不会删除其他注解。因此人工维护的 `Queue` 可以携带额外注解，但其策略仍由配额控制。
3. **删除 `ElasticQuota` 会删除对应的 `Queue`。** 仍在排队的单元会失去所属队列，并在重新出现匹配配额之前通过 `QueueNotFound` 事件上报。

被同步的注解中哪些会被队列评估，取决于该队列的策略。`Priority` 与 `Block` 策略会读取 wait-for-pods-running、抢占与扫描深度注解；`Intelligent` 策略只读取 `koord-queue/priority-threshold`，其余三者对其不产生效果。各策略评估的注解详见[排队策略与调优](./queue-policies-and-tuning.md)。

## 层级与准入判定

配额的父级取自标签 `quota.scheduling.koordinator.sh/parent`。当该标签缺失或为空时，父级默认为 `koordinator-root-quota`，与 koord-scheduler 的行为一致；根配额自身没有父级。

层级会参与准入判定。插件在检查某个 `QueueUnit` 是否放得下时，会从该单元所属配额沿父链向上遍历，直至（但不包含）`koordinator-root-quota`，并对路径上每一份配额按其自身的 `min` 与 `max`（乘以参数 `--oversellrate` 配置的超卖率）评估使用量。该遍历会检测引用环，也会在父级标签所指向的祖先并不存在对应 `ElasticQuota` 时失败。两种情况都会以 `FailedScheduling` 事件呈现在 `QueueUnit` 上，其消息包含下列文本之一：

| 消息 | 含义 |
|------|------|
| `CheckUsage found cycle reference, item:..., quotaName:..., visited quota: ...` | 路径上各配额的父级标签构成了环。 |
| `CheckUsage found quota not exist, item:..., quotaName:..., visited quota: ...` | 父级标签引用的祖先没有对应的 `ElasticQuota`。 |

由于链路上的每一层都会被评估，即使作业所属配额仍有余量，它也可能因某个祖先配额而被拦在队列中。

需要说明的是，参数 `--enableParentLimit` 会被组件接受，但在当前发布版本中不参与任何决策，队列接口中用于施加父级限制的方法也是空实现。因此父级限制体现为上述配额记账行为，而非一个额外的开关。

## 实践建议

| 目标 | 配置方式 |
|------|----------|
| 将作业计入某份配额 | 在作业上添加标签 `quota.scheduling.koordinator.sh/name`，取值为该 `ElasticQuota` 的名称。 |
| 选择队列的出队策略 | 在 `ElasticQuota` 上添加标签 `koord-queue/queue-policy`。 |
| 为队列开启抢占 | 在 `ElasticQuota` 上添加注解 `koord-queue/wait-for-pods-running` 与 `koord-queue/enable-queueunit-preemption`。 |
| 将配额纳入层级 | 在 `ElasticQuota` 上添加标签 `quota.scheduling.koordinator.sh/parent`，并确保该父级存在对应的 `ElasticQuota`。 |
| 在同步注解之外调优队列 | 编辑 `koord-queue` 命名空间下的 `Queue`；注解会在协调中保留，策略不会。 |
| 查看运行中作业的映射结果 | 先读取作业上的配额标签，再查看 `koord-queue` 命名空间下的同名 `Queue`。由作业扩展创建的 `QueueUnit`，其 `spec.queue` 字段为空，因为队列是由插件解析得到，而非写入单元。 |

## 排障

| 现象 | 原因 | 处理方式 |
|------|------|----------|
| `QueueUnit` 上出现 `QueueNotFound` 事件 | 作业带有配额标签，但不存在该名称的 `ElasticQuota`。 | 创建对应的 `ElasticQuota`，或修正标签。 |
| `QueueUnit` 长期没有 phase，也没有任何事件 | 作业完全未带配额标签，无法推导队列名。 | 在作业上添加标签 `quota.scheduling.koordinator.sh/name`。 |
| 作业所在队列与预期不符 | 作业标签指向了另一份配额，而队列名始终跟随配额名。 | 修正标签；不存在独立的队列选择器。 |
| 队列策略总是被改回 `Priority` | `ElasticQuota` 未携带 `koord-queue/queue-policy` 标签，协调时恢复为默认值。 | 在 `ElasticQuota` 上设置该标签。 |
| `Queue` 上出现 `AddQueueFail` 事件 | 所请求的策略未在队列工厂中注册，`Round` 与 `FIFO` 即属此类。 | 改用 `Priority`、`Block` 或 `Intelligent`。 |
| 自身配额有余量，作业仍被拦下 | 层级中某个祖先配额已耗尽。 | 检查父链上每份配额的 `min` 与 `max`。 |
| 出现 `CheckUsage found quota not exist` | 父级标签引用了不存在的配额。 | 创建父级 `ElasticQuota`，或修正标签。 |
| 两份配额相互干扰 | 不同命名空间中存在同名 `ElasticQuota`，而插件仅按名称建立索引。 | 重命名其中之一，使配额名在集群范围内唯一。 |

## 参考

| 关注点 | [koord-queue](https://github.com/koordinator-sh/koord-queue) 中的位置 |
|--------|------------------|
| 配额名解析 | `pkg/framework/plugins/elasticquotav1alpha1/util.go` 中的 `getQuotaName` |
| `QueueUnit` 到队列的映射 | `pkg/framework/plugins/elasticquotav1alpha1/elasticquota.go` 中的 `Mapping` 与 `GetQueueUnitQuotaName` |
| `Queue` 的创建、协调与删除 | `pkg/framework/plugins/elasticquotav1alpha1/elasticquota_handler.go` |
| 注解同步规则 | `pkg/framework/plugins/elasticquotav1alpha1/elasticquota_handler.go` 中的 `shouldSyncAnnotation` |
| 层级用量检查 | `pkg/framework/plugins/elasticquotav1alpha1/cache.go` 中的 `CheckUsage` |
| 父级解析 | `pkg/framework/plugins/elasticquotav1alpha1/util.go` 中的 `getParentQuotaName` |
| 队列工厂与受支持策略 | `pkg/queue/factory.go`、`pkg/queue/queuepolicies/types.go` |

## 后续阅读

- [Koord-Queue 使用指南](./queue-management.md)：安装与端到端使用。
- [排队策略与调优](./queue-policies-and-tuning.md)：策略行为与调优注解。
- [队列级抢占](./queue-preemption.md)：从低优先级作业回收配额。
- [容量调度](../capacity-scheduling.md)：Koordinator 中的 ElasticQuota 配置。

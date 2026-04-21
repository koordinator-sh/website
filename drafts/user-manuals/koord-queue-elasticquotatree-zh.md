# Koord-Queue ElasticQuota 树模式（草稿 - 未发布）

本文档包含从官方文档中移除的 ElasticQuota 树模式相关内容。

---

## ElasticQuota 模式（树模式） - 配置

使用单个 `ElasticQuotaTree` CR（`scheduling.sigs.k8s.io/v1beta1`）在一个资源中定义整个配额层级。

```yaml
controller:
  queueGroupPlugin: elasticquota

pluginConfigs:
  apiVersion: scheduling.k8s.io/v1
  kind: KoordQueueConfiguration
  plugins:
    - name: Priority
    - name: ElasticQuota
  pluginConfigs:
    ElasticQuota:
      checkHungryQuota: false
```

---

## 使用 ElasticQuota（树模式）

使用 ElasticQuota 插件（树模式）时，通过单个 `ElasticQuotaTree` CRD 定义整个配额层级。在 Helm values 中设置 `queueGroupPlugin: elasticquota`。

### 1. 创建 ElasticQuotaTree

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

```bash
$ kubectl apply -f elastic-quota-tree.yaml
```

ElasticQuota 插件会监听 `kube-system` 命名空间中的 `ElasticQuotaTree`，并构建内存中的配额树。默认情况下，它会为每个配额组自动创建 `Queue` 资源（由 `ElasticQuotaTreeBuildQueueForQuota` 特性门控控制）。

### 2. 提交作业

在 `team-a` 命名空间中创建的 `QueueUnit` 会自动关联到 `team-a` 配额。也可以通过标签显式关联 `QueueUnit` 到配额：

```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: QueueUnit
metadata:
  name: my-job-qu
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/name: team-a
spec:
  consumerRef:
    apiVersion: batch/v1
    kind: Job
    name: my-job
    namespace: default
  queue: team-a
  priority: 100
  resource:
    cpu: "4"
    memory: 8Gi
```

ElasticQuota 插件会在允许 `QueueUnit` 出队之前，检查配额组是否有足够的可用资源（考虑 min/max 和超卖率）。

### 高级：可抢占作业

可以将 `QueueUnit` 标记为可抢占，这意味着它在 max 配额范围内运行，且可以被更高优先级的不可抢占作业抢占：

```yaml
metadata:
  labels:
    quota.scheduling.koordinator.sh/preemptible: "true"
```

### 高级：借用限制

可以通过配额节点中的 `alibabacloud.com/lendlimit` 属性控制多少 min 配额可以借给其他组：

```yaml
children:
  - name: team-a
    namespaces: ["team-a"]
    attributes:
      alibabacloud.com/lendlimit: '{"cpu":"10","memory":"20Gi"}'
    min:
      cpu: "40"
      memory: 80Gi
    max:
      cpu: "60"
      memory: 120Gi
```

---

## 指定目标队列 *(公测版)*

> **注意**：此功能仅在 **ElasticQuota（树模式）** 下可用。ElasticQuotaV2 模式中，每个 ElasticQuota 会自动映射到对应的 Queue，不支持此覆盖操作。

默认情况下，Koord-Queue 会根据作业所在的命名空间将 `QueueUnit` 映射到对应的 Queue：ElasticQuota 树解析该命名空间属于哪个配额组，再路由到对应的 Queue。

在 ElasticQuota 树模式中，你可以通过在 `QueueUnit` 上设置 annotation `koord-queue/queue-name` 来显式覆盖目标 Queue。这对于需要将某命名空间的作业调度到非默认 Queue 的场景非常有用——例如使用一个具有不同优先级或策略的 Queue。

```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: QueueUnit
metadata:
  name: my-job
  namespace: team-a
  annotations:
    koord-queue/queue-name: high-priority-queue
spec:
  consumerRef:
    apiVersion: batch/v1
    kind: Job
    name: my-job
    namespace: team-a
  queue: high-priority-queue
  resource:
    cpu: "4"
    memory: 8Gi
```

目标 Queue 必须允许该作业的配额组进入。一个 Queue 允许某个 quota 的条件为：
- 该 Queue 是为该 quota 自动创建的（即其 annotation `koord-queue/quota-fullname` 与该 quota 匹配），**或**
- 该 Queue 的 annotation `koord-queue/available-quota-in-queue` 包含该 quota 名称或通配符 `*`。

如果目标 Queue 不允许该 quota，`QueueUnit` 将无法映射并保持未调度状态。

> 也可以直接在 **Job** 上设置该 annotation，因为 Job Extensions 会自动将 Job 的所有 label 和 annotation 复制到创建的 `QueueUnit` 上。
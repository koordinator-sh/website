---
sidebar_label: 可观测性
---

# Koord-Queue 可观测性

## 引言

Koord-Queue 提供四类互补的可观测能力：Prometheus 指标、Grafana 大盘、用于查询队列内容的 Visibility 聚合 API，以及用于输出配额缓存内部状态的调试 HTTP API。此外，`QueueUnit` 状态、`Queue` 状态与 Kubernetes 事件共同构成了解释单次调度决策所需的信息。

| 观测面 | 提供方 | 开启方式 |
|--------|--------|----------|
| Prometheus 指标（TCP 端口 `10259`） | `koord-queue` | 始终开启 |
| Grafana 大盘 | 仓库产物 `pkg/dashboard/dashboard.json` 与 `pkg/dashboard/exporter.yaml` | 需手动导入 |
| Visibility API（API 组 `visibility.koord-queue.x-k8s.io`） | `koord-queue` | Helm 取值 `controller.enableVisibilityServer=true` |
| 调试 HTTP API（TCP 端口 `19876`） | `koord-queue` | 参数 `--enableApiHandler=true` |
| `QueueUnit` 状态、`Queue` 状态与事件 | `koord-queue` 与 `koord-queue-controllers` | 始终开启 |

## Prometheus 指标

`koord-queue` 进程会在 `10259` 端口启动 HTTP 服务并暴露 `/metrics`。该服务无条件启动，且早于 Leader 选举，因此每个副本都会响应该端口。但描述排队活动的指标只由持有租约的副本产生，因为控制器与调度器只在该副本中运行；其余副本仅提供 Go 采集器指标与 client-go 指标。Helm Chart 未声明该端口的 `containerPort`，也未创建对应的 `Service`，因此采集需直接指向 Pod（例如通过 `PodMonitor`），或在临时排查时进行端口转发：

```bash
$ kubectl -n koord-queue port-forward deployment/koord-queue 10259:10259
$ curl -s http://127.0.0.1:10259/metrics | grep -E '^queueunits_|^job_'
```

### 指标清单

当前实现真正会写入的指标如下。

| 指标 | 类型 | 标签 | 说明 |
|------|------|------|------|
| `dequeued_quota_usage_by_quota` | Gauge | `quota`、`resource` | 已出队作业所占用的资源量，按配额与资源名聚合。 |
| `dequeued_quota_usage_by_namespace` | Gauge | `namespace`、`resource` | 同上，按命名空间聚合。 |
| `job_scheduling_algorithm_latency` | Histogram | 无 | 单次调度周期中过滤阶段的耗时，单位毫秒；桶自 0.01 起以 2 倍指数增长，共 15 个。 |
| `job_schedule_attempts` | Counter | `queue`、`result` | 各队列的调度尝试次数，按结果打标。 |
| `queueunits_by_job_type` | Gauge | `namespace`、`type` | 各命名空间、各作业类型的 `QueueUnit` 数量；创建时加一，删除时减一。 |
| `rest_client_request_duration_seconds` | Histogram | `verb`、`host` | 组件向 APIServer 发送请求的耗时。 |
| `rest_client_requests_total` | Counter | `code`、`method`、`host` | 组件向 APIServer 发送的请求数，按响应码统计。 |

进程同时输出 Go 默认采集器指标，其中包含 `process_cpu_seconds_total` 与 `process_resident_memory_bytes`。

另有三个指标族在代码中已声明，但当前实现从不写入，因此完全不会出现在输出中：`queueunits_in_active_queue`、
`queueunits_in_backoff_queue` 与 `queueunits_coming_rate_by_job_type`。

所有带标签的指标，只有在其标签组合至少被观测到一次之后才会输出。因此刚启动、尚未见到任何队列的控制器只会输出
`job_scheduling_algorithm_latency`、client-go 指标与 Go 采集器指标；`dequeued_quota_usage_by_quota`、
`job_schedule_attempts` 与 `queueunits_by_job_type` 会在队列出现、作业被准入、`QueueUnit` 被创建之后才出现。
也就是说，查询结果为空本身并不能说明安装有问题。

需要说明的是，下文所述 Grafana 大盘引用了指标 `job_scheduling_e2e_latency`，而当前实现并未输出该指标，因此对应面板将始终为空。

## Grafana 大盘

仓库同时提供了大盘与其所期望的采集配置。

| 产物 | 用途 |
|------|------|
| `pkg/dashboard/dashboard.json` | 大盘 `AckKoordQueue`（uid `VhwsfAqVz`），包含各配额资源使用量、按配额与命名空间统计的已出队资源量、作业数、各用户作业数与入队速率、各队列作业数、调度吞吐、调度延迟、组件资源使用量以及 APIServer 请求延迟等面板。 |
| `pkg/dashboard/exporter.yaml` | Prometheus 采集配置：`job_name: koord-queue-exporter`、`metrics_path: /metrics`、目标 `127.0.0.1:10259`。 |

所有面板均以标签 `job="koord-queue-exporter"` 进行过滤，因此采集作业必须使用该名称，否则大盘无数据。在 Kubernetes 部署形态下采集目标是 Pod 而非 `127.0.0.1`，需相应调整采集配置，例如使用抓取作业名为 `koord-queue-exporter` 的 `PodMonitor`。该大盘最初为内部 Grafana 实例编写，导入后需重新选择数据源，且面板标题为中文。

由于所查询的指标当前并未输出，有四个面板会始终为空：查询 `job_scheduling_e2e_latency` 的端到端调度延迟面板，以及查询 `queueunits_in_active_queue`、`queueunits_in_backoff_queue` 与 `queueunits_coming_rate_by_job_type` 的面板。

## Visibility API

Visibility API 是一个聚合 API 组，用于报告队列或配额当前所含的内容。它由 `koord-queue` 进程在 `8082` 端口提供服务，并通过 `APIService` `v1alpha1.visibility.koord-queue.x-k8s.io` 注册。开启后会在 `koord-queue` 命名空间创建名为 `koord-queue-visibility-server` 的 `Service`，其选择器为带有标签 `control-plane: koord-queue` 与 `koord-queue-leader: "true"` 的 Pod。`koord-queue-leader` 标签由赢得 Leader 选举的进程自行打上，因此该 Service 始终路由到持有调度状态的副本。

```bash
$ helm upgrade koord-queue koordinator-sh/koord-queue --version 1.8.0 \
    --namespace koord-queue --reuse \
    --set controller.enableVisibilityServer=true

$ kubectl get apiservice v1alpha1.visibility.koord-queue.x-k8s.io
NAME                                    SERVICE                             AVAILABLE   AGE
v1alpha1.visibility.koord-queue.x-k8s.io koord-queue/koord-queue-visibility-server True      1m
```

### 接口

| 请求 | 说明 |
|------|------|
| `/apis/visibility.koord-queue.x-k8s.io/v1alpha1/queues/{queue}/queueunits` | 指定队列当前在内存中持有的 `QueueUnit`，实际上即仍在排队的单元；队列不存在时返回 `NotFound`。 |
| `/apis/visibility.koord-queue.x-k8s.io/v1alpha1/elasticquotas/{quota}/queueunits` | 映射到指定配额的 `QueueUnit`；支持查询参数 `phase`，例如 `?phase=Enqueued`。 |

每条记录包含 `QueueUnit` 的命名空间与名称、所属配额与队列、请求量与资源总量、phase，以及运行中与等待中的 Pod 数量。

```bash
$ kubectl get --raw "/apis/visibility.koord-queue.x-k8s.io/v1alpha1/queues/team-a/queueunits" | jq .
{
  "kind": "QueueUnitsSummary",
  "apiVersion": "visibility.koord-queue.x-k8s.io/v1alpha1",
  "items": [
    {
      "metadata": { "name": "my-job-blocked", "namespace": "default" },
      "quotaName": "team-a",
      "queueName": "team-a",
      "request": { "cpu": "4", "memory": "8Gi" },
      "resources": { "cpu": "4", "memory": "8Gi" },
      "phase": "Enqueued",
      "podState": { "pending": 0, "running": 0 }
    }
  ]
}

$ kubectl get --raw "/apis/visibility.koord-queue.x-k8s.io/v1alpha1/elasticquotas/team-a/queueunits?phase=Enqueued" | jq '.items | length'
```

该 API 接受查询参数 `queue`、`phase`、`offset` 与 `limit`。其中仅 `phase` 会被求值，且仅在按配额查询的接口生效；`offset` 与 `limit` 虽被接受，但当前不产生作用。集合资源 `queues` 与 `elasticquotas` 仅用于 API 发现，未实现列表操作。

### Leader 选举

队列控制器、调试 API 与 Visibility 服务都只在进程获得 Leader 选举租约之后才启动；该租约是 `default` 命名空间下名为
`example-lease` 的 `Lease`。排查安装问题时有两点需要知道：

- 处于 `Running` 且就绪的 Pod 未必已经在提供服务。重启之后，获得租约最多需要 15 秒的租约时长；在此之前，
  Visibility `Service` 没有就绪端点，`APIService` 会报告 `Available=False`，原因为 `MissingEndpoints`。
- 该租约名称是通用的。集群中任何在 `default` 命名空间使用同名租约的组件（例如同一套排队系统的另一份安装）都会
  阻止本安装成为 Leader。当组件看起来在运行却毫无动作时，应检查 `default/example-lease` 的持有者标识。

```bash
$ kubectl -n default get lease example-lease -o jsonpath='{.spec.holderIdentity}{"\n"}'
$ kubectl -n koord-queue logs deployment/koord-queue -c controller | grep -m1 "became leader"
```

## 调试 HTTP API

参数 `--enableApiHandler=true` 会在 `19876` 端口启动一个额外的 HTTP 服务，用于交互式诊断，Chart 不会为其创建 `Service`。

```bash
$ kubectl -n koord-queue port-forward deployment/koord-queue 19876:19876
```

| 接口 | 内容 |
|------|------|
| `GET /apis/v1/elasticquota` | `ElasticQuotaV2` 插件内存缓存的按配额视图，以配额名为键，包含 `Count`、`Max`、`Min`、`Used`、`SelfUsed`、`ChildrenUsed`、`GuaranteedUsed`、`SelfGuaranteedUsed`、`ChildrenGuaranteedUsed`，以及 `Items`（预留缓存中持有的 `QueueUnit` 列表，含资源、优先级、创建时间与是否处于预留缓存）。资源量以毫单位表示，因此 5 核显示为 `5000`。尚未知晓任何配额时返回空对象。 |
| `GET /apis/v1/queue` | 预留的按队列调试信息接口。响应是以队列名为键的映射，且每个值均为 `null`，因为当前发布版本的各队列实现未提供数据。例如存在 `team-a` 与 `team-b` 两个队列时，响应为 `{"team-a":null,"team-b":null}`。 |
| `GET /apis/v1/userquota` | 预留的按用户配额调试信息接口，结构与限制与上者相同。 |

当需要将配额记账结果与集群中的 `ElasticQuota` 对象进行核对时，按配额接口最为有用：它输出插件所认为的预留量，而过滤阶段正是以该值与 `min`、`max` 比较。

## 单个作业的排查

`QueueUnit` 状态是排查单个作业的首要信息来源。

| 字段 | 说明 |
|------|------|
| `status.phase` | 生命周期位置。`Enqueued` 表示等待中，`Reserved` 表示已持有配额并等待准入检查，`Dequeued` 表示作业已被放行。 |
| `status.message` | 当前 phase 的可读原因，包含过滤阶段给出的信息以及抢占尝试的结果。 |
| `status.attempts` | 调度尝试次数。若该计数持续增长而 phase 不变，说明作业无法放入可用配额。 |
| `status.admissions` | 按 PodSet 给出已准入副本数、运行中副本数、预留资源，以及抢占写入的 `reclaimState`（若存在）。 |
| `status.podState` | 作业运行中与等待中的 Pod 数量。 |
| `status.lastUpdateTime` 与 `status.lastAllocateTime` | 分别用于退避逻辑与回收保护期计算的时间戳。 |

```bash
# 查看单个作业的完整状态
$ kubectl get queueunit my-job-blocked -n default -o yaml

# 排查时最常用的字段精简视图
$ kubectl get queueunit -n default -o custom-columns='NAME:.metadata.name,PHASE:.status.phase,ATTEMPTS:.status.attempts,PRIORITY:.spec.priority,MESSAGE:.status.message'

# 单元所属配额（亦即队列）取自其标签；由作业扩展创建的单元，其 spec.queue 为空
$ kubectl get queueunit -n default \
    -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.metadata.labels.quota\.scheduling\.koordinator\.sh/name}{"\t"}{.status.phase}{"\n"}{end}'
```

`Queue` 对象通过 `status.queueItemDetails` 对外发布队列排序信息，其结构为“队列种类 → 有序条目列表”，每个条目包含命名空间、名称、优先级与位置。列表中只包含仍在队列中等待的单元；已出队的单元会从列表消失，因此空闲队列上该值为空属于预期。列表由每个队列的周期作业刷新，默认间隔 15 秒。两个注解用于控制该行为：`koord-queue/queue-items-refresh-interval` 设置刷新间隔（例如 `30s`），`koord-queue/disable-show-queue-items` 停止该周期作业。停止作业不会清空该字段，因此最后一次发布的值会一直保留，直到发布恢复。

```bash
$ kubectl -n koord-queue get queue team-a -o jsonpath='{.status.queueItemDetails}' | jq .
```

## 事件

Koord-Queue 会在 `QueueUnit` 与 `Queue` 上记录事件。

| 原因 | 类型 | 对象 | 含义 |
|------|------|------|------|
| `Scheduled` | Normal | `QueueUnit` | 该单元已成功出队。 |
| `FailedScheduling` | Normal 或 Warning | `QueueUnit` | 该单元未能被准入，消息中包含过滤阶段给出的原因与抢占尝试结果。 |
| `Preempted` | Warning | `QueueUnit` | 该单元被队列级抢占选为受害者，正等待作业扩展回收其资源。 |
| `Reclaimed` | Normal | `QueueUnit` | 受害者的资源已被回收，该单元重新可调度。 |
| `QueueNotFound` | Warning | `QueueUnit` | 已由单元的标签推导出队列名，但不存在同名 `Queue`；每个单元至多记录一次，且该单元一旦成功映射到队列，相应记账即被清除。若单元完全没有配额标签，则不会产生事件，只是停留在待处理列表中。 |
| `AddQueueFail` | Warning | `Queue` | 队列未能加入调度循环，例如其策略不受支持。 |
| `Deactivated` | Normal | 作业 | `QueueUnit` 被停用，作业已挂起且资源已回收。 |
| `MaximumExecutionTimeExceeded` | Warning | 作业 | 作业执行时长超过 `spec.maximumExecutionTimeSeconds`。 |

```bash
$ kubectl get events -n default --field-selector involvedObject.name=my-job-blocked \
    -o custom-columns='LAST:.lastTimestamp,TYPE:.type,REASON:.reason,MESSAGE:.message'
```

## 日志

Chart 以 `--v=4` 启动 `koord-queue` 容器。用于诊断的日志级别其实更低，输出量也显著更少：

| 级别 | 内容 |
|------|------|
| `--v=1` | 队列创建及其策略、`wait-for-pods-running` 与 `max-depth` 取值；已加载的插件配置；抢占轮次及受害者列表。 |
| `--v=2` | 抢占决策，包含因处于回收保护期而被跳过的受害者；假定集合的进出及原因；回收后内部记账状态的清理。 |
| `--v=4` | Visibility API 的完整请求与响应内容。 |

```bash
$ kubectl -n koord-queue logs deployment/koord-queue -c controller --tail=200 -f
$ kubectl -n koord-queue logs deployment/koord-queue-controllers -c manager --tail=200 -f
```

## 参考

| 关注点 | [koord-queue](https://github.com/koordinator-sh/koord-queue) 中的位置 |
|--------|------------------|
| 指标定义 | `pkg/metrics/metrics.go` |
| 指标 HTTP 服务 | `cmd/main.go` |
| 大盘与采集配置 | `pkg/dashboard/dashboard.json`、`pkg/dashboard/exporter.yaml` |
| Visibility API 类型与存储 | `pkg/visibility/apis/v1alpha1/types.go`、`pkg/visibility/apis/restapi/storage.go` |
| Visibility 服务启动 | `pkg/visibility/server.go` |
| 调试 HTTP API | `cmd/app/server/apihandler.go`、`cmd/app/server/apimethod.go`、`pkg/framework/plugins/elasticquotav1alpha1/api_handler.go` |
| 事件发出位置 | `pkg/scheduler/scheduler.go`、`pkg/controller/eventhandler.go`、`pkg/queue/queuepolicies/schedulingqueuev2/preempt.go` |

## 后续阅读

- [Koord-Queue 使用指南](./queue-management.md)：安装与配置。
- [队列级抢占](./queue-preemption.md)：`Preempted` 与 `Reclaimed` 事件的解读。
- [调度可观测性](../scheduling-monitoring.md)：koord-scheduler 的 Grafana 大盘。

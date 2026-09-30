---
sidebar_label: Observability
---

# Koord-Queue Observability

## Introduction

Koord-Queue exposes four complementary observability surfaces: Prometheus metrics, a Grafana dashboard, an
aggregated visibility API for querying the contents of a queue, and an HTTP debugging API that reports the
internal state of the quota cache. In addition, the `QueueUnit` status, the `Queue` status and Kubernetes
events carry the information that is needed to explain an individual scheduling decision.

| Surface | Provided by | Enabled by |
|---------|-------------|------------|
| Prometheus metrics on TCP port `10259` | `koord-queue` | Always on |
| Grafana dashboard | Repository artefacts `pkg/dashboard/dashboard.json` and `pkg/dashboard/exporter.yaml` | Imported manually |
| Visibility API, group `visibility.koord-queue.x-k8s.io` | `koord-queue` | Helm value `controller.enableVisibilityServer=true` |
| Debugging HTTP API on TCP port `19876` | `koord-queue` | Flag `--enableApiHandler=true` |
| `QueueUnit` status, `Queue` status and events | `koord-queue` and `koord-queue-controllers` | Always on |

## Prometheus Metrics

The `koord-queue` process starts an HTTP server on port `10259` that serves `/metrics`. The server is
started unconditionally and before leader election, so every replica answers on that port. The metrics that
describe queueing activity, however, are produced only by the replica that holds the lease, because the
controller and the scheduler run only there; the other replicas serve the Go collector and the client-go
metrics alone. The Helm chart declares neither a `containerPort` nor a `Service` for this port, therefore
scraping has to target the pods directly, for example through a `PodMonitor`, or the port has to be
forwarded for an ad-hoc inspection:

```bash
$ kubectl -n koord-queue port-forward deployment/koord-queue 10259:10259
$ curl -s http://127.0.0.1:10259/metrics | grep -E '^queueunits_|^job_'
```

### Exported Metrics

The metrics that the current implementation actually populates are the following.

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `dequeued_quota_usage_by_quota` | Gauge | `quota`, `resource` | Amount of resources held by dequeued jobs, aggregated per quota and resource name. |
| `dequeued_quota_usage_by_namespace` | Gauge | `namespace`, `resource` | The same aggregation, per namespace. |
| `job_scheduling_algorithm_latency` | Histogram | none | Latency of the filter phase of a scheduling cycle, in milliseconds. Buckets grow exponentially from 0.01 by a factor of two, fifteen times. |
| `job_schedule_attempts` | Counter | `queue`, `result` | Number of scheduling attempts per queue, labelled with the outcome. |
| `queueunits_by_job_type` | Gauge | `namespace`, `type` | Number of `QueueUnit`s per namespace and job type. Raised when a `QueueUnit` is added and lowered when it is deleted. |
| `rest_client_request_duration_seconds` | Histogram | `verb`, `host` | Latency of the requests that the component sends to the API server. |
| `rest_client_requests_total` | Counter | `code`, `method`, `host` | Number of requests sent to the API server, by response code. |

The process also exports the standard Go collector metrics, among them `process_cpu_seconds_total` and
`process_resident_memory_bytes`.

Three further families are declared in the code but are never populated by the current implementation, so
they do not appear in the output at all: `queueunits_in_active_queue`, `queueunits_in_backoff_queue` and
`queueunits_coming_rate_by_job_type`.

Every metric that carries labels is exported only once its label combination has been observed at least
once. A freshly started controller that has not seen a queue yet therefore serves only
`job_scheduling_algorithm_latency`, the client-go metrics and the Go collector metrics, while
`dequeued_quota_usage_by_quota`, `job_schedule_attempts` and `queueunits_by_job_type` appear as soon as
queues exist, jobs are admitted and `QueueUnit`s are created. An empty result is consequently not by itself
an indication of a broken installation.

Note that the metric `job_scheduling_e2e_latency` is referenced by the Grafana dashboard described below but
is not exported by the current implementation, so the corresponding panel remains empty.

## Grafana Dashboard

The repository ships a ready-made dashboard together with the scrape configuration that it expects.

| Artefact | Purpose |
|----------|---------|
| `pkg/dashboard/dashboard.json` | Dashboard `AckKoordQueue`, uid `VhwsfAqVz`, with panels for quota usage, dequeued resources per quota and namespace, job counts, per-user job counts and arrival rate, per-queue job counts, scheduling throughput, scheduling latency, component resource usage and API server request latency. |
| `pkg/dashboard/exporter.yaml` | Prometheus scrape configuration with `job_name: koord-queue-exporter`, `metrics_path: /metrics` and target `127.0.0.1:10259`. |

Every panel filters by the label `job="koord-queue-exporter"`. The scrape job must therefore carry that
name, otherwise the dashboard shows no data. In a Kubernetes deployment the target is a pod rather than
`127.0.0.1`, so the scrape configuration has to be adapted, for example to a `PodMonitor` whose scrape job
is named `koord-queue-exporter`. The dashboard was authored for an internal Grafana instance; the data
source has to be selected again after the import, and the panel titles are in Chinese.

Four panels stay empty with the current implementation because the metrics they query are not exported:
the end-to-end scheduling latency panel, which queries `job_scheduling_e2e_latency`, and the panels that
query `queueunits_in_active_queue`, `queueunits_in_backoff_queue` and `queueunits_coming_rate_by_job_type`.

## Visibility API

The visibility API is an aggregated API group that reports what a queue or a quota currently holds. It is
served by the `koord-queue` process on port `8082` and is registered through the `APIService`
`v1alpha1.visibility.koord-queue.x-k8s.io`. Enabling it creates a `Service` named
`koord-queue-visibility-server` in the `koord-queue` namespace, which selects pods that carry the labels
`control-plane: koord-queue` and `koord-queue-leader: "true"`. The leader label is applied by the process
that wins the leader election, so the service always routes to the replica that holds the scheduling state.

```bash
$ helm upgrade koord-queue koordinator-sh/koord-queue --version 1.8.0 \
    --namespace koord-queue --reuse \
    --set controller.enableVisibilityServer=true

$ kubectl get apiservice v1alpha1.visibility.koord-queue.x-k8s.io
NAME                                    SERVICE                             AVAILABLE   AGE
v1alpha1.visibility.koord-queue.x-k8s.io koord-queue/koord-queue-visibility-server True      1m
```

### Endpoints

| Request | Description |
|---------|-------------|
| `/apis/visibility.koord-queue.x-k8s.io/v1alpha1/queues/{queue}/queueunits` | The `QueueUnit`s that the named queue currently holds in memory, which are in practice the units that are still enqueued. Returns `NotFound` when the queue does not exist. |
| `/apis/visibility.koord-queue.x-k8s.io/v1alpha1/elasticquotas/{quota}/queueunits` | The `QueueUnit`s that are mapped to the named quota. Supports the query parameter `phase`, for example `?phase=Enqueued`. |

Each item reports the namespace and name of the `QueueUnit`, the quota and queue it belongs to, its request
and its total resource requirement, its phase, and the number of running and pending pods.

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

The API accepts the query parameters `queue`, `phase`, `offset` and `limit`. Only `phase` is evaluated, and
only by the per-quota endpoint; `offset` and `limit` are accepted but currently have no effect. The
collection resources `queues` and `elasticquotas` are registered for discovery purposes and do not
implement a list operation.

### Leader Election

The queue controller, the debugging API and the visibility server all start only after the process has
acquired the leader election lease, which is a `Lease` named `example-lease` in the `default` namespace.
Two consequences are worth knowing when diagnosing an installation:

- A pod that is `Running` and ready is not necessarily serving anything yet. Acquisition can take up to the
  fifteen second lease duration after a restart, and until then the visibility `Service` has no ready
  endpoint and the `APIService` reports `Available=False` with the reason `MissingEndpoints`.
- The lease name is generic. Any other component in the cluster that uses a lease with the same name in the
  `default` namespace, for example another installation of the same queuing system, prevents this
  installation from becoming the leader. Check the holder identity of `default/example-lease` when the
  component appears to be running but does nothing.

```bash
$ kubectl -n default get lease example-lease -o jsonpath='{.spec.holderIdentity}{"\n"}'
$ kubectl -n koord-queue logs deployment/koord-queue -c controller | grep -m1 "became leader"
```

## Debugging HTTP API

The flag `--enableApiHandler=true` starts an additional HTTP server on port `19876`. It is intended for
interactive diagnosis and is not exposed through a `Service`.

```bash
$ kubectl -n koord-queue port-forward deployment/koord-queue 19876:19876
```

| Endpoint | Content |
|----------|---------|
| `GET /apis/v1/elasticquota` | Per-quota view of the in-memory cache of the `ElasticQuotaV2` plugin, keyed by quota name: `Count`, `Max`, `Min`, `Used`, `SelfUsed`, `ChildrenUsed`, `GuaranteedUsed`, `SelfGuaranteedUsed`, `ChildrenGuaranteedUsed`, and `Items`, the list of `QueueUnit`s held in the reserve cache with their resource, priority, creation timestamp and whether they are in the reserve cache. Resource quantities are reported in milli-units, so five cores appear as `5000`. An empty object is returned while no quota is known. |
| `GET /apis/v1/queue` | Reserved for per-queue debugging information. The response is a map with one key per queue, and every value is `null`, because the queue implementations of the current release provide no data. With the queues `team-a` and `team-b` the response is `{"team-a":null,"team-b":null}`. |
| `GET /apis/v1/userquota` | Reserved for per-user quota debugging information, with the same shape and the same limitation. |

The per-quota endpoint is the most useful one when the accounting of a quota has to be reconciled with the
`ElasticQuota` objects in the cluster: it reports what the plugin believes to be reserved, which is the
value that the filter phase compares against `min` and `max`.

## Inspecting an Individual Job

The `QueueUnit` status is the primary source of information about a single job.

| Field | Description |
|-------|-------------|
| `status.phase` | Position in the lifecycle. `Enqueued` means waiting, `Reserved` means quota is held while admission checks run, `Dequeued` means the job has been released. |
| `status.message` | Human-readable reason for the current phase, including the message produced by the filter phase and whether a preemption attempt succeeded. |
| `status.attempts` | Number of scheduling attempts. A steadily growing counter with an unchanged phase indicates that the job does not fit into the available quota. |
| `status.admissions` | Per pod set: the number of admitted replicas, the number of running replicas, the reserved resources and, when set, the `reclaimState` written by preemption. |
| `status.podState` | Number of running and pending pods of the job. |
| `status.lastUpdateTime` and `status.lastAllocateTime` | Timestamps used by the backoff logic and by the reclaim protect time. |

```bash
# Full status of a single job
$ kubectl get queueunit my-job-blocked -n default -o yaml

# Compact view of the fields that matter most during triage
$ kubectl get queueunit -n default -o custom-columns='NAME:.metadata.name,PHASE:.status.phase,ATTEMPTS:.status.attempts,PRIORITY:.spec.priority,MESSAGE:.status.message'

# The quota, and therefore the queue, of a unit is taken from its labels; spec.queue is empty for units
# that a job extension created
$ kubectl get queueunit -n default \
    -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.metadata.labels.quota\.scheduling\.koordinator\.sh/name}{"\t"}{.status.phase}{"\n"}{end}'
```

The `Queue` object reports the ordering that the queue publishes to users in
`status.queueItemDetails`, a map from queue kind to the ordered list of items with their namespace, name,
priority and position. Only the units that are waiting in the queue are listed; a unit that has been
dequeued disappears from the list, so an empty value on an idle queue is expected. The list is refreshed by
a periodic task per queue, every fifteen seconds by default. Two annotations control it:
`koord-queue/queue-items-refresh-interval` sets the refresh interval, for example `30s`, and
`koord-queue/disable-show-queue-items` stops the periodic task. Stopping the task does not clear the field,
so the value that was published last remains visible until publication resumes.

```bash
$ kubectl -n koord-queue get queue team-a -o jsonpath='{.status.queueItemDetails}' | jq .
```

## Events

Koord-Queue records events on the `QueueUnit` and on the `Queue`.

| Reason | Type | Object | Meaning |
|--------|------|--------|---------|
| `Scheduled` | Normal | `QueueUnit` | The unit has been dequeued successfully. |
| `FailedScheduling` | Normal or Warning | `QueueUnit` | The unit could not be admitted. The message carries the reason reported by the filter phase and the outcome of a preemption attempt. |
| `Preempted` | Warning | `QueueUnit` | The unit has been selected as a victim by queue-level preemption and is waiting for the job extension to reclaim its resources. |
| `Reclaimed` | Normal | `QueueUnit` | The resources of a victim have been reclaimed and the unit is schedulable again. |
| `QueueNotFound` | Warning | `QueueUnit` | A queue name was derived from the labels of the unit, but no `Queue` with that name exists. Recorded at most once per unit, and the bookkeeping is cleared as soon as the unit is mapped to a queue. A unit for which no quota label exists at all produces no event and simply stays in the pending list. |
| `AddQueueFail` | Warning | `Queue` | A queue could not be added to the scheduling loop, for example because its policy is not supported. |
| `Deactivated` | Normal | Job | The job was suspended and its resources reclaimed because the `QueueUnit` was deactivated. |
| `MaximumExecutionTimeExceeded` | Warning | Job | The job exceeded `spec.maximumExecutionTimeSeconds`. |

```bash
$ kubectl get events -n default --field-selector involvedObject.name=my-job-blocked \
    -o custom-columns='LAST:.lastTimestamp,TYPE:.type,REASON:.reason,MESSAGE:.message'
```

## Logs

The chart starts the `koord-queue` container with `--v=4`. The verbosity that is useful for diagnosis is
lower and produces considerably less output:

| Level | Content |
|-------|---------|
| `--v=1` | Queue construction with its policy, the value of `wait-for-pods-running` and `max-depth`; the plugin configuration that was loaded; preemption rounds with the list of victims. |
| `--v=2` | Preemption decisions, including victims that were skipped because they are inside the reclaim protect time; insertion into and removal from the assumed set with the reason; clearing of the internal bookkeeping after a reclaim. |
| `--v=4` | Full request and response payloads of the visibility API. |

```bash
$ kubectl -n koord-queue logs deployment/koord-queue -c controller --tail=200 -f
$ kubectl -n koord-queue logs deployment/koord-queue-controllers -c manager --tail=200 -f
```

## Reference

| Concern | Location in [koord-queue](https://github.com/koordinator-sh/koord-queue) |
|---------|------------------|
| Metric definitions | `pkg/metrics/metrics.go` |
| Metrics HTTP server | `cmd/main.go` |
| Dashboard and scrape configuration | `pkg/dashboard/dashboard.json`, `pkg/dashboard/exporter.yaml` |
| Visibility API types and storage | `pkg/visibility/apis/v1alpha1/types.go`, `pkg/visibility/apis/restapi/storage.go` |
| Visibility server bootstrap | `pkg/visibility/server.go` |
| Debugging HTTP API | `cmd/app/server/apihandler.go`, `cmd/app/server/apimethod.go`, `pkg/framework/plugins/elasticquotav1alpha1/api_handler.go` |
| Event emission | `pkg/scheduler/scheduler.go`, `pkg/controller/eventhandler.go`, `pkg/queue/queuepolicies/schedulingqueuev2/preempt.go` |

## What's Next

- [Koord-Queue User Guide](./queue-management.md): Installation and configuration.
- [Queue-Level Preemption](./queue-preemption.md): Interpretation of the `Preempted` and `Reclaimed` events.
- [Scheduling Monitoring](../scheduling-monitoring.md): Grafana dashboards for koord-scheduler.

# Queue Policies and Tuning

## Introduction

Koord-Queue orders work at two levels. Across queues, the `Priority` plugin sorts the queues by
`Queue.spec.priority`, so a queue with a higher priority is served before a queue with a lower one. Within
a queue, the ordering and the behaviour under contention are determined by the queue policy, which is
`Queue.spec.queuePolicy`.

This document describes the three policies that can be selected, the exact ordering rules that they apply,
the annotations that tune their behaviour, and the settings that the components accept but do not currently
evaluate.

## Policy Overview

| Policy | Implementation | Ordering within the queue | Preemption | Tuning annotations that the policy evaluates |
|--------|----------------|---------------------------|------------|----------------------------------------------|
| `Priority` | Shared implementation of `Priority` and `Block` | Priority descending, then first attempt timestamp ascending | Supported | `wait-for-pods-running`, `enable-queueunit-preemption`, `max-depth` |
| `Block` | Shared implementation of `Priority` and `Block` | Priority descending, then first attempt timestamp ascending | Supported | `wait-for-pods-running`, `enable-queueunit-preemption`, `max-depth` |
| `Intelligent` | Dual sub-queue implementation | High priority sub-queue first, each sub-queue ordered by priority then timestamp | Not supported | `priority-threshold` only |

The last column omits the common `koord-queue/` prefix of the tuning annotations; the full keys are listed
under [Tuning Annotations](#tuning-annotations).

Two further policy names exist in the code but cannot be used. `FIFO` is declared as a constant of the
`Queue` API, and `Round` is accepted by the policy matcher of the `ElasticQuotaV2` plugin, yet neither is
registered with the queue factory. Selecting one of them makes the queue construction fail, which is
reported as a `Warning` event with the reason `AddQueueFail` on the `Queue`, and the queue does not serve
any job.

## Ordering Rules

Both levels of ordering are implemented by the `Priority` plugin.

| Comparison | Rule |
|------------|------|
| Between two queues | The queue with the higher `spec.priority` comes first. An unset priority counts as `0`. |
| Between two `QueueUnit`s of a queue | The unit with the higher `spec.priority` comes first. When the priorities are equal, the unit whose first scheduling attempt happened earlier comes first. An unset priority counts as `0`. |

The priority of a `QueueUnit` is derived from the job by the job extension, which reads the priority class
name and the priority value from the pod template of the job, and it is updated when the job changes. It can
also be set directly on the `QueueUnit`.

## Priority Policy

`Priority` is the default policy. The queue keeps its units in a sorted list and hands them to the scheduler
in order. When no unit can be scheduled, the behaviour depends on whether any quota is currently recorded as
blocked:

- If at least one quota is blocked, the blocked bookkeeping is reset and the queue retries immediately.
- Otherwise the queue waits for an event, with a timer of one minute that wakes it up so that throttling
  cannot stall it indefinitely.

Units whose quota is not blocked are retried in turn, so a single unit that does not fit does not prevent the
units behind it from being considered.

## Block Policy

`Block` uses the same ordering and the same implementation as `Priority`, and differs in how the queue
reacts to contention. It maintains a per-quota blocked set: when a unit cannot be scheduled and the resource
situation did not change during the scheduling cycle, the quota of that unit is marked as blocked, and
subsequent scans skip the units of blocked quotas instead of retrying them one by one. A quota leaves the
blocked set when a new unit for it is added, or when a unit of that quota is reserved or dequeued.

Three timers govern the behaviour:

| Timer | Duration | Purpose |
|-------|----------|---------|
| Wake-up timer while blocked | 30 seconds | Re-evaluates the queue when no event arrived. |
| Stale state reset | 3 minutes | Clears the blocked set when nothing has been scheduled for three minutes, which prevents a queue from hanging on stale bookkeeping. |
| Same unit throttle | 5 seconds | Prevents the same unit from being picked twice within five seconds. |

`Block` is the conservative choice: it avoids repeated attempts against a quota that is known to be
exhausted, at the cost of a coarser reaction to small resource changes.

## Intelligent Policy

`Intelligent` splits the units of a queue into two sub-queues around a priority threshold:

- Units with a priority greater than or equal to the threshold are placed in the high priority sub-queue.
- Units with a priority below the threshold are placed in the low priority sub-queue.

Both sub-queues are ordered by priority and then by timestamp. The high priority sub-queue is served first.
The two sub-queues differ in their retry behaviour: when a high priority unit cannot be scheduled, the same
unit is retried, which guarantees that a critical job is not bypassed; when a low priority unit cannot be
scheduled, the queue advances to the next one, which yields a round-robin behaviour and prevents a single
large batch job from starving the rest of the queue.

The threshold defaults to `4` and is configured with the annotation `koord-queue/priority-threshold` on the
`Queue`.

`Intelligent` does not implement preemption. A preemption attempt on such a queue is rejected with an error
and no victim is marked, see [Queue-Level Preemption](./queue-preemption.md).

## Selecting and Changing a Policy

For a queue that is created automatically from an `ElasticQuota`, the policy is taken from the label
`koord-queue/queue-policy`. A value that is not one of `Priority`, `Block`, `Round` or `Intelligent` is
ignored, and the policy defaults to `Priority`.

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

For a queue that is maintained manually, the policy is set in `spec.queuePolicy` of the `Queue`:

```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: Queue
metadata:
  name: team-a
  namespace: koord-queue
spec:
  queuePolicy: Intelligent
  priority: 1000
  annotations:
    koord-queue/priority-threshold: "10"
```

A policy that is written directly to an automatically created `Queue` is reverted at the next reconciliation
of the `ElasticQuota`, see
[ElasticQuota and Queue Mapping](./queue-quota-mapping.md).

Policy changes are applied at runtime, without a restart and without losing the units that are waiting:

- A change between `Priority` and `Block` is applied in place, because both policies share one
  implementation. Only the blocking behaviour switches.
- A change to or from `Intelligent` replaces the implementation. The existing units are carried over to the
  new implementation and re-added, so no unit is dropped and no unit is re-created.

## Tuning Annotations

The following annotations are read from the `Queue` object and all carry the `koord-queue/` prefix. For a
queue that is created automatically they can be set on the `ElasticQuota` instead, from where the
reconciliation copies them to the `Queue`, see
[ElasticQuota and Queue Mapping](./queue-quota-mapping.md).

| Annotation | Applies to | Default | Effect |
|------------|-----------|---------|--------|
| `koord-queue/wait-for-pods-running` | `Priority`, `Block` | absent, that is disabled | Keeps admitted units whose pods are not running yet in the assumed set, so the queue waits for the pods of an admitted job before releasing the next one, and so those units can be considered by preemption. |
| `koord-queue/enable-queueunit-preemption` | `Priority`, `Block` | absent, that is disabled | Enables the preemption path that runs after the quota filter fails. |
| `koord-queue/max-depth` | `Priority`, `Block` | `-1`, unlimited | Limits how deep the queue scans and schedules. `-1` disables the limit. |
| `koord-queue/priority-threshold` | `Intelligent` | `4` | Priority threshold that separates the high priority sub-queue from the low priority sub-queue. |
| `koord-queue/queue-items-refresh-interval` | All policies | `15s` | Refresh interval of the published queue order in `Queue.status.queueItemDetails`. The value is a Go duration, for example `30s` or `2m`. |
| `koord-queue/disable-show-queue-items` | All policies | absent, that is publishing enabled | Stops the periodic task that refreshes `Queue.status.queueItemDetails`. The value that was published last is left in place. The presence of the key is what matters, not its value. |
| `koord-queue/queue-args` | Accepted by all policies | empty | Parsed as a YAML map of strings and passed to the queue implementation. The current implementations do not read any argument, so the annotation has no effect. |

The `Intelligent` policy evaluates `koord-queue/priority-threshold` only. Setting
`koord-queue/wait-for-pods-running`, `koord-queue/enable-queueunit-preemption` or `koord-queue/max-depth`
on an `Intelligent` queue has no effect, so a scan depth limit requires `Priority` or `Block`.

Annotations are re-read whenever the `Queue` object changes, which means that tuning takes effect without a
restart of the component.

## Publishing the Queue Order

Each queue publishes the order in which it would serve its units in `Queue.status.queueItemDetails`. The
value is a map from a queue kind to an ordered list of items; the key is `active` for all three policies.
Every item carries the namespace, the name, the priority and the one-based position of the unit. Only the
units that are waiting in the queue are listed, so an idle queue publishes an empty value. The list is
refreshed by a periodic task, every fifteen seconds by default.

```bash
$ kubectl -n koord-queue get queue team-a -o jsonpath='{.status.queueItemDetails}' | jq .
{
  "active": [
    { "name": "job-a", "namespace": "default", "priority": 100, "position": 1 },
    { "name": "job-b", "namespace": "default", "priority": 10,  "position": 2 }
  ]
}
```

For a queue with the `Intelligent` policy, the published list contains the units of the high priority
sub-queue first, followed by the units of the low priority sub-queue, with positions numbered continuously
across both.

Publication can be turned off with `koord-queue/disable-show-queue-items` on queues that hold a very large
number of units, and its interval can be raised with `koord-queue/queue-items-refresh-interval` to reduce
the write load on the API server. Turning publication off stops the refresh only; it does not clear the
field, so the previously published order stays visible until publication resumes.

## Settings That Are Accepted but Not Evaluated

The components accept several settings that no decision currently consults. They are listed here so that
they are not mistaken for working knobs.

| Setting | Where it is accepted | Status |
|---------|---------------------|--------|
| `--enableParentLimit` | `koord-queue` | Parsed and logged at start-up. No decision reads it, and the queue method that would apply a parent based limit is a no-op. Parent quotas are enforced through the hierarchical usage check instead, see [ElasticQuota and Queue Mapping](./queue-quota-mapping.md). |
| `--default-queue-policy` | `koord-queue` | Registered as a flag and initialised from the environment variables `StrictPriority` and `StrictConsistency`, but its value is never read. The effective default policy comes from the reconciliation of the `ElasticQuota` and is `Priority`. |
| `--defaultPreemptible` | `koord-queue` | Registered as a flag. Victim selection in the queue level preemption path is based on priority and on whether resources can be reclaimed, not on a preemptible attribute, and no preemptible label is read. |
| `--podInitialBackoffSeconds`, `--podMaxBackoffSeconds` | `koord-queue` | Used to populate the argument map of a queue, which the implementations do not read. |
| `koord-queue/queue-args` | `Queue` annotation | Parsed into the same argument map, with the same outcome. |
| `koord-queue/wait-for-pods-running`, `koord-queue/enable-queueunit-preemption` and `koord-queue/max-depth` on an `Intelligent` queue | `ElasticQuota` or `Queue` annotation | Stored on the `Queue`, but not read by the `Intelligent` implementation. |

## Choosing a Policy

| Situation | Recommendation |
|-----------|----------------|
| General purpose queue with mixed priorities | `Priority`. It retries units in turn and reacts quickly to freed resources. |
| Quota is regularly exhausted and repeated attempts against it are wasteful | `Block`. It stops retrying a quota that is known to be exhausted and reacts on events and timers instead. |
| A queue holds both critical jobs and many long-running batch jobs | `Intelligent`. Critical jobs at or above the threshold are retried until they fit, while batch jobs below the threshold are served round-robin. |
| Preemption of admitted jobs is required | `Priority` or `Block`. `Intelligent` does not implement preemption. |
| A scan depth limit is required | `Priority` or `Block`, with `koord-queue/max-depth`. |

## Troubleshooting

| Symptom | Cause | Action |
|---------|-------|--------|
| `AddQueueFail` event on a `Queue` | The policy is not registered, which is the case for `FIFO` and `Round`. | Use `Priority`, `Block` or `Intelligent`. |
| The queue serves no job at all | The queue failed to be constructed, or no unit resolves to it. | Check the events of the `Queue` and the `QueueNotFound` events of the units, see [ElasticQuota and Queue Mapping](./queue-quota-mapping.md). |
| A `Block` queue reacts slowly to freed resources | Blocked quotas are re-evaluated on events and on the 30 second timer, and stale state is cleared after three minutes. | This is the intended behaviour. Use `Priority` when reaction speed matters more than attempt count. |
| The threshold of an `Intelligent` queue does not change | The annotation was written under a key other than `koord-queue/priority-threshold`, or was set on the job rather than on the `ElasticQuota` or the `Queue`. | Set `koord-queue/priority-threshold` on the `ElasticQuota`, or on the `Queue`. |
| An `Intelligent` queue never preempts | Preemption is not implemented for that policy. | Use `Priority` or `Block` for queues that require preemption. |
| `max-depth` has no effect | The queue uses the `Intelligent` policy, which does not read `koord-queue/max-depth`. | Use `Priority` or `Block`. |
| The published order in `status.queueItemDetails` is stale | Publication was disabled, which stops the refresh but keeps the last value, or the refresh interval is large. | Remove `koord-queue/disable-show-queue-items` or lower `koord-queue/queue-items-refresh-interval`. |
| The published order in `status.queueItemDetails` is empty | No unit is waiting in the queue; dequeued units are not listed. | Expected behaviour. Inspect the `QueueUnit` objects of the queue instead. |

## Reference

| Concern | Location in [koord-queue](https://github.com/koordinator-sh/koord-queue) |
|---------|------------------|
| Ordering of queues and of units | `pkg/framework/plugins/priority/priority.go` |
| `Priority` and `Block` implementation, blocked quota bookkeeping, timers | `pkg/queue/queuepolicies/schedulingqueuev2/schedulingqueuev2.go` |
| `Intelligent` implementation, threshold and retry behaviour | `pkg/queue/queuepolicies/intelligentqueue/intelligentqueue.go`, `pkg/queue/queuepolicies/intelligentqueue/methods.go` |
| Annotation constants | `pkg/queue/queuepolicies/schedulingqueuev2/schedulingqueuev2.go`, `pkg/queue/queuepolicies/basequeue/basequeue.go`, `pkg/queue/queuepolicies/types.go` |
| Policy registration and construction | `pkg/queue/factory.go`, `pkg/queue/types.go` |
| Publication of the queue order | `pkg/queue/types.go`, function `sync`, and the `SortedList` method of each implementation |
| Verification suites | `pkg/test/integration/schedulingqueuev2`, `pkg/test/integration/intelligentqueue` |

## What's Next

- [Koord-Queue User Guide](./queue-management.md): Installation and end-to-end usage.
- [ElasticQuota and Queue Mapping](./queue-quota-mapping.md): How quotas and queues are associated.
- [Queue-Level Preemption](./queue-preemption.md): Reclaiming quota from lower-priority jobs.
- [Koord-Queue Observability](./queue-observability.md): Metrics, visibility API and events.

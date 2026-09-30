# Queue-Level Preemption

## Introduction

Koord-Queue admits a job by reserving quota for it before the job is allowed to create pods. A reserved
job continues to occupy its quota until its pods are actually running, and it keeps occupying the quota
while it runs. When the quota of a queue is consumed by jobs that have been admitted but whose pods have
not started yet, a high-priority job submitted afterwards would normally have to wait for those pods to
start, and in the worst case to complete, even though the cluster has not delivered any useful work for
the reserved quota.

Queue-level preemption removes this form of head-of-line blocking. When a high-priority `QueueUnit` cannot
be admitted, Koord-Queue marks the *admitted but not yet running* replicas of lower-priority `QueueUnit`s
in the same queue for reclamation. The job extension then deletes the corresponding pods, reports the
reduced usage, and the released quota is granted to the high-priority job in a subsequent scheduling cycle.

Two properties of this mechanism are important to understand before enabling it:

- **Koord-Queue never deletes a running pod.** Only replicas whose pods have not been bound to a node are
  reclaimed. Preemption therefore accelerates the admission of high-priority jobs; it does not evict
  workloads that are already executing. To reclaim resources from running workloads, use
  [Job Level Preemption](../job-level-preemption.md) or descheduling in koord-scheduler.
- **Preemption is asynchronous.** The preemptor is not admitted in the scheduling cycle in which the
  victims are marked. It is re-queued and admitted later, once the job extension has reclaimed the
  victims' pods and reported the freed quota.

## Concepts

| Term | Description |
|------|-------------|
| Preemptor | A `QueueUnit` with a higher priority that cannot be admitted within the quota of its queue. |
| Assumed set | The set of `QueueUnit`s in a queue that have reserved quota but whose pods are not all running yet. Only members of this set can become victims. |
| Victim | A `QueueUnit` in the assumed set with a lower priority than the preemptor and at least one reclaimable admission. |
| `ReclaimState` | `status.admissions[i].reclaimState.replicas` on a victim. Writing this field is the preemption decision; the job extension acts on it by deleting pods. |
| Reclaim protect time | A grace period, counted from `status.lastAllocateTime`, during which a freshly admitted `QueueUnit` cannot be reclaimed. |

## Supported Scope

| Dimension | Support |
|-----------|---------|
| Queue policy | `Priority` and `Block`. The `Intelligent` policy does not implement preemption; a preemption attempt on such a queue is rejected with an error and no victim is marked. |
| Quota plugin | `ElasticQuotaV2` (the default). Its filter reports the queue as unschedulable when the quota is exhausted, which is what routes the scheduler into the preemption path. |
| Reclaimable state | Admitted replicas whose pods are neither in a terminal phase nor bound to a node. |

## How Preemption Is Triggered

Koord-Queue evaluates preemption at two points of the scheduling cycle. Both require
`koord-queue/wait-for-pods-running` to be enabled on the queue, because that annotation is what keeps
admitted-but-not-running `QueueUnit`s in the assumed set.

1. **Before reserving (`Reserve`).** When a `QueueUnit` is about to be admitted and the assumed set of the
   queue is not empty, every assumed `QueueUnit` that sorts after the incoming one is examined. If at least
   one of them has reclaimable resources, those victims are marked and the incoming `QueueUnit` is not
   admitted in this cycle. If none of them is reclaimable, the queue reports that no further `QueueUnit`
   may be scheduled and the incoming `QueueUnit` waits.
2. **After the quota filter fails (`Preempt`).** When the filter plugins report that the `QueueUnit` does
   not fit into the available quota, the scheduler invokes the preemption routine of the queue. This path
   is additionally gated by `koord-queue/enable-queueunit-preemption`. A dry run selects victims from the
   assumed set, in ascending priority order, until the resources that would be released cover the request
   of the preemptor for every requested resource name. The selected victims are marked, and the preemptor
   is re-queued.

```
high-priority QueueUnit created
  -> popped from the queue (highest priority first)
  -> Reserve: assumed set not empty and a lower-priority member is reclaimable
        -> mark victims (ReclaimState) and re-queue the preemptor
     or
  -> Filter: quota exhausted -> Preempt (requires enable-queueunit-preemption)
        -> dry run over the assumed set, lowest priority first
        -> mark victims until the released resources cover the request
        -> re-queue the preemptor
  -> job extension observes ReclaimState, deletes the victims' pending pods,
     reports the reduced usage
  -> the queue emits the Reclaimed event and makes the victims schedulable again
  -> a later scheduling cycle admits the preemptor
```

Only one preemption round runs per queue at a time. A second request received while a round is in
progress is rejected, which prevents repeated marking of the same victims.

## Enabling Queue-Level Preemption

Preemption is configured with two annotations. Both must be set to `"true"`.

| Annotation | Effect |
|------------|--------|
| `koord-queue/wait-for-pods-running` | Keeps admitted-but-not-running `QueueUnit`s in the assumed set, which makes them visible to the preemption logic, and holds the queue until the pods of an admitted job have started. Preemption is disabled without it. |
| `koord-queue/enable-queueunit-preemption` | Enables the preemption path that runs after the quota filter fails. |

The annotations are read when the queue is created and re-read whenever the `Queue` object is updated, so
no component restart is required.

### Option 1: Annotate the ElasticQuota (recommended)

When the `ElasticQuotaV2` plugin is used, a `Queue` is created automatically for every `ElasticQuota`, and
all annotations with the `koord-queue/` prefix are copied from the `ElasticQuota` to that `Queue`. The
queue policy label itself is not copied, because it is translated into `spec.queuePolicy`.

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

### Option 2: Annotate the Queue

For a `Queue` that is maintained manually, set the same annotations on the `Queue` object. All `Queue`
objects reside in the namespace in which Koord-Queue is deployed, which is `koord-queue` by default.

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

If the `Queue` is created automatically from an `ElasticQuota`, annotations that are written directly to
the `Queue` are preserved by the reconciliation loop, but the `ElasticQuota` remains the intended place for
user configuration.

## Configuring the Reclaim Protect Time

A newly admitted job is often in the middle of pulling images or initialising its runtime. Reclaiming it
immediately wastes the work that has already been done. The reclaim protect time suppresses reclamation
for a configurable period after the quota of a `QueueUnit` has been allocated, that is, after
`status.lastAllocateTime`.

The value is a field of the component configuration and is therefore set through the Helm value
`pluginConfigs`:

```yaml
pluginConfigs:
  apiVersion: scheduling.k8s.io/v1
  kind: KoordQueueConfiguration
  defaultReclaimProtectTime: 5m
  plugins:
    - name: Priority
    - name: ElasticQuotaV2
```

The default is `0`, which disables the protection. A `QueueUnit` whose allocation is younger than the
configured duration is skipped during victim selection, both in the dry run and in the reserve path.

## Victim Selection Rules

A `QueueUnit` in the assumed set is selected as a victim only when all of the following hold:

1. It sorts after the preemptor according to the ordering function of the queue, which means its priority
   is lower, or the priority is equal and it was created later.
2. At least one of its admissions has `replicas` different from `running`, that is, some admitted replica
   has not started running yet.
3. That admission does not carry a `reclaimState` already, so a victim is never marked twice.
4. The reclaim protect time has elapsed since `status.lastAllocateTime`.

In the preemption path that follows a filter failure, victims are considered in ascending priority order
and are accumulated until the resources that would be released are greater than or equal to the request of
the preemptor for every resource name that the preemptor requests. In the reserve path, every assumed
`QueueUnit` with a lower priority than the incoming one is marked in a single round.

When victims are marked, Koord-Queue writes `status.admissions[i].reclaimState.replicas`, sets
`status.message` to `Waiting job extension to reclaim resources.`, and records a `Warning` event with the
reason `Preempted` on each victim. A `QueueUnit` that is already fully dequeued or that does not reserve
any resource is skipped.

## What the Job Extension Does

For every admission that carries a `reclaimState`, the job extension selects up to
`reclaimState.replicas` pods of the corresponding pod set, skipping pods that are in a terminal phase and
pods that are already bound to a node, and deletes them. It then reports the reduced usage back to the
`QueueUnit`. When the `QueueUnit` no longer reserves any resource and its request is no longer satisfied,
the queue releases its internal bookkeeping for that unit, records a `Normal` event with the reason
`Reclaimed`, and the unit becomes schedulable again.

Because pods that are already bound to a node are never selected, a job whose pods have all been scheduled
cannot be reclaimed through this mechanism and stops being a valid victim.

`status.admissions[i].reclaimState` is transient. The job extension clears it as soon as the corresponding
pods have been reclaimed, which on an idle cluster happens within seconds. The durable evidence of a
preemption is therefore the pair of events, `Preempted` followed by `Reclaimed`, and not the field itself.

## Example

The example uses one quota whose guaranteed and maximum capacity are both two CPU cores, so a single
two-core job exhausts the quota. Both jobs are submitted with `spec.suspend: true`, which is what makes
them managed by Koord-Queue.

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

The expected sequence of states is the following.

1. `low-priority-job` is admitted: its `QueueUnit` reaches the `Dequeued` phase, `status.admissions[0].replicas`
   is `1`, `status.admissions[0].reclaimState` is absent, and the job is resumed. As long as the pods of the
   job have not been bound to a node, the `QueueUnit` remains in the assumed set of the queue.
2. `high-priority-job` is submitted. The quota is exhausted, so its `QueueUnit` cannot be admitted. The
   preemption logic marks the lower-priority unit: `status.admissions[0].reclaimState.replicas` of
   `low-priority-job` becomes `1` and its `status.message` becomes
   `Waiting job extension to reclaim resources.`.
3. The job extension deletes the pending pods of `low-priority-job` and reports the released quota. A
   `Reclaimed` event is recorded on the victim.
4. In a following scheduling cycle, `high-priority-job` is admitted and reaches the `Dequeued` phase.

The state of the two units can be inspected with the following commands.

```bash
# Admission and reclaim state of a single job
$ kubectl get queueunit low-priority-job -n default \
    -o jsonpath='{.status.phase}{"\t"}{.status.admissions[0].replicas}{"\t"}{.status.admissions[0].reclaimState.replicas}{"\n"}'

# Preemption and reclaim events of a queue unit
$ kubectl get events -n default --field-selector involvedObject.name=low-priority-job \
    -o custom-columns='REASON:.reason,TYPE:.type,MESSAGE:.message'
```

## Observability

| Signal | Where to look |
|--------|---------------|
| A victim was marked | `Warning` event with reason `Preempted` on the victim `QueueUnit`; `status.admissions[i].reclaimState`; `status.message`. |
| Resources were reclaimed | `Normal` event with reason `Reclaimed` on the victim `QueueUnit`. |
| The preemptor could not be admitted | `status.phase` remains `Enqueued`, `status.message` contains the filter result and whether the preemption attempt succeeded, and `status.attempts` increases. |
| Scheduling pressure of a queue | Metric `job_schedule_attempts{queue,result="unschedulable"}` and metric `queueunits_in_active_queue{queue}`. |
| Detailed decision logs | Controller log with `--v=2` or higher. Victim selection, protection skips and completed rounds are logged with the queue name and the `QueueUnit` reference. |

## Limitations and Troubleshooting

| Symptom | Cause | Action |
|---------|-------|--------|
| No victim is ever marked | `koord-queue/wait-for-pods-running` is not `"true"`, so the assumed set stays empty. | Set the annotation on the `ElasticQuota` or the `Queue`. |
| Preemption never runs after a quota filter failure | `koord-queue/enable-queueunit-preemption` is not `"true"`. | Set the annotation on the `ElasticQuota` or the `Queue`. |
| Preemption is rejected with an error on every attempt | The queue uses the `Intelligent` policy, which does not implement preemption. | Use `Priority` or `Block` for queues that require preemption. |
| A running job is not reclaimed | Reclamation only considers pods that are not bound to a node. | Use [Job Level Preemption](../job-level-preemption.md) or descheduling to reclaim resources from running workloads. |
| A freshly admitted job is never selected | The reclaim protect time has not elapsed. | Lower `defaultReclaimProtectTime`, or wait for the protection window to pass. |
| The preemptor stays `Enqueued` although victims were marked | Preemption is asynchronous, and the preemptor is admitted only after the job extension has reported the freed quota. | Check the pods of the victims, the `Reclaimed` event, and the log of the job extension. |
| The queue stops admitting any job | All admitted `QueueUnit`s are in the assumed set and none of them is reclaimable, so the queue waits for their pods to start. | This is the intended behaviour of `wait-for-pods-running`. Investigate why the pods of the admitted jobs do not start. |

## Reference

The behaviour described in this document is implemented in the following places of the
[koord-queue](https://github.com/koordinator-sh/koord-queue) repository.

| Concern | Location |
|---------|----------|
| Preemption after a filter failure, dry run and victim marking | `pkg/queue/queuepolicies/schedulingqueuev2/preempt.go` |
| Preemption before reserving, assumed set, annotation handling | `pkg/queue/queuepolicies/schedulingqueuev2/schedulingqueuev2.go` |
| Reclaimable resources and protect time | `pkg/utils/util.go`, function `GetResourcesCanReclaim` |
| Reclaim protection configuration | `pkg/apis/config/types.go`, field `DefaultReclaimProtectTime` |
| Scheduler entry point | `pkg/scheduler/scheduler.go` |
| Pod deletion performed for a `reclaimState` | `pkg/jobext/framework/resource_report_controller.go`, function `reconcileReclaim` |
| Annotation synchronisation from `ElasticQuota` to `Queue` | `pkg/framework/plugins/elasticquotav1alpha1/elasticquota_handler.go` |
| End-to-end verification suite | `pkg/test/integration/elasticquotav1alpha1preemption` |

## What's Next

- [Koord-Queue User Guide](./queue-management.md): Installation, queue policies and the `QueueUnit` API.
- [Queue Policies and Tuning](./queue-policies-and-tuning.md): Ordering, blocking behaviour and the tuning annotations of a queue.
- [Job Level Preemption](../job-level-preemption.md): Preemption of running workloads by koord-scheduler.
- [Capacity Scheduling](../capacity-scheduling.md): ElasticQuota configuration in Koordinator.

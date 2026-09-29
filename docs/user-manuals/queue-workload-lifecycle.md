# Workload Lifecycle Control

## Introduction

A `QueueUnit` is the representation of a job inside Koord-Queue. Beyond the phase that describes where a
job is in the queue, the `QueueUnit` API carries a set of fields that allow an operator or an external
controller to intervene in the lifecycle of a job: a job can be paused and resumed without being deleted,
its execution can be bounded in time, its state can be consumed through standard Kubernetes conditions, and
its retries can follow a structured backoff schedule. The field names and their semantics are aligned with
the `Workload` API of Kueue, so tooling written against Kueue concepts maps onto Koord-Queue directly.

| Capability | Field | Purpose |
|------------|-------|---------|
| Pause and resume | `spec.active` | Stop a job from being admitted, and release its quota if it is already admitted, without deleting anything. |
| Execution budget | `spec.maximumExecutionTimeSeconds`, `status.accumulatedPastExecutionTimeSeconds` | Bound the time a job may spend executing and deactivate it when the budget is exhausted. |
| Standardised state | `status.conditions` | Mirror the authoritative `status.phase` into `metav1.Condition` entries for users and external tooling. |
| Structured retry | `status.requeueState` | Record how many times a job has been re-queued and when the next attempt is eligible. |

## Availability

The fields described in this document were added to the `QueueUnit` API after the v1.8.0 release. Two
preconditions therefore apply.

1. **The `QueueUnit` CRD must contain the new fields.** The CRD shipped with the v1.8.0 Helm chart does not
   declare `spec.active`, `spec.maximumExecutionTimeSeconds`, `status.conditions`, `status.requeueState`,
   `status.reclaimablePods` or `status.accumulatedPastExecutionTimeSeconds`, and the API server prunes
   undeclared fields. Apply the CRD from the repository, at
   `pkg/crd/scheduling.x-k8s.io_queueunits.yaml`, or install a chart newer than v1.8.0.
2. **The corresponding feature gate must be enabled.** Feature gates are supplied with the
   `--feature-gates` flag, for example `--feature-gates=QueueUnitActive=true,QueueUnitRequeueState=true`.

| Feature gate | Default | Stage | Enforced by |
|--------------|---------|-------|-------------|
| `QueueUnitConditions` | Enabled | Beta | `koord-queue` and `koord-queue-controllers` |
| `QueueUnitActive` | Disabled | Alpha | `koord-queue` for admission gating; `koord-queue-controllers` for the annotation synchronisation and the deactivation of a job |
| `QueueUnitRequeueState` | Disabled | Alpha | `koord-queue` |
| `MaximumExecutionTime` | Disabled | Alpha | `koord-queue-controllers` |

The `--feature-gates` flag is accepted by the `koord-queue` binary only. The `koord-queue-controllers`
binary, which runs the job extensions, does not expose it, so the gates that are evaluated inside a job
extension remain at their default value in a stock deployment. The practical consequence is stated for each
capability below.

## Pausing and Resuming a Job

`spec.active` determines whether a `QueueUnit` may be admitted. An unset value is treated as `true`.
Setting it to `false` has two effects, which are produced by two different components:

- **The unit stops being scheduled, and stops consuming quota.** The queue keeps an inactive unit in its
  ordering but never hands it to the scheduler. When the value changes, the cached copy of the unit is
  refreshed, the scan cursor of the queue is rewound and the queue is woken up, so both directions of the
  change take effect without a restart. This part is performed by `koord-queue`.
- **A unit that has already been admitted is evicted.** The job is suspended again, the phase returns to
  `Enqueued`, the execution time already spent is banked into
  `status.accumulatedPastExecutionTimeSeconds`, the `Evicted` condition is recorded with the reason
  `Deactivated`, and a `Normal` event with the same reason is emitted. This part is performed by the job
  extension, so it requires the gate in the `koord-queue-controllers` binary, which does not accept
  `--feature-gates`; see [Availability](#availability).

The following behaviour is verified by the integration suite `pkg/test/integration/workloadapi`:

- A `QueueUnit` created with `spec.active: false` is never admitted. Its phase stays away from `Reserved`
  and `Dequeued`, `status.admissions` stays empty, and the whole quota remains available to other units.
- Updating `spec.active` to `true` makes the same `QueueUnit` eligible again, and it is admitted once the
  quota allows it.

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

Admission gating is performed by the queue implementations inside the `koord-queue` binary, so enabling
`QueueUnitActive` on that deployment is sufficient for pausing and resuming to take effect:

```bash
$ kubectl -n koord-queue patch deployment koord-queue --type=json \
    -p='[{"op":"add","path":"/spec/template/spec/containers/0/command/-","value":"--feature-gates=QueueUnitActive=true"}]'
```

Two related mechanisms are implemented in the job extension and are therefore inactive unless that binary
also receives the gate:

- The annotation `scheduling.x-k8s.io/active` on a job, which is synchronised onto `spec.active` of the
  corresponding `QueueUnit`, so that a job can be paused from the job object itself.
- The eviction path that suspends the job, sets the phase back to `Enqueued`, records the
  `Evicted` condition with the reason `Deactivated`, banks the execution time already spent into
  `status.accumulatedPastExecutionTimeSeconds`, and emits a `Normal` event with the reason `Deactivated`.

An inactive `QueueUnit` that is still being reclaimed by preemption is left alone until the reclamation
completes, so pausing a job never races with an in-flight preemption.

## Bounding the Execution Time of a Job

`spec.maximumExecutionTimeSeconds` caps how long a job may execute. The clock starts when the pods of the
job report running, which is the moment recorded by the `PodsReady` condition, so time spent waiting for
admission or for pods to start is not charged against the budget. When the budget is exhausted, the
`QueueUnit` is deactivated: `spec.active` is set to `false`, `status.accumulatedPastExecutionTimeSeconds`
is reset, the `Evicted` condition is recorded with the reason `MaximumExecutionTimeExceeded`, and a
`Warning` event with the same reason is emitted. Reactivating the unit afterwards grants a fresh budget.

The corresponding annotation on a job is `scheduling.x-k8s.io/max-exec-time-seconds`, which mirrors the
upstream `kueue.x-k8s.io/max-exec-time-seconds` label.

Enforcement is implemented in the job extension (`pkg/jobext/framework/activation.go`) and requires the
`MaximumExecutionTime` gate in the `koord-queue-controllers` binary. As that binary does not expose
`--feature-gates`, the execution budget cannot be enabled in a stock deployment of the current release;
the field is accepted by the API and is otherwise inert.

## Consuming the State Through Conditions

`status.phase` remains the authoritative state of a `QueueUnit`. `status.conditions` mirrors it into the
standard `metav1.Condition` representation and is never used to make a scheduling decision, which makes it
safe to consume from external tooling that expects Kubernetes conventions. The gate
`QueueUnitConditions` is enabled by default.

| Condition type | True when |
|----------------|-----------|
| `QuotaReserved` | Quota has been reserved for the unit in its queue, that is, the phase is `Reserved` or later and the unit is not backing off. |
| `Admitted` | All admission checks have passed and the job has been released, that is, the phase is `Dequeued` or later. |
| `PodsReady` | The pods of the job are running. |
| `Finished` | The job succeeded or failed. The reason is `Succeeded` or `Failed`. |
| `Evicted` | The unit lost its admission. The reason states why. |

Reasons reported on the `Evicted` condition:

| Reason | Meaning |
|--------|---------|
| `Deactivated` | `spec.active` was set to `false`. |
| `BackoffTimeout` | The reservation was released while the unit backed off, for example after an admission check was rejected or timed out. |
| `Preempted` | The unit was selected as a victim by queue-level preemption. |
| `MaximumExecutionTimeExceeded` | The job ran longer than `spec.maximumExecutionTimeSeconds`. |

The verified behaviour, from the same integration suite, is that a unit which has been admitted carries
`QuotaReserved=True` and `Admitted=True` with a non-empty reason and a populated `lastTransitionTime`, and
that a unit whose admission check is rejected moves to the `TimeoutBackoff` phase with `Evicted=True`,
reason `BackoffTimeout`, and `QuotaReserved=False`, so the reservation is no longer advertised.

```bash
$ kubectl get queueunit training-job -n default \
    -o custom-columns='PHASE:.status.phase,CONDITIONS:.status.conditions[*].type'
```

## Structured Backoff With requeueState

When a `QueueUnit` has to be re-queued, for example because an admission check was rejected or timed out,
the controller records a structured backoff in `status.requeueState`:

| Field | Description |
|-------|-------------|
| `count` | The number of times the unit has been re-queued. The first backoff records `1`. |
| `requeueAt` | The timestamp from which the unit is eligible for the next attempt. |

The delay grows exponentially with the attempt number, starting from a base of ten seconds, doubling on
each attempt, and capped at fifteen minutes. A symmetric jitter of ten percent is applied, so that many
units that back off at the same moment, which is the typical case when a whole queue is starved, do not
retry in lockstep. When the gate `QueueUnitRequeueState` is disabled, the controller falls back to a flat
backoff duration and `status.requeueState` is not written.

The verified behaviour is that the first rejection records `count: 1` with a `requeueAt` later than
`status.lastUpdateTime`, and that a second rejection records `count: 2` with a `requeueAt` later than the
first one.

```bash
$ kubectl get queueunit training-job -n default \
    -o jsonpath='{.status.phase}{"\t"}{.status.requeueState.count}{"\t"}{.status.requeueState.requeueAt}{"\n"}'
```

## Relation to the Kueue Workload API

| Kueue concept | Koord-Queue counterpart |
|---------------|-------------------------|
| `Workload.spec.active` | `QueueUnit.spec.active` |
| `kueue.x-k8s.io/max-exec-time-seconds` label | `scheduling.x-k8s.io/max-exec-time-seconds` annotation and `QueueUnit.spec.maximumExecutionTimeSeconds` |
| `Workload.status.conditions` with `QuotaReserved`, `Admitted`, `PodsReady`, `Finished`, `Evicted` | `QueueUnit.status.conditions` with the same condition types |
| `Workload.status.requeueState` | `QueueUnit.status.requeueState` |
| `Workload.status.reclaimablePods` | `QueueUnit.status.reclaimablePods` |
| `Workload.status.admissionChecks` | `QueueUnit.status.admissionChecks`, using the Kueue `AdmissionCheckState` type |
| `Workload.spec.podSets` | `QueueUnit.spec.podSet`, using the Kueue `PodSet` type |

The `AdmissionCheckState` and `PodSet` types are taken from the Kueue API directly, so their field
semantics are identical.

## Reference

| Concern | Location in [koord-queue](https://github.com/koordinator-sh/koord-queue) |
|---------|------------------|
| API fields and condition and eviction reason constants | `pkg/apis/scheduling/v1alpha1/type.go` |
| Condition mirroring | `pkg/utils/conditions.go` |
| Backoff computation and recording | `pkg/utils/requeue.go` |
| Activation, deactivation and execution budget | `pkg/jobext/framework/activation.go` |
| Admission gating of inactive units | `pkg/queue/queuepolicies/schedulingqueuev2/schedulingqueuev2.go`, `pkg/queue/queuepolicies/basequeue/basequeue.go`, `pkg/queue/queuepolicies/intelligentqueue/methods.go` |
| Backoff and condition handling on admission check failure | `pkg/controllers/queueunitcontroller.go` |
| Feature gates and defaults | `pkg/features/features.go` |
| Verification suite | `pkg/test/integration/workloadapi` |

## What's Next

- [Koord-Queue User Guide](./queue-management.md): Installation, queue policies and the `QueueUnit` API.
- [Queue-Level Preemption](./queue-preemption.md): How the `Preempted` eviction reason is produced.
- [Koord-Queue Observability](./queue-observability.md): Metrics, the visibility API and debugging commands.

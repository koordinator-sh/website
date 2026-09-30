# ElasticQuota and Queue Mapping

## Introduction

Koord-Queue resolves two independent questions for every job that it manages: which quota the job is
charged against, and which queue the job waits in. With the default `ElasticQuotaV2` plugin both answers
are derived from a single value, the name of an `ElasticQuota`, which makes the common case fully
automatic and the exceptional cases easy to reason about.

This document describes the resolution rules, the objects that the plugin maintains on the user's behalf,
and how the quota hierarchy participates in the admission decision. For the configuration of the
`ElasticQuota` objects themselves, see [Capacity Scheduling](../capacity-scheduling.md).

## Resolution Overview

```
Job (labels are copied onto the QueueUnit)
  -> quota name   from the label quota.scheduling.koordinator.sh/name
  -> queue name   identical to the quota name
  -> Queue object in the namespace koord-queue, created and maintained automatically
```

The job extension copies the labels and annotations of a job onto the `QueueUnit` that it creates for it.
The plugin reads the quota name from the `QueueUnit`, and the queue name is the same string. There is
therefore exactly one queue per quota, and both carry the name of the `ElasticQuota`.

## Step 1: Determining the Quota

The plugin reads the quota name from the label `quota.scheduling.koordinator.sh/name`, which the job
extension copies from the job onto the `QueueUnit`.

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

Three consequences follow from this rule and are worth stating explicitly:

- **There is no namespace based fallback.** A job that does not carry the label does not resolve to any
  quota, and consequently not to any queue. Its `QueueUnit` is created and then held in the pending list of
  the controller, which retries the mapping periodically. The unit is never admitted and no event is
  recorded for it, so this misconfiguration is silent and has to be found in the labels of the job.
- **A label that names a quota which does not exist is reported.** The queue name is derived from the
  label before the quota is looked up, so a `QueueUnit` whose label names an unknown quota resolves to a
  queue that does not exist. A `Warning` event with the reason `QueueNotFound` is then recorded once on the
  unit, with a message of the form `queue <name> not found for queueUnit <namespace>/<name>`, and the
  mapping is retried until a matching `ElasticQuota` appears.
- **The namespace of the `ElasticQuota` is irrelevant for the mapping.** The plugin watches `ElasticQuota`
  objects in all namespaces and indexes them by name, and the label on the job carries a name rather than a
  reference. Quota names must therefore be unique across the cluster; two `ElasticQuota` objects with the
  same name in different namespaces are treated as the same quota, and the one that is reconciled last
  wins.

## Step 2: Determining the Queue

The queue name equals the quota name, and the `Queue` object is maintained by the plugin:

| Event on the `ElasticQuota` | Action of the plugin |
|-----------------------------|----------------------|
| Creation | A `Queue` with the same name is created in the namespace `koord-queue`. |
| Update | The `Queue` is reconciled: policy, parent label and synchronised annotations are updated. |
| Deletion | The `Queue` is deleted. |

All `Queue` objects live in the namespace in which Koord-Queue is deployed, which is `koord-queue` by
default. A `Queue` that is created automatically receives the following content:

| Field | Value |
|-------|-------|
| `metadata.name` | The name of the `ElasticQuota`. |
| `metadata.namespace` | `koord-queue`. |
| `spec.priority` | `1000`. |
| `spec.queuePolicy` | The value of the label `koord-queue/queue-policy`, when that value is one of `Priority`, `Block`, `Round` or `Intelligent`. Otherwise `Priority`. |
| `metadata.labels["quota.scheduling.koordinator.sh/parent"]` | Copied from the `ElasticQuota`. |
| `metadata.annotations` | Every annotation of the `ElasticQuota` whose key starts with `koord-queue/`, except the queue policy key itself, which is translated into `spec.queuePolicy`. |

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

The `ElasticQuota` above produces the following `Queue`:

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

## Reconciliation Semantics

The plugin re-derives the content of the `Queue` from the `ElasticQuota` on every reconciliation. This has
three practical consequences:

1. **The queue policy must be configured on the `ElasticQuota`.** A policy that is written directly to the
   `spec.queuePolicy` of an automatically created `Queue` is restored to the value derived from the quota
   label, or to `Priority` when the label is absent, at the next reconciliation.
2. **Annotations that are written directly to the `Queue` are preserved.** The reconciliation adds and
   updates the annotations that come from the `ElasticQuota`; it does not remove others. A `Queue` that is
   maintained by hand can therefore carry additional annotations, but its policy remains under the control
   of the quota.
3. **Deleting the `ElasticQuota` deletes the `Queue`.** Units that are still enqueued lose their queue and
   are reported through `QueueNotFound` events until a matching quota exists again.

Which of the synchronised annotations a queue evaluates depends on its policy. The `Priority` and `Block`
policies read the wait-for-pods-running, preemption and scan depth annotations, while the `Intelligent`
policy reads `koord-queue/priority-threshold` only and is not affected by the other three.
[Queue Policies and Tuning](./queue-policies-and-tuning.md) lists the annotations that each policy
evaluates.

## Hierarchy and the Admission Decision

The parent of a quota is taken from the label `quota.scheduling.koordinator.sh/parent`. When the label is
absent or empty, the parent defaults to `koordinator-root-quota`, which matches the behaviour of
koord-scheduler; the root quota itself has no parent.

The hierarchy participates in admission. When the plugin checks whether a `QueueUnit` fits, it walks the
chain from the quota of the unit up to, but excluding, `koordinator-root-quota`, and evaluates the usage of
every quota on that path against its own `min` and `max`, scaled by the oversell rate configured with the
flag `--oversellrate`. The walk detects reference cycles, and it fails when an ancestor named by a parent
label does not exist as an `ElasticQuota`. Both conditions surface as a `FailedScheduling` event on the
`QueueUnit` whose message contains one of the following texts:

| Message | Meaning |
|---------|---------|
| `CheckUsage found cycle reference, item:..., quotaName:..., visited quota: ...` | The parent labels of the quotas on the path form a cycle. |
| `CheckUsage found quota not exist, item:..., quotaName:..., visited quota: ...` | An ancestor referenced by a parent label has no corresponding `ElasticQuota`. |

Because every level of the chain is evaluated, a job can be held in the queue by an ancestor quota even
when its own quota still has capacity.

Note that the flag `--enableParentLimit` is accepted by the component but is not consulted by any decision
in the current release, and the queue interface method that would apply a parent based limit is a no-op.
Parent limits are therefore a property of the quota accounting described above, not an additional switch.

## Practical Guidance

| Objective | Configuration |
|-----------|---------------|
| Charge a job to a quota | Add the label `quota.scheduling.koordinator.sh/name` with the name of the `ElasticQuota` to the job. |
| Choose the dequeue policy of a queue | Add the label `koord-queue/queue-policy` to the `ElasticQuota`. |
| Enable preemption for a queue | Add the annotations `koord-queue/wait-for-pods-running` and `koord-queue/enable-queueunit-preemption` to the `ElasticQuota`. |
| Place a quota in a hierarchy | Add the label `quota.scheduling.koordinator.sh/parent` to the `ElasticQuota`, and make sure that the parent exists as an `ElasticQuota`. |
| Tune a queue beyond the synchronised annotations | Edit the `Queue` in the `koord-queue` namespace; annotations survive reconciliation, the policy does not. |
| Inspect the mapping of a running job | Read the quota label of the job, then the `Queue` of the same name in the `koord-queue` namespace. The `spec.queue` field of a `QueueUnit` that was created by a job extension is left empty, because the queue is resolved by the plugin rather than written into the unit. |

## Troubleshooting

| Symptom | Cause | Action |
|---------|-------|--------|
| `QueueNotFound` event on a `QueueUnit` | The job carries a quota label, but no `ElasticQuota` with that name exists. | Create the `ElasticQuota`, or correct the label. |
| A `QueueUnit` stays without a phase and without any event | The job carries no quota label at all, so no queue name could be derived. | Add the label `quota.scheduling.koordinator.sh/name` to the job. |
| The queue of a job is not the expected one | The label on the job names a different quota, and the queue name always follows the quota name. | Correct the label; there is no separate queue selector. |
| The policy of a queue keeps reverting to `Priority` | The `ElasticQuota` does not carry a `koord-queue/queue-policy` label, so the reconciliation restores the default. | Set the label on the `ElasticQuota`. |
| `AddQueueFail` event on a `Queue` | The requested policy is not registered by the queue factory, which is the case for `Round` and for `FIFO`. | Use `Priority`, `Block` or `Intelligent`. |
| A job is held although its own quota has capacity | An ancestor quota in the hierarchy is exhausted. | Inspect the `min` and `max` of every quota on the parent chain. |
| `CheckUsage found quota not exist` | A parent label references a quota that does not exist. | Create the parent `ElasticQuota`, or correct the label. |
| Two quotas interfere with each other | Two `ElasticQuota` objects share a name in different namespaces, and the plugin indexes quotas by name only. | Rename one of the quotas so that names are unique cluster wide. |

## Reference

| Concern | Location in [koord-queue](https://github.com/koordinator-sh/koord-queue) |
|---------|------------------|
| Quota name resolution | `pkg/framework/plugins/elasticquotav1alpha1/util.go`, function `getQuotaName` |
| Mapping of a `QueueUnit` to a queue | `pkg/framework/plugins/elasticquotav1alpha1/elasticquota.go`, functions `Mapping` and `GetQueueUnitQuotaName` |
| Creation, reconciliation and deletion of the `Queue` | `pkg/framework/plugins/elasticquotav1alpha1/elasticquota_handler.go` |
| Annotation synchronisation rule | `pkg/framework/plugins/elasticquotav1alpha1/elasticquota_handler.go`, function `shouldSyncAnnotation` |
| Hierarchical usage check | `pkg/framework/plugins/elasticquotav1alpha1/cache.go`, function `CheckUsage` |
| Parent resolution | `pkg/framework/plugins/elasticquotav1alpha1/util.go`, function `getParentQuotaName` |
| Queue factory and supported policies | `pkg/queue/factory.go`, `pkg/queue/queuepolicies/types.go` |

## What's Next

- [Koord-Queue User Guide](./queue-management.md): Installation and end-to-end usage.
- [Queue Policies and Tuning](./queue-policies-and-tuning.md): Policy behaviour and the tuning annotations.
- [Queue-Level Preemption](./queue-preemption.md): Reclaiming quota from lower-priority jobs.
- [Capacity Scheduling](../capacity-scheduling.md): ElasticQuota configuration in Koordinator.

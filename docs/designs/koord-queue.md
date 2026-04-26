# Koord-Queue

## Overview

Koord-Queue is a native Kubernetes job queuing system for the Koordinator ecosystem. It provides job-level queue management with deep integration into Koordinator's ElasticQuota system, enabling resource fairness, reduced scheduler pressure via pre-scheduling, and support for Priority/Block queuing policies. It is purpose-built for multi-tenant AI/ML and batch workloads.

![Architecture](/img/koord-queue-architecture.png)

## Architecture

The overall system consists of three main parts:

### Koord Queue

The Koord Queue is deployed as a `Deployment`. It listens to the Kubernetes APIServer and manages the lifecycle of `QueueUnit` resources. Its primary responsibilities include:

- Monitoring `QueueUnit` status transitions (e.g., from `Reserved` to `Dequeued` when all admission checks pass).
- Handling admission check results and updating `QueueUnit` status accordingly.
- Managing queue item ordering and position tracking.

The Queue Scheduler watches multiple queues and decides which job (represented by a `QueueUnit`) should be released. The scheduling process uses a plugin-based framework with the following built-in plugins:

- **Priority Plugin**: Sorts `QueueUnits` within a queue by priority (higher first) and creation time (earlier first).
- **ElasticQuota Plugin**: Integrates with Koordinator's individual `ElasticQuota` CRD (scheduling.sigs.k8s.io/v1alpha1) for resource fairness, elastic allocation. 

The scheduling cycle for each queue follows:

1. **Filter** - Check if sufficient resources are available via filter plugins.
2. **Reserve** - Reserve resources for the `QueueUnit` via reserve plugins.
3. **Dequeue** - Transition the `QueueUnit` to the dequeued state and notify the job extension.

### Koord Queue Controllers

Koord Queue Controllers monitor real job CRs (such as TFJob, PyTorchJob, MPIJob, Spark, Argo Workflow, and native Kubernetes Jobs) and bridge them with the queuing system. When a new job is created:

1. The Koord Queue Controllers creates a corresponding `QueueUnit` in the APIServer.
2. The job is suspended: Kubernetes Jobs use `spec.suspend: true`, while other job types (TFJob, PyTorchJob, etc.) use the `scheduling.x-k8s.io/suspend: "true"` annotation.
3. When the `QueueUnit` is dequeued, the Extension Server removes the suspend flag (sets `spec.suspend: false` or removes the annotation), allowing the job to run.

## Core Concepts

### Queue

A `Queue` is a namespace-scoped CRD that defines a logical job queue with a specific queuing policy. **All Queue resources must be created in the `koord-queue` namespace**, which is the namespace where the Koord-Queue controller is deployed. Each queue can be configured with:

- **QueuePolicy**: Either `Priority` (priority-based ordering) or `Block` (strict blocking mode).
- **Priority**: A numeric priority for multi-queue scheduling (higher priority queues are scheduled first).
- **AdmissionChecks**: A list of admission checks that `QueueUnits` in this queue must pass before being dequeued.

### QueueUnit

A `QueueUnit` is a namespace-scoped CRD that represents a job waiting to be scheduled. Unlike `Queue`, a `QueueUnit` can be created in any namespace (typically the same namespace as the job it wraps). It is a wrapper around the actual job (TFJob, PyTorchJob, etc.) and carries the information needed for queuing decisions:

- **ConsumerRef**: A reference to the original job CR.
- **Priority**: The priority of this unit within its queue.
- **Queue**: The name of the queue this unit belongs to.
- **Resource/Request**: The total resource requirements of the job.
- **PodSets**: Descriptions of homogeneous pod groups within the job.

### QueueUnit Lifecycle

The `QueueUnit` goes through the following phases:

```
Enqueued → Reserved → Dequeued → Running → Succeed/Failed
              ↓                ↓
        TimeoutBackoff    SchedReady → SchedSucceed/SchedFailed
     (if admission check       (strict dequeue mode only)
      fails or is rejected)
```

| Phase | Description |
|-------|-------------|
| `Enqueued` | The `QueueUnit` has been created and is waiting in the queue. |
| `Reserved` | Resources have been tentatively reserved; admission checks are in progress. |
| `Dequeued` | All admission checks passed; the job is released to run. |
| `Running` | The job's pods are actively running. |
| `Succeed` | The job completed successfully. |
| `Failed` | The job failed. |
| `SchedReady` | (Strict dequeue mode) All admission checks passed, waiting for scheduler confirmation. |
| `SchedSucceed` | (Strict dequeue mode) The scheduler has confirmed the job is schedulable. |
| `SchedFailed` | (Strict dequeue mode) The scheduler determined the job cannot be scheduled. |
| `TimeoutBackoff` | An admission check failed, was rejected, or timed out; the unit will be retried. |

## Plugin Framework

Koord-Queue's scheduling decisions are driven by a plugin framework similar in spirit to the Kubernetes Scheduler Framework. Plugins are registered in the plugin registry and executed in defined phases:

| Plugin Phase | Description |
|-------------|-------------|
| **MultiQueueSort** | Determines the order in which queues are processed. |
| **QueueSort** | Determines the order of `QueueUnits` within a queue. |
| **QueueUnitMapping** | Maps a `QueueUnit` to its target queue/quota group. |
| **Filter** | Checks whether resources are available for a `QueueUnit`. |
| **Reserve** | Reserves resources and records the allocation. |

### ElasticQuota Integration

#### ElasticQuotaV2 Plugin (Individual CR Mode)

The ElasticQuotaV2 plugin integrates with Koordinator's individual `ElasticQuota` CRD (scheduling.sigs.k8s.io/v1alpha1), where each quota group is a separate resource. This is the default mode (`queueGroupPlugin: elasticquotav2`).

`QueueUnits` are associated with ElasticQuota groups via labels (e.g., `quota.scheduling.koordinator.sh/name`). During scheduling, the plugin checks whether the quota group has sufficient available resources (considering min/max and borrowed resources) before allowing a `QueueUnit` to be dequeued.

Example of individual ElasticQuota CRs:

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: team-a
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/parent: koordinator-root-quota
spec:
  min:
    cpu: "40"
    memory: 80Gi
  max:
    cpu: "60"
    memory: 120Gi
```

Key characteristics:

- Each ElasticQuota is a separate CR, typically created in the user's namespace.
- The plugin automatically creates a corresponding `Queue` resource in the `koord-queue` namespace for each ElasticQuota.
- Parent-child relationships are established via the `quota.scheduling.koordinator.sh/parent` label. Without this label, the default parent is `koordinator-root-quota`.
- Supports elastic borrowing: requests within min are always allowed; requests exceeding min but within max can borrow from other groups' idle resources.

For details on ElasticQuota CRD usage, see [Capacity Scheduling](../user-manuals/capacity-scheduling.md).

### Admission Checks *(Work In Progress)*

> **Note**: The Admission Check controller is not yet included in this release. This section describes the planned API for future use.

Koord-Queue supports an admission check framework (compatible with Kueue's `AdmissionCheck` API). Queues can define a list of admission checks that must all pass before a `QueueUnit` transitions from `Reserved` to `Dequeued`. Each admission check has one of the following states:

| State | Description |
|-------|-------------|
| `Pending` | The check is still in progress. |
| `Ready` | The check has passed successfully. |
| `Retry` | The check needs to be retried. |
| `Rejected` | The check has been rejected. |


## Supported Job Types

Koord-Queue supports multiple job frameworks through its Extension Server architecture. Each supported type requires enabling the corresponding extension in the Helm values:

| Job Type | Helm Value | Description |
|----------|-----------|-------------|
| Kubernetes Job | \extension.batchjob.enable\ | Native Kubernetes batch/v1 Job |
| TFJob | \extension.tf.enable\ | TensorFlow training jobs |
| PyTorchJob | \extension.pytorch.enable\ | PyTorch training jobs |
| Argo Workflow | \extension.argo.enable\ | Argo workflow jobs |
| Spark | \extension.spark.enable\ | Spark application jobs |
| Ray | \extension.ray.enable\ | Ray cluster/job |
| MPI | \extension.mpi.enable\ | MPI jobs |

## Deployment Architecture

Koord-Queue is deployed via Helm charts and consists of the following components:

| Component | Type | Description |
|-----------|------|-------------|
| `koord-queue` | Deployment | The main controller and scheduler. The `admissioncheck-controller` runs as a sidecar container within this Deployment. |
| `koord-queue-controllers` | Deployment | A separate Deployment handling job framework integrations (TFJob, PyTorchJob, etc.). |

## What's Next

- [Koord-Queue User Guide](../user-manuals/koord-queue.md): Learn how to install and use Koord-Queue for job queuing.
- [Capacity Scheduling](../user-manuals/capacity-scheduling.md): Learn about Koordinator's ElasticQuota management.

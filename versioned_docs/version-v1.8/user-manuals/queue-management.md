# Koord-Queue

## Introduction

Koord-Queue is a native Kubernetes job queuing system designed for the Koordinator ecosystem. It manages job admission and ordering across multiple queues, integrating deeply with Koordinator's ElasticQuota for resource fairness and multi-tenant isolation. Key capabilities include:

- **Multi-queue management** with Priority, Block, and Intelligent queuing policies.
- **Deep ElasticQuota integration** to avoid duplicate quota configurations and enable elastic resource sharing.
- **Pre-scheduling** to reduce scheduler pressure by queuing jobs before they create pods.
- **Multi-framework support** including TFJob, PyTorchJob, Spark, Argo Workflow, Ray, and native Kubernetes Jobs.
- **Admission check framework** compatible with Kueue's AdmissionCheck API.

## Setup

### Prerequisite

- Kubernetes >= 1.22
- Koordinator >= 1.5 (for ElasticQuota integration)

### Installation

Install Koord-Queue using Helm:

```bash
# Option 1: Install from Helm repository
helm repo add koordinator-sh https://koordinator-sh.github.io/charts/
helm install koord-queue koordinator-sh/koord-queue --version 1.8.0 \
  --namespace koord-queue \
  --create-namespace


```

Verify the installation:

```bash
$ kubectl get deployment -n koord-queue
NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
koord-queue-controllers    1/1     1            1           30s
koord-queue                1/1     1            1           30s

$ kubectl get crd | grep scheduling.x-k8s.io
queues.scheduling.x-k8s.io          2024-01-01T00:00:00Z
queueunits.scheduling.x-k8s.io      2024-01-01T00:00:00Z
```

### Configurations

Koord-Queue uses ElasticQuotaV2 mode by default.

#### Default Configuration

```yaml
# Image registry (default: Aliyun Beijing)
global:
  imagePrefix: registry.cn-beijing.aliyuncs.com

controller:
  image:
    repository: koordinator-sh/koord-queue
    tag: v1.8.0

extension:
  koord-queue-controllers:
    repository: koordinator-sh/koord-queue-controllers
    tag: v1.8.0
  batchjob:
    enable: true    # Native Kubernetes Job support
  tf:
    enable: false
  pytorch:
    enable: false
  argo:
    enable: false
  spark:
    enable: false
  ray:
    enable: false
  mpi:
    enable: false

pluginConfigs:
  apiVersion: scheduling.k8s.io/v1
  kind: KoordQueueConfiguration
  plugins:
    - name: Priority
    - name: ElasticQuotaV2
```

#### ElasticQuotaV2 Mode (Default)

Uses individual `ElasticQuota` CRs (`scheduling.sigs.k8s.io/v1alpha1`). This is the recommended mode for Koordinator users.

## Use Koord-Queue

### Quick Start with ElasticQuota

This example uses Koordinator's ElasticQuota for elastic resource management.

#### Create an ElasticQuota

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: team-a
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/parent: ""
    quota.scheduling.koordinator.sh/is-parent: "false"
spec:
  max:
    cpu: "4"
    memory: 8Gi
  min:
    cpu: "4"
    memory: 8Gi
```

```bash
$ kubectl apply -f elastic-quota.yaml
```

##### Queue Auto-creation

When using ElasticQuotaV2, the plugin **automatically creates a `Queue` CR** in the `koord-queue` namespace for each ElasticQuota resource. The auto-created Queue has the same name as the ElasticQuota (e.g., `team-a`), with a default `priority: 1000` and `queuePolicy: Priority`. You do **not** need to manually create a Queue for each ElasticQuota.

If you want to customize the Queue policy, you can set the `koord-queue/queue-policy` label on the ElasticQuota:

```yaml
metadata:
  labels:
    koord-queue/queue-policy: Priority  # Options: Priority, Block, Intelligent
```

##### Submit Jobs and verify queuing

Koord-Queue's Job Extensions automatically create `QueueUnit` resources for submitted jobs. To submit a Kubernetes Job managed by Koord-Queue, set `spec.suspend: true` and add the quota label. Save the following two-document YAML as `jobs.yaml` and apply it at once:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: my-job
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/name: team-a
spec:
  suspend: true
  template:
    spec:
      containers:
      - name: test
        image: busybox:stable
        command: ["/bin/sh", "-c", "sleep 30"]
        resources:
          requests:
            cpu: "4"
            memory: 8Gi
          limits:
            cpu: "4"
            memory: 8Gi
      restartPolicy: Never
---
apiVersion: batch/v1
kind: Job
metadata:
  name: my-job-blocked
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/name: team-a
spec:
  suspend: true
  template:
    spec:
      containers:
      - name: test
        image: busybox:stable
        command: ["/bin/sh", "-c", "sleep 30"]
        resources:
          requests:
            cpu: "4"
            memory: 8Gi
          limits:
            cpu: "4"
            memory: 8Gi
      restartPolicy: Never
```

```bash
$ kubectl apply -f jobs.yaml
```

The `team-a` quota has `max.cpu: "4"` and `max.memory: "8Gi"`, which is exactly enough for one job. The ElasticQuotaV2 plugin tracks quota usage based on **running Pod resource consumption**. Once `my-job`'s Pod is Running and consuming the full quota, `my-job-blocked` will be held in the queue:

```bash
# Wait for my-job's pod to reach Running state first
$ kubectl wait --for=condition=Ready pod -l job-name=my-job -n default --timeout=120s

$ kubectl get queueunit my-job-blocked -n default
NAME             PHASE   PRIORITY   ADMISSIONS   JOBTYPE
my-job-blocked                                   Job
```

The `QueueUnit` stays in `Enqueued` phase because `team-a` has already reached its `max` quota. Once `my-job` completes and resources are released, `my-job-blocked` will be dequeued automatically.

For other job types (TFJob, PyTorchJob, etc.), use the `scheduling.x-k8s.io/suspend: "true"` annotation instead of `spec.suspend`.

## Use Queue

### Queue Spec

| Field | Type | Description |
|-------|------|-------------|
| `queuePolicy` | `string` | Queuing policy: `Priority`, `Block`, or `Intelligent`. |
| `priority` | `*int32` | Queue priority for multi-queue ordering. |
| `priorityClassName` | `string` | Kubernetes PriorityClass name. |
| `admissionChecks` | `[]AdmissionCheckWithSelector` | List of admission checks required. |

### Queue Priority

By default, Koord-Queue's Job Extensions automatically derive the `QueueUnit` priority from the job's pod template: it reads `spec.template.spec.priorityClassName` and `spec.template.spec.priority`. If a `PriorityClass` object is found, its `.value` is used as the `QueueUnit` priority; otherwise the raw integer in `spec.template.spec.priority` is used.

You can also manually patch a `QueueUnit`'s `spec.priority` after it is created to override this default and influence dequeue ordering.

#### Priority Queue

Jobs with higher priority values are dequeued first. Among jobs with the same priority, earlier-created jobs are dequeued first:

To set the priority of a `QueueUnit`:

```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: QueueUnit
metadata:
  name: high-priority-job
  namespace: default
spec:
  queue: priority-queue
  priority: 200
  consumerRef:
    apiVersion: batch/v1
    kind: Job
    name: important-job
    namespace: default
  resource:
    cpu: "2"
    memory: 4Gi
```

### Queue Policies

Koord-Queue supports three queue policies to control how jobs are dequeued and scheduled.

#### Priority Policy

**Ordering**: Queue units are ordered by priority value (descending), then by creation timestamp (ascending). Higher priority jobs are always dequeued first. Jobs with the same priority are processed in FIFO order.

**Key Features**:
- Jobs with higher `spec.priority` values are dequeued first
- When multiple jobs have the same priority, earlier-created jobs are scheduled first
- Failed jobs will be re-added to the queue and can be retried
- **Supports preemption**: lower-priority jobs can be preempted to make room for higher-priority jobs

**Scheduling Behavior**:
Priority policy is **not strict priority scheduling**. When high-priority jobs are blocked (e.g., quota exhausted), the scheduler skips them and continues scanning. Lower-priority jobs that are schedulable can dequeue before blocked high-priority jobs. This improves throughput and prevents scheduler stall.

**Key Difference from Block Policy**:
- **Priority**: Optimistic scheduling - continues scheduling when quota is near limit, blocked jobs are skipped
- **Block**: Conservative scheduling - strictly blocks jobs when quota reaches limit

**Use Cases**:
- Multi-tenant environments with different priority levels
- Production jobs that should preempt development jobs

**Configuration Example**:
```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: priority-queue
  labels:
    koord-queue/queue-policy: Priority
spec:
  max:
    cpu: "10"
    memory: 20Gi
```

#### Block Policy

**Ordering**: Same as Priority policy - queue units are ordered by priority (descending) then timestamp (ascending).

**Key Features**:
- **Strict resource blocking**: When quota reaches the limit, subsequent jobs using that quota are blocked
- Unlike Priority policy (which skips blocked high-priority jobs and allows lower-priority schedulable jobs to dequeue first), Block policy strictly enforces priority order
- Prevents resource over-allocation
- Blocked queue units are skipped during scheduling until resources become available

**Key Differences**:
- Priority policy: Not strict priority scheduling - allows lower-priority jobs to dequeue before blocked high-priority jobs
- Block policy: Strict priority scheduling - blocked high-priority jobs must wait, preventing lower-priority jobs from bypassing them

**Use Cases**:
- Resource-constrained environments
- Production workloads requiring guaranteed resource availability
- Multi-tenant isolation where resource limits must be strictly enforced

**Configuration Example**:
```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: block-queue
  labels:
    koord-queue/queue-policy: Block
spec:
  max:
    cpu: "10"
    memory: 20Gi
```

#### Intelligent Policy

**Ordering**: Uses a **dual-queue mechanism** with configurable priority threshold (default: 4):

- **High-priority queue**: Jobs with priority >= threshold
  - Ordered by priority (descending) then timestamp (ascending)
  - **Retry behavior**: On failure, retries the same job (FIFO mode)

- **Low-priority queue**: Jobs with priority < threshold
  - Ordered by priority (descending) then timestamp (ascending)
  - **Retry behavior**: On failure, moves to the next job (Round-Robin mode)

**Key Features**:
- Prioritizes high-priority jobs: high-priority queue is always checked first
- **Retry guarantee for high-priority jobs**: Failed high-priority jobs are immediately retried
- **Round-robin for low-priority jobs**: Failed low-priority jobs yield to the next job
- Threshold configurable via annotation: `koord-queue/priority-threshold`

**Use Cases**:
- Mixed workloads with both critical and batch jobs
- Environments requiring both priority enforcement and fair scheduling

**Configuration Example**:
```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: intelligent-queue
  labels:
    koord-queue/queue-policy: Intelligent
  annotations:
    koord-queue/priority-threshold: "5"
spec:
  max:
    cpu: "10"
    memory: 20Gi
```

#### Policy Comparison

| Feature | Priority | Block | Intelligent |
|---------|----------|-------|-------------|
| Ordering | Priority + Timestamp | Priority + Timestamp | Dual-queue: High (FIFO) + Low (Round-Robin) |
| Retry Behavior | Retry failed job | Retry failed job | High: retry same job; Low: move to next job |
| Resource Blocking | Optimistic | Strict/Conservative | Balanced |
| Preemption Support | Yes | No | Yes (for high-priority jobs) |
| Use Cases | Priority scheduling | Strict resource isolation | Mixed critical + batch workloads |

#### Configuring Queue Policy

Queue policy can be set in two ways:

1. **Via ElasticQuota label** (recommended):
```yaml
metadata:
  labels:
    koord-queue/queue-policy: Priority  # Options: Priority, Block, Intelligent
```

2. **Via Queue CR** (advanced configuration):
```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: Queue
metadata:
  name: my-queue
  namespace: koord-queue
spec:
  queuePolicy: Intelligent
  priority: 1000
  annotations:
    koord-queue/priority-threshold: "5"
```

**Advanced Tuning Annotations**:
- `koord-queue/priority-threshold`: Set threshold for Intelligent policy (default: 4)
- `koord-queue/max-depth`: Limit max number of jobs considered during scheduling
- `koord-queue/wait-for-pods-running`: Wait for pods to enter Running state before dequeuing next job

## Use QueueUnit

###  QueueUnit Spec

| Field | Type | Description |
|-------|------|-------------|
| `consumerRef` | `ObjectReference` | Reference to the original job CR. |
| `priority` | `*int32` | Priority within the queue. |
| `queue` | `string` | Name of the target queue. |
| `resource` | `ResourceList` | Total resource requirements. |
| `podSet` | `[]PodSet` | Pod group definitions (max 8). |
| `priorityClassName` | `string` | Kubernetes PriorityClass name. |
| `request` | `ResourceList` | Actual resource requests parsed from the job. |

### QueueUnit Status

| Field | Type | Description |
|-------|------|-------------|
| `phase` | `QueueUnitPhase` | Current lifecycle phase. |
| `attempts` | `int64` | Number of scheduling attempts. |
| `message` | `string` | Human-readable status message. |
| `lastUpdateTime` | `Time` | Last status update timestamp. |
| `admissionChecks` | `[]AdmissionCheckState` | Status of each admission check. |
| `podState` | `PodState` | Running/Pending pod counts. |
| `admissions` | `[]Admission` | Resource allocation and state per PodSet admission. |

## Use AdmissionCheck

### Admission Checks *(Work In Progress)*

> **Note**: The Admission Check controller is not yet included in this release. This section describes the planned API for future use.

Queues can require admission checks that must pass before a `QueueUnit` is released. This is useful for integrating with external resource provisioning systems.

```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: Queue
metadata:
  name: checked-queue
  namespace: koord-queue
spec:
  queuePolicy: Priority
  admissionChecks:
    - name: prov-req-check
      labelSelector:
        matchLabels:
          requires-provisioning: "true"
```

When a `QueueUnit` is reserved, the admission check controller processes each configured check. The `QueueUnit` transitions to `Dequeued` only when all checks report `Ready` status.

## Observability

### Monitoring

Koord-Queue exposes Prometheus metrics for monitoring:

```bash
# Port-forward to the controller
$ kubectl port-forward -n koord-queue svc/koord-queue 10259:10259

# Fetch metrics
$ curl http://localhost:10259/metrics
```

If the visibility server is enabled (`enableVisibilityServer: true`), you can query queue status via REST API:

```bash
$ curl http://koord-queue-visibility:8090/api/queues
```

### Debugging

Check the controller logs for scheduling decisions:

```bash
$ kubectl logs -n koord-queue deployment/koord-queue-controller -f --tail=100
```

Inspect `QueueUnit` status for scheduling details:

```bash
$ kubectl describe queueunit <name> -n <namespace>
```

Check Kubernetes events for scheduling-related messages:

```bash
$ kubectl get events -n <namespace> --field-selector reason=Scheduling
```
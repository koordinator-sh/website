# Koord-Queue

## Introduction

Koord-Queue is a native Kubernetes job queuing system designed for the Koordinator ecosystem. It manages job admission and ordering across multiple queues, integrating deeply with Koordinator's ElasticQuota for resource fairness and multi-tenant isolation. Key capabilities include:

- **Multi-queue management** with FIFO and Priority queuing policies.
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
helm install koord-queue ./charts/v1.2.0 \
  --namespace koord-queue \
  --create-namespace
```

Verify the installation:

```bash
$ kubectl get deployment -n koord-queue
NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
koord-queue-controller     1/1     1            1           30s

$ kubectl get crd | grep scheduling.x-k8s.io
queues.scheduling.x-k8s.io          2024-01-01T00:00:00Z
queueunits.scheduling.x-k8s.io      2024-01-01T00:00:00Z
```

### Configurations

Key Helm values for customization:

```yaml
controller:
  # Queue group plugin: elasticquotav2, elasticquota, or resourceQuota
  queueGroupPlugin: elasticquotav2
  # Enable strict dequeue mode (requires scheduler confirmation before dequeue)
  enableResourceCheckWithScheduler: false
  # Enable strict priority (higher priority queues always scheduled first)
  enableStrictPriority: false
  # Default preemptible flag for QueueUnits
  defaultPreemptible: true

extension:
  # Enable/disable job framework integrations
  tf:
    enable: false
  pytorch:
    enable: false
  batchjob:
    enable: true    # Native Kubernetes Job support
  argo:
    enable: false
  spark:
    enable: false
  ray:
    enable: false

# Plugin configuration
pluginConfigs:
  apiVersion: scheduling.k8s.io/v1
  kind: KoordQueueConfiguration
  plugins:
    - name: Priority
    - name: ElasticQuotaV2
```

## Use Koord-Queue

### Quick Start with ResourceQuota

This example demonstrates multi-queue job scheduling with Kubernetes native ResourceQuota.

#### 1. Create queues and resource quotas

All `Queue` resources must be created in the `koord-queue` namespace (the controller's namespace). `ResourceQuota` and jobs are created in their own namespaces.

```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: Queue
metadata:
  name: queue1
  namespace: koord-queue
spec:
  queuePolicy: Priority
```

```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: Queue
metadata:
  name: queue2
  namespace: koord-queue
spec:
  queuePolicy: Priority
```

```bash
$ kubectl apply -f queue1.yaml
$ kubectl apply -f queue2.yaml
```

#### 2. Create namespaces and resource quotas

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: queue1
  namespace: queue1
spec:
  hard:
    cpu: "4"
    memory: 4Gi
```

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: queue2
  namespace: queue2
spec:
  hard:
    cpu: "4"
    memory: 4Gi
```

```bash
$ kubectl create namespace queue1
$ kubectl create namespace queue2
$ kubectl apply -f resource_quota_q1.yaml
$ kubectl apply -f resource_quota_q2.yaml

$ kubectl get resourcequota -A -o wide
NAMESPACE   NAME     AGE   REQUEST                        LIMIT
queue1      queue1   10s   cpu: 0/4, memory: 0/4Gi
queue2      queue2   10s   cpu: 0/4, memory: 0/4Gi
```

#### 3. Submit jobs

Create a TFJob with the suspend annotation (Koord-Queue Job Extensions handle this automatically). For TFJob/PyTorchJob, use the `scheduling.x-k8s.io/suspend` annotation; for Kubernetes Jobs, use `spec.suspend: true`:

```yaml
apiVersion: "kubeflow.org/v1"
kind: "TFJob"
metadata:
  name: "job1_q1"
  namespace: "queue1"
  annotations:
    scheduling.x-k8s.io/suspend: "true"
spec:
  tfReplicaSpecs:
    PS:
      replicas: 1
      restartPolicy: Never
      template:
        spec:
          containers:
            - name: tensorflow
              image: busybox:stable
              command: ["/bin/sh", "-c", "--"]
              args: ["sleep 30s"]
              resources:
                requests:
                  cpu: 1
                  memory: 1Gi
                limits:
                  cpu: 1
                  memory: 1Gi
    Worker:
      replicas: 2
      restartPolicy: Never
      template:
        spec:
          containers:
            - name: tensorflow
              image: busybox:stable
              command: ["/bin/sh", "-c", "--"]
              args: ["sleep 30s"]
              resources:
                requests:
                  cpu: 1
                  memory: 1Gi
                limits:
                  cpu: 1
                  memory: 1Gi
```

#### 4. Observe queuing behavior

Initially, only one job per queue runs because of resource limits:

```bash
$ kubectl get tfjob -n queue1
NAME      STATE     AGE
job1_q1   Running   5s
job2_q1   Queuing   5s

$ kubectl get pods -n queue1
NAME               READY   STATUS    RESTARTS   AGE
job1_q1-ps-0       1/1     Running   0          8s
job1_q1-worker-0   1/1     Running   0          8s
job1_q1-worker-1   1/1     Running   0          8s
```

When job1 completes, job2 is dequeued and starts running:

```bash
$ kubectl get tfjob -n queue1
NAME      STATE       AGE
job1_q1   Succeeded   38s
job2_q1   Running     38s
```

#### 5. Verify queue status

```bash
$ kubectl get queue -n koord-queue
NAME     AGE
queue1   10m
queue2   10m

$ kubectl get queueunit -A
NAMESPACE   NAME          PHASE      PRIORITY
queue1      job1_q1-qu    Succeed    0
queue1      job2_q1-qu    Running    0
queue2      job1_q2-qu    Succeed    0
queue2      job2_q2-qu    Running    0
```

### Quick Start with ElasticQuota

This example uses Koordinator's ElasticQuota for elastic resource management. Koord-Queue supports two ElasticQuota plugin modes:

- **ElasticQuotaV2** (default): Uses individual `ElasticQuota` CRs (`scheduling.sigs.k8s.io/v1alpha1`). Set `queueGroupPlugin: elasticquotav2`.
- **ElasticQuota**: Uses a single `ElasticQuotaTree` CR (`scheduling.sigs.k8s.io/v1beta1`) to define the entire quota hierarchy. Set `queueGroupPlugin: elasticquota`.

#### Using ElasticQuotaV2 (Default Mode)

##### 1. Create an ElasticQuota

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
    cpu: "40"
    memory: 80Gi
  min:
    cpu: "10"
    memory: 20Gi
```

```bash
$ kubectl apply -f elastic-quota.yaml
```

##### 2. Queue Auto-creation

When using ElasticQuotaV2, the plugin **automatically creates a `Queue` CR** in the `koord-queue` namespace for each ElasticQuota resource. The auto-created Queue has the same name as the ElasticQuota (e.g., `team-a`), with a default `priority: 1000` and `queuePolicy: Priority`. You do **not** need to manually create a Queue for each ElasticQuota.

If you want to customize the Queue policy, you can set the `koord-queue/queue-policy` label on the ElasticQuota:

```yaml
metadata:
  labels:
    koord-queue/queue-policy: FIFO
```

##### 3. Submit a Job with quota label

Koord-Queue's Job Extensions automatically create `QueueUnit` resources for submitted jobs. To submit a Kubernetes Job managed by Koord-Queue, set `spec.suspend: true` and add the quota label. The job-extensions controller will create the corresponding `QueueUnit` and associate it with the `team-a` quota group:

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
```

The ElasticQuotaV2 plugin will check whether `team-a` has sufficient available resources (considering min/max and borrowed resources) before allowing the `QueueUnit` to be dequeued. Once dequeued, the job-extensions controller sets `spec.suspend: false` to resume the job.

For other job types (TFJob, PyTorchJob, etc.), use the `scheduling.x-k8s.io/suspend: "true"` annotation instead of `spec.suspend`.

#### Using ElasticQuota (Tree Mode)

With the ElasticQuota plugin (Tree Mode), you define the entire quota hierarchy in a single `ElasticQuotaTree` CRD. Set `queueGroupPlugin: elasticquota` in your Helm values.

##### 1. Create an ElasticQuotaTree

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

The ElasticQuota plugin will watch the `ElasticQuotaTree` in `kube-system` namespace and build an in-memory quota tree. By default, it will also automatically create `Queue` resources for each quota group (controlled by `ElasticQuotaTreeBuildQueueForQuota` feature gate).

##### 2. Submit a Job

`QueueUnits` created in the `team-a` namespace are automatically associated with the `team-a` quota. Alternatively, you can explicitly associate a `QueueUnit` to a quota via label:

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

The ElasticQuota plugin will check whether the quota group has sufficient available resources (considering min/max and oversell rate) before allowing the `QueueUnit` to be dequeued.

##### Advanced: Preemptible Jobs

You can mark a `QueueUnit` as preemptible, which means it runs within the max quota and can be preempted by higher-priority non-preemptible jobs:

```yaml
metadata:
  labels:
    quota.scheduling.koordinator.sh/preemptible: "true"
```

##### Advanced: Lendlimit

You can control how much min quota can be lent to other groups via the `alibabacloud.com/lendlimit` attribute in the quota node:

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

### Queue Policies

#### FIFO Queue

Jobs are dequeued in the order they were created:

```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: Queue
metadata:
  name: fifo-queue
  namespace: koord-queue
spec:
  queuePolicy: FIFO
```

#### Priority Queue

Jobs with higher priority values are dequeued first. Among jobs with the same priority, earlier-created jobs are dequeued first:

```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: Queue
metadata:
  name: priority-queue
  namespace: koord-queue
spec:
  queuePolicy: Priority
  priority: 100
```

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

### Admission Checks

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

### Supported Job Types

Koord-Queue supports multiple job frameworks through its Extension Server architecture. Each supported type requires enabling the corresponding extension in the Helm values:

| Job Type | Helm Value | Description |
|----------|-----------|-------------|
| Kubernetes Job | `extension.batchjob.enable` | Native Kubernetes batch/v1 Job |
| TFJob | `extension.tf.enable` | TensorFlow training jobs |
| PyTorchJob | `extension.pytorch.enable` | PyTorch training jobs |
| Argo Workflow | `extension.argo.enable` | Argo workflow jobs |
| Spark | `extension.spark.enable` | Spark application jobs |
| Ray | `extension.ray.enable` | Ray cluster/job |

### CRD Reference

#### Queue Spec

| Field | Type | Description |
|-------|------|-------------|
| `queuePolicy` | `string` | Queuing policy: `FIFO` or `Priority`. |
| `priority` | `*int32` | Queue priority for multi-queue ordering. |
| `priorityClassName` | `string` | Kubernetes PriorityClass name. |
| `admissionChecks` | `[]AdmissionCheckWithSelector` | List of admission checks required. |

#### QueueUnit Spec

| Field | Type | Description |
|-------|------|-------------|
| `consumerRef` | `ObjectReference` | Reference to the original job CR. |
| `priority` | `*int32` | Priority within the queue. |
| `queue` | `string` | Name of the target queue. |
| `resource` | `ResourceList` | Total resource requirements. |
| `podSet` | `[]PodSet` | Pod group definitions (max 8). |
| `priorityClassName` | `string` | Kubernetes PriorityClass name. |
| `request` | `ResourceList` | Actual resource requests parsed from the job. |

#### QueueUnit Status

| Field | Type | Description |
|-------|------|-------------|
| `phase` | `QueueUnitPhase` | Current lifecycle phase. |
| `attempts` | `int64` | Number of scheduling attempts. |
| `message` | `string` | Human-readable status message. |
| `lastUpdateTime` | `Time` | Last status update timestamp. |
| `admissionChecks` | `[]AdmissionCheckState` | Status of each admission check. |
| `podState` | `PodState` | Running/Pending pod counts. |
| `admissions` | `[]Admission` | Resource allocation and state per PodSet admission. |

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

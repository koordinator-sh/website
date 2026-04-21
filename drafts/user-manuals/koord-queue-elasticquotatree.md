# Koord-Queue ElasticQuota Tree Mode (Draft - Not Published)

This document contains the ElasticQuota Tree Mode sections removed from the official documentation.

---

## ElasticQuota Mode (Tree Mode) - Configuration

Uses a single `ElasticQuotaTree` CR (`scheduling.sigs.k8s.io/v1beta1`) to define the entire quota hierarchy in one resource.

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

## Using ElasticQuota (Tree Mode)

With the ElasticQuota plugin (Tree Mode), you define the entire quota hierarchy in a single `ElasticQuotaTree` CRD. Set `queueGroupPlugin: elasticquota` in your Helm values.

### 1. Create an ElasticQuotaTree

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

### 2. Submit a Job

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

### Advanced: Preemptible Jobs

You can mark a `QueueUnit` as preemptible, which means it runs within the max quota and can be preempted by higher-priority non-preemptible jobs:

```yaml
metadata:
  labels:
    quota.scheduling.koordinator.sh/preemptible: "true"
```

### Advanced: Lendlimit

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

---

## Specifying a Target Queue *(Alpha)*

> **Note**: This feature is only available in **ElasticQuota (Tree Mode)**. In ElasticQuotaV2 mode, each ElasticQuota automatically maps to its own Queue and this override is not supported.

By default, Koord-Queue maps a `QueueUnit` to a Queue based on the job's namespace: the ElasticQuota tree resolves which quota group the namespace belongs to, then routes the job to the corresponding Queue.

In ElasticQuota Tree Mode, you can explicitly override the target Queue by setting the annotation `koord-queue/queue-name` on the `QueueUnit`. This is useful when a namespace's jobs need to be dispatched to a different Queue than the default one — for example, to use a Queue with a different priority or policy.

```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: QueueUnit
metadata:
  name: my-job
  namespace: team-a
  annotations:
    koord-queue/queue-name: high-priority-queue   # explicitly target this Queue
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

The target Queue must allow the job's quota group. A Queue allows a quota when:
- The Queue was auto-created for that quota (its annotation `koord-queue/quota-fullname` matches the quota), **or**
- The Queue's annotation `koord-queue/available-quota-in-queue` contains the quota name or a wildcard `*`.

If the target Queue does not allow the quota, the `QueueUnit` will fail to map and remain unscheduled.

> You can also set this annotation on the **Job** directly (as a job annotation), since Job Extensions copy all job labels and annotations to the created `QueueUnit` automatically.
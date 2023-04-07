# PodMigrationJob

Koordinator defines a CRD-based Pod migration API called `PodMigrationJob`, through which the descheduler or other automatic fault recovery components can evict or delete Pods more safely.

## Introduction

Migrating Pods is an important capability that many components (such as deschedulers) rely on, and can be used to optimize scheduling or help resolve workload runtime quality issues. We believe that pod migration is a complex process, involving steps such as auditing, resource allocation, and application startup, and is mixed with application upgrading, scaling scenarios, and resource operation and maintenance operations by cluster administrators. Therefore, how to manage the stability risk of this process to ensure that the application does not fail due to the migration of Pods is a very critical issue that must be resolved.

Based on the final state-oriented migration capability of the PodMigrationJob CRD, we can track the status of each process during the migration process, perceive scenarios such as application upgrades and scaling to ensure the stability of the workload.

## Setup

### Prerequisite

- Kubernetes >= 1.18
- Koordinator >= 0.6

### Installation

Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to [Installation](/docs/installation).

### Configurations

PodMigrationJob is *Enabled* by default. You can use it without any modification on the koord-descheduler config.

## Use PodMigrationJob

### Quick Start

1. Create a Deployment `pod-demo` with the YAML file below.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pod-demo
  namespace: default
spec:
  progressDeadlineSeconds: 600
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app: pod-demo
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
    type: RollingUpdate
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: pod-demo
      name: stress
    spec:
      containers:
      - args:
        - -c
        - "1"
        command:
        - stress
        image: polinux/stress
        imagePullPolicy: Always
        name: stress
        resources:
          limits:
            cpu: "2"
            memory: 4Gi
          requests:
            cpu: 200m
            memory: 400Mi
      restartPolicy: Always
      schedulerName: koord-scheduler
```

```bash
$ kubectl create -f pod-demo.yaml
deployment.apps/pod-demo created
```

2. Check the scheduled result of the pod `pod-demo-0`.

```bash
$ kubectl get pod -o wide
NAME                        READY   STATUS    RESTARTS   AGE   IP            NODE     NOMINATED NODE   READINESS GATES
pod-demo-5f9b977566-c7lvk   1/1     Running   0          41s   10.17.0.9     node-0   <none>           <none>
```

`pod-demo-5f9b977566-c7lvk` is scheduled on the node `node-0`.

3. Create a `PodMigrationJob` with the YAML file below to migrate `pod-demo-0`.

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: PodMigrationJob
metadata:
  name: migrationjob-demo
spec:
  paused: false
  ttl: 5m
  mode: ReservationFirst
  podRef:
    namespace: default
    name: pod-demo-5f9b977566-c7lvk
status:
  phase: Pending
```

```bash
$ kubectl create -f migrationjob-demo.yaml
podmigrationjob.scheduling.koordinator.sh/migrationjob-demo created
```

5. Query migration status

```bash
$ kubectl get podmigrationjob migrationjob-demo
NAME                PHASE     STATUS     AGE   NODE     RESERVATION                            PODNAMESPACE   POD                         NEWPOD                      TTL
migrationjob-demo   Succeed   Complete   37s   node-1   d56659ab-ba16-47a2-821d-22d6ba49258e   default        pod-demo-5f9b977566-c7lvk   pod-demo-5f9b977566-nxjdf   5m0s
```

From the above results, it can be observed that:
- **PHASE** is `Succeed`, **STATUS** is `Complete`, indicating that the migration is successful. 
- **NODE** `node-1` indicates the node where the new Pod is scheduled after the migration. 
- **RESERVATION** `d56659ab-ba16-47a2-821d-22d6ba49258e` is the Reservation created during migration. The PodMigrationJob Controller will try to create the reserved resource for the Reservation before starting to evict the Pod. After the reservation is successful, the eviction will be initiated, which can ensure that the new Pod must be expelled. There are resources available. 
- **PODNAMESPACE** `default` represents the namespace where the migrated Pod is located, 
- **POD** `pod-demo-5f9b977566-c7lvk` represents the Pod to be migrated, 
- **NEWPOD** `pod-demo-5f9b977566-nxjdf` is the newly created Pod after migration.
- **TTL** indicates the TTL period of the current Job.

6. Query migration events

PodMigrationJob Controller will create Events for important steps in the migration process to help users diagnose migration problems

```bash
$ kubectl describe podmigrationjob migrationjob-demo
...
Events:
  Type    Reason                Age    From               Message
  ----    ------                ----   ----               -------
  Normal  ReservationCreated    8m33s  koord-descheduler  Successfully create Reservation "d56659ab-ba16-47a2-821d-22d6ba49258e"
  Normal  ReservationScheduled  8m33s  koord-descheduler  Assigned Reservation "d56659ab-ba16-47a2-821d-22d6ba49258e" to node "node-1"
  Normal  Evicting              8m33s  koord-descheduler  Try to evict Pod "default/pod-demo-5f9b977566-c7lvk"
  Normal  EvictComplete         8m     koord-descheduler  Pod "default/pod-demo-5f9b977566-c7lvk" has been evicted
  Normal  Complete              8m     koord-descheduler  Bind Pod "default/pod-demo-5f9b977566-nxjdf" in Reservation "d56659ab-ba16-47a2-821d-22d6ba49258e"
```

### Advanced Configurations

> The latest API can be found in [`pod_migration_job_types.go`](https://github.com/koordinator-sh/koordinator/blob/main/apis/scheduling/v1alpha1/pod_migration_job_types.go).

### Example: Manually confirm whether the migration is allowed

Eviction or migration operations that bring risks to the stability, so it is hoped to manually check and confirm that there is no error before initiating the migration operation, and then initiate the migration.

Therefore, when creating a PodMigrationJob, set `spec.paused` to `true`, and set `spec.paused` to `false` after manually confirming that execution is allowed. 
If you refuse to execute, you can update `status.phase=Failed` to terminate the execution of the PodMigrationJob immediately or wait for the PodMigrationJob to expire automatically.

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: PodMigrationJob
metadata:
  name: migrationjob-demo
spec:
  # paused indicates whether the PodMigrationJob should to work or not.
  paused: true
  # ttl controls the PodMigrationJob timeout duration.
  ttl: 5m
  mode: ReservationFirst
  podRef:
    namespace: default
    name: pod-demo-5f9b977566-c7lvk
status:
  phase: Pending
```

### Example: Just want to evict Pods, no need to reserve resources

PodMigrationJob provides two migration modes:
- `EvictDirectly` is directly evict Pod, no need to reserve resources, 
- `ReservationFirst` reserves resources first to ensure that resources can be allocated before initiating eviction.

If just want to evict Pods, just set `spec.mode` to `EvictDirectly`

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: PodMigrationJob
metadata:
  name: migrationjob-demo
spec:
  paused: false
  ttl: 5m
  mode: EvictDirectly
  podRef:
    namespace: default
    name: pod-demo-5f9b977566-c7lvk
status:
  phase: Pending
```

### Example: Use reserved resources when migrating

In some scenarios, resources are reserved first, and then a PodMigrationJob is created after success. 
The arbitration mechanism provided by the PodMigrationJob Controller (BTW: will be implemented in v0.7) is reused to ensure workload stability.

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: PodMigrationJob
metadata:
  name: migrationjob-demo
spec:
  paused: false
  ttl: 5m
  mode: ReservationFirst
  podRef:
    namespace: default
    name: pod-demo-5f9b977566-c7lvk
  reservationOptions:
    # the reservation-0 created before creating PodMigrationJob
    reservationRef:
      name: reservation-0
status:
  phase: Pending
```

### Example: Evicting Pods Gracefully

PodMigrationJob supports graceful eviction of pods.

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: PodMigrationJob
metadata:
  name: migrationjob-demo
spec:
  paused: true
  ttl: 5m
  mode: ReservationFirst
  podRef:
    namespace: default
    name: pod-demo-5f9b977566-c7lvk
  deleteOptions:
    # The duration in seconds before the object should be deleted. Value must be non-negative integer.
    # The value zero indicates delete immediately. If this value is nil, the default grace period for the
    # specified type will be used.
    # Defaults to a per object value if not specified. zero means delete immediately.
    gracePeriodSeconds: 60
status:
  phase: Pending
```


### Known Issues
- [Arbitration mechanism](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20220701-pod-migration-job.md#filter-podmigrationjob) is not currently supported. The v0.6 version only implements the migration capability based on resource reservation
- [Basic Migration API](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20220701-pod-migration-job.md#basic-migration-api) is not currenty supported
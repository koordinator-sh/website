# PodMigrationJob

Koordinator定义了一个基于 CRD 的 Pod 迁移 API，称为 `PodMigrationJob`，通过此 API，重调度器（descheduler）或其他自动故障恢复组件可以更安全地将 Pod 驱逐或删除。

## 介绍

迁移 Pods 是许多组件（如descheduler）依赖的重要能力，可用于优化调度或帮助解决工作负载运行时质量问题。我们认为，Pod 迁移是一个复杂的过程，涉及诸如审计（auditing）、资源分配和应用程序启动等步骤，并与应用程序升级、伸缩等场景以及集群管理员的资源操作和维护操作混合在一起。因此，如何管理此过程的稳定性风险，以确保应用程序不会因为 Pod 迁移而失败，是必须解决的关键的问题。

基于 PodMigrationJob CRD 的最终状态导向迁移能力，我们可以跟踪迁移过程中每个过程的状态，感知应用程序升级和扩展等场景，以确保工作负载的稳定性。

## 设置

### 前置条件

- Kubernetes >= 1.18
- Koordinator >= 0.6

### Installation

请确保Koordinator组件已正确安装在您的集群中。如果未安装，请参考[安装](docs/installation).

### Configurations

PodMigrationJob 已默认启用。您可以在koord-descheduler配置中无需任何修改即可使用它。

## 使用 PodMigrationJob

### 快速开始

1. 使用下面的YAML文件创建一个名为`pod-demo`的Deployment

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

2. 检查Pod `pod-demo-0` 的调度结果

```bash
$ kubectl get pod -o wide
NAME                        READY   STATUS    RESTARTS   AGE   IP            NODE     NOMINATED NODE   READINESS GATES
pod-demo-5f9b977566-c7lvk   1/1     Running   0          41s   10.17.0.9     node-0   <none>           <none>
```

`pod-demo-5f9b977566-c7lvk` 被调度在节点 `node-0`上。

3. 使用下面的YAML文件创建一个 `PodMigrationJob` 来迁移 `pod-demo-0`

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

5. 查看迁移状态

```bash
$ kubectl get podmigrationjob migrationjob-demo
NAME                PHASE     STATUS     AGE   NODE     RESERVATION                            PODNAMESPACE   POD                         NEWPOD                      TTL
migrationjob-demo   Succeed   Complete   37s   node-1   d56659ab-ba16-47a2-821d-22d6ba49258e   default        pod-demo-5f9b977566-c7lvk   pod-demo-5f9b977566-nxjdf   5m0s
```

从上述结果可以观察到：
- **PHASE** 为 `Succeed`, **STATUS** 为 `Complete`, 表明迁移成功。；
- **NODE** `node-1` 表示迁移后新Pod所调度的节点；
- **RESERVATION** `d56659ab-ba16-47a2-821d-22d6ba49258e` 是在迁移期间创建的Reservation。PodMigrationJob Controller将在开始驱逐Pod之前尝试为Reservation创建预留资源。在成功预留资源后，将启动驱逐操作，这可以确保新 Pod 必须被驱逐，因为已有资源可用；
- **PODNAMESPACE** `default` 表示待迁移 Pod 所在的命名空间；
- **POD** `pod-demo-5f9b977566-c7lvk` 表示待迁移的 Pod；
- **NEWPOD** `pod-demo-5f9b977566-nxjdf` 表示迁移后新创建的Pod；
- **TTL** 表示当前作业的TTL周期。

6. 查看迁移事件

PodMigrationJob Controller将在迁移过程的重要步骤中创建事件，以帮助用户诊断迁移问题。

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

### 高级配置

> 最新的API可以查看[`pod_migration_job_types.go`](https://github.com/koordinator-sh/koordinator/blob/main/apis/scheduling/v1alpha1/pod_migration_job_types.go).

### 示例: 手动确认是否允许迁移

驱逐或迁移操作会带来稳定性风险，因此希望在启动迁移操作之前手动检查和确认没有错误，然后再启动迁移。

因此，在创建PodMigrationJob时，将`spec.paused`设置为`true`，手动确认允许执行后再将`spec.paused`设置为`false`。如果拒绝执行，则可以更新`status.phase=Failed`立即终止PodMigrationJob 的执行，或者等待 PodMigrationJob 自动过期。

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

### 示例: 只想驱逐 Pods, 无需预留资源

PodMigrationJob 提供两种迁移模式:
- `EvictDirectly` 直接驱逐Pod，无需预留资源, 
- `ReservationFirst` 先预留资源，以确保在开始驱逐之前可以分配资源。

如果你只想驱逐Pod，只需将 `spec.mode` 设置为 `EvictDirectly`。

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

### 示例: 在迁移中使用预留资源

在某些情况下，首先预留资源，然后在成功后创建一个 PodMigrationJob，以重复使用 PodMigrationJob Controller 提供的仲裁机制（将在v0.7中实现）以确保工作负载的稳定性。

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

### 示例: 优雅驱逐 Pods

PodMigrationJob 支持 Pod 的优雅驱逐。

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


### 已知问题
- 当前不支持[Arbitration mechanism](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20220701-pod-migration-job.md#filter-podmigrationjob)。v0.6版本仅实现了基于资源预留的迁移能力。 
- 目前不支持[Basic Migration API](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20220701-pod-migration-job.md#basic-migration-api) 。

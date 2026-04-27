# Job 级别抢占

## 简介

在大规模集群环境中，高优先级作业（例如关键的 AI 训练任务）在可用资源不足时，通常需要从低优先级工作负载中抢占资源。然而，Kubernetes 中传统的 **Pod 级别抢占**无法保证分布式作业的所有成员 Pod 一起抢占资源，导致无效抢占。

为了解决这个问题，Koordinator 提供了 **Job 级别抢占**，它确保：
- 抢占在作业（GangGroup）级别触发。
- 只有当所有成员 Pod 在驱逐后都可以共同调度时，才会发生抢占。
- 通过 `nominatedNode` 为所有成员预留资源，以维护调度一致性。

此功能与 [PodGroup/GangGroup](https://koordinator.sh/docs/next/architecture/job/) 语义无缝协作。

## 前置条件

- Kubernetes >= 1.18
- Koordinator >= 1.7.0

## 验证抢占是否已启用

虽然从 Koordinator >= 1.7.0 开始，Job 级别抢占**默认启用**，但建议确认 Coscheduling 插件配置。

### 检查调度器配置

检索当前的 `koord-scheduler-config`:

```bash
kubectl -n koordinator-system get cm koord-scheduler-config -o yaml
```

确保 Coscheduling 插件具有 `enablePreemption: true`:

```yaml
pluginConfig:
  - name: Coscheduling
    args:
      apiVersion: kubescheduler.config.k8s.io/v1
      kind: CoschedulingArgs
      enablePreemption: true
```
如果进行了更改,请重启 koord-scheduler Pod 以应用它们。

## 使用示例

### 环境设置

为了演示 Job 级别抢占，我们将模拟一个资源受限的环境，并从高优先级作业触发抢占。假设集群有 2 个工作节点，每个节点具有：
- CPU： 4 核心
- 内存： 16 GiB
- 初始时没有其他运行的工作负载

我们的步骤是：
1. 用低优先级 Pod 填充两个节点，消耗所有 CPU。
2. 提交一个无法容纳的高优先级 Gang 作业。
3. 观察 Koordinator 如何驱逐低优先级 Pod 以腾出空间。



###  定义 PriorityClass
1. 您必须定义优先级类以启用抢占逻辑。

```yaml
# 高优先级类(用于抢占者)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 1000000
preemptionPolicy: PreemptLowerPriority
description: "用于可以抢占其他作业的关键 AI 训练作业。"
```
```yaml
# 低优先级类(用于受害者)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: low-priority
value: 1000
preemptionPolicy: PreemptLowerPriority
globalDefault: false
description: "用于可以被抢占的非关键作业。"
```
2. 应用它们
```bash
kubectl apply -f priorityclasses.yaml
```
3. 验证
```bash
kubectl get priorityclass
```
```
NAME              VALUE        GLOBAL-DEFAULT   AGE
high-priority     1000000      false            1m
low-priority      1000         false            1m
```
### 部署低优先级 Pod 以消耗资源

1. 创建 2 个低优先级 Pod（每个节点 1 个），每个请求 4 个 CPU 核心 → 完全占用两个节点。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: lp-pod-1
  namespace: default
spec:
  schedulerName: koord-scheduler
  priorityClassName: low-priority
  containers:
  - command:
    - sleep
    - 365d
    image: busybox
    imagePullPolicy: IfNotPresent
    name: curlimage
    resources:
      limits:
        cpu: 4
        memory: 40Mi
      requests:
        cpu: 4
        memory: 40Mi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
---
apiVersion: v1
kind: Pod
metadata:
  name: lp-pod-2
  namespace: default
spec:
  schedulerName: koord-scheduler
  priorityClassName: low-priority
  containers:
  - command:
    - sleep
    - 365d
    image: busybox
    imagePullPolicy: IfNotPresent
    name: curlimage
    resources:
      limits:
        cpu: 4
        memory: 40Mi
      requests:
        cpu: 4
        memory: 40Mi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
```
2. 应用它们

```bash
kubectl apply -f low-priority-pods.yaml
```
3. 检查

```bash
kubectl get pods -o wide
```
```bash
NAME        READY   STATUS    RESTARTS   AGE     IP            NODE.          NOMINATED NODE   READINESS GATES
lp-pod-1    1/1     Running   0          2m      10.244.1.10   cn-beijing.1   <none>           <none>
lp-pod-2    1/1     Running   0          2m      10.244.1.11   cn-beijing.2   <none>           <none>
```

此时，两个节点上都没有可用的 CPU。

### 创建高优先级 Gang 作业以触发抢占

1. 现在提交一个 2 Pod 的高优先级作业，每个 Pod 需要 3 个 CPU — 总需求超过当前容量。

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: hp-training-job
  namespace: default
spec:
  minMember: 2
  scheduleTimeoutSeconds: 300
```
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hp-worker-1
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: hp-training-job
spec:
  schedulerName: koord-scheduler
  priorityClassName: high-priority
  preemptionPolicy: PreemptLowerPriority
  containers:
  - command:
    - sleep
    - 365d
    image: busybox
    imagePullPolicy: IfNotPresent
    name: curlimage
    resources:
      limits:
        cpu: 3
        memory: 40Mi
      requests:
        cpu: 3
        memory: 40Mi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
---
apiVersion: v1
kind: Pod
metadata:
  name: hp-worker-2
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: hp-training-job
spec:  
  schedulerName: koord-scheduler
  priorityClassName: high-priority
  preemptionPolicy: PreemptLowerPriority
  containers:
  - command:
    - sleep
    - 365d
    image: busybox
    imagePullPolicy: IfNotPresent
    name: curlimage
    resources:
      limits:
        cpu: 3
        memory: 40Mi
      requests:
        cpu: 3
        memory: 40Mi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
```
2. 应用它们

```bash
kubectl apply -f high-priority-job.yaml
```
几秒钟后，Koordinator 将驱逐每个节点上的一个 Pod 以释放资源。

### 验证抢占结果

1. 检查受害 Pod 是否被驱逐
```bash
kubectl get pods -o wide
```
```bash
NAME           READY   STATUS        RESTARTS   AGE     IP            NODE           NOMINATED NODE   READINESS GATES
hp-worker-1    0/1     Pending       0          90s     <none>        <none>         cn-beijing.1     <none>
hp-worker-2    0/1     Pending       0          90s     <none>        <none>         cn-beijing.2     <none>
lp-pod-1       0/1     Terminating   0          5m      10.244.1.10   cn-beijing.1   <none>           <none>
lp-pod-2       1/1     Terminating   0          5m      10.244.1.11   cn-beijing.2   <none>           <none>
```
Pod lp-pod-1 和 lp-pod-2 正在被终止以腾出空间，高优先级 Pod 已被提名。

2. 检查一个受害者:
```bash
kubectl get pod lp-pod-1 -o yaml
```
```yaml
status:
  conditions:
    - type: DisruptionTarget
      status: "True"
      lastTransitionTime: "2025-09-17T08:41:35Z"
      message: 'koord-scheduler: preempting to accommodate higher priority pods, preemptor:
        default/hp-training-job, triggerpod: default/hp-worker-1'
      reason: PreemptionByScheduler
```
3. 确认终止后的绑定
```bash
kubectl get pods -o wide
```
```yaml
NAME           READY   STATUS    RESTARTS   AGE     IP            NODE           NOMINATED NODE   READINESS GATES
hp-worker-1    1/1     Running   0          3m      10.244.1.14   cn-beijing.1   <none>           <none>
hp-worker-2    1/1     Running   0          3m      10.244.2.15   cn-beijing.2   <none>           <none>
```

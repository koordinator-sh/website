# Job Level Preemption

## Introduction

In large-scale cluster environments, high-priority jobs (e.g., critical AI training tasks) often need to preempt resources from lower-priority workloads when sufficient resources are not available. However, traditional **pod-level preemption** in Kubernetes cannot guarantee that all member pods of a distributed job will seize resources together, leading to invalid preemption.

To solve this, Koordinator provides **job-level preemption**, which ensures that:
- Preemption is triggered at the job (GangGroup) level.
- Only when all member pods can be co-scheduled after eviction will preemption occur.
- Resources are reserved via `nominatedNode` for all members to maintain scheduling consistency.

This capability works seamlessly with [PodGroup/GangGroup](https://koordinator.sh/docs/next/architecture/job/) semantics.

## Prerequisites

- Kubernetes >= 1.18
- Koordinator >= 1.7.0

## Verify Preemption is Enabled

Although job-level preemption is **enabled by default** as of koordinator ≥ 1.7.0, it's recommended to confirm the Coscheduling plugin configuration.

### Check Scheduler Configuration

Retrieve the current `koord-scheduler-config`:

```bash
kubectl -n koordinator-system get cm koord-scheduler-config -o yaml
```

Ensure the Coscheduling plugin has `enablePreemption: true`:

```yaml
pluginConfig:
  - name: Coscheduling
    args:
      apiVersion: kubescheduler.config.k8s.io/v1
      kind: CoschedulingArgs
      enablePreemption: true
```
If changes are made, restart the koord-scheduler pod to apply them.

## Usage Example

### Environment Setup

To demonstrate job-level preemption, we will simulate a resource-constrained environment and trigger preemption from a high-priority job. Assume the cluster has 2 worker nodes, each with:
- CPU: 4 cores
- Memory: 16 GiB
- No other running workloads initially

Our procedure is:
1. Fill both nodes with low-priority pods consuming all CPU.
2. Submit a high-priority gang job that cannot fit.
3. Observe how Koordinator evicts low-priority pods to make space.



###  Define PriorityClasses
1. You must define priority classes to enable preemption logic.

```yaml
# High-Priority Class (for preemptors)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 1000000
preemptionPolicy: PreemptLowerPriority
description: "Used for critical AI training jobs that can preempt others."
```
```yaml
# Low-Priority Class (for victims)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: low-priority
value: 1000
preemptionPolicy: PreemptLowerPriority
globalDefault: false
description: "Used for non-critical jobs that can be preempted."
```
2. Apply them
```bash
kubectl apply -f priorityclasses.yaml
```
3. Verify
```bash
kubectl get priorityclass
```
```
NAME              VALUE        GLOBAL-DEFAULT   AGE
high-priority     1000000      false            1m
low-priority      1000         false            1m
```
### Deploy Low-Priority Pods to Consume Resources

1. Create 2 low-priority pods (1 per node), each requesting 4 CPU cores → fully occupying both nodes.

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
2. Apply them

```bash
kubectl apply -f low-priority-pods.yaml
```
3. Check

```bash
kubectl get pods -o wide
```
```bash
NAME        READY   STATUS    RESTARTS   AGE     IP            NODE.          NOMINATED NODE   READINESS GATES
lp-pod-1    1/1     Running   0          2m      10.244.1.10   cn-beijing.1   <none>           <none>
lp-pod-2    1/1     Running   0          2m      10.244.1.11   cn-beijing.2   <none>           <none>
```

At this point, no CPU remains available on either node.

### Create a High-Priority Gang Job to Trigger Preemption

1. Now submit a 2-pod high-priority job that requires 3 CPU per pod — total demand exceeds current capacity.

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
2. Apply them

```bash
kubectl apply -f high-priority-job.yaml
```
After a few seconds, Koordinator will evict one pod per node to free up resources.

### Verify Preemption Outcome

1. Check Victim Pods Were Evicted
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
Pods lp-pod-1 and lp-pod-2 are being terminated to make room and high-priority pods are nominated.
2.  Inspect one victim:
```bash
kubectl get pod lp-pod-1 -o yaml
```
```yaml
status:
  conditions:
    - type: DisruptionTarget
      status: "True"
      lastTransitionTime: "2025-10-12T11:23:45Z"
      reason: PreemptionByScheduler
      message: >-
        koord-scheduler: preempting to accommodate higher priority pods, preemptor:
        default/hp-training-job, triggerpod: default/hp-worker-1
```
3. Confirm Binding After Termination
```bash
kubectl get pods -o wide
```
```yaml
NAME           READY   STATUS    RESTARTS   AGE     IP            NODE           NOMINATED NODE   READINESS GATES
hp-worker-1    1/1     Running   0          3m      10.244.1.14   cn-beijing.1   <none>           <none>
hp-worker-2    1/1     Running   0          3m      10.244.2.15   cn-beijing.2   <none>           <none>
```
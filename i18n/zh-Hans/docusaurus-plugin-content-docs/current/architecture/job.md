# Job

## Job Scheduling

A batch of pods that must be scheduled together is called a `Job`. 

### PodGroup
Sometimes, the batch of pods is completely homogeneous and only needs to accumulate to a specified minimum number before scheduling is successful. In this case, we can describe the `minMember` through a separate `PodGroup`, and then associate its `member` pods through pod Labels. Here is a PodGroup with a minimum cumulative number of 2 and its `member` pods.

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: gang-example
  namespace: default
spec:
  minMember: 2
```
```yaml
apiVersion: v1
kind: pod
metadata:
  name: pod-example1
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: gang-example
spec:
  schedulerName: koord-scheduler
  ...
---
apiVersion: v1
kind: pod
metadata:
  name: pod-example2
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: gang-example
spec:
  schedulerName: koord-scheduler
  ...
```
### GangGroup
In other cases, the pods that must be scheduled together may not be homogeneous and must complete the minimum number of accumulations separately. In this case, Koordinator supports associating different `PodGroups` to form a `GangGroup` through PodGroup Label. Here is a `GangGroup` with two PodGroups:

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: gang-example1
  namespace: default
  annotations:
    gang.scheduling.koordinator.sh/groups: "[\"default/gang-example1\", \"default/gang-example2\"]"
spec:
  minMember: 1
---
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: gang-example2
  namespace: default
  annotations:
    gang.scheduling.koordinator.sh/groups: "[\"default/gang-example1\", \"default/gang-example2\"]"
spec:
  minMember: 2
```


## Job-Level Preemption

When a pod cannot be scheduled due to insufficient resources, Kube-Scheduler attempts to evict lower-priority pods to make room for it. This is traditional **pod-level reemption**. However, when a Job cannot be scheduled due to insufficient resources, the scheduler must **make enough space for the entire Job to be scheduled**. This type of preemption is called **Job-level preemption**.

### Preemption Algorithm

The job that initiates preemption is called the `preemptor`, and the preempted pod is called the `victim`. The overall workflow of job-level preemption is as follows:
1. Unschedulable pod → Enters PostFilter phase
2. Is it a Job? → Yes → Fetch all member pods
3. Check Job Preemption Eligibility:
   - `pods.spec.preemptionPolicy` ≠ Never
   - No terminating victims on the currently nominated nodes of all member pods (prevent redundant preemption)
4. Find candidate nodes where preemption may help
5. Perform dry-run to simulate removal of potential victims (low priority pods)
6. Select optimal node + minimal-cost victim set (**job-aware cost model**)
7. Execute preemption:
   - Delete victims (by setting DisruptionTarget condition and invoking the deletion API)
   - Clear `status.nominatedNode` of other lower-priority nominated pods on the target nodes.
   - Set `status.nominatedNode` for all member pods.
8. Preemption successful → The pod enters the scheduling queue, waiting for victims to terminate.


### Preemption Reason for Victim
When a victim is preempted, Koord-Scheduler adds an entry to `victim.status.conditions` to indicate which job preempted it and triggers graceful termination. 

```yaml
apiVersion: v1
kind: pod
metadata:
  name: victim-1
  namespace: default
status:
  conditions:
  - lastProbeTime: null
    lastTransitionTime: "2025-09-17T08:41:35Z"
    message: 'koord-scheduler: preempting to accommodate higher priority pods, preemptor:
      default/hello-job, triggerpod: default/preemptor-pod-2'
    reason: PreemptionByScheduler
    status: "True"
    type: DisruptionTarget
```

The above shows that default/victim-1 was preempted by the high-priority job `hello-job`. Member Pods of `hello-job` can be retrieved via the following command:
```bash
$ kubectl get po -n default -l pod-group.scheduling.sigs.k8s.io=hello-job
hello-job-pod-1   0/1     Pending             0                5m
hello-job-pod-2   0/1     Pending             0                5m
```
### Nominated Node for Preemptor


After a Job preemption succeeds, in addition to evicting the victim pods, the scheduler must also reserve the reclaimed resources in its internal cache. In Kubernetes, this is achieved using `pod.status.nominatedNode`. In Koordinator, koord-scheduler sets the `.status.nominatedNode` field for **all member pods of the preempting job** to reflect this resource reservation.

```yaml
apiVersion: v1
kind: pod
metadata:
name: preemptor-pod-1
namespace: default
labels:
  pod-group.scheduling.sigs.k8s.io: hello-job
status:
  nominatednodeName: example-node
  phase: Pending
---
apiVersion: v1
kind: pod
metadata:
  name: preemptor-pod-2
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: hello-job
status:
  nominatednodeName: example-node
  phase: Pending
```

The above shows that the two pods of `hello-job` have successfully completed preemption and are nominated for scheduling to example-node.

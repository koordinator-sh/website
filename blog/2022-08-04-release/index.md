---
slug: release-v0.6.0
title: "Koordinator v0.6: Complete fine-grained CPU orchestration, Resource Reservation and Descheduling"
authors: [joseph]
tags: [release]
---

We are happy to announce the release of Koordinator v0.6.0. Koordinator v0.6.0 brings complete Fine-grained CPU Orchestration, Resource Reservation mechanism, safely Pod Migration mechanism and Descheduling Framework.

## Install or Upgrade to Koordinator v0.6.0

### Install with helms

Koordinator can be simply installed by helm v3.5+, which is a simple command-line tool, and you can get it
from [here](https://github.com/helm/helm/releases).

```shell
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Install the latest version.
$ helm install koordinator koordinator-sh/koordinator --version 0.6.0
```

### Upgrade with helm

```shell
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Upgrade the latest version.
$ helm upgrade koordinator koordinator-sh/koordinator --version 0.6.0 [--force]
```

For more details, please refer to the [installation manual](/docs/installation).

## Fine-grained CPU Orchestration

In Koordinator v0.5.0, we designed and implemented basic CPU orchestration capabilities. The koord-scheduler supports different CPU bind policies to help LSE/LSR Pods achieve better performance. 

Now in the v0.6 version, we have basically completed the CPU orchestration capabilities originally designed, such as:
- Support default CPU bind policy configured by koord-scheduler for LSR/LSE Pods that do not specify a CPU bind policy
- Support CPU exclusive policy that supports `PCPULevel` and `NUMANodeLevel`, which can spread the CPU-bound Pods to different physical cores or NUMA Nodes as much as possible to reduce the interference between Pods.
- Support Node CPU Orchestration API to helper cluster administrators control the CPU orchestration behavior of nodes. The label `node.koordinator.sh/cpu-bind-policy` constrains how to bind CPU logical CPUs when scheduling. If set with the `FullPCPUsOnly` that requires that the scheduler must allocate full physical cores. Equivalent to kubelet CPU manager policy option `full-pcpus-only=true`. If there is no `node.koordinator.sh/cpu-bind-policy` in the node's label, it will be executed according to the policy configured by the Pod or koord-scheduler. The label `node.koordinator.sh/numa-allocate-strategy` indicates how to choose satisfied NUMA Nodes when scheduling. Support `MostAllocated` and `LeastAllocated`.
- koordlet supports the LSE Pods and improve compatibility with existing Guaranteed Pods with static CPU Manager policy. 


Please check out our [user manual](/docs/user-manuals/fine-grained-cpu-orchestration) for a detailed introduction and
tutorial.

## Resource Reservation

We completed the `Resource Reservation API` design proposal in v0.5, and implemented the basic Reservation mechanism in the current v0.6 version. 

When you want to use the Reservation mechanism to reserve resources, you do not need to modify the Pod or the existing workloads(e.g. Deployment, StatefulSet). koord-scheduler provides a simple to use API named `Reservation`, which allows us to reserve node resources for specified pods or workloads even if they haven't get created yet. You only need to write the Pod Template and the owner information in the ReservationSpec when creating a Reservation. When koord-scheduler perceives a new Reservation object, it will allocate resources to the Reservation object through the normal Pod scheduling process. After scheduling, koord-scheduler will update the success or failure information to ResourceStatus. If the reservation is successful, and the OwnerReference or Labels of the newly created Pod satisfy the owner information declared earlier, then the newly created Pod will directly reuse the resources held by the Reservation. When the Pod is destroyed, the Reservation object can be reused until the Reservation expires.

![image](/img/resource-reservation.svg)

The resource reservation mechanism can help solve or optimize the problems in the following scenarios:

1. Preemption: Existing preemption does not guarantee that only preempting pods can allocate preempted resources. With a
   reservation, the scheduler should be able to "lock" resources preventing from allocation of other pods with the same
   or higher priority.
2. Descheduling: For the descheduler, it is better to ensure sufficient resources with the reservation before pods get
   rescheduled. Otherwise, rescheduled pods may not be runnable anymore and make the belonging application disrupted.
3. Horizontal scaling: Using reservation to achieve more deterministic horizontal scaling. e.g. Submit a reservation and
   make sure it is available before scaling up replicas.
4. Resource Pre-allocation: Sometimes we want to pre-allocate node resources for future resource demands even if the
   resources are not currently allocatable. Reservation can help with this and it should make no physical cost.

- Please check out our [user manual](/docs/user-manuals/resource-reservation) for a detailed introduction and
tutorial.
- For more information, please see [Design: Resource Reservation](/docs/designs/resource-reservation)

## Pod Migration Job

Migrating Pods is an important capability that many components (such as descheduler) rely on, and can be used to optimize scheduling or help resolve workload runtime quality issues. We believe that pod migration is a complex process, involving steps such as auditing, resource allocation, and application startup, and is mixed with application upgrading, scaling scenarios, resource operation and maintenance operations by cluster administrators. Therefore, how to manage the stability risk of this process to ensure that the application does not fail due to the migration of Pods is a very critical issue that must be resolved.

The descheduler in the K8s community evicts pods according to different strategies. However, it does not guarantee whether the evicted Pod has resources available after re-creation. If a large number of newly created Pods are in the Pending state when the resources in the cluster are tight, may lower the application availabilities.

Koordinator defines a CRD-based Migration/Eviction API named `PodMigrationAPI`, through which the descheduler or other components can evict or delete Pods more safely. With PodMigrationJob we can track the status of each process in the migration, and perceive scenarios such as upgrading and scaling of the application.

It's simple to use the PodMigrationJob API. Create a `PodMigrationJob` with the YAML file below to migrate `pod-demo-0`. 

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

Then you can query the migration status and query the migration events

```bash
$ kubectl get podmigrationjob migrationjob-demo
NAME                PHASE     STATUS     AGE   NODE     RESERVATION                            PODNAMESPACE   POD                         NEWPOD                      TTL
migrationjob-demo   Succeed   Complete   37s   node-1   d56659ab-ba16-47a2-821d-22d6ba49258e   default        pod-demo-5f9b977566-c7lvk   pod-demo-5f9b977566-nxjdf   5m0s

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

- Please check out our [user manual](/docs/user-manuals/pod-migration-job) for a detailed introduction and
tutorial.
- For more information, please see [Design: PodMigrationJob](/docs/designs/pod-migration-job).

## Descheduling Framework

We implemented a brand new Descheduling Framework in v0.6. 

The existing descheduler in the community can solve some problems, but we think that there are still many aspects of the descheduler that can be improved, for example, it only supports the mode of periodic execution, and does not support the event-triggered mode. It is not possible to extend and configure custom descheduling strategies without invading the existing code of descheduler like kube-scheduler; it also does not support implementing custom evictor.

We also noticed that the K8s descheduler community also found these problems and proposed corresponding solutions such as [#753 Descheduler framework Proposal](https://github.com/kubernetes-sigs/descheduler/issues/753) and [PoC #781](https://github.com/kubernetes-sigs/descheduler/pull/781). The K8s descheduler community tries to implement a descheduler framework similar to the k8s scheduling framework. This coincides with our thinking.

Overall, these solutions solved most of our problems, but we also noticed that the related implementations were not merged into the main branch. But we review these implementations and discussions, and we believe this is the right direction. Considering that Koordiantor has clear milestones for descheduler-related features, we will implement Koordinator's own descheduler independently of the upstream community. We try to use some of the designs in the [#753 PR](https://github.com/kubernetes-sigs/descheduler/issues/753) proposed by the community and we will follow the Koordinator's compatibility principle with K8s to maintain compatibility with the upstream community descheduler when implementing. Such as independent implementation can also drive the evolution of the upstream community's work on the descheduler framework. And when the upstream community has new changes or switches to the architecture that Koordinator deems appropriate, Koordinator will follow up promptly and actively.

Based on this descheduling framework, it is very easy to be compatible with the existing descheduling strategies in the K8s community, and users can implement and integrate their own descheduling plugins as easily as K8s Scheduling Framework. At the same time, users are also supported to implement Controller in the form of plugins to realize event-based descheduling scenarios. At the same time, the framework integrates the `MigrationController` based on PodMigrationJob API and serves as the default Evictor plugin to help safely migrate Pods in various descheduling scenarios.

At present, we have implemented the main body of the framework, including the MigrationController based on PodMigrationJob, which is available as a whole. And we also provide [a demo descheduling plugin](https://github.com/koordinator-sh/koordinator/blob/main/pkg/descheduler/framework/plugins/removepodsviolatingnodeaffinity/node_affinity.go). In the future, we will migrate and be compatible with the existing descheduling policies of the community, as well as the load balancing descheduling plugin provided for co-location scenarios. 

The current framework is still in the early stage of rapid evolution, and there are still many details that need to be improved. Everyone who is interested is welcome to participate in the construction together. We hope that more people can be more assured and simpler to realize the descheduling capabilities they need.

- For more information, please see [Design: descheduling framework](/docs/designs/descheduler-framework).
- For specific implementation, please see [pkg/descheduler](https://github.com/koordinator-sh/koordinator/tree/main/pkg/descheduler).

## About GPU Scheduling

There are also some new developments in GPU scheduling capabilities that everyone cares about. 

During the iteration of v0.6, we completed the design of [GPU Share Scheduling](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20220629-fine-grained-device-scheduling.md), and also completed the design of [Gang Scheduling](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20220701-schedule-gang.md). Development of these capabilities is ongoing and will be released in v0.7. 

In addition, in order to explore the mechanism of GPU overcommitment, we have implemented the ability to [report GPU Metric](https://github.com/koordinator-sh/koordinator/pull/361) in v0.6.

## What’s coming next in Koordinator

Don't forget that Koordinator is developed in the open. You can check out our Github milestone to know more about what
is happening and what we have planned. For more details, please refer to
our [milestone](https://github.com/koordinator-sh/koordinator/milestones). Hope it helps!
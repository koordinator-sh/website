---
slug: release-v0.5.0
title: "Koordinator v0.5: Now With Node Resource Topology And More"
authors: [jason]
tags: [release]
---

In addition to the usual updates to supporting utilities, Koordinator v0.5 adds a couple of new useful features we think
you'll like.

## Install or Upgrade to Koordinator v0.5.0

### Install with helms

Koordinator can be simply installed by helm v3.5+, which is a simple command-line tool, and you can get it
from [here](https://github.com/helm/helm/releases).

```shell
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Install the latest version.
$ helm install koordinator koordinator-sh/koordinator --version 0.5.0
```

### Upgrade with helm

```shell
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Upgrade the latest version.
$ helm upgrade koordinator koordinator-sh/koordinator --version 0.5.0 [--force]
```

For more details, please refer to the [installation manual](/docs/installation).

## Fine-grained CPU Orchestration

In this version, we introduced a fine-grained CPU orchestration. Pods in the Kubernetes cluster may interfere with
others' running when they share the same physical resources and both demand many resources. The sharing of CPU resources
is almost inevitable. e.g. SMT threads (i.e. logical processors) share execution units of the same core, and cores in
the same chip share one last-level cache. The resource contention can slow down the running of these CPU-sensitive
workloads, resulting in high response latency (RT).

To improve the performance of CPU-sensitive workloads, koord-scheduler provides a mechanism of fine-grained CPU
orchestration. It enhances the CPU management of Kubernetes and supports detailed NUMA-locality and CPU exclusions.

Please check out our [user manual](/docs/user-manuals/fine-grained-cpu-orchestration) for a detailed introduction and
tutorial.

## Resource Reservation

Pods are fundamental units for allocating node resources in Kubernetes, which bind resource requirements with business
logic. The scheduler is not able to reserve node resources for specific pods or workloads. We may try using a fake pod
to prepare resources by the preemption mechanism. However, fake pods can be preempted by any scheduled pods with higher
priorities, which make resources get scrambled unexpectedly.

In Koordinator, a resource reservation mechanism is proposed to enhance scheduling and especially benefits scenarios
below:

1. Preemption: Existing preemption does not guarantee that only preempting pods can allocate preempted resources. With a
   reservation, the scheduler should be able to "lock" resources preventing from allocation of other pods with the same
   or
   higher priority.
2. De-scheduling: For the descheduler, it is better to ensure sufficient resources with the reservation before pods get
   rescheduled. Otherwise, rescheduled pods may not be runnable anymore and make the belonging application disrupted.
3. Horizontal scaling: Using reservation to achieve more deterministic horizontal scaling. e.g. Submit a reservation and
   make sure it is available before scaling up replicas.
4. Resource Pre-allocation: Sometimes we want to pre-allocate node resources for future resource demands even if the
   resources are not currently allocatable. Reservation can help with this and it should make no physical cost.

This feature is still under development. We've finalized the API, feel free to check it out.

```
type Reservation struct {
	metav1.TypeMeta `json:",inline"`
	// A Reservation object is non-namespaced.
	// It can reserve resources for pods of any namespace. Any affinity/anti-affinity of reservation scheduling can be
	// specified in the pod template.
	metav1.ObjectMeta `json:"metadata,omitempty"`
	Spec              ReservationSpec   `json:"spec,omitempty"`
	Status            ReservationStatus `json:"status,omitempty"`
}

type ReservationSpec struct {
	// Template defines the scheduling requirements (resources, affinities, images, ...) processed by the scheduler just
	// like a normal pod.
	// If the `template.spec.nodeName` is specified, the scheduler will not choose another node but reserve resources on
	// the specified node.
	Template *corev1.PodTemplateSpec `json:"template,omitempty"`
	// Specify the owners who can allocate the reserved resources.
	// Multiple owner selectors and ANDed.
	Owners []ReservationOwner `json:"owners,omitempty"`
	// By default, the resources requirements of reservation (specified in `template.spec`) is filtered by whether the
	// node has sufficient free resources (i.e. ReservationRequest <  NodeFree).
	// When `preAllocation` is set, the scheduler will skip this validation and allow overcommitment. The scheduled
	// reservation would be waiting to be available until free resources are sufficient.
	PreAllocation bool `json:"preAllocation,omitempty"`
	// Time-to-Live period for the reservation.
	// `expires` and `ttl` are mutually exclusive. If both `ttl` and `expires` are not specified, a very
	// long TTL will be picked as default.
	TTL *metav1.Duration `json:"ttl,omitempty"`
	// Expired timestamp when the reservation expires.
	// `expires` and `ttl` are mutually exclusive. Defaults to being set dynamically at runtime based on the `ttl`.
	Expires *metav1.Time `json:"expires,omitempty"`
}

type ReservationStatus struct {
	// The `phase` indicates whether is reservation is waiting for process (`Pending`), available to allocate
	// (`Available`) or expired to get cleanup (Expired).
	Phase ReservationPhase `json:"phase,omitempty"`
	// The `conditions` indicate the messages of reason why the reservation is still pending.
	Conditions []ReservationCondition `json:"conditions,omitempty"`
	// Current resource owners which allocated the reservation resources.
	CurrentOwners []corev1.ObjectReference `json:"currentOwners,omitempty"`
}

type ReservationOwner struct {
	// Multiple field selectors are ORed.
	Object        *corev1.ObjectReference         `json:"object,omitempty"`
	Controller    *ReservationControllerReference `json:"controller,omitempty"`
	LabelSelector *metav1.LabelSelector           `json:"labelSelector,omitempty"`
}

type ReservationControllerReference struct {
	// Extend with a `namespace` field for reference different namespaces.
	metav1.OwnerReference `json:",inline"`
	Namespace             string `json:"namespace,omitempty"`
}

type ReservationPhase string

const (
	// ReservationPending indicates the Reservation has not been processed by the scheduler or is unschedulable for
	// some reasons (e.g. the resource requirements cannot get satisfied).
	ReservationPending ReservationPhase = "Pending"
	// ReservationAvailable indicates the Reservation is both scheduled and available for allocation.
	ReservationAvailable ReservationPhase = "Available"
	// ReservationWaiting indicates the Reservation is scheduled, but the resources to reserve are not ready for
	// allocation (e.g. in pre-allocation for running pods).
	ReservationWaiting ReservationPhase = "Waiting"
	// ReservationExpired indicates the Reservation is expired, which the object is not available to allocate and will
	// get cleaned in the future.
	ReservationExpired ReservationPhase = "Expired"
)

type ReservationCondition struct {
	LastProbeTime      metav1.Time `json:"lastProbeTime"`
	LastTransitionTime metav1.Time `json:"lastTransitionTime"`
	Reason             string      `json:"reason"`
	Message            string      `json:"message"`
}
```

## QoS Manager

Currently, plugins from resmanager in Koordlet are mixed together, they should be classified into two
categories: `static` and `dynamic`. Static plugins will be called and run only once when a container created, updated,
started or stopped. However, for dynamic plugins, they may be called and run at any time according the real-time runtime
states of node, such as CPU suppress, CPU burst, etc. This proposal only focuses on refactoring dynamic plugins. Take a
look at current plugin implementation, there are many function calls to resmanager's methods directly, such as
collecting node/pod/container metrics, fetching metadata of node/pod/container, fetching configurations(NodeSLO, etc.).
In the feature, we may need a flexible and powerful framework with scalability for special external plugins.

The below is directory tree of qos-manager inside koordlet, all existing dynamic plugins(as built-in plugins) will be
moved into sub-directory `plugins`.

```
pkg/koordlet/qosmanager/
                       - manager.go
                       - context.go   // plugin context
                       - /plugins/    // built-in plugins
                                 - /cpubrust/
                                 - /cpusuppress/
                                 - /cpuevict/
                                 - /memoryevict/
```

We only have the proposal in this version. Stay tuned, further implementation is coming soon!

## Multiple Running Hook Modes

`Runtime Hooks` includes a set of plugins which are responsible for the injections of resource isolation parameters
by pod attribute. When `Koord Runtime Proxy` running as a CRI Proxy, `Runtime Hooks` acts as the backend server. The
mechanism of CRI Proxy can ensure the consistency of resource parameters during pod lifecycle. However,
`Koord Runtime Proxy` can only hijack CRI requests from kubelet for pods, the consistency of resource parameters in
QoS class directory cannot be guaranteed. Besides, modification of pod parameters from third-party(e.g. manually) will
also break the correctness of hook plugins.

Therefore, a standalone running mode with reconciler for `Runtime Hooks` is necessary. Under `Standalone` running
mode, resource isolation parameters will be injected asynchronously, keeping eventual consistency of the injected
parameters for pod and QoS class even without `Runtime Hook Manager`.

## Some minor works

1. We fix the backward compatibility issues reported by our users
   in [here](https://github.com/koordinator-sh/koordinator/issues/310). If you've ever encountered similar problem,
   please upgrade to the latest version.
2. Two more interfaces were added into runtime-proxy. One is `PreCreateContainerHook`, which could set container
   resources setting before creating, and the other is `PostStopSandboxHook`, which could do the resource setting
   garbage collecting before pods deleted.
3. `cpuacct.usage` is more precise than `cpuacct.stat`, and `cpuacct.stat` is in USER_HZ unit, while `cpuacct.usage` is
   nanoseconds. After thorough discussion, we were on the same page that we replace `cpuacct.stat` with `cpuacct.usage`
   in koordlet.
4. Koordlet needs to keep fetching data from kubelet. Before this version, we only support accessing kubelet via
   read-only port over HTTP. Due to security concern, we've enabled HTTPS access in this version. For more details,
   please refer to this [PR](https://github.com/koordinator-sh/koordinator/pull/320).

## What’s coming next in Koordinator

Don't forget that Koordinator is developed in the open. You can check out our Github milestone to know more about what
is happening and what we have planned. For more details, please refer to
our [milestone](https://github.com/koordinator-sh/koordinator/milestones). Hope it helps!
# Resource Reservation

## Summary

A scheduling mechanism and its API is provided to reserve node resources for pods may not be created yet.

## Motivation

Pods are fundamental units for allocating node resources in Kubernetes, which bind resource requirements with business logic. The scheduler is not able to reserve node resources for specific pods or workloads. We may try using a [fake pod](https://github.com/kubernetes/autoscaler/blob/master/cluster-autoscaler/FAQ.md#how-can-i-configure-overprovisioning-with-cluster-autoscaler) to prepare resources by the preemption mechanism. However, fake pods can be preempted by any scheduled pods with higher priorities, which make resources get scrambled unexpectedly.

In Koordinator, a resource reservation mechanism is proposed to enhance scheduling and especially benefits scenarios below:

1. Preemption: Existing preemption does not guarantee that only preempting pods can allocate preempted resources. With a reservation, the scheduler should be able to "lock" resources preventing from allocation of other pods with the same or higher priority.
2. De-scheduling: For the descheduler, it is better to ensure sufficient resources with the reservation before pods get rescheduled. Otherwise, rescheduled pods may not be runnable anymore and make the belonging application disrupted.
3. Horizontal scaling: Using reservation to achieve more deterministic horizontal scaling. e.g. Submit a reservation and make sure it is available before scaling up replicas.
4. Resource Pre-allocation: Sometimes we want to pre-allocate node resources for future resource demands even if the resources are not currently allocatable. Reservation can help with this and it should make no physical cost.

### Goals

- Define the basic API of resource reservation for *Motivations<1,2,3>*, extensible for supporting *Motivation<4>* in the future.
- Provide a scheduler plugin that implements above reservation mechanism.

### Non-Goals/Future Work

- Detailed design of reservative preemption/descheduler/horizontal scaler/pre-allocation.
- Modify kubelet admission control for reservation objects.

## Proposal

### User Stories

#### Story 1

As a Kubernetes developer, I want to enhance the current **preemption** mechanism since preempted resources may be allocated by pods other than the preemptor. The scheduler can create a reservation for the preempting pods, so the ownership of preempted resources can be guaranteed, making the preemption more reliable.

#### Story 2

As a cluster administrator, I want to use **descheduler** to migrate pods that are placed abnormally to somewhere they could "live better" and fulfill orchestration requirements of the app. e.g. Move pods on a over-utilized node to idler nodes and bind CPUs of same NUMA node. Reservations can be created before rescheduling pods, helping ensure there are sufficient resources and well placement.

#### Story 3

As an application administrator, I want to make the **horizontal scaling** of my app more deterministic by submitting reservations before a scale-up. Besides, I can also reserve resources after a scale-down for future demands. It is useful especially when we want a guaranteed scale-up of applications for the coming business peak.

#### Story 4

As a cluster administrator, I want to **pre-allocate** node resources for future usage no matter whether they are available now or not. I want to allocate the future free resources but do not disrupt the running of scheduled pods. Reservation can be made to pre-allocate resources since it makes no physical cost to the node. It may be in a `Waiting` state. When there is enough space for the reservation, it will become `Available` for the owner pods' scheduling.

### API

In this section, a Custom Resource Definition (CRD) named `Reservation` is proposed to allow the scheduler to reserve node resources for specific pods.

![image](/img/resource-reservation.svg)

```go
// Reservation is the Schema for the reservation API.
// A Reservation object is non-namespaced.
// Any namespaced affinity/anti-affinity of reservation scheduling can be specified in the spec.template.
type Reservation struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ReservationSpec   `json:"spec,omitempty"`
	Status ReservationStatus `json:"status,omitempty"`
}

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

type ReservationSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	// Template defines the scheduling requirements (resources, affinities, images, ...) processed by the scheduler just
	// like a normal pod.
	// If the `template.spec.nodeName` is specified, the scheduler will not choose another node but reserve resources on
	// the specified node.
	// +kubebuilder:pruning:PreserveUnknownFields
	// +kubebuilder:validation:Schemaless
	// +kubebuilder:validation:Required
	Template *corev1.PodTemplateSpec `json:"template"`
	// Specify the owners who can allocate the reserved resources.
	// Multiple owner selectors and ORed.
	// +kubebuilder:validation:Required
	// +kubebuilder:validation:MinItems=1
	Owners []ReservationOwner `json:"owners"`
	// Time-to-Live period for the reservation.
	// `expires` and `ttl` are mutually exclusive. Defaults to 24h. Set 0 to disable expiration.
	// +kubebuilder:default="24h"
	// +optional
	TTL *metav1.Duration `json:"ttl,omitempty"`
	// Expired timestamp when the reservation is expected to expire.
	// If both `expires` and `ttl` are set, `expires` is checked first.
	// `expires` and `ttl` are mutually exclusive. Defaults to being set dynamically at runtime based on the `ttl`.
	// +optional
	Expires *metav1.Time `json:"expires,omitempty"`
	// By default, the resources requirements of reservation (specified in `template.spec`) is filtered by whether the
	// node has sufficient free resources (i.e. Reservation Request <  Node Free).
	// When `preAllocation` is set, the scheduler will skip this validation and allow overcommitment. The scheduled
	// reservation would be waiting to be available until free resources are sufficient.
	// +optional
	PreAllocation bool `json:"preAllocation,omitempty"`
	// When `AllocateOnce` is set, the reserved resources are only available for the first owner who allocates successfully
	// and are not allocatable to other owners anymore. Defaults to true.
	// +kubebuilder:default=true
	// +optional
	AllocateOnce *bool `json:"allocateOnce,omitempty"`
	// AllocatePolicy represents the allocation policy of reserved resources that Reservation expects.
	// +kubebuilder:validation:Enum=Aligned;Restricted
	// +optional
	AllocatePolicy ReservationAllocatePolicy `json:"allocatePolicy,omitempty"`
	// Unschedulable controls reservation schedulability of new pods. By default, reservation is schedulable.
	// +optional
	Unschedulable bool `json:"unschedulable,omitempty"`
}

type ReservationStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	// The `phase` indicates whether is reservation is waiting for process, available to allocate or failed/expired to
	// get cleanup.
	// +optional
	Phase ReservationPhase `json:"phase,omitempty"`
	// The `conditions` indicate the messages of reason why the reservation is still pending.
	// +optional
	Conditions []ReservationCondition `json:"conditions,omitempty"`
	// Current resource owners which allocated the reservation resources.
	// +optional
	CurrentOwners []corev1.ObjectReference `json:"currentOwners,omitempty"`
	// Name of node the reservation is scheduled on.
	// +optional
	NodeName string `json:"nodeName,omitempty"`
	// Resource reserved and allocatable for owners.
	// +optional
	Allocatable corev1.ResourceList `json:"allocatable,omitempty"`
	// Resource allocated by current owners.
	// +optional
	Allocated corev1.ResourceList `json:"allocated,omitempty"`
}

// ReservationOwner indicates the owner specification which can allocate reserved resources.
// +kubebuilder:validation:MinProperties=1
type ReservationOwner struct {
	// Multiple field selectors are ANDed.
	// +optional
	Object *corev1.ObjectReference `json:"object,omitempty"`
	// +optional
	Controller *ReservationControllerReference `json:"controller,omitempty"`
	// +optional
	LabelSelector *metav1.LabelSelector `json:"labelSelector,omitempty"`
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
	// ReservationSucceeded indicates the Reservation is scheduled and allocated for a owner, but not allocatable anymore.
	ReservationSucceeded ReservationPhase = "Succeeded"
	// ReservationWaiting indicates the Reservation is scheduled, but the resources to reserve are not ready for
	// allocation (e.g. in pre-allocation for running pods).
	ReservationWaiting ReservationPhase = "Waiting"
	// ReservationFailed indicates the Reservation is failed to reserve resources, due to expiration or marked as
	// unavailable, which the object is not available to allocate and will get cleaned in the future.
	ReservationFailed ReservationPhase = "Failed"
)

type ReservationCondition struct {
	Type               ReservationConditionType `json:"type,omitempty"`
	Status             ConditionStatus          `json:"status,omitempty"`
	Reason             string                   `json:"reason,omitempty"`
	Message            string                   `json:"message,omitempty"`
	LastProbeTime      metav1.Time              `json:"lastProbeTime,omitempty"`
	LastTransitionTime metav1.Time              `json:"lastTransitionTime,omitempty"`
}

type ReservationConditionType string

const (
	ReservationConditionScheduled ReservationConditionType = "Scheduled"
	ReservationConditionReady     ReservationConditionType = "Ready"
)

type ConditionStatus string

const (
	ConditionStatusTrue    ConditionStatus = "True"
	ConditionStatusFalse   ConditionStatus = "False"
	ConditionStatusUnknown ConditionStatus = "Unknown"
)

const (
	ReasonReservationScheduled     = "Scheduled"
	ReasonReservationUnschedulable = "Unschedulable"

	ReasonReservationAvailable = "Available"
	ReasonReservationSucceeded = "Succeeded"
	ReasonReservationExpired   = "Expired"
)
```

### Implementation Details

#### Reservation Plugin

##### Schedule Reservations

A `Reservation` object has its scheduling requirements like a pod. Ideally, A `Reservation` object should get processed directly by the scheduler like a pod. However, it can require a series of modifications on [scheduling framework](https://kubernetes.io/docs/concepts/scheduling-eviction/scheduling-framework/), losing the compatibility with standard kube-scheduler, kubelet, autoscaler, etc. In the reservation plugin, we fake one *reservation pod* for one `Reservation` inside the scheduler to fulfill general scheduling plugins (noderesources, nodeaffinity, tainttolerations, ...). The scheduling framework can handle `Reservation` objects by processing fake pods in both [scheduling cycle and binding cycle](https://kubernetes.io/docs/concepts/scheduling-eviction/scheduling-framework/#scheduling-cycle-binding-cycle).

A fake pod inside the scheduler can construct the same affinity/anti-affinity constraints as owner pods, which may change the reservation result. To handle this problem, koord-scheduler extends the framework to skip check of pod affinity for existing reservations in the `Filter` phase.

A reservation specified `PreAllocation` intends to pre-allocate resources on nodes. The scheduler will skip its filtering of node resources in the scheduling cycle. However, the scheduled reservation will be `Waiting` to be `Available` until there are enough resources to fulfill its requests.

If all nodes are unscheduled for the reservation, the scheduler keeps its status as `Pending` and sets `Conditions` with the failure message.

Once the scheduling decision has been made, the corresponding `Reservation` object is updated with a new status indicating whether the reservation succeeded or not. The fake pod does not expose to other components, and the kubelet without modification does not perceive a `Reservation` assigned. Fortunately, a `Reservation` does not need to be executable on the node, so existing containers can keep running as usual without additional admissions.

If a reservation has set the `nodeName` (inside the `template` field), the scheduler is responsible for checking if the node can fulfill the reservation since kubelet does not do admissions for the reservation.

##### Allocate Reserved Resources

Let's call the reservation is *allocatable* for a pod if:

1. The reservation is available.
2. The pod matches the reservation owner spec.
3. There are sufficient free resources in the reservation to fulfill the pod.

When the reservation plugin is enabled, the scheduler checks for every scheduling pod if there are allocatable reservations on a node. With a `Score` plugin implemented, the scheduler prefers pods to schedule on nodes which have more allocatable reserved resources.

When a pod is scheduled on a node with allocatable reservations, it allocates resources belonging to one of reservations. To pick one of reservations, we choose the one which can get most reserved resources allocated (i.e. MostAllocated). And the scheduler also annotates the pod with the reservation info.

##### Expiration and Cleanup

When a reservation has been created for a long time exceeding the `TTL` or `Expires`, the scheduler updates its status as `Expired`. For expired reservations, the scheduler will cleanup them with a custom garbage collection period.

When a node is deleted, the available and waiting reservations on the node should be marked as `Failed` since they are not allocatable any more.

#### Use Cases

To generally reserve node resources, submit a `Reservation` and set the pod template in the field `spec.template`. Then the koord-scheduler will update this `Reservation` with the scheduling result and the resources will get reserved.

To be more specific,

- `spec.template` specifies the fundamental resource requirements of a reservation. The scheduler will schedule the fake pod based on the template.
- `spec.owners` specifies which kinds of pods can use the reservation.
- `spec.ttl` and `expires` specifies the expiration for the reservation.
- `spec.preAllocation` indicates whether the scheduler should filter with its resource requirements. Otherwise, the pre-allocation of node resources is allowed, and the reservation will become available until there are sufficient resources.
- `status.phase` is marked as `Pending` when the Reservation is created. And it is marked as `Available` when the Reservation is successfully scheduled.
- `status.conditions` shows why the reservation is unscheduled or failed.
- When a Reservation is `Available` on the node, only specified pods can allocate the reserved resources.

##### Usage in Preemption

The [Priority Preemption](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/#preemption) happens in the PostFilter phase trying to make preemptive pods schedulable by evicting low-priority pods. When a pod succeeds the preemption, the pod `status` will be patched with a *nominated node* where the scheduler do the eviction. However, the preemptor's nominated node is not always the same as the scheduled node, since the scheduler does not reserve resources for the preemptor.
To ensure the preemptive resources are for the preemptor, firstly the scheduler can create a reservation that both sets `owners` with the preemptor pod and relevant affinity rules for reserving resources of the preempts. Then the scheduler evict pods, and the reservation will become `Available` once the resources are released. Finally, the preemptor pods can get scheduled on the nodes with preemptive resource reserved.

##### Usage in Descheduling

Before a pod is rescheduled, the descheduler can create a reservation that sets `template` and `owners` for the candidate. When the reservation becomes `Available`, the descheduler can assign the pod to allocate the reserved resources. This solves the problem in which the rescheduled pod has stopped at the old node but cannot run on the new node. Moreover, the descheduler can migrate resources between pods by setting the `preAllocation` field.

##### Usage in Pre-allocation

Reservations with `preAllocation` specified allow users to pre-allocate the node resources from running pods. The `status.phase` of the reservation is set as `Waiting` until the resources are released, indicating that its availability is conditional. Once the referenced pods have terminated, the `phase` is `Available` for owners, and the pre-allocation succeeds.

### Risks and Mitigations

Kubelet without any modification possibly ignore `Reservation` objects in predicate admission, which increases the chance of unexpected overcommitment at nodes. `Reservation` does not require any physical resources to be executable, so the overcommitment is mainly a problem only when pods get scheduled with `Reservation` and start to run, which is somewhat easier to mitigate since Kubelet do admit these pods. To further descrease the possibility of unexpected overcommitment or pods admit failures, we could use resource estimation for in-flight pods, balance pods to the nodes with less reserved resources, etc.

## Unsolved Problems

As stated above, `Reservation` can generate the same pod affinity/anti-affinity rules as the owner pods. The problem gets resolved in the koord-scheduler by extending scheduling framework, but it still limits the standard kube-scheduler.

## Alternatives

### Use a `pause` pod with a low priority to reserve resources

Reserving resources with [`pause` pods with very low assigned priority](https://github.com/kubernetes/autoscaler/blob/master/cluster-autoscaler/FAQ.md#how-can-i-configure-overprovisioning-with-cluster-autoscaler) does work when the preemption can be precisely enabled for specific pods. In the example of cluster autoscaler, `pause` pods are helpful when we need to overprovision resources to prevent idle nodes from scaling down by CA. However, a `pause` pod has no reservation guarantee except `priority`. As declared above, many scenarios require reservations to rely on other pod characteristics (e.g. names, namespaces, labels, priorityClass), where `pause` pods cannot meet the demands.

## References

1. [Kueue Pod Resource Reservation](https://docs.google.com/document/d/1sbFUA_9qWtorJkcukNULr12FKX6lMvISiINxAURHNFo)

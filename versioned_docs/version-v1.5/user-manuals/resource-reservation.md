# Resource Reservation

Resource Reservation is an ability of koord-scheduler for reserving node resources for specific pods or workloads.

## Introduction

Pods are fundamental for allocating node resources in Kubernetes, which bind resource requirements with business logic.
However, we may allocate resources for specific pods or workloads not created yet in the scenarios below:

1. Preemption: Existing preemption does not guarantee that only preempting pods can allocate preempted resources. We expect that the scheduler can "lock" resources preventing from allocation of other pods even if they have the same or higher priorities.
2. De-scheduling: For the descheduler, it is better to ensure sufficient resources before pods get rescheduled. Otherwise, rescheduled pods may not be runnable anymore and make the belonging application disrupted.
3. Horizontal scaling: To achieve more deterministic horizontal scaling, we expect to allocate node resources for the replicas to scale.
4. Resource Pre-allocation: We may want to pre-allocate node resources for future resource demands even if the resources are not currently allocatable.

To enhance the resource scheduling of Kubernetes, koord-scheduler provides a scheduling API named `Reservation`, which allows us to reserve node resources for specified pods or workloads even if they haven't get created yet.

![image](/img/resource-reservation.svg)

For more information, please see [Design: Resource Reservation](../designs/resource-reservation).

## Setup

### Prerequisite

- Kubernetes >= 1.18
- Koordinator >= 0.6

### Installation

Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to [Installation](/docs/installation).

### Configurations

Resource Reservation is *Enabled* by default. You can use it without any modification on the koord-scheduler config.

## Use Resource Reservation

### Quick Start

1. Deploy a reservation `reservation-demo` with the YAML file below.

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Reservation
metadata:
  name: reservation-demo
spec:
  template: # set resource requirements
    metadata:
      namespace: default
    spec:
      containers:
        - args:
            - '-c'
            - '1'
          command:
            - stress
          image: polinux/stress
          imagePullPolicy: Always
          name: stress
          resources: # reserve 500m cpu and 800Mi memory
            requests:
              cpu: 500m
              memory: 800Mi
      schedulerName: koord-scheduler # use koord-scheduler
  owners: # set the owner specifications
    - object: # owner pods whose name is `default/pod-demo-0`
        name: pod-demo-0
        namespace: default
  ttl: 1h # set the TTL, the reservation will get expired 1 hour later
```

```bash
$ kubectl create -f reservation-demo.yaml
reservation.scheduling.koordinator.sh/reservation-demo created
```

2. Watch the reservation status util it becomes available.

```bash
$ kubectl get reservation reservation-demo -o wide
NAME               PHASE       AGE   NODE     TTL  EXPIRES
reservation-demo   Available   88s   node-0   1h
```

3. Deploy a pod `pod-demo-0` with the YAML file below.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-demo-0 # match the owner spec of `reservation-demo`
spec:
  containers:
    - args:
        - '-c'
        - '1'
      command:
        - stress
      image: polinux/stress
      imagePullPolicy: Always
      name: stress
      resources:
        limits:
          cpu: '1'
          memory: 1Gi
        requests:
          cpu: 200m
          memory: 400Mi
  restartPolicy: Always
  schedulerName: koord-scheduler # use koord-scheduler
```

```bash
$ kubectl create -f pod-demo-0.yaml
pod/pod-demo-0 created
```

4. Check the scheduled result of the pod `pod-demo-0`.

```bash
$ kubectl get pod pod-demo-0 -o wide
NAME         READY   STATUS    RESTARTS   AGE   IP            NODE     NOMINATED NODE   READINESS GATES
pod-demo-0   1/1     Running   0          32s   10.17.0.123   node-0   <none>           <none>
```

`pod-demo-0` is scheduled at the same node with `reservation-demo`.

5. Check the status of the reservation `reservation-demo`.

```bash
$ kubectl get reservation reservation-demo -oyaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Reservation
metadata:
  name: reservation-demo
  creationTimestamp: "YYYY-MM-DDT05:24:58Z"
  uid: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  ...
spec:
  owners:
  - object:
      name: pod-demo-0
      namespace: default
  template:
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
          requests:
            cpu: 500m
            memory: 800Mi
      schedulerName: koord-scheduler
  ttl: 1h
status:
  allocatable: # total reserved
    cpu: 500m
    memory: 800Mi
  allocated: # current allocated
    cpu: 200m
    memory: 400Mi
  conditions:
  - lastProbeTime: "YYYY-MM-DDT05:24:58Z"
    lastTransitionTime: "YYYY-MM-DDT05:24:58Z"
    reason: Scheduled
    status: "True"
    type: Scheduled
  - lastProbeTime: "YYYY-MM-DDT05:24:58Z"
    lastTransitionTime: "YYYY-MM-DDT05:24:58Z"
    reason: Available
    status: "True"
    type: Ready
  currentOwners:
  - name: pod-demo-0
    namespace: default
    uid: yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
  nodeName: node-0
  phase: Available
```

Now we can see the reservation `reservation-demo` has reserved 500m cpu and 800Mi memory, and the pod `pod-demo-0`
allocates 200m cpu and 400Mi memory from the reserved resources.

6. Cleanup the reservation `reservation-demo`.

```bash
$ kubectl delete reservation reservation-demo
reservation.scheduling.koordinator.sh "reservation-demo" deleted
$ kubectl get pod pod-demo-0
NAME         READY   STATUS    RESTARTS   AGE
pod-demo-0   1/1     Running   0          110s
```

After the reservation deleted, the pod `pod-demo-0` is still running.

### Advanced Configurations

> The latest API can be found in [`reservation_types`](https://github.com/koordinator-sh/koordinator/blob/main/apis/scheduling/v1alpha1/reservation_types.go).

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Reservation
metadata:
  name: reservation-demo
spec:
  # pod template (required): Reserve resources and play pod/node affinities according to the template.
  # The resource requirements of the pod indicates the resource requirements of the reservation
  template:
    metadata:
      namespace: default
    spec:
      containers:
        - args:
            - '-c'
            - '1'
          command:
            - stress
          image: polinux/stress
          imagePullPolicy: Always
          name: stress
          resources:
            requests:
              cpu: 500m
              memory: 800Mi
      # scheduler name (required): use koord-scheduler to schedule the reservation
      schedulerName: koord-scheduler
  # owner spec (required): Specify what kinds of pods can allocate resources of this reservation.
  # Currently support three kinds of owner specifications:
  # - object: specify the name, namespace, uid of the owner pods
  # - controller: specify the owner reference of the owner pods, e.g. name, namespace(extended by koordinator), uid, kind
  # - labelSelector: specify the matching labels are matching expressions of the owner pods
  owners:
    - object:
        name: pod-demo-0
        namespace: default
    - labelSelector:
        matchLabels:
          app: app-demo
  # TTL (optional): Time-To-Live duration of the reservation. The reservation will get expired after the TTL period.
  # If not set, use `24h` as default.
  ttl: 1h
  # Expires (optional): Expired timestamp when the reservation is expected to expire.
  # If both `expires` and `ttl` are set, `expires` is checked first.
  expires: "YYYY-MM-DDTHH:MM:SSZ"
```

<!--
TODO: update pre-allocation and preemption api
-->

### Example: Reserve on Specified Node, with Multiple Owners

1. Check the resources allocatable of each node.

```bash
$ kubectl get node -o custom-columns=NAME:.metadata.name,CPU:.status.allocatable.cpu,MEMORY:.status.allocatable.memory
NAME     CPU     MEMORY
node-0   7800m   28625036Ki
node-1   7800m   28629692Ki
...
$ kubectl describe node node-1 | grep -A 8 "Allocated resources"
  Allocated resources:
    (Total limits may be over 100 percent, i.e., overcommitted.)
    Resource                     Requests     Limits
    --------                     --------     ------
    cpu                          780m (10%)   7722m (99%)
    memory                       1216Mi (4%)  14044Mi (50%)
    ephemeral-storage            0 (0%)       0 (0%)
    hugepages-1Gi                0 (0%)       0 (0%)
    hugepages-2Mi                0 (0%)       0 (0%)
```

As above, the node `node-1` has about 7.0 cpu and 26Gi memory unallocated.

2. Deploy a reservation `reservation-demo-big` with the YAML file below.

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Reservation
metadata:
  name: reservation-demo-big
spec:
  allocateOnce: false # allow the reservation to be allocated by multiple owners
  template:
    metadata:
      namespace: default
    spec:
      containers:
        - args:
            - '-c'
            - '1'
          command:
            - stress
          image: polinux/stress
          imagePullPolicy: Always
          name: stress
          resources: # reserve 6 cpu and 20Gi memory
            requests:
              cpu: 6
              memory: 20Gi
      nodeName: node-1 # set the expected node name to schedule at
      schedulerName: koord-scheduler
  owners: # set multiple owners
    - object: # owner pods whose name is `default/pod-demo-0`
        name: pod-demo-1
        namespace: default
    - labelSelector: # owner pods who have label `app=app-demo` can allocate the reserved resources
        matchLabels:
          app: app-demo
  ttl: 1h
```

```bash
$ kubectl create -f reservation-demo-big.yaml
reservation.scheduling.koordinator.sh/reservation-demo-big created
```

3. Watch the reservation status util it becomes available.

```bash
$ kubectl get reservation reservation-demo-big -o wide
NAME                   PHASE       AGE   NODE     TTL  EXPIRES
reservation-demo-big   Available   37s   node-1   1h
```

The reservation `reservation-demo-big` is scheduled at the node `node-1`, which matches the nodeName set in pod template.

4. Deploy a deployment `app-demo` with the YAML file below.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-demo
spec:
  replicas: 2
  selector:
    matchLabels:
      app: app-demo
  template:
    metadata:
      name: stress
      labels:
        app: app-demo # match the owner spec of `reservation-demo-big`
    spec:
      schedulerName: koord-scheduler # use koord-scheduler
      containers:
      - name: stress
        image: polinux/stress
        args:
          - '-c'
          - '1'
        command:
          - stress
        resources:
          requests:
            cpu: 2
            memory: 10Gi
          limits:
            cpu: 4
            memory: 20Gi
```

```bash
$ kubectl create -f app-demo.yaml
deployment.apps/app-demo created
```

5. Check the scheduled result of the pods of deployment `app-demo`.

```bash
k get pod -l app=app-demo -o wide
NAME                        READY   STATUS    RESTARTS   AGE   IP            NODE     NOMINATED NODE   READINESS GATES
app-demo-798c66db46-ctnbr   1/1     Running   0          2m    10.17.0.124   node-1   <none>           <none>
app-demo-798c66db46-pzphc   1/1     Running   0          2m    10.17.0.125   node-1   <none>           <none>
```

Pods of deployment `app-demo` are scheduled at the same node with `reservation-demo-big`.

6. Check the status of the reservation `reservation-demo-big`.

```bash
$ kubectl get reservation reservation-demo-big -oyaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Reservation
metadata:
  name: reservation-demo-big
  creationTimestamp: "YYYY-MM-DDT06:28:16Z"
  uid: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  ...
spec:
  allocateOnce: false # allow the reservation to be allocated by multiple owners
  owners:
  - object:
      name: pod-demo-0
      namespace: default
  template:
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
          requests:
            cpu: 500m
            memory: 800Mi
      schedulerName: koord-scheduler
  ttl: 1h
status:
  allocatable:
    cpu: 6
    memory: 20Gi
  allocated:
    cpu: 4
    memory: 20Gi
  conditions:
  - lastProbeTime: "YYYY-MM-DDT06:28:17Z"
    lastTransitionTime: "YYYY-MM-DDT06:28:17Z"
    reason: Scheduled
    status: "True"
    type: Scheduled
  - lastProbeTime: "YYYY-MM-DDT06:28:17Z"
    lastTransitionTime: "YYYY-MM-DDT06:28:17Z"
    reason: Available
    status: "True"
    type: Ready
  currentOwners:
  - name: app-demo-798c66db46-ctnbr
    namespace: default
    uid: yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
  - name: app-demo-798c66db46-pzphc
    namespace: default
    uid: zzzzzzzz-zzzz-zzzz-zzzzzzzzzzzz
  nodeName: node-1
  phase: Available
```

Now we can see the reservation `reservation-demo-big` has reserved 6 cpu and 20Gi memory, and the pods of deployment
`app-demo` allocates 4 cpu and 20Gi memory from the reserved resources.
The allocation for reserved resources does not increase the requested of node resources, otherwise the total request of
`node-1` would exceed the node allocatable.
Moreover, a reservation can be allocated by multiple owners when there are enough reserved resources unallocated.

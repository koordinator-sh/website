# Priority

Koordinator defines a set of specifications on top of kubernetes priority class, and extends a dimension of priority to support fine-grained colocation.

## Definition

Priority is represented by numbers, and four classes are currently defined:

PriorityClass |	Priority Ranges |	 Description
----- |   -----------   |  --------   
koord-prod  |	[9000, 9999]	| Selling requires planning resources quota in advance, and success is guaranteed within quota
koord-mid	  | [7000, 7999]	| Selling requires planning resources quota in advance, and success is guaranteed within quota
koord-batch | [5000, 5999]	| Selling requires planning resources quota in advance, and quota borrowing is allowed generally
koord-free  | [3000, 3999]	| Resource quota is not guaranteed, and the total allocatable resource depends on the total idle resources of the cluster

There is some white space between PriorityClass to support possible future extensions.


## Constraints

Koordinator matches different types of workloads to different priorities:
- koord-prod, running typical latency sensitive services, generally referring to types of services that require a "real-time" response, such as a typical service called by clicking a button in the mobile APP.
- koord-mid, corresponding to the available resources estimated by the appeal long-term reservation, typically used to run some real-time computing, AI training jobs, such as tensorflow/pytorch, etc.
- koord-batch, corresponding to the available resources estimated by the appeal short-term reservation, run typical offline batch jobs, generally referring to offline analysis type jobs, such as day-level big data reports, non-interactive SQL queries.
- koord-free, run low-priority offline batch jobs, generally refers to not making resource budgets, using idle resources to complete as much as possible, such as developers submitting a job for testing purposes.

## Koordinator Priority vs. Kubernetes Priority

Koordinator initializes four PriorityClasses in the kubernetes cluster:
```
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: koord-prod
value: 9000
description: "This priority class should be used for prod service pods only."
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: koord-mid
value: 7000
description: "This priority class should be used for mid service pods only."
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: koord-batch
value: 5000
description: "This priority class should be used for batch service pods only."
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: koord-free
value: 3000
description: "This priority class should be used for free service pods only."
```

Inside each PriorityClass, Koordinator allows users to set Pod colocation priorities for fine-grained resource scheduling.

## Examples

The following YAML is an example of a Pod configuration that uses the PriorityClass and Priority created in the preceding example.

```
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    env: test
    koordinator.sh/priority: "5300"
spec:
  containers:
  - name: nginx
    image: nginx
    imagePullPolicy: IfNotPresent
  priorityClassName: koord-batch
```

## What's Next

Here are some recommended next steps:

- Learn Koordinator's [Resource Model](./resource-model).
- Learn Koordinator's [QoS](./qos).

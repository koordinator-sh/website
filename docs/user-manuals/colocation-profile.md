---
sidebar_position: 1
---

# Colocation Profile

koord-manager has a variety of parameters that can be specified when creating a Custom Resource (CR). In this section, we will walk through all parameters in `ClusterColocationProfile`.

## What is ClusterColocationProfile?

`ClusterColocationProfile` is Kubernetes custom resource to configure webhook interception and mutation policy. It is a cluster-scoped resource, so it doesn't work in a particular namespace. We aim to reduce users workload by letting webhook do all the dirty work based on `ClusterColocationProfile`.

## Example

A `ClusterColocationProfile` is a resource with a YAML representation like the one below. Please do edit each parameter to fit your own use cases.

```yaml
apiVersion: config.koordinator.sh/v1alpha1
kind: ClusterColocationProfile
metadata:
  name: colocation-profile-example
spec:
  namespaceSelector:
    matchLabels:
      koordinator.sh/enable-colocation: "true"
  selector:
    matchLabels:
      sparkoperator.k8s.io/launched-by-spark-operator: "true"
  qosClass: BE
  priorityClassName: koord-batch
  koordinatorPriority: 1000
  schedulerName: koord-scheduler
  labels:
    koordinator.sh/mutated: "true"
  annotations: 
    koordinator.sh/intercepted: "true"
  patch:
    spec:
      terminationGracePeriodSeconds: 30
```

## General Parameters

If you are not familiar with Kubernetes resources please refer to the page [Understanding Kubernetes Objects](https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/).

- **namespaceSelector**: decides whether to mutate/validate Pods if the namespace matches the selector. Default to the empty LabelSelector,  which will match everything.

- **selector**: decides whether to mutate/validate Pods if the Pod matches the selector. Default to the empty LabelSelector, which will match everything.

- **qosClass** (*required*): describes the type of Koordinator QoS that the Pod is running. The value will be injected into Pod as label koordinator.sh/qosClass. Options are `LSE`, `LSR`, `LS`, `BE`, and `SYSTEM`. For more information, please check [here](../core-concepts/qos).

- **priorityClassName** (*required*): the priorityClassName and the priority value defined in PriorityClass will be injected into the Pod. Options are `koordinator-prod`, `koordinator-mid`, `koordinator-batch`, and `koordinator-free`. For more information, please check [here](../core-concepts/priority).

- **koordinatorPriority**: defines the Pod sub-priority in Koordinator. The priority value will be injected into Pod as label koordinator.sh/priority. Various Koordinator components determine the priority of the Pod in the Koordinator through KoordinatorPriority and the priority value in PriorityClassName. Higher the value, higher the priority.

- **labels**: describes the k/v pair that needs to inject into `Pod.Labels`.

- **annotations**: describes the k/v pair that needs to inject into `Pod.Annotations`.

- **schedulerName**: if specified, the pod will be dispatched by specified scheduler.

- **patch**: indicates Pod Template patching that user would like to inject into the Pod.

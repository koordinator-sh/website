---
sidebar_position: 1
---

# Colocation Profile

## Motivation

If the workloads in the existing cluster want to be co-located through Koordinator, you need to modify the existing Controller/Operator to support protocols such as the QoS class, priority, and resource model defined by Koordinator.
In order to avoid repeated construction and make it easier for everyone to obtain the benefits of co-location technology, Koordinator defines `ClusterColocationProfile` CRD, and implements webhook modify and verify newly created Pods, inject the fields described in `ClusterColocationProfile`.


## Architecture

![image](/img/clustercolocationprofile-arch.png)

## feature-gates

ClusterColocationProfile mutating/validating feature is turned on by default, if you want to turn it off set feature-gates:

```bash
$ helm install koordinator https://... --set featureGates="PodMutatingWebhook=false\,PodValidatingWebhook=false"
```


## Spec definition

If you are not familiar with Kubernetes resources please refer to the page [Understanding Kubernetes Objects](https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/).

- **namespaceSelector**: decides whether to mutate/validate Pods if the namespace matches the selector. Default to the empty LabelSelector,  which will match everything.

- **selector**: decides whether to mutate/validate Pods if the Pod matches the selector. Default to the empty LabelSelector, which will match everything.

- **qosClass** (*required*): describes the type of Koordinator QoS that the Pod is running. The value will be injected into Pod as label koordinator.sh/qosClass. Options are `LSE`, `LSR`, `LS`, `BE`, and `SYSTEM`. For more information, please check [here](../architecture/qos).

- **priorityClassName** (*required*): the priorityClassName and the priority value defined in PriorityClass will be injected into the Pod. Options are `koord-prod`, `koord-mid`, `koord-batch`, and `koord-free`. For more information, please check [here](../architecture/priority).

- **labels**: describes the k/v pair that needs to inject into `Pod.Labels`.

- **annotations**: describes the k/v pair that needs to inject into `Pod.Annotations`.

- **schedulerName**: if specified, the pod will be dispatched by specified scheduler.

- **patch**: indicates Pod Template patching that user would like to inject into the Pod.


## Example

### Create ClusterColocationProfile

The `profile.yaml` file below describes to modify Pod in Namepspace with label `koordinator.sh/enable-colocation=true` and inject Koordinator QoS, Koordinator Priority etc.

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
      koordinator.sh/enable-colocation: "true"
  qosClass: BE
  priorityClassName: koord-batch
  schedulerName: koord-scheduler
  labels:
    koordinator.sh/mutated: "true"
  annotations: 
    koordinator.sh/intercepted: "true"
  patch:
    spec:
      terminationGracePeriodSeconds: 30
```

Create a ClusterColocationProfile based on the YAML file:

```bash
$ kubectl apply -f profile.yaml
```

### Verify ClusterColocationProfile works

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    koordinator.sh/enable-colocation: "true"
  name: test-pod
spec:
  containers:
  - name: app
    image: nginx:1.15.1
    resources:
        limits:
          cpu: "1"
          memory: "3456Mi"
        requests:
          cpu: "1"
          memory: "3456Mi"
```

Create this pod and now you will find it's injected with Koordinator QoS, Koordinator Priority etc.

```bash
$ kubectl get pod test-pod -o yaml
apiVersion: v1
kind: Pod
metadata:
  annotations: 
    koordinator.sh/intercepted: true
  labels:
    koordinator.sh/qosClass: BE
    koordinator.sh/mutated: true
  ...
spec:
  terminationGracePeriodSeconds: 30
  priority: 5000
  priorityClassName: koord-batch
  schedulerName: koord-scheduler
  containers:
  - name: app
    image: nginx:1.15.1
    resources:
        limits:
          kubernetes.io/batch-cpu: "1000"
          kubernetes.io/batch-memory: 3456Mi
        requests:
          kubernetes.io/batch-cpu: "1000"
          kubernetes.io/batch-memory: 3456Mi
```

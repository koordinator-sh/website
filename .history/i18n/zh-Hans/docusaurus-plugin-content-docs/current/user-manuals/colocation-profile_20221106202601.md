---
sidebar_position: 1
---

# Colocation Profile

## Motivation

如果现有集群中的工作负载想要通过 Koordinator 共存，则需要修改现有的 Controller/Operator 以支持 Koordinator 定义的 QoS 类、优先级和资源模型等协议。
为了降低 Koordinator 混部系统的使用门槛，让大家可以简单快速的灰度和使用混部技术获得收益, 因此 Koordinator 提供了一个 `ClusterColocationProfile` CRD, 通过 webhook 修改和验证新创建的 Pod，注入 `ClusterColocationProfile` 中描述的字段


## 构架

![image](/img/clustercolocationprofile-arch.png)

## 特性门控

ClusterColocationProfile mutating/validating 功能默认是打开的, 如果想要关闭,请设置 feature-gates:

```bash
$ helm install koordinator https://... --set featureGates="PodMutatingWebhook=false\,PodValidatingWebhook=false"
```


## 规格定义

如果您对 Kubernetes 资源不熟悉，请参考页面 [了解 Kubernetes 对象](https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/).

- **namespaceSelector**: decides whether to mutate/validate Pods if the namespace matches the selector. Default to the empty LabelSelector,  which will match everything.

- **selector**: decides whether to mutate/validate Pods if the Pod matches the selector. Default to the empty LabelSelector, which will match everything.

- **qosClass** (*required*): describes the type of Koordinator QoS that the Pod is running. The value will be injected into Pod as label koordinator.sh/qosClass. Options are `LSE`, `LSR`, `LS`, `BE`, and `SYSTEM`. For more information, please check [here](../architecture/qos).

- **priorityClassName** (*required*): the priorityClassName and the priority value defined in PriorityClass will be injected into the Pod. Options are `koordinator-prod`, `koordinator-mid`, `koordinator-batch`, and `koordinator-free`. For more information, please check [here](../architecture/priority).

- **koordinatorPriority**: defines the Pod sub-priority in Koordinator. The priority value will be injected into Pod as label koordinator.sh/priority. Various Koordinator components determine the priority of the Pod in the Koordinator through KoordinatorPriority and the priority value in PriorityClassName. Higher the value, higher the priority.

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
    koordinator.sh/priority: 1000
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

---
sidebar_position: 1
---

# Colocation Profile

## Motivation

如果现有集群中的工作负载想要通过 Koordinator 进行混合部署，则需要修改现有的 Controller/Operator 以支持 Koordinator 定义的 QoS Class、优先级和资源模型等协议。为了降低 Koordinator 混部系统的使用门槛，让大家可以简单快速的使用混部技术获得收益，因此 Koordinator 提供了一个 `ClusterColocationProfile` CRD 和 对应的 Webhook 修改和验证新创建的 Pod，注入 `ClusterColocationProfile` 中描述的字段。


## 构架

![image](/img/clustercolocationprofile-arch.png)

## Feature Gates

ClusterColocationProfile mutating/validating 功能默认是打开的，如果想要关闭，请设置 Feature Gates：

```bash
$ helm install koordinator https://... --set featureGates="PodMutatingWebhook=false\,PodValidatingWebhook=false"
```


## 规格定义

如果您对 Kubernetes 资源不熟悉，请参考页面 [了解 Kubernetes 对象](https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/)。

- **namespaceSelector**： 如果命名空间与选择器匹配，则决定是否改变/验证 Pod。 LabelSelector 默认为空，它将匹配所有 Namespace。

- **selector**： 如果 Pod 与选择器匹配，则决定是否改变/验证 Pod。 默认为空的 LabelSelector，它将匹配所有 Pod。

- **qosClass** （*required*）： 描述了 Pod 的 Koordinator QoSClass。该值以标签 `koordinator.sh/qosClass` 的形式更新到 Pod 中。对应的选项为 `LSE`、`LSR`、`LS`、`BE` 和 `SYSTEM`。 有关更多信息，请查看页面[此处](../architecture/qos)。

- **priorityClassName** （*required*）： 指定要写入到 Pod.Spec.PriorityClassName 中的 Kubenretes PriorityClass. 选项为 `koord-prod`、`koord-mid`、`koord-batch` 和 `koord-free`。有关更多信息，请查看 [此处](../architecture/priority)。

- **koordinatorPriority**： Koordinator 还提供了 Pod 级别的子优先级 sub-priority。 优先级值将作为标签 `koordinator.sh/priority` 更新到 Pod。 各个 Koordinator 组件通过 KoordinatorPriority 和 PriorityClassName 中的优先级值来确定 Koordinator 中 Pod 的优先级，值越高，优先级越高。

- **labels**： 描述需要注入到 `Pod.Labels` 的 k/v 键值对。

- **annotations**： 描述了需要注入到 `Pod.Annotations` 的 k/v 键值对。

- **schedulerName**： 如果指定，则 Pod 将由指定的调度器调度。

- **patch**： 表示用户想要注入 Pod 的 Pod 模板补丁。


## 例子

### 创建 ClusterColocationProfile

下面的 `profile.yaml` 文件描述了对所有含有标签 `koordinator.sh/enable-colocation=true` 的 Namespace 下的所有含有标签 `koordinator.sh/enable-colocation=true` 的 Pod 进行修改，注入 Koordinator QoSClass、Koordinator Priority 等。

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

基于 YAML 文件创建 ClusterColocationProfile：

```bash
$ kubectl apply -f profile.yaml
```

### 验证 ClusterColocationProfile 是否生效

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

创建这个 Pod，现在你会发现该 Pod 被注入了 Koordinator QoSClass、Koordinator Priority 等。

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
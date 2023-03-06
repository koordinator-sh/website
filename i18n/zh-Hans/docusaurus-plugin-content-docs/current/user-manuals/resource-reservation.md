# 资源预留

资源预留是koord-scheduler的一种为某些特定pod或负载预留节点资源的能力。

## 介绍

容器是kubernetes节点资源分配的基础载体，他根据业务逻辑绑定对应的资源需求。但是我们可能分为一些还没创建的特定容器和负载分配资源，例如：

1. 抢占：已经存在的抢占规则不能保证只有正在抢占中的容器才能分配抢占的资源，我们期望调度器能锁定资源，防止这些资源被有相同或更高优先级的其他容器抢占。
2. 重调度：在重调度场景下，最好能保证在容器被重调度之前保留足够的资源。否则，被重调度的容器可能再也没法运行，然后对应的应用可能就会崩溃。
3. 水平扩容：为了能更精准地进行水平扩容，我们希望能为扩容的容器副本分配节点资源。
4. 资源预分配：即使当前的资源还不可用，我们可能想为将来的资源需求提前预留节点资源。

为了增强kubernetes的资源调度能力，koord-scheduler提供了一个名字叫`Reservation`的调度API,允许我们为一些当前还未创建的特定的容器和负载，提前预留节点资源。

![image](/img/resource-reservation.svg)

更多信息，请看 [设计文档：资源预留](../designs/resource-reservation)。

## 设置

### 前提

- Kubernetes >= 1.18
- Koordinator >= 0.6

### 安装步骤

请确保Koordinator的组件已经在你的集群中正确安装，如果还未正确安装，请参考[安装说明](/docs/installation)。

### 配置

资源预留功能默认*启用*，你无需对koord-scheduler配置做任何修改，即可使用。

## 使用指南

### 快速上手

1. 使用如下yaml文件预留资源：`reservation-demo`。

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Reservation
metadata:
  name: reservation-demo
spec:
  template: # set resource requirements
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

2. 跟踪reservation-demo的状态，直到它变成可用状态。

```bash
$ kubectl get reservation reservation-demo -o wide
NAME               PHASE       AGE   NODE     TTL  EXPIRES
reservation-demo   Available   88s   node-0   1h
```

3. 使用如下YAML文件部署一个容器：`pod-demo-0`。

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

4. 检查`pod-demo-0`的调度状态。

```bash
$ kubectl get pod pod-demo-0 -o wide
NAME         READY   STATUS    RESTARTS   AGE   IP            NODE     NOMINATED NODE   READINESS GATES
pod-demo-0   1/1     Running   0          32s   10.17.0.123   node-0   <none>           <none>
```

`pod-demo-0`将会和`reservation-demo`被调度到同一个节点。

5. 检查`reservation-demo`的状态。

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

现在我们可以看到`reservation-demo`预留了500m cpu和 800Mi内存,  `pod-demo-0`从预留的资源中分配了200m cpu and 400Mi内存。

6. 清理`reservation-demo`的预留资源。

```bash
$ kubectl delete reservation reservation-demo
reservation.scheduling.koordinator.sh "reservation-demo" deleted
$ kubectl get pod pod-demo-0
NAME         READY   STATUS    RESTARTS   AGE
pod-demo-0   1/1     Running   0          110s
```

在预留资源被删除后，`pod-demo-0`依然正常运行。

### 高级特性

> 最新的API可以在这里查看： [`reservation_types`](https://github.com/koordinator-sh/koordinator/blob/main/apis/scheduling/v1alpha1/reservation_types.go)。

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Reservation
metadata:
  name: reservation-demo
spec:
  # pod template (required): Reserve resources and play pod/node affinities according to the template.
  # The resource requirements of the pod indicates the resource requirements of the reservation
  template:
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

### 案例：多个属主在同一个节点预留资源

1. 检查每个节点的可分配资源。

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

如上图，`node-1`节点还保留7.0 cpu and 26Gi memory未分配。

2. 用如下YAML文件预留资源：`reservation-demo-big`。

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Reservation
metadata:
  name: reservation-demo-big
spec:
  template:
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

3. 跟踪`reservation-demo-big`的状态，直到他变成可用状态。

```bash
$ kubectl get reservation reservation-demo-big -o wide
NAME                   PHASE       AGE   NODE     TTL  EXPIRES
reservation-demo-big   Available   37s   node-1   1h
```

`reservation-demo-big`将被调度到容器模板中设置的nodeName属性节点:`node-1`。

4. 用如下YAML文件创建一次部署：`app-demo`。

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

5. 检查`app-demo`的容器调度结果.

```bash
k get pod -l app=app-demo -o wide
NAME                        READY   STATUS    RESTARTS   AGE   IP            NODE     NOMINATED NODE   READINESS GATES
app-demo-798c66db46-ctnbr   1/1     Running   0          2m    10.17.0.124   node-1   <none>           <none>
app-demo-798c66db46-pzphc   1/1     Running   0          2m    10.17.0.125   node-1   <none>           <none>
```

`app-demo`的容器将会被调度到`reservation-demo-big`所在的节点。

6. 检查`reservation-demo-big`的状态。

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

现在我们能看到`reservation-demo-big`预留了6 cpu和20Gi内存，`app-demo`从预留的资源中分配了4 cpu and 20Gi内存，预留资源的分配不会增加节点资源的请求容量，否则`node-1`的请求资源总容量将会超过可分配的资源容量。而且当有足够的未分配的预留资源时，这些预留资源可以被同时分配给多个属主。
# GangScheduling

## 简介
Koord-dscheduler 提供了 Gang Scheduling 满足 All-or-Nothing 调度需求。用户可以声明最小资源集合数，只有当已经完成调度资源数超过前面声明当前最小资源集合数才能触发节点绑定。
同时提供 `Strict` 和 `NonStrict` 两个参数用于控制资源累积过程，区别于其他社区方案将提供 two-level Gang 描述用于更好匹配真实场景。

## 设置

### 前置条件

- Kubernetes >= 1.18
- Koordinator >= 0.70

### 安装

请确保 Kubernetes 集群已经安装 Koordinator 组件，如果没有安装，请参阅 [安装](/docs/installation)。

### 配置

GangScheduling 特性默认*开启*，无需修改 koord-scheduler 配置进行开启。

## GangScheduling 使用手册

### 快速开始

#### Gang CRD 方式

1.创建 pod-group 资源
```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: gang-example
  namespace: default
spec:
  scheduleTimeoutSeconds: 100
  minMember: 2
```

```bash
$ kubectl get pgs -n default
  NAME           AGE
  gang-example   13s
```

2.创建子资源 pod1
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-example1
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: gang-example
spec:
  schedulerName: koord-scheduler
  containers:
  - command:
    - sleep
    - 365d
    image: busybox
    imagePullPolicy: IfNotPresent
    name: curlimage
    resources:
      limits:
        cpu: 40m
        memory: 40Mi
      requests:
        cpu: 40m
        memory: 40Mi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
```

```bash
$ kubectl get pod -n default
  NAME           READY   STATUS    RESTARTS   AGE
  pod-example1   0/1     Pending   0          7s
```

3.创建子资源 pod2
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-example2
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: gang-example
spec:
  schedulerName: koord-scheduler
  containers:
  - command:
    - sleep
    - 365d
    image: busybox
    imagePullPolicy: IfNotPresent
    name: curlimage
    resources:
      limits:
        cpu: 40m
        memory: 40Mi
      requests:
        cpu: 40m
        memory: 40Mi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
```

```bash
$ kubectl get pod -n default
  NAME           READY   STATUS    RESTARTS   AGE
  pod-example1   1/1     Running   0          53s
  pod-example2   1/1     Running   0          5s
```

```bash
$ kubectl get pg gang-example -n default -o yaml
```

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  creationTimestamp: "2022-10-09T09:08:17Z"
  generation: 6
spec:
  minMember: 1
  scheduleTimeoutSeconds: 100
status:
  phase: Running
  running: 2
  scheduled: 2
```

#### Pod Annotaion 方式
1.创建子资源 pod1
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-example1
  namespace: default
  annotations:
    gang.scheduling.koordinator.sh/name: "gang-example"
    gang.scheduling.koordinator.sh/min-available: "2"  
spec:
  schedulerName: koord-scheduler
  containers:
  - command:
    - sleep
    - 365d
    image: busybox
    imagePullPolicy: IfNotPresent
    name: curlimage
    resources:
      limits:
        cpu: 40m
        memory: 40Mi
      requests:
        cpu: 40m
        memory: 40Mi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
```

```bash
$ kubectl get pod -n default
  NAME           READY   STATUS    RESTARTS   AGE
  pod-example1   0/1     Pending   0          7s
```

2.创建子资源 pod2
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-example2
  namespace: default
  annotations:
    gang.scheduling.koordinator.sh/name: "gang-example"
    gang.scheduling.koordinator.sh/min-available: "2"  
spec:
  schedulerName: koord-scheduler
  containers:
  - command:
    - sleep
    - 365d
    image: busybox
    imagePullPolicy: IfNotPresent
    name: curlimage
    resources:
      limits:
        cpu: 40m
        memory: 40Mi
      requests:
        cpu: 40m
        memory: 40Mi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
```

```bash
$ kubectl get pod -n default
  NAME           READY   STATUS    RESTARTS   AGE
  pod-example1   1/1     Running   0          53s
  pod-example2   1/1     Running   0          5s
```

```bash
$ kubectl get pg gang-example -n default -o yaml
```

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  creationTimestamp: "2022-10-09T09:08:17Z"
  generation: 6
spec:
  minMember: 1
  scheduleTimeoutSeconds: 100
status:
  phase: Running
  running: 2
  scheduled: 2
```

#### Gang 调度调试接口:
```bash
$ kubectl -n koordinator-system get lease koord-scheduler --no-headers | awk '{print $2}' | cut -d'_' -f1 | xargs -I {} kubectl -n koordinator-system get pod {} -o wide --no-headers | awk '{print $6}'
  10.244.0.64

$ curl 10.244.0.64:10251/apis/v1/plugins/Coscheduling/gang/default/gang-example
```

```json
{
    "boundChildren": {
        "default/pod-example1": {},
        "default/pod-example2": {}
    },
    "children": {
        "default/pod-example1": {},
        "default/pod-example2": {}
    },
    "childrenScheduleRoundMap": {
        "default/pod-example1": 2,
        "default/pod-example2": 2
    },
    "createTime": "2022-10-09T07:31:53Z",
    "gangFrom": "GangFromPodAnnotation",
    "gangGroup": null,
    "hasGangInit": true,
    "minRequiredNumber": 2,
    "mode": "Strict",
    "name": "default/gang-example",
    "onceResourceSatisfied": true,
    "scheduleCycle": 2,
    "scheduleCycleValid": true,
    "totalChildrenNum": 2,
    "waitTime": 600000000000,
    "waitingForBindChildren": {}
}
```

#### Gang 调度高级配置
1.PodGroup Annotation 方式

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: gang-example1
  namespace: default
  annotations:
    gang.scheduling.koordinator.sh/total-number: "3"
    gang.scheduling.koordinator.sh/mode: "NonStrict"
    gang.scheduling.koordinator.sh/groups: "[\"default/gang-example1\", \"default/gang-example2\"]"
    
spec:
  scheduleTimeoutSeconds: 100
  minMember: 2
  
```

- `gang.scheduling.koordinator.sh/total-number` 用于配置 gang 内子资源总数。如果未配置，则使用 `minMember` 配置。
- `gang.scheduling.koordinator.sh/mode` 用于配置 Gang 调度失败处理策略。支持 `Strict\NonStrict` 两种模式，默认为 `Strict` 。
- `gang.scheduling.koordinator.sh/groups` 用于配置支持多个 gang 为一组完成 Gang 调度，用于支持多个 gang 之间有依赖关系的场景。

2.Pod Annotation 方式
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-example2
  namespace: default
  annotations:
    gang.scheduling.koordinator.sh/name: "gang-example1"
    gang.scheduling.koordinator.sh/min-available: "2"  
    gang.scheduling.koordinator.sh/total-number: "3"
    gang.scheduling.koordinator.sh/mode: "Strict\NonStrict"
    gang.scheduling.koordinator.sh/groups: "[\"default/gang-example1\", \"default/gang-example2\"]"
    gang.scheduling.koordinator.sh/waiting-time: "100s"
spec:
  schedulerName: koord-scheduler
  containers:
  - command:
    - sleep
    - 365d
    image: busybox
    imagePullPolicy: IfNotPresent
    name: curlimage
    resources:
      limits:
        cpu: 40m
        memory: 40Mi
      requests:
        cpu: 40m
        memory: 40Mi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
```

- `gang.scheduling.koordinator.sh/total-number` 用于配置 gang 内子资源总数。如果未配置，则使用 `gang.scheduling.koordinator.sh/min-available` 配置。
- `gang.scheduling.koordinator.sh/mode` 用于配置 Gang 调度失败处理策略。支持 `Strict\NonStrict` 两种模式，默认为 `Strict` 。
- `gang.scheduling.koordinator.sh/groups` 用于配置支持多个 gang 为一组完成 Gang 调度，用于支持多个 gang 之间有依赖关系的场景。
- `gang.scheduling.koordinator.sh/waiting-time` 用于配置自第一个 Pod 进入 Permit 阶段依赖的最大等待时间。

#### 调度器高级配置
您可以在 helm 中修改 `koord-scheduler-config.yaml` 来调整 `Coscheduling` 配置，如下所示：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: koord-scheduler-config
  namespace: {{ .Values.installation.namespace }}
data:
  koord-scheduler-config: |
    apiVersion: kubescheduler.config.k8s.io/v1beta2
    kind: KubeSchedulerConfiguration
    leaderElection:
      leaderElect: true
      resourceLock: leases
      resourceName: koord-scheduler
      resourceNamespace: {{ .Values.installation.namespace }}
    profiles:
      - pluginConfig:
        - name: Coscheduling
        args:
            apiVersion: kubescheduler.config.k8s.io/v1beta2
            kind: CoschedulingArgs`
            defaultTimeout: 600s
 	        controllerWorkers: 1
        - name: ElasticQuota
        ...
```
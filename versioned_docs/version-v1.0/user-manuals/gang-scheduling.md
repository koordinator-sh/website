# GangScheduling

## Introduction
We provide Gang mechanism for the scheduler to control pods binding opportunity. User can declare a resource-collection-minimum number, 
only when assigned-resources reach the given limitation can trigger the binding. We provide `Strict` and `NonStrict` to 
control the resource-accumulation-process by a configuration. We also provide a two-level Gang description for better matching 
the real scenario, which is different from community.

## Setup

### Prerequisite

- Kubernetes >= 1.18
- Koordinator >= 0.70

### Installation

Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to [Installation](/docs/installation).

### Configurations

GangScheduling is *Enabled* by default. You can use it without any modification on the koord-scheduler config.

## Use GangScheduling

### Quick Start

#### apply gang through gang crd
1.create pod-group
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

2.create child pod1
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

3.create child pod2
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

#### apply gang through annotation
1.create child pod1
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

2.create child pod2
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

#### device resource debug api:
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

#### advanced configuration for gang
1.apply through pod-group.

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

- `gang.scheduling.koordinator.sh/total-number` specifies the total children number of the gang. If not specified,it will be set with the `minMember`
- `gang.scheduling.koordinator.sh/mode` defines the Gang Scheduling operation when failed scheduling. Support `Strict\NonStrict`, default is `Strict`
- `gang.scheduling.koordinator.sh/groups` defines which gangs are bundled as a group. The gang will go to bind only all gangs in one group meet the conditions

2.apply through pod annotations.
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
- `gang.scheduling.koordinator.sh/total-number` specifies the total children number of the gang. If not specified,it will be set with the `gang.scheduling.koordinator.sh/min-available`
- `gang.scheduling.koordinator.sh/mode` defines the Gang Scheduling operation when failed scheduling. Support `Strict\NonStrict`, default is `Strict`
- `gang.scheduling.koordinator.sh/groups` defines which gangs are bundled as a group. The gang will go to bind only all gangs in one group meet the conditions
- `gang.scheduling.koordinator.sh/waiting-time` specifies gang's max wait time in Permit Stage.

#### advanced configuration for scheduler
you can modify `koord-scheduler-config.yaml` in helm to adjust `Coscheduling` configuration as below:

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
            kind: CoschedulingArgs
            defaultTimeout: 600s
 	        controllerWorkers: 1
        - name: ElasticQuota
        ...
```


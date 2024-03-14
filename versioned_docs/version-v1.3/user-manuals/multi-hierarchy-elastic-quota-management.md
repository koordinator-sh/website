# Multi Hierarchy Elastic Quota Management

Multi Hierarchy ElasticQuota Management is an ability of koord-scheduler to manage different user's resource usage in a shared-cluster.

## Introduction
When several users or teams share a cluster, fairness of resource allocation is very important. the Koordinator provides
multi-hierarchy elastic quota management mechanism for the scheduler. 
- It supports configuring quota groups in a tree structure, which is similar to the organizational structure of most companies.
- It supports the borrowing / returning of resources between different quota groups, for better resource utilization efficiency.
The busy quota groups can automatically temporarily borrow the resources from the idle quota groups, which can improve the
utilization of the cluster. At the same time, when the idle quota group turn into the busy quota group, it can also automatically
take back the "lent-to" resources.
- It considers the resource fairness between different quota groups. When the busy quota groups borrow the 
resources from the idle quota groups, the resources can be allocated to the busy quota groups under some fair rules.

## Setup

### Prerequisite

- Kubernetes >= 1.18
- Koordinator >= 0.71

### Installation

Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to [Installation](/docs/installation).

### Configurations

Multi-Hierarchy-ElasticQuota-Management is *Enabled* by default. You can use it without any modification on the koord-descheduler config.

## Use Multi-Hierarchy-ElasticQuota-Management

### Quick Start by Label

1.Create a Deployment `quota-example` with the YAML file below.

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: quota-example
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/parent: ""
    quota.scheduling.koordinator.sh/is-parent: "false"
spec:
  max:
    cpu: 40
    memory: 40Gi
  min:
    cpu: 10
    memory: 20Mi
```

```bash
$ kubectl apply -f quota-example.yaml
  elasticquota.scheduling.sigs.k8s.io/quota-example created

$ kubectl get eqs -n default
  NAME     AGE
  test-d   2s
```

2.Create a pod `pod-example` with the YAML file below.
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-example
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/name: "quota-example"
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
$ kubectl apply -f pod-example.yaml
  pod/pod-example created
```

3.Verify `quota-example` has changed.
```bash
$ kubectl get eqs -n default quota-example -o yaml
```
```yaml
kind: ElasticQuota
metadata:
  annotations:
    quota.scheduling.koordinator.sh/request: '{"cpu":"40m","memory":"40Mi"}'
    quota.scheduling.koordinator.sh/runtime: '{"cpu":"40m","memory":"40Mi"}'
    quota.scheduling.koordinator.sh/shared-weight: '{"cpu":"40","memory":"40Gi"}'
  creationTimestamp: "2022-10-08T09:26:38Z"
  generation: 2
  labels:
    quota.scheduling.koordinator.sh/is-parent: "false"
    quota.scheduling.koordinator.sh/parent: root
    manager: koord-scheduler
    operation: Update
    time: "2022-10-08T09:26:50Z"
  name: quota-example
  namespace: default
  resourceVersion: "39012008"
spec:
  max:
    cpu: "40"
    memory: 40Gi
  min:
    cpu: "10"
    memory: 20Mi
status:
  used:
    cpu: 40m
    memory: 40Mi
```

### Quick Start by Namespace
1.Create namespace
```bash
$ kubectl create ns quota-example
  namespace/quota-example created
```

2.Create a Deployment `quota-example` with the YAML file below.

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: quota-example
  namespace: quota-example
  labels:
    quota.scheduling.koordinator.sh/parent: ""
    quota.scheduling.koordinator.sh/is-parent: "false"
spec:
  max:
    cpu: 40
    memory: 40Gi
  min:
    cpu: 10
    memory: 20Mi
```

```bash
$ kubectl apply -f quota-example.yaml
  elasticquota.scheduling.sigs.k8s.io/quota-example created

$ kubectl get eqs -n quota-example
  NAME     AGE
  test-d   2s
```

2.Create a pod `pod-example` with the YAML file below.
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-example
  namespace: quota-example
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
$ kubectl apply -f pod-example.yaml
  pod/pod-example created
```

3.Verify `quota-example` has changed.
```bash
$ kubectl get eqs -n quota-example quota-example -o yaml
```
```yaml
kind: ElasticQuota
metadata:
  annotations:
    quota.scheduling.koordinator.sh/request: '{"cpu":"40m","memory":"40Mi"}'
    quota.scheduling.koordinator.sh/runtime: '{"cpu":"40m","memory":"40Mi"}'
    quota.scheduling.koordinator.sh/shared-weight: '{"cpu":"40","memory":"40Gi"}'
  creationTimestamp: "2022-10-08T09:26:38Z"
  generation: 2
  labels:
    quota.scheduling.koordinator.sh/is-parent: "false"
    quota.scheduling.koordinator.sh/parent: root
    manager: koord-scheduler
    operation: Update
    time: "2022-10-08T09:26:50Z"
  name: quota-example
  namespace: quota-example
  resourceVersion: "39012008"
spec:
  max:
    cpu: "40"
    memory: 40Gi
  min:
    cpu: "10"
    memory: 20Mi
status:
  used:
    cpu: 40m
    memory: 40Mi
```

### Quota Debug Api.
```bash
$ kubectl -n koordinator-system get lease koord-scheduler --no-headers | awk '{print $2}' | cut -d'_' -f1 | xargs -I {} kubectl -n koordinator-system get pod {} -o wide --no-headers | awk '{print $6}'
  10.244.0.64

$ curl 10.244.0.64:10251/apis/v1/plugins/ElasticQuota/quota/quota-example
```

```json
{
    "allowLentResource": true,
    "autoScaleMin": {
        "cpu": "10",
        "memory": "20Mi",
    },
    "isParent": false,
    "max": {
        "cpu": "40",
        "memory": "40Gi",
    },
    "min": {
        "cpu": "10",
        "memory": "20Mi",
    },
    "name": "quota-example",
    "parentName": "root",
    "podCache": {
        "pod-example": {
            "isAssigned": true,
            "resource": {
                "cpu": "40m",
                "memory": "40Mi"
            }
        }
    },
    "request": {
        "cpu": "40m",
        "memory": "40Mi"
    },
    "runtime": {
        "cpu": "40m",
        "memory": "41943040",
    },
    "runtimeVersion": 39,
    "sharedWeight": {
        "cpu": "40",
        "memory": "40Gi",
    },
    "used": {
        "cpu": "40m",
        "memory": "40Mi"
    }
}
```
The main different with yaml is that we can find all quota's pods and its status in `podCache`.

### Advanced Configurations
```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: quota-example
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/is-parent: false
    quota.scheduling.koordinator.sh/parent: "parent"
    quota.scheduling.koordinator.sh/allow-lent-resource: true
  annotations:
    quota.scheduling.koordinator.sh/shared-weight: '{"cpu":"40","memory":"40Gi"}'
spec:
  max:
    cpu: 40
    memory: 40Gi
  min:
    cpu: 10
    memory: 20Mi
```

- `quota.scheduling.koordinator.sh/is-parent` is disposed by the user. It reflects the "child\parent" attribute of the quota group. Default is child.
- `quota.scheduling.koordinator.sh/parent` is disposed by the user. It reflects the parent quota name. Default is root.
- `quota.scheduling.koordinator.sh/shared-weight` is disposed by the user. It reflects the ability to share the "lent to" resource. Default equals to "max".
- `quota.scheduling.koordinator.sh/allow-lent-resource` is disposed by the user. It reflects whether quota group allows lent unused "min" to others.

### WebHook Verify
1.Except for the first level quota group, we require that the sum of "min" of all sub quota groups should be less than or
equal to the "min" of parent group. 

first create parent quota:
```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: quota-parent-example
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/is-parent: true
spec:
  max:
    cpu: 40
    memory: 40Gi
  min:
    cpu: 10
    memory: 20Mi
```

then create child quota:
```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: quota-example
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/is-parent: false
    quota.scheduling.koordinator.sh/parent: "quota-parent-example"
spec:
  max:
    cpu: 40
    memory: 40Gi
  min:
    cpu: 20
    memory: 20Mi
```

```bash
kubectl apply -f quota-example.yaml
Error from server: error when creating "quota-example.yaml": admission webhook "vquota.kb.io" denied the request: checkMinQuotaSum allChildren SumMinQuota > parentMinQuota, parent: quota-parent-example
```

2.Parent and child's min\max resource key must same.
first create parent quota:
```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: quota-parent-example
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/is-parent: true
spec:
  max:
    cpu: 40
    memory: 40Gi
  min:
    cpu: 10
    memory: 20Mi
```

then create child quota:
```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: quota-example
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/is-parent: false
    quota.scheduling.koordinator.sh/parent: "quota-parent-example"
spec:
  max:
    cpu: 40
    memory: 40Gi
    test: 200
  min:
    cpu: 10
    memory: 20Mi
```

```bash
$ kubectl apply -f quota-example.yaml
  Error from server: error when creating "quota-example.yaml": admission webhook "vquota.kb.io" denied the request: checkSubAndParentGroupMaxQuotaKeySame failed: quota-parent-example's key is not the same with quota-example
```

3.Parent group cannot run pod.

first create parent quota:
```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: quota-parent-example
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/is-parent: true
spec:
  max:
    cpu: 40
    memory: 40Gi
  min:
    cpu: 10
    memory: 20Mi
```

then create pod:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-example
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/name: "quota-parent-example"
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
$ kubectl apply -f pod-example_xb.yaml
  Error from server: error when creating "pod-example.yaml": admission webhook "vpod.kb.io" denied the request: pod can not be linked to a parentQuotaGroup,quota:quota-parent-example, pod:pod-example
```

4.The parent of node can only be parent group, not child group.

first create parent quota:
```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: quota-parent-example
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/is-parent: false
spec:
  max:
    cpu: 40
    memory: 40Gi
  min:
    cpu: 10
    memory: 20Mi
```

then create child quota:
```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: quota-example
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/is-parent: false
    quota.scheduling.koordinator.sh/parent: "quota-parent-example"
spec:
  max:
    cpu: 40
    memory: 40Gi
    test: 200
  min:
    cpu: 10
    memory: 20Mi
```

```bash
$ kubectl apply -f quota-example.yaml
  Error from server: error when creating "elastic-quota-example_xb.yaml": admission webhook "vquota.kb.io" denied the request: quota-example has parentName quota-parent-example but the parentQuotaInfo's IsParent is false
```

5.A quota group can't be converted on the attribute of parent group\child group.

first create parent quota:
```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: quota-parent-example
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/is-parent: true
spec:
  max:
    cpu: 40
    memory: 40Gi
  min:
    cpu: 10
    memory: 20Mi
```

then modify `quota.scheduling.koordinator.sh/is-parent:false`:
```bash
$ kubectl apply -f quota-parent-example.yaml
  elastic-quota-example_xb_parent.yaml": admission webhook "vquota.kb.io" denied the request: IsParent is forbidden modify now, quotaName:quota-parent-example
```

### used > runtime revoke
We offer a config to control if quota's used > runtime, we allow the scheduler to delete over-resource-used pod from 
low priority to high priority. you should follow the below config of `koord-scheduler-config.yaml` in helm.

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
        - name: ElasticQuota
          args:
            apiVersion: kubescheduler.config.k8s.io/v1beta2
            kind: ElasticQuotaArgs
            quotaGroupNamespace: {{ .Values.installation.namespace }}
            enableCheckParentQuota: true
            monitorAllQuotas: true
            revokePodInterval: 60s
            delayEvictTime: 300s
        plugins:
          queueSort:
            disabled:
              - name: "*"
            enabled:
              - name: Coscheduling
          preFilter:
            enabled:
              - name: NodeNUMAResource
              - name: DeviceShare
              - name: Reservation
              - name: Coscheduling
              - name: ElasticQuota
          filter:
              ...
```
- `enableCheckParentQuota` check parentQuotaGroups' used and runtime Quota. Default is false.
- `monitorAllQuotas` enable "used > runtime revoke" logic. Default is false.
- `revokePodInterval` check loop time interval.
- `delayEvictTime` when "used > runtime" continues over `delayEvictTime` will really trigger eviction.

To let scheduler can really delete the pod successfully, you should config the `rbac/koord-scheduler.yaml` as below in helm.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: koord-scheduler-role
rules:
{{- if semverCompare "<= 1.20-0" .Capabilities.KubeVersion.Version }}
- apiGroups:
  - ""
  resources:
  - namespaces
  verbs:
  - get
  - list
  - watch
{{- end }}
- apiGroups:
  - coordination.k8s.io
  resources:
  - leases
  verbs:
  - create
  - get
  - update
- apiGroups:
  - ""
  resources:
  - pods
  verbs:
  - patch
  - update
  - delete
- apiGroups:
  - ""
  resources:
  - pods/eviction
  verbs:
  - create
- apiGroups:
  ...
```

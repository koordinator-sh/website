# Capacity Scheduling - Elastic Quota Management

Capacity Scheduling is an ability of koord-scheduler to manage different user's resource usage in a shared-cluster.

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

Capacity-Scheduling is *Enabled* by default. You can use it without any modification on the koord-descheduler config.

If you want to use multi quota trees, you need to set feature-gate `MultiQuotaTree` to true in koord-manager and koord-scheduler.

## Use Capacity-Scheduling

### Quick Start by Label

1.Create an ElasticQuota `quota-example` with the YAML file below.

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

$ kubectl get ElasticQuotaf -n default
  NAME     AGE
  test-d   2s
```

2.Create a Pod `pod-example` with the YAML file below.
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
$ kubectl get ElasticQuota -n default quota-example -o yaml
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
1.Create a Namespace
```bash
$ kubectl create ns quota-example
  namespace/quota-example created
```

2.Create a ElasticQuota `quota-example` with the YAML file below.

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

$ kubectl get ElasticQuota -n quota-example
  NAME     AGE
  test-d   2s
```

2.Create a Pod `pod-example` with the YAML file below.
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
$ kubectl get ElasticQuota -n quota-example quota-example -o yaml
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

### Quota Debug API
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

To prevent Pods from being revoked, you can add label `quota.scheduling.koordinator.sh/preemptible: false` to the Pod:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-example
  namespace: default
  labels:
    quota.scheduling.koordinator.sh/name: "quota-example"
    quota.scheduling.koordinator.sh/preemptible: false
spec:
...
```
In this case, the Pod is not allowed to use resources exceeding the `Min`.
Since the "Min" resources are the guaranteed resources, the Pod will not be evicted.

### multi quota tree

If you want to use multi quota trees, you need to set feature-gate `MultiQuotaTree` to true in koord-manager and koord-scheduler.


1. create quota profile `cn-hangzhou-k-nodepool` and `cn-hangzhou-g-nodepool` with the YAML file below.

```yaml
apiVersion: quota.koordinator.sh/v1alpha1
kind: ElasticQuotaProfile
metadata:
  labels:
    topology.kubernetes.io/region: cn-hangzhou
    topology.kubernetes.io/zone: cn-hangzhou-k
  name: cn-hangzhou-k-nodepool
  namespace: kube-system
spec:
  nodeSelector:
    matchLabels:
      topology.kubernetes.io/region: cn-hangzhou
      topology.kubernetes.io/zone: cn-hangzhou-k
  quotaLabels:
    quota.scheduling.koordinator.sh/is-parent: "true"
    topology.kubernetes.io/region: cn-hangzhou
    topology.kubernetes.io/zone: cn-hangzhou-k
  quotaName: cn-hangzhou-k-root-quota
---
apiVersion: quota.koordinator.sh/v1alpha1
kind: ElasticQuotaProfile
metadata:
  labels:
    topology.kubernetes.io/region: cn-hangzhou
    topology.kubernetes.io/zone: cn-hangzhou-g
  name: cn-hangzhou-g-nodepool
  namespace: kube-system
spec:
  nodeSelector:
    matchLabels:
      topology.kubernetes.io/region: cn-hangzhou
      topology.kubernetes.io/zone: cn-hangzhou-g
  quotaLabels:
    quota.scheduling.koordinator.sh/is-parent: "true"
    topology.kubernetes.io/region: cn-hangzhou
    topology.kubernetes.io/zone: cn-hangzhou-g
  quotaName: cn-hangzhou-g-root-quota
```

```bash
$ kubectl apply -f quota-profile.yaml
  elasticquotaprofile.quota.koordinator.sh/cn-hangzhou-k-nodepool created
  elasticquotaprofile.quota.koordinator.sh/cn-hangzhou-g-nodepool created
```

We has three nodes. two nodes is in cn-hangzhou-k, one node is in cn-hangzhou-g. Every node has 4 cpus(3.9 is allocatable) and 15.3Gi(12.52Gi is allocatable) memory.

The quota profile `cn-hangzhou-k-nodepool` select the nodes in cn-hangzhou-k.
The quota profile `cn-hangzhou-g-nodepool` select the nodes in cn-hangzhou-g.

```bash
$ kubectl --kubeconfig kubeconfig get nodes -L topology.kubernetes.io/zone
NAME                          STATUS   ROLES    AGE    VERSION            ZONE
cn-hangzhou.192.168.112.189   Ready    <none>   83m    v1.28.3-aliyun.1   cn-hangzhou-g
cn-hangzhou.192.168.14.209    Ready    <none>   102m   v1.28.3-aliyun.1   cn-hangzhou-k
cn-hangzhou.192.168.14.210    Ready    <none>   102m   v1.28.3-aliyun.1   cn-hangzhou-k
```

2. the profile controller will generate the root quota `cn-hangzhou-k-root-quota` and `cn-hangzhou-g-root-quota`

```bash
$  kubectl -nkube-system get eq  cn-hangzhou-k-root-quota cn-hangzhou-g-root-quota
NAME                              AGE
cn-hangzhou-k-root-quota   24m
cn-hangzhou-g-root-quota   24m
```

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  annotations:
    quota.scheduling.koordinator.sh/shared-weight: '{"cpu":"4611686018427387","memory":"4611686018427387"}'
    quota.scheduling.koordinator.sh/total-resource: '{"cpu":"7800m","ephemeral-storage":"227102691772","hugepages-1Gi":"0","hugepages-2Mi":"0","kubernetes.io/batch-cpu":"4458","kubernetes.io/batch-memory":"13451995003","kubernetes.io/mid-cpu":"0","kubernetes.io/mid-memory":"0","memory":"26264816Ki","pods":"46"}'
  creationTimestamp: "2024-03-19T11:11:24Z"
  generation: 1
  labels:
    quota.scheduling.koordinator.sh/is-parent: "true"
    quota.scheduling.koordinator.sh/is-root: "true"
    quota.scheduling.koordinator.sh/parent: koordinator-root-quota
    quota.scheduling.koordinator.sh/profile: cn-hangzhou-k-nodepool
    quota.scheduling.koordinator.sh/tree-id: "18340441938858026940"
    topology.kubernetes.io/region: cn-hangzhou
    topology.kubernetes.io/zone: cn-hangzhou-k
  name: cn-hangzhou-k-root-quota
  namespace: kube-system
  resourceVersion: "26949"
  uid: cf9c35e7-5f44-42a5-ba9d-1a365903b7a8
spec:
  max:
    cpu: "4611686018427387"
    memory: "4611686018427387"
  min:
    cpu: 7800m
    memory: 26264816Ki
status: {}
---
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  annotations:
    quota.scheduling.koordinator.sh/shared-weight: '{"cpu":"4611686018427387","memory":"4611686018427387"}'
    quota.scheduling.koordinator.sh/total-resource: '{"cpu":"3900m","ephemeral-storage":"113781462033","hugepages-1Gi":"0","hugepages-2Mi":"0","kubernetes.io/batch-cpu":"2276","kubernetes.io/batch-memory":"7120693060","kubernetes.io/mid-cpu":"0","kubernetes.io/mid-memory":"0","memory":"12903364Ki","pods":"23"}'
  creationTimestamp: "2024-03-19T11:11:30Z"
  generation: 1
  labels:
    quota.scheduling.koordinator.sh/is-parent: "true"
    quota.scheduling.koordinator.sh/is-root: "true"
    quota.scheduling.koordinator.sh/parent: koordinator-root-quota
    quota.scheduling.koordinator.sh/profile: cn-hangzhou-g-nodepool
    quota.scheduling.koordinator.sh/tree-id: "8589367430557242040"
    topology.kubernetes.io/region: cn-hangzhou
    topology.kubernetes.io/zone: cn-hangzhou-g
  name: cn-hangzhou-g-root-quota
  namespace: kube-system
  resourceVersion: "40568"
  uid: 8d886c21-c3c7-40b2-a944-b2f6117586b3
spec:
  max:
    cpu: "4611686018427387"
    memory: "4611686018427387"
  min:
    cpu: 3900m
    memory: 12903364Ki
status: {}
```

- `quota.scheduling.koordinator.sh/total-resource` is updated by the controller. It'll sum the node resources. And the quota min is equal the total resources.
- `quota.scheduling.koordinator.sh/is-root` means the root quota of the quota tree.
- `quota.scheduling.koordinator.sh/tree-id` means the tree id.

3. create child quota `test-child` with the YAML file below. the parent is `cn-hangzhou-k-root-quota`

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  annotations:
  labels:
    quota.scheduling.koordinator.sh/parent: cn-hangzhou-k-root-quota
  name: test-child
  namespace: kube-system
spec:
  max:
    cpu: 3
    memory: 6Gi
  min:
    cpu: 3
    memory: 6Gi
```

```bash
$ kubectl apply -f test-child.yaml
elasticquota.scheduling.sigs.k8s.io/test-child created
```

4. Create a pod `pod-example` with the YAML file below.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-example
  namespace: kube-system
  labels:
    quota.scheduling.koordinator.sh/name: "test-child"
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
        cpu: 1
        memory: 2Gi
      requests:
        cpu: 1
        memory: 2Gi
```

5. check the pod the quota info

The node is scheduled to the node cn-hangzhou.192.168.14.209. Indeed the quota profile nodeSelector is injected the the pod node affinity.

```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    k8s.aliyun.com/pod-ips: 192.168.15.4
  creationTimestamp: "2024-03-19T11:17:36Z"
  labels:
    quota.scheduling.koordinator.sh/name: test-child
  name: pod-example
  namespace: kube-system
  resourceVersion: "28417"
  uid: 021364da-820b-490c-843e-a6b2d51ed023
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: topology.kubernetes.io/region
            operator: In
            values:
            - cn-hangzhou
          - key: topology.kubernetes.io/zone
            operator: In
            values:
            - cn-hangzhou-k
  containers:
  - command:
    - sleep
    - 365d
    image: busybox
    imagePullPolicy: IfNotPresent
    name: curlimage
    resources:
      limits:
        cpu: "1"
        memory: 2Gi
      requests:
        cpu: "1"
        memory: 2Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
    volumeMounts:
    - mountPath: /var/run/secrets/kubernetes.io/serviceaccount
      name: kube-api-access-mf6vc
      readOnly: true
  dnsPolicy: ClusterFirst
  enableServiceLinks: true
  nodeName: cn-hangzhou.192.168.14.209
  preemptionPolicy: PreemptLowerPriority
  priority: 0
  restartPolicy: Always
  schedulerName: koord-scheduler
  securityContext: {}
  serviceAccount: default
  serviceAccountName: default
  terminationGracePeriodSeconds: 30
  tolerations:
  - effect: NoExecute
    key: node.kubernetes.io/not-ready
    operator: Exists
    tolerationSeconds: 300
  - effect: NoExecute
    key: node.kubernetes.io/unreachable
    operator: Exists
    tolerationSeconds: 300
  volumes:
  - name: kube-api-access-mf6vc
    projected:
      defaultMode: 420
      sources:
      - serviceAccountToken:
          expirationSeconds: 3607
          path: token
      - configMap:
          items:
          - key: ca.crt
            path: ca.crt
          name: kube-root-ca.crt
      - downwardAPI:
          items:
          - fieldRef:
              apiVersion: v1
              fieldPath: metadata.namespace
            path: namespace
```

the quota `test-child` used 1 cpu and 2Gi memory

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  annotations:
    quota.scheduling.koordinator.sh/child-request: '{"cpu":"1","memory":"2Gi"}'
    quota.scheduling.koordinator.sh/request: '{"cpu":"1","memory":"2Gi"}'
    quota.scheduling.koordinator.sh/runtime: '{"cpu":"1","memory":"2Gi"}'
    quota.scheduling.koordinator.sh/shared-weight: '{"cpu":"3","memory":"6Gi"}'
  creationTimestamp: "2024-03-19T11:16:11Z"
  generation: 2
  labels:
    quota.scheduling.koordinator.sh/parent: cn-hangzhou-k-root-quota
    quota.scheduling.koordinator.sh/tree-id: "18340441938858026940"
  name: test-child
  namespace: kube-system
  resourceVersion: "28358"
  uid: e929c26c-d8ff-420a-a300-f1e801370f81
spec:
  max:
    cpu: "3"
    memory: 6Gi
  min:
    cpu: "3"
    memory: 6Gi
status:
  used:
    cpu: "1"
    memory: 2Gi
```

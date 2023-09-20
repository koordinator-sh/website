# Device Scheduling - GPU/RDMA
We provide a fine-grained mechanism for managing GPUs and other devices such as RDMA and FPGA, defines a set of APIs to 
describe device information on nodes, including GPU, RDMA, and FPGA, and a new set of resource names to flexibly support 
users to apply at a finer granularity GPU resources. This mechanism is the basis for subsequent other GPU scheduling 
capabilities such as GPU Share, GPU Overcommitment, etc.

## Introduction
GPU devices have very strong computing power, but are expensive. How to make better use of GPU equipment, give full play 
to the value of GPU and reduce costs is a problem that needs to be solved. In the existing GPU allocation mechanism of 
the K8s community, the GPU is allocated by the kubelet, and it is a complete device allocation. This method is simple 
and reliable, but similar to the CPU and memory, the GPU will also be wasted. Therefore, some users expect to use only 
a portion of the GPU's resources and share the rest with other workloads to save costs. Moreover, GPU has particularities. 
For example, the NVLink and oversold scenarios supported by NVIDIA GPU mentioned below both require a central decision 
through the scheduler to obtain globally optimal allocation results.

## Setup

### Prerequisite

- Kubernetes >= 1.18
- Koordinator >= 0.71

### Installation

Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to [Installation](/docs/installation).

### Configurations

DeviceScheduling is *Enabled* by default. You can use it without any modification on the koord-scheduler config.

## Use DeviceScheduling

### Quick Start

1.check device crd:

```bash
$ kubectl get device host04 -o yaml
```

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Device
metadata:
  creationTimestamp: "2022-10-08T09:26:42Z"
  generation: 1
  managedFields:
  - apiVersion: scheduling.koordinator.sh/v1alpha1
    fieldsType: FieldsV1
    fieldsV1:
      f:metadata:
        f:ownerReferences: {}
      f:spec:
        .: {}
        f:devices: {}
      f:status: {}
    manager: koordlet
    operation: Update
    time: "2022-10-08T09:26:42Z"
  name: host04
  ownerReferences:
  - apiVersion: v1
    blockOwnerDeletion: true
    controller: true
    kind: Node
    name: host04
    uid: 09c4f912-6026-467a-85d2-6b2147c9557e
  resourceVersion: "39011943"
  selfLink: /apis/scheduling.koordinator.sh/v1alpha1/devices/host04
  uid: 5a498e1f-1357-4518-b74c-cab251d6c18c
spec:
  devices:
  - health: true
    id: GPU-04cea5cd-966f-7116-1d58-1ac34421541b
    minor: 0
    resources:
      kubernetes.io/gpu-core: "100"
      kubernetes.io/gpu-memory: 16Gi
      kubernetes.io/gpu-memory-ratio: "100"
    type: gpu
  - health: true
    id: GPU-3680858f-1753-371e-3c1a-7d8127fc7113
    minor: 1
    resources:
      kubernetes.io/gpu-core: "100"
      kubernetes.io/gpu-memory: 16Gi
      kubernetes.io/gpu-memory-ratio: "100"
    type: gpu
status: {}
```
We can find this node has two gpu cards, we can find the detail info of each gpu card here.

2.check node allocatable resource:

```bash
$ kubectl get node host04 -o yaml
```

```yaml
apiVersion: v1
kind: Node
metadata:
  annotations:
    flannel.alpha.coreos.com/backend-data: '{"VtepMAC":"5a:69:48:10:29:25"}'
  creationTimestamp: "2022-08-29T09:12:55Z"
  labels:
    beta.kubernetes.io/os: linux
  status:
    addresses:
    - address: 10.15.0.37
      type: InternalIP
    - address: host04
      type: Hostname
    allocatable:
      cpu: "6"
      ephemeral-storage: "200681483926"
      kubernetes.io/gpu: "200"
      kubernetes.io/gpu-core: "200"
      kubernetes.io/gpu-memory: 32Gi
      kubernetes.io/gpu-memory-ratio: "200"
      memory: 59274552Ki
      nvidia.com/gpu: "2"
      pods: "220"
    capacity:
      cpu: "8"
      kubernetes.io/gpu: "200"
      kubernetes.io/gpu-core: "200"
      kubernetes.io/gpu-memory: 32Gi
      kubernetes.io/gpu-memory-ratio: "200"
      memory: 61678904Ki
      nvidia.com/gpu: "2"
      pods: "220"
```
We can find the node allocatable resource has merged each gpu card resource.

3.apply pod:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-example
  namespace: default
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
        kubernetes.io/gpu: "100"
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
```

```bash
$ kubectl get pod -n default pod-example -o yaml
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    scheduling.koordinator.sh/device-allocated: '{"gpu":[{"minor":0,"resources":{"kubernetes.io/gpu-core":"100","kubernetes.io/gpu-memory":"12508288Ki","kubernetes.io/gpu-memory-ratio":"100"}}]}'
  creationTimestamp: "2022-10-08T09:33:07Z"
  name: pod-example
  namespace: default
  resourceVersion: "39015044"
  selfLink: /api/v1/namespaces/xlf/pods/gpu-pod7
  uid: 6bf1ac3c-0c9f-472a-8b86-de350bbfa795
spec:
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
        kubernetes.io/gpu: "100"
        memory: 256Mi
      requests:
        cpu: "1"
        kubernetes.io/gpu: "100"
        memory: 256Mi
status:
  conditions:
  ...
  hostIP: 10.0.0.149
  phase: Running
  podIP: 10.244.2.45
  podIPs:
  - ip: 10.244.2.45
  qosClass: Guaranteed
  startTime: "2022-10-08T09:33:07Z"
```
You can find the concrete device allocate result through annotation `scheduling.koordinator.sh/device-allocated`.

4.more apply protocol:
```yaml
apiVersion: v1
kind: Pod
...
spec:
    ...
    resources:
      requests:
        cpu: 40m
        memory: 40Mi
        nvidia.com/gpu: "100"
```

```yaml
apiVersion: v1
kind: Pod
...
spec:
    ...
    resources:
      requests:
        cpu: 40m
        memory: 40Mi
        kubernetes.io/gpu-core: "100"
        kubernetes.io/gpu-memory-ratio: "100"
```

```yaml
apiVersion: v1
kind: Pod
...
spec:
    ...
    resources:
      requests:
        cpu: 40m
        memory: 40Mi
        kubernetes.io/gpu-core: "100"
        kubernetes.io/gpu-memory: "16Mi"
```

4.device resource debug api:
```bash
$ kubectl -n koordinator-system get lease koord-scheduler --no-headers | awk '{print $2}' | cut -d'_' -f1 | xargs -I {} kubectl -n koordinator-system get pod {} -o wide --no-headers | awk '{print $6}'
  10.244.0.64

$ curl 10.244.0.64:10251/apis/v1/plugins/DeviceShare/nodeDeviceSummaries
$ curl 10.244.0.64:10251/apis/v1/plugins/DeviceShare/nodeDeviceSummaries/host04
```

```json
{
    "allocateSet": {
        "gpu": {
            "xlf/gpu-pod7": {
                "0": {
                    "kubernetes.io/gpu-core": "100",
                    "kubernetes.io/gpu-memory": "12508288Ki",
                    "kubernetes.io/gpu-memory-ratio": "100"
                }
            }
        }
    },
    "deviceFree": {
        "kubernetes.io/gpu-core": "0",
        "kubernetes.io/gpu-memory": "0",
        "kubernetes.io/gpu-memory-ratio": "0"
    },
    "deviceFreeDetail": {
        "gpu": {
            "0": {
                "kubernetes.io/gpu-core": "0",
                "kubernetes.io/gpu-memory": "0",
                "kubernetes.io/gpu-memory-ratio": "0"
            }
        }
    },
    "deviceTotal": {
        "kubernetes.io/gpu-core": "100",
        "kubernetes.io/gpu-memory": "12508288Ki",
        "kubernetes.io/gpu-memory-ratio": "100"
    },
    "deviceTotalDetail": {
        "gpu": {
            "0": {
                "kubernetes.io/gpu-core": "100",
                "kubernetes.io/gpu-memory": "12508288Ki",
                "kubernetes.io/gpu-memory-ratio": "100"
            }
        }
    },
    "deviceUsed": {
        "kubernetes.io/gpu-core": "100",
        "kubernetes.io/gpu-memory": "12508288Ki",
        "kubernetes.io/gpu-memory-ratio": "100"
    },
    "deviceUsedDetail": {
        "gpu": {
            "0": {
                "kubernetes.io/gpu-core": "100",
                "kubernetes.io/gpu-memory": "12508288Ki",
                "kubernetes.io/gpu-memory-ratio": "100"
            }
        }
    }
}
```

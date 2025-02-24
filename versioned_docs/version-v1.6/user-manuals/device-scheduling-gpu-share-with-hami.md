# Device Scheduling - GPU Share With HAMi

## Introduction

GPU is an indispensable device for today's large AI model training and inference, and can provide powerful computing power support for AI applications. An NVIDIA A100 80 GB GPU can provide up to 249 times the inference performance on the BERT-LARGE task compared to a CPU. However, behind such powerful computing power is an expensive price. An NVIDIA A100 40GB model GPU chip is priced at around $13,000, while an A100 80GB model GPU chip is priced at around $15,000. We have observed that some inference tasks often use less than a full GPU, but only use, for example, 50% of the computing power or gpu memory. Therefore, sharing a GPU with multiple Pods can significantly improve GPU resource utilization.

[HAMi](https://project-hami.io/docs/developers/hami-core-design/) is a [Cloud Native Computing Foundation](https://cncf.io/) sandbox project which provides the ability to share Heterogeneous AI devices among tasks. Koordinator takes advantage of HAMi's GPU isolation capabilities on the node side to provide an end-to-end GPU sharing solution.

## Setup

### Prerequisite

- Kubernetes >= 1.18
- Koordinator >= 1.6

### Installation

Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to [Installation](/docs/installation).

#### Runtime Requirements

The scheduled GPU devices are bound to the container requires support from the runtime environment. Currently, there are two solutions to achieve this:

| Runtime Environment                           | Installation                                                 |
| --------------------------------------------- | ------------------------------------------------------------ |
| Containerd >= 1.7.0 <br /> Koordinator >= 1.6 | Please make sure NRI is enabled in containerd. If not, please refer to [Enable NRI in Containerd](https://github.com/containerd/containerd/blob/main/docs/NRI.md) |

#### HAMi-Core Installation

[HAMi-core](https://github.com/Project-HAMi/HAMi-core) is the in-container gpu resource controller, it operates by Hijacking the API-call between CUDA-Runtime(libcudart.so) and CUDA-Driver(libcuda.so). The output from building HAMi-core is libvgpu.so. You can directly install HAMi-core on your nodes by deploying the DaemonSet with the YAML file provided below.

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: hami-core-distribute
  namespace: default
spec:
  selector:
    matchLabels:
      koord-app: hami-core-distribute
  template:
    metadata:
      labels:
        koord-app: hami-core-distribute
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: node-type
                operator: In
                values:
                - "gpu"
      containers:
      - command:
        - /bin/sh
        - -c
        - |
          cp -f /k8s-vgpu/lib/nvidia/libvgpu.so /usl/local/vgpu && sleep 3600000
        image: docker.m.daocloud.io/projecthami/hami:v2.4.0
        imagePullPolicy: Always
        name: name
        resources:
          limits:
            cpu: 200m
            memory: 256Mi
          requests:
            cpu: "0"
            memory: "0"
        volumeMounts:
        - mountPath: /usl/local/vgpu
          name: vgpu-hook
        - mountPath: /tmp/vgpulock
          name: vgpu-lock
      tolerations:
      - operator: Exists
      volumes:
      - hostPath:
          path: /usl/local/vgpu
          type: DirectoryOrCreate
        name: vgpu-hook
     # https://github.com/Project-HAMi/HAMi/issues/696
      - hostPath:
          path: /tmp/vgpulock
          type: DirectoryOrCreate
        name: vgpu-lock
```

The above DaemonSet will distribute 'libvgpu.so' to the /usr/local/vgpu directory and create `/tmp/vgpulock` directory for all nodes with node-type=gpu labelled.

### Configurations

DeviceScheduling is *Enabled* by default. You can use it without any modification on the koord-scheduler config.

## Use GPU Share With HAMi

1. Create a Pod to apply for a GPU card with 50% computing power and 50% gpu memory, and specify the need for hami-core isolation through the Pod Label koordinator.sh/gpu-isolation-provider

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-example
  namespace: default
  labels:
    koordinator.sh/gpu-isolation-provider: hami-core
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
        koordinator.sh/gpu-shared: 1
        koordinator.sh/gpu-core: 50
        koordinator.sh/gpu-memory-ratio: 50
      requests:
        cpu: 40m
        memory: 40Mi
        koordinator.sh/gpu-shared: 1
        koordinator.sh/gpu-core: 50
        koordinator.sh/gpu-memory-ratio: 50
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
    scheduling.koordinator.sh/device-allocated: '{"gpu":[{"minor":1,"resources":{"koordinator.sh/gpu-core":"50","koordinator.sh/gpu-memory":"11520Mi","koordinator.sh/gpu-memory-ratio":"50"}}]}'
  name: pod-example
  namespace: default
  labels:
    koordinator.sh/gpu-isolation-provider: hami-core
...
```

You can find the concrete device allocate result through annotation `scheduling.koordinator.sh/device-allocated`.

2. Enter the pod and you can see that the upper limit of the gpu memory seen by the program inside the pod is the value shown in the allocation result above.

```bash
$ kubectl exec -it -n default pod-example bash
```

![image](/img/gpu-share-with-hami-result.png)

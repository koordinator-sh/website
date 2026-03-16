# 设备调度 - 沐曦 GPU

## 背景

当前 Koordinator 支持沐曦卡在 K8s 的使用，基于 koord-device-daemon 和 koordlet 组件上报异构 GPU 资源，将异构卡信息汇总到 Device 中供调度器进行拓扑调度。

## 使用方法

### 前置条件

沐曦卡GPU虚拟化的使用需要提前安装配置如下组件
- 沐曦 Driver
- 沐曦 [metax-container-runtime](https://developer.metax-tech.com/api/client/document/preview/1006/k8s/03_component.html#container-runtime)
- 沐曦 [metax-gpu-device (开启sGPU参数配置)](https://developer.metax-tech.com/api/client/document/preview/1006/k8s/03_component.html#device-config)

```yaml sGPU 启动配置
apiVersion: v1
kind: ConfigMap
metadata:
  name: metax-device-config
data:
  version: v1
  cluster-config: |
    mode: "native" # sgpu/shared/vgpu, cluster scope
  nodes-config: |
    - nodeName: "sample-node1"
      mode: "sgpu" # sgpu/shared/vgpu, node scope
```

- Koordinator 相关组件(koordinator >= v1.7.0)
  - 需要在 chart 的 `scheduler.featureGates` 参数中加入 `DevicePluginAdaption=true` 以启用该功能所需的特性门控
   
> **注:** [sGPU](https://developer.metax-tech.com/api/client/document/preview/1009/k8s/04_sgpu.html#sgpu) 是沐曦基于软件实现的算力切分方案，可以基于物理GPU创建最多16个虚拟GPU实例，主要面向基于容器的云端推理和小模型训练场景。
### 使用

1. 确认沐曦卡已成功被 Device 识别，示例如下，通过 `kubectl get device <node-name> -o yaml` 查看 Device 资源。
   
> **注意:** 
> - node.koordinator.sh/gpu-vendor 对应的标签值为 metax

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Device
metadata:
  labels:
    node.koordinator.sh/gpu-model: C500 # The model of the Cambricon card.
    node.koordinator.sh/gpu-vendor: metax # The vendor of the card.
  name: sample-node1
spec:
  devices:
  - health: true
    id: 89033010-2354-0000-0000-000000000000 # The UUID of the Metax card (mocked value).
    minor: 0 # The minor number of the Cambricon card.
    resources:
      koordinator.sh/gpu-core: "100" # The total compute capacity of the Cambricon card in percentage.
      koordinator.sh/gpu-memory: "64Gi" # The total GPU memory of the Cambricon card.
      koordinator.sh/gpu-memory-ratio: "100" # The total GPU memory ratio in percentage.
    topology:
      busID: 0000:38:00.0 # The PCI bus ID.
      nodeID: 3 # The NUMA node ID.
      pcieID: pci0000:3a # The PCI root ID.
      socketID: -1
    type: gpu
    conditions:
    - lastTransitionTime: "20256-03-15T10:00:00Z"
      message: device is healthy
      reason: DeviceHealthy
      status: "True"
      type: Healthy
status: {}
```

2. 确认沐曦的节点上已正确注册沐曦卡资源信息，示例如下，通过 `kubectl get node <node-name> -o yaml` 查看 node.status.allocatable/node.status.capacity 资源。

```yaml
apiVersion: v1
kind: Node
metadata:
  name: sample-node1
  ...
status:
    allocatable:
      ...
      koordinator.sh/gpu.shared: "100" # Report by koordinator
      koordinator.sh/gpu-core: "100" # Report by koordinator
      koordinator.sh/gpu-memory: 64Gi # Report by koordinator
      koordinator.sh/gpu-memory-ratio: "100" # Report by koordinator
      metax-tech.com/sgpu: "16" # Report by metax-gpu-device
    capacity:
      ...
      koordinator.sh/gpu.shared: "100" # Report by koordinator
      koordinator.sh/gpu-core: "100" # Report by koordinator
      koordinator.sh/gpu-memory: 24Gi # Report by koordinator
      koordinator.sh/gpu-memory-ratio: "100" # Report by koordinator
      metax-tech.com/sgpu: "16" # Report by metax-gpu-device
```

3. 创建 Pod 申请使用沐曦卡，样例如下，示例中申请了虚拟卡场景。**沐曦不支持配置多卡虚拟化**。

> **注意:**
> - 此处镜像使用了乌班图基础镜像，用户可根据实际需求选择合适的镜像
> - resources.limits 和 resources.requests 中均需要额外配置资源
>  - 虚拟卡场景，以 Metax C500 使用虚拟化为例。
>    - koordinator.sh/gpu.shared
>      - 使用虚拟卡填写 1 即可。
>    - koordinator.sh/gpu-core
>      - 用多少算力，填写多少即可，百分比表示。
>    - koordinator.sh/gpu-memory
>      - 用多少显存，填写多少即可
>    -  metax-tech.com/sgpu
>      - 用几张虚拟卡，填写几即可
> - metadata.annoations 中需要配置qos策略
>  - fixed-share 表示固定资源
>  - best-effort 表示竞争资源
>  - burst-share 表示弹性共享资源（保证基础资源，额外资源空闲可超额使用）

```yaml sGPU
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: demo-sleep
  name: test-metax-sGPU
  namespace: default
  annotations:
     metax-tech.com/sgpu-qos-policy: "fixed-share" # fixed-share/best-effort/burst-share
spec:
  containers:
  - command:
    - sleep
    - infinity
    image: ubuntu:22.04
    imagePullPolicy: IfNotPresent
    name: demo-sleep
    resources:
      limits:
        cpu: "32"
        memory: 64Gi
        koordinator.sh/gpu.shared: "1"
        koordinator.sh/gpu-memory: "1Gi"
        koordinator.sh/gpu-core: "10"
        metax-tech.com/sgpu: "1"
      requests:
        cpu: "32"
        memory: 64Gi
        koordinator.sh/gpu.shared: "1"
        koordinator.sh/gpu-memory: "1Gi"
        koordinator.sh/gpu-core: "10"
        metax-tech.com/sgpu: "1"
```

4. 进入容器内部(`kubectl exec -it {pod-name} --bash`)，在容器内部执行 `ls /dev/mx*` 命令查看卡挂载情况。如果能够正常输出，表示卡已经成功分配到 Pod 中。
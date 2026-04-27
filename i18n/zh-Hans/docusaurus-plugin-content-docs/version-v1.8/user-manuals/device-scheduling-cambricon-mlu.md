# 设备调度 - 寒武纪 MLU

## 背景

当前 Koordinator 支持寒武纪卡在 K8s 的使用，基于 koord-device-daemon 和 koordlet 组件上报异构 GPU 资源，将异构卡信息汇总到 Device 中供调度器进行拓扑调度。

## 使用方法

### 前置条件

昇腾卡的使用需要提前安装配置如下组件
- 寒武纪 Driver
- 寒武纪 [Cambricon Device Plugin (开启虚拟化参数配置)](https://github.com/Cambricon/cambricon-k8s-device-plugin)
```yaml dynamic-smlu 启动参数
args:
  - --mode=dynamic-smlu # device plugin mode: default, dynamic-smlu, env-share, mim, topology-aware
  - --virtualization-num=1 # virtualization number for each MLU, used only in env-share mode, set to 110 to support multi cards per container in env-share mode
  - --mlulink-policy=best-effort # MLULink topology policy: best-effort, guaranteed or restricted, used only in topology-aware mode
  - --cnmon-path=/usr/bin/cnmon # host machine cnmon path, must be absolute path. comment out this line to avoid mounting cnmon
  - --log-level=info # log level: trace/debug/info/warn/error/fatal/panic" default:"info"
  - --min-dsmlu-unit=256 # minimum unit for dsmu, used only in dynamic-smlu mode" default:"0" env:"MIN-DSMLU-UNIT"
```
- Koordinator 相关组件(koordinator >= v1.7.0)
  - 需要在 chart 的 `scheduler.featureGates` 参数中加入 `DevicePluginAdaption=true` 以启用该功能所需的特性门控

### 使用

1. 确认寒武纪卡已成功被 Device 识别，示例如下，通过 `kubectl get device <node-name> -o yaml` 查看 Device 资源。
注意：
   - node.koordinator.sh/gpu-vendor 对应的标签值为 cambricon
```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Device
metadata:
  labels:
    node.koordinator.sh/gpu-model: MLU-370 # The model of the Cambricon card.
    node.koordinator.sh/gpu-vendor: cambricon # The vendor of the card.
  name: node-1
spec:
  devices:
  - health: true
    id: 89033010-2354-0000-0000-000000000000 # The UUID of the Cambricon card (mocked value).
    minor: 0 # The minor number of the Cambricon card.
    resources:
      koordinator.sh/gpu-core: "100" # The total compute capacity of the Cambricon card in percentage.
      koordinator.sh/gpu-memory: 24Gi # The total GPU memory of the Cambricon card.
      koordinator.sh/gpu-memory-ratio: "100" # The total GPU memory ratio in percentage.
    topology:
      busID: 0000:47:00.0 # The PCI bus ID.
      nodeID: 3 # The NUMA node ID.
      pcieID: pci0000:3a # The PCI root ID.
      socketID: -1
    type: gpu
    conditions:
    - lastTransitionTime: "2025-04-25T10:00:00Z"
      message: device is healthy
      reason: DeviceHealthy
      status: "True"
      type: Healthy
status: {}
```
2. 确认寒武纪的节点上已正确注册寒武纪卡资源信息，示例如下，通过 `kubectl get node <node-name> -o yaml` 查看 node.status.allocatable/node.status.capacity 资源。

```yaml
apiVersion: v1
kind: Node
metadata:
  name: node-1
  ...
status:
    allocatable:
      ...
      koordinator.sh/gpu.shared: "100" # Report by koordinator
      koordinator.sh/gpu-core: "100" # Report by koordinator
      koordinator.sh/gpu-memory: 24Gi # Report by koordinator
      koordinator.sh/gpu-memory-ratio: "100" # Report by koordinator
      cambricon.com/mlu.smlu.vcore: "100" # Report by cambricon device plugin
      cambricon.com/mlu.smlu.vmemory: "96" # Report by cambricon device plugin
    capacity:
      ...
      koordinator.sh/gpu.shared: "100" # Report by koordinator
      koordinator.sh/gpu-core: "100" # Report by koordinator
      koordinator.sh/gpu-memory: 24Gi # Report by koordinator
      koordinator.sh/gpu-memory-ratio: "100" # Report by koordinator
      cambricon.com/mlu.smlu.vcore: "100" # Report by cambricon device plugin
      cambricon.com/mlu.smlu.vmemory: "96" # Report by cambricon device plugin
```

3. 创建 Pod 申请使用寒武纪卡，样例如下，示例中申请了虚拟卡场景。**寒武纪不支持配置多卡虚拟化**。
- 注意
   - 此处镜像使用了乌班图基础镜像，用户可根据实际需求选择合适的镜像
   - resources.limits 和 resources.requests 中均需要额外配置资源
     - 虚拟卡场景，以 MLU-370 使用虚拟化为例。
       - koordinator.sh/gpu.shared
         - 使用虚拟卡填写 1 即可。
       - koordinator.sh/gpu-core
         - 用多少算力，填写多少即可，百分比表示。
       - cambricon.com/mlu.smlu.vcore
         - 用多少算力，填写多少即可，百分比表示。
       - cambricon.com/mlu.smlu.vmemory
         - 用多少显存，比如 1GB，需要换算，填写分片的数量。以每个分片为 256Mi 为例，分片大小在 Cambricon Device Plugin 的 `min-dsmlu-unit`中配置。 `slice_count = 1GB / 256Mi `。

```yaml partial-card
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: demo-sleep
  name: test-cambricon-partial
  namespace: default
spec:
  containers:
  - command:
    - sleep
    - infinity
    image: ubuntu:18.04
    imagePullPolicy: IfNotPresent
    name: demo-sleep
    resources:
      limits:
        cpu: "32"
        memory: 64Gi
        koordinator.sh/gpu.shared: "1"
        koordinator.sh/gpu-memory: "1Gi"
        koordinator.sh/gpu-core: "10"
        cambricon.com/mlu.smlu.vcore: "10" # percentage
        cambricon.com/mlu.smlu.vmemory: "4" # slice counts, actual allocated memory: 4*256Mi=1Gi
      requests:
        cpu: "32"
        memory: 64Gi
        koordinator.sh/gpu.shared: "1"
        koordinator.sh/gpu-memory: "1Gi"
        koordinator.sh/gpu-core: "10"
        cambricon.com/mlu.smlu.vcore: "10" 
        cambricon.com/mlu.smlu.vmemory: "4" 
```
4. 进入容器内部(`kubectl exec -it {pod-name} --bash`)，在容器内部执行 `ls /dev/cambricon*` 命令查看卡挂载情况。如果能够正常输出，表示卡已经成功分配到 Pod 中。

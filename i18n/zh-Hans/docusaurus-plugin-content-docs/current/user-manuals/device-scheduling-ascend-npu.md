# 设备调度 - 华为昇腾 NPU

## 背景

当前 Koordinator 支持昇腾卡在 K8s 的使用，基于 koord-device-daemon 和 koordlet 组件上报异构 GPU 资源，将异构卡信息汇总到 Device 中供调度器进行拓扑调度。当前同时支持昇腾的虚拟化模板和整卡。

## 使用方法

### 前置条件

昇腾卡的使用需要提前安装配置如下组件
- 昇腾 Driver
- 昇腾 [Ascend Docker Runtime](https://gitcode.com/Ascend/mind-cluster/releases)
- 昇腾 [Ascend Device Plugin (开启虚拟化参数配置)](https://gitcode.com/Ascend/mind-cluster/releases)
```yaml 启动参数
args:
  - --volcanoType=true
  - --presetVirtualDevice=false
  - --useAscendDocker=true
```
- Koordinator 相关组件(koordinator >= v1.7.0)
  - 需要在 chart 的 `scheduler.featureGates` 参数中加入 `DevicePluginAdaption=true` 以启用该功能所需的特性门控

### 使用

1. 确认昇腾卡已成功被 Device 识别， 示例如下，通过 `kubectl get device <node-name> -o yaml` 查看 Device 资源。

- 注意
  - node.koordinator.sh/gpu-vendor 对应的标签值为 huawei
  - `scheduling.koordinator.sh/gpu-partitions` 的内容表示这个节点的卡编号 0,1,2,3 为一组 partion , 彼此之间有 HCCS 的亲和性，卡 1，2，3，4 为另一组 partition ，多卡调度的时候需要遵循亲和性的要求, 不能跨越不同的partition，否则不同partition之间的卡无法通信。
```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Device
metadata:
  labels:
    node.koordinator.sh/gpu-partition-policy: "Honor" # Enforce partition policy during scheduling.
    node.koordinator.sh/gpu-model: Ascend-910B3 # Model of the Ascend card.
    node.koordinator.sh/gpu-vendor: huawei # Vendor of the card.
  annotations:
    scheduling.koordinator.sh/gpu-partitions: |
      {
        "4": [
                {
                    "minors": [
                       0,1,2,3  # Minor numbers of cards in this partition
                    ],
                    "gpuLinkType": "HCCS", # Indicate the type of inter-card link within the partition.
                    "allocationScore": "1" # Indicate the overall allocation quality for the node after the partition has been assigned away.
                }
        ],
        "4": [
                {
                    "minors": [
                       4,5,6,7 
                    ],
                    "gpuLinkType": "HCCS",
                    "allocationScore": "1"
                }
        ]
      }
  name: node-1
spec:
  devices:
    - health: true
      id: GPU-fd971b33-4891-fd2e-ed42-ce6adf324615 # The UUID of the Ascend card (mocked value).
      minor: 0 # Every card has a unique minor number. Card 0.
      resources:
        huawei.com/npu-core: "20" # Number of aicore on the Ascend card.
        huawei.com/npu-cpu: "7"  # Number of aicpu on the Ascend card.
        huawei.com/npu-dvpp: "100" # There exists dvpp on the Ascend card.
        koordinator.sh/gpu-core: "100" # The total compute capacity of the Ascend card in percentage.
        koordinator.sh/gpu-memory: 64Gi # The total memory capacity of the Ascend card.
        koordinator.sh/gpu-memory-ratio: "100" # The total memory capacity of the Ascend card in percentage.
      topology:
        busID: 0000:3b:00.0 # PCI bus ID.
        nodeID: 0 # NUMA node ID.
        pcieID: pci0000:3a # PCIe root ID.
        socketID: -1
      type: gpu
      conditions:
        - lastTransitionTime: "2025-04-25T10:00:00Z"
          message: device is healthy
          reason: DeviceHealthy
          status: "True"
          type: Healthy
    - health: true
      id: GPU-ab123c45-6789-d001-e234-f567890abcde
      minor: 1 # Card 1.
      resources:
        huawei.com/npu-core: "20"
        huawei.com/npu-cpu: "7"
        huawei.com/npu-dvpp: "100"
        koordinator.sh/gpu-core: "100"
        koordinator.sh/gpu-memory: 64Gi
        koordinator.sh/gpu-memory-ratio: "100"
      topology:
        busID: 0000:3b:00.1
        nodeID: 1
        pcieID: pci0000:3a
        socketID: -1
      type: gpu
      conditions:
        - lastTransitionTime: "2025-04-25T10:00:00Z"
          message: device is healthy
          reason: DeviceHealthy
          status: "True"
          type: Healthy
    - health: true
      id: GPU-bc234d56-7890-e112-f345-678901bcdefa
      minor: 2
      resources:
        huawei.com/npu-core: "20"
        huawei.com/npu-cpu: "7"
        huawei.com/npu-dvpp: "100"
        koordinator.sh/gpu-core: "100"
        koordinator.sh/gpu-memory: 64Gi
        koordinator.sh/gpu-memory-ratio: "100"
      topology:
        busID: 0000:3b:00.2
        nodeID: 2
        pcieID: pci0000:3a
        socketID: -1
      type: gpu
      conditions:
        - lastTransitionTime: "2025-04-25T10:00:00Z"
          message: device is healthy
          reason: DeviceHealthy
          status: "True"
          type: Healthy
    - health: true
      id: GPU-cd345e67-8901-f223-4567-890123cdefab
      minor: 3
      resources:
        huawei.com/npu-core: "20"
        huawei.com/npu-cpu: "7"
        huawei.com/npu-dvpp: "100"
        koordinator.sh/gpu-core: "100"
        koordinator.sh/gpu-memory: 64Gi
        koordinator.sh/gpu-memory-ratio: "100"
      topology:
        busID: 0000:3b:00.3
        nodeID: 3
        pcieID: pci0000:3a
        socketID: -1
      type: gpu
      conditions:
        - lastTransitionTime: "2025-04-25T10:00:00Z"
          message: device is healthy
          reason: DeviceHealthy
          status: "True"
          type: Healthy
    - health: true
      id: GPU-de456f78-9012-f334-5678-901234defabc
      minor: 4
      resources:
        huawei.com/npu-core: "20"
        huawei.com/npu-cpu: "7"
        huawei.com/npu-dvpp: "100"
        koordinator.sh/gpu-core: "100"
        koordinator.sh/gpu-memory: 64Gi
        koordinator.sh/gpu-memory-ratio: "100"
      topology:
        busID: 0000:3b:00.4
        nodeID: 4
        pcieID: pci0000:3b
        socketID: -1
      type: gpu
      conditions:
        - lastTransitionTime: "2025-04-25T10:00:00Z"
          message: device is healthy
          reason: DeviceHealthy
          status: "True"
          type: Healthy
    - health: true
      id: GPU-ef567g89-0123-f445-6789-012345efabcd
      minor: 5
      resources:
        huawei.com/npu-core: "20"
        huawei.com/npu-cpu: "7"
        huawei.com/npu-dvpp: "100"
        koordinator.sh/gpu-core: "100"
        koordinator.sh/gpu-memory: 64Gi
        koordinator.sh/gpu-memory-ratio: "100"
      topology:
        busID: 0000:3b:00.5
        nodeID: 5
        pcieID: pci0000:3b
        socketID: -1
      type: gpu
      conditions:
        - lastTransitionTime: "2025-04-25T10:00:00Z"
          message: device is healthy
          reason: DeviceHealthy
          status: "True"
          type: Healthy
    - health: true
      id: GPU-fg678h90-1234-f556-7890-123456fgabce
      minor: 6
      resources:
        huawei.com/npu-core: "20"
        huawei.com/npu-cpu: "7"
        huawei.com/npu-dvpp: "100"
        koordinator.sh/gpu-core: "100"
        koordinator.sh/gpu-memory: 64Gi
        koordinator.sh/gpu-memory-ratio: "100"
      topology:
        busID: 0000:3b:00.6
        nodeID: 6
        pcieID: pci0000:3b
        socketID: -1
      type: gpu
      conditions:
        - lastTransitionTime: "2025-04-25T10:00:00Z"
          message: device is healthy
          reason: DeviceHealthy
          status: "True"
          type: Healthy
    - health: true
      id: GPU-gh789i01-2345-f667-8901-234567ghabcd
      minor: 7
      resources:
        huawei.com/npu-core: "20"
        huawei.com/npu-cpu: "7"
        huawei.com/npu-dvpp: "100"
        koordinator.sh/gpu-core: "100"
        koordinator.sh/gpu-memory: 64Gi
        koordinator.sh/gpu-memory-ratio: "100"
      topology:
        busID: 0000:3b:00.7
        nodeID: 7
        pcieID: pci0000:3b
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

2. 确认昇腾的节点上已正确注册昇腾卡资源信息，示例如下，通过 `kubectl get node <node-name> -o yaml` 查看 node.status.allocatable/node.status.capacity 资源。

```yaml
apiVersion: v1
kind: Node
metadata:
  name: node-1
  ...
status:
    allocatable:
      ...
      koordinator.sh/gpu.shared: "800" # Reported by koordinator
      koordinator.sh/gpu-core: "800" # Reported by koordinator
      koordinator.sh/gpu-memory: 512Gi # Reported by koordinator
      koordinator.sh/gpu-memory-ratio: "800" # Reported by koordinator
      huawei.com/npu-core: "160" # Reported by ascend device plugin
      huawei.com/npu-cpu: "56" # Reported by Koordinator
      huawei.com/npu-dvpp: "800" #  Reported Koordinator
    capacity:
      ...
      koordinator.sh/gpu.shared: "800" # Reported by koordinator
      koordinator.sh/gpu-core: "800" # Reported by koordinator
      koordinator.sh/gpu-memory: 512Gi # Reported by koordinator
      koordinator.sh/gpu-memory-ratio: "800" # Reported by koordinator
      huawei.com/npu-core: "160" # Reported by ascend device plugin
      huawei.com/npu-cpu: "56" # Reported by Koordinator
      huawei.com/npu-dvpp: "800" # Reported Koordinator
```

3. 创建 Pod 申请使用昇腾卡，样例如下，示例中申请了整卡和虚拟卡场景。
- 注意
   - 此处镜像使用了昇腾官方提供的推理基础镜像，用户可根据实际需求选择合适的镜像
   - resources.limits 和 resources.requests 中均需要额外配置资源
     - 整卡场景，以 910B3 的整卡规格为例子。昇腾支持多卡整卡场景。
       - huawei.com/npu-core
         - 单卡包含 20 个 npucore，申请 1 卡则需要申请 20 个 npucore。`number_to_fill = card_count * npucore_per_card`
         - koordinator.sh/gpu-memory-ratio
           - 对于整卡场景， 1 卡对应 100 的 gpu-memory-ratio。`number_to_fill = card_count * 100`
     - 虚拟卡场景，以 910B3 的虚拟规格 `virt10_3c_32g` 为例（可查询[昇腾卡虚拟规格说明](#昇腾卡虚拟规格说明)）， 规格表示申请 10 个 npucore， 3 个 npucpu， 32GB 显存。**昇腾不支持配置多卡虚拟化**。
       - koordinator.sh/gpu.shared
         - 申请虚拟卡填写 1 即可。
       - koordinator.sh/gpu-memory
         - 申请 1 虚拟卡则需要申请 32GB 的 gpu-memory。`number_to_fill = gpu-memory_in_spec`。
       - huawei.com/npu-core
         - 申请 1 虚拟卡则需要申请 10 个 npucore。`number_to_fill = npucore_in_spec`。
       - huawei.com/npu-cpu
         - 申请 1 虚拟卡则需要申请 3 个 npucpu。`number_to_fill = npucpu_in_spec`。
       - huawei.com/npu-dvpp
         - 申请 1 虚拟卡则需要申请 0 的 dvpp。直接查规格表即可。 `number_to_fill = dvpp_in_spec`
       
```yaml full-card
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: demo-sleep
  name: test-ascend-full-1
  namespace: default
spec:
  containers:
  - command:
    - sleep
    - infinity
    image: swr.cn-south-1.myhuaweicloud.com/ascendhub/ascend-infer:24.0.0-ubuntu20.04
    imagePullPolicy: IfNotPresent
    name: demo-sleep
    resources:
      limits:
        cpu: "32"
        memory: 64Gi
        koordinator.sh/gpu-memory-ratio: "100" # card_count * 100
        huawei.com/npu-core: "20" # card_count * npucore_per_card
      requests:
        cpu: "32"
        memory: 64Gi
        koordinator.sh/gpu-memory-ratio: "100" 
        huawei.com/npu-core: "20" 
```

```yaml partial-card
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: demo-sleep
  name: test-ascend-partial-1
  namespace: default
spec:
  containers:
  - command:
    - sleep
    - infinity
    image: swr.cn-south-1.myhuaweicloud.com/ascendhub/ascend-infer:24.0.0-ubuntu20.04
    imagePullPolicy: IfNotPresent
    name: demo-sleep
    resources:
      limits:
        cpu: "32"
        memory: 64Gi
        koordinator.sh/gpu.shared: "1"
        koordinator.sh/gpu-memory: "32Gi" # gpu-memory_in_spec
        huawei.com/npu-core: "10" # npucore_in_spec
        huawei.com/npu-cpu: "3" # npucpu_in_spec
      requests:
        cpu: "32"
        memory: 64Gi
        koordinator.sh/gpu.shared: "1"
        koordinator.sh/gpu-memory: "32Gi"
        huawei.com/npu-core: "10"
        huawei.com/npu-cpu: "3"
```
4. 进入容器内部(`kubectl exec -it {pod-name} --bash`)，在容器内部执行 `npu-smi` 命令查看卡的使用情况。如果能够正常显示数据，表示卡已经成功分配到 Pod 中。

### 昇腾卡虚拟规格列表

下面列出了常见昇腾卡的虚拟规格，用户可根据实际需求选择合适的虚拟规格进行申请使用。
``` 昇腾虚拟化规格说明
huawei-Ascend-310P:
vir01:
  huawei.com/npu-core: "1"
  huawei.com/npu-cpu: "1"
  huawei.com/npu-dvpp: "12"
  koordinator.sh/gpu-memory: 3Gi
vir02:
  huawei.com/npu-core: "2"
  huawei.com/npu-cpu: "2"
  huawei.com/npu-dvpp: "25"
  koordinator.sh/gpu-memory: 6Gi
vir02_1c:
  huawei.com/npu-core: "2"
  huawei.com/npu-cpu: "1"
  huawei.com/npu-dvpp: "25"
  koordinator.sh/gpu-memory: 6Gi
vir04:
  huawei.com/npu-core: "4"
  huawei.com/npu-cpu: "4"
  huawei.com/npu-dvpp: "50"
  koordinator.sh/gpu-memory: 12Gi
vir04_3c:
  huawei.com/npu-core: "4"
  huawei.com/npu-cpu: "3"
  huawei.com/npu-dvpp: "50"
  koordinator.sh/gpu-memory: 12Gi
vir04_3c_ndvpp:
  huawei.com/npu-core: "4"
  huawei.com/npu-cpu: "3"
  koordinator.sh/gpu-memory: 12Gi
vir04_4c_dvpp:
  huawei.com/npu-core: "4"
  huawei.com/npu-cpu: "4"
  huawei.com/npu-dvpp: "100"
  koordinator.sh/gpu-memory: 12Gi
huawei-Ascend-310P3:
vir01:
  huawei.com/npu-core: "1"
  huawei.com/npu-cpu: "1"
  huawei.com/npu-dvpp: "12"
  koordinator.sh/gpu-memory: 3Gi
vir02:
  huawei.com/npu-core: "2"
  huawei.com/npu-cpu: "2"
  huawei.com/npu-dvpp: "25"
  koordinator.sh/gpu-memory: 6Gi
vir02_1c:
  huawei.com/npu-core: "2"
  huawei.com/npu-cpu: "1"
  huawei.com/npu-dvpp: "25"
  koordinator.sh/gpu-memory: 6Gi
vir04:
  huawei.com/npu-core: "4"
  huawei.com/npu-cpu: "4"
  huawei.com/npu-dvpp: "50"
  koordinator.sh/gpu-memory: 12Gi
vir04_3c:
  huawei.com/npu-core: "4"
  huawei.com/npu-cpu: "3"
  huawei.com/npu-dvpp: "50"
  koordinator.sh/gpu-memory: 12Gi
vir04_3c_ndvpp:
  huawei.com/npu-core: "4"
  huawei.com/npu-cpu: "3"
  koordinator.sh/gpu-memory: 12Gi
vir04_4c_dvpp:
  huawei.com/npu-core: "4"
  huawei.com/npu-cpu: "4"
  huawei.com/npu-dvpp: "100"
  koordinator.sh/gpu-memory: 12Gi
huawei-Ascend-910:
vir02:
  huawei.com/npu-core: "2"
  huawei.com/npu-cpu: "1"
  koordinator.sh/gpu-memory: 2Gi
vir04:
  huawei.com/npu-core: "4"
  huawei.com/npu-cpu: "1"
  koordinator.sh/gpu-memory: 4Gi
vir08:
  huawei.com/npu-core: "8"
  huawei.com/npu-cpu: "3"
  koordinator.sh/gpu-memory: 8Gi
vir16:
  huawei.com/npu-core: "16"
  huawei.com/npu-cpu: "7"
  koordinator.sh/gpu-memory: 16Gi
huawei-Ascend-910B1:
vir03_1c_8g:
  huawei.com/npu-core: "3"
  huawei.com/npu-cpu: "1"
  koordinator.sh/gpu-memory: 8Gi
vir06_1c_16g:
  huawei.com/npu-core: "6"
  huawei.com/npu-cpu: "1"
  koordinator.sh/gpu-memory: 16Gi
vir12_3c_32g:
  huawei.com/npu-core: "12"
  huawei.com/npu-cpu: "3"
  koordinator.sh/gpu-memory: 32Gi
huawei-Ascend-910B2:
vir03_1c_8g:
  huawei.com/npu-core: "3"
  huawei.com/npu-cpu: "1"
  koordinator.sh/gpu-memory: 8Gi
vir06_1c_16g:
  huawei.com/npu-core: "6"
  huawei.com/npu-cpu: "1"
  koordinator.sh/gpu-memory: 16Gi
vir12_3c_32g:
  huawei.com/npu-core: "12"
  huawei.com/npu-cpu: "3"
  koordinator.sh/gpu-memory: 32Gi
huawei-Ascend-910B2C:
vir03_1c_8g:
  huawei.com/npu-core: "3"
  huawei.com/npu-cpu: "1"
  koordinator.sh/gpu-memory: 8Gi
vir06_1c_16g:
  huawei.com/npu-core: "6"
  huawei.com/npu-cpu: "1"
  koordinator.sh/gpu-memory: 16Gi
vir12_3c_32g:
  huawei.com/npu-core: "12"
  huawei.com/npu-cpu: "3"
  koordinator.sh/gpu-memory: 32Gi
huawei-Ascend-910B3:
vir05_1c_16g:
  huawei.com/npu-core: "5"
  huawei.com/npu-cpu: "1"
  koordinator.sh/gpu-memory: 16Gi
vir10_3c_32g:
  huawei.com/npu-core: "10"
  huawei.com/npu-cpu: "3"
  koordinator.sh/gpu-memory: 32Gi
huawei-Ascend-910B4:
vir05_1c_8g:
  huawei.com/npu-core: "5"
  huawei.com/npu-cpu: "1"
  huawei.com/npu-dvpp: "25"
  koordinator.sh/gpu-memory: 8Gi
vir10_3c_16g:
  huawei.com/npu-core: "10"
  huawei.com/npu-cpu: "3"
  huawei.com/npu-dvpp: "50"
  koordinator.sh/gpu-memory: 16Gi
vir10_3c_16g_nm:
  huawei.com/npu-core: "10"
  huawei.com/npu-cpu: "3"
  koordinator.sh/gpu-memory: 16Gi
vir10_4c_16g_m:
  huawei.com/npu-core: "10"
  huawei.com/npu-cpu: "4"
  huawei.com/npu-dvpp: "100"
  koordinator.sh/gpu-memory: 16Gi
```

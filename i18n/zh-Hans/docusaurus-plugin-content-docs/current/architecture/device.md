# Device

Device 是对 K8s 节点上异构设备的一种抽象。

## 定义

Device 代表了 K8s 节点上的所有异构设备，通常包括 GPU、RDMA、FPGA 等。在 K8s 集群中，它以一个 CRD 的形式存在，对于每一个 K8s Node，都会存在一个对应的 Device 对象，该对象包含了该节点上所有异构设备的基本信息、资源信息、拓扑信息、健康状态等，一个示例的对象如下：

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Device
metadata:
  name: worker01
  labels:
    node.koordinator.sh/gpu-model: NVIDIA-H20
    node.koordinator.sh/gpu-vendor: nvidia
  ...
spec:
  devices:
  - conditions:
    - lastTransitionTime: "2025-10-07T07:15:15Z"
      message: device is healthy
      reason: DeviceHealthy
      status: "True"
      type: Healthy
    health: true
    id: GPU-a43e0de9-28a0-1e87-32f8-f5c4994b3e69
    minor: 0
    resources:
      koordinator.sh/gpu-core: "100"
      koordinator.sh/gpu-memory: 97871Mi
      koordinator.sh/gpu-memory-ratio: "100"
    topology:
      busID: 0000:0e:00.0
      nodeID: 0
      pcieID: pci0000:0b
      socketID: -1
    type: gpu
  - conditions:
    - lastTransitionTime: "2025-10-07T07:15:15Z"
      message: device is healthy
      reason: DeviceHealthy
      status: "True"
      type: Healthy
    health: true
    id: GPU-05308270-c34c-8a61-e8b2-aeefbc23a3ba
    minor: 1
    resources:
      koordinator.sh/gpu-core: "100"
      koordinator.sh/gpu-memory: 97871Mi
      koordinator.sh/gpu-memory-ratio: "100"
    topology:
      busID: "0000:44:00.0"
      nodeID: 0
      pcieID: pci0000:3a
      socketID: -1
    type: gpu
  - health: true
    id: 0000:0f:00.0
    minor: 0
    resources:
      koordinator.sh/rdma: "100"
    topology:
      busID: 0000:0f:00.0
      nodeID: 0
      pcieID: pci0000:0b
      socketID: -1
    type: rdma
    vfGroups:
    - vfs:
      - busID: 0000:0f:00.1
        minor: -1
      - busID: 0000:0f:00.2
        minor: -1
      - busID: 0000:0f:00.3
        minor: -1
      - busID: 0000:0f:00.4
        minor: -1
      - busID: 0000:0f:00.5
        minor: -1
      - busID: 0000:0f:00.6
        minor: -1
      - busID: 0000:0f:00.7
        minor: -1
      - busID: 0000:0f:01.0
        minor: -1
  - health: true
    id: 0000:3d:00.0
    minor: 1
    resources:
      koordinator.sh/rdma: "100"
    topology:
      busID: 0000:3d:00.0
      nodeID: 0
      pcieID: pci0000:3a
      socketID: -1
    type: rdma
    vfGroups:
    - vfs:
      - busID: 0000:3d:00.1
        minor: -1
      - busID: 0000:3d:00.2
        minor: -1
      - busID: 0000:3d:00.3
        minor: -1
      - busID: 0000:3d:00.4
        minor: -1
      - busID: 0000:3d:00.5
        minor: -1
      - busID: 0000:3d:00.6
        minor: -1
      - busID: 0000:3d:00.7
        minor: -1
      - busID: 0000:3d:01.0
        minor: -1
  ...
```

该对象由 koordlet 上报，koord-scheduler 在调度申请了异构设备资源的 Pod 时，会利用该对象进行各类复杂的调度决策，如设备的部分资源分配（vGPU）、虚拟设备的分配（RDMA VF）、设备拓扑感知调度、设备故障隔离等。通过 Device，Koordinator 实现了对于异构设备的全局最优化调度，突破了传统 K8s [设备插件](https://kubernetes.io/zh-cn/docs/concepts/extend-kubernetes/compute-storage-net/device-plugins/)方案由 kubelet 进行设备分配而产生的各种功能限制。

## 设备调度架构

![设备调度架构](/img/device-scheduling-architecture.jpg)

上图展示了 Koordinator 设备调度的组件架构及其工作流。可以看到，整个设备调度的过程分为三个阶段：

- 设备上报：主要由 koordlet 及其配套的 koord-device-daemon 负责，koord-manager 也会参与此过程。目前 koordlet 内置了针对 NVIDIA GPU 和通用 RDMA 设备的信息收集与上报能力，对于其他厂商的异构 GPU（如华为昇腾 NPU 等），则通过读取由外部写入的 Device Info 文件来收集并上报设备信息，以更灵活地适配各类异构 GPU 设备，下文会进一步展开介绍该扩展机制。
- 设备调度：完全由中心化的 koord-scheduler 负责，它会综合考虑 Node 与 Device 的信息，基于 Pod 的设备资源请求做出全局最优的调度决策，且支持设备的部分资源分配（vGPU）、虚拟设备的分配（RDMA VF）、设备拓扑感知调度、设备故障隔离等高阶调度能力。由于 Device 对异构设备进行了很好的抽象，koord-scheduler 的核心设备调度逻辑是厂商无关的，具有很强的通用性。设备的调度分配结果最终会写入到 Pod Annotation 中供端侧组件读取，此外，koord-scheduler 额外提供了一套三方厂商设备插件适配机制来无缝接入现有的设备插件生态，下文会进一步展开介绍该扩展机制。
- 设备分配：主要由 koordlet 负责，目前其内置了针对 NVIDIA GPU 和通用 RDMA 设备的分配能力，它会从 Pod 上读取 koord-scheduler 的设备调度结果并通过 NRI 机制为目标容器注入所需的设备文件及环境变量等。对于 NVIDIA GPU，其还集成了 [HAMi](https://github.com/Project-HAMi/HAMi/) 提供了分配虚拟 GPU 的能力。而对于其他三方厂商的异构 GPU，通过上述 koord-scheduler 的设备插件适配机制，设备分配也可以直接使用厂商提供的设备插件及对应的容器运行时（若有）。

## 异构设备适配扩展机制

Koordinator 设备调度提供了一套异构设备适配扩展机制来最小化新设备的接入成本。下面以接入一种新厂商的 GPU 为例，来介绍该扩展机制：

首先，我们需要让 koordlet 能够识别并上报这种 GPU，这可以通过在节点上写入一个包含了这个节点上所有这种 GPU 信息的 Device Info 文件来实现，这个文件包含了 GPU 的厂商、型号、资源、拓扑、健康状态等信息，这些信息可以通过任意方式来获取（如通过这种 GPU 的命令行工具等），只要最终按照 Device Info 文件的格式写入即可，koordlet 会自动识别该文件并将其上报为 Device 对象。目前 Koordinator 已提供了一个内置的 koord-device-daemon 组件来提供部分三方厂商 GPU 的 Device Info 文件生成能力，后续该组件也会持续接入新的三方厂商 GPU，也欢迎来自社区的贡献。

由于设备调度核心逻辑是通用的，因此通常情况下，无论使用整卡还是虚拟化 GPU，我们都不需要对 koord-scheduler 的核心调度逻辑做任何修改。

最后，我们需要集成这种 GPU 的端侧设备分配链路，由于目前绝大多数设备厂商都提供了 K8s 设备插件，我们可以直接在端侧使用厂商官方提供的设备插件，唯一需要做的是在 koord-scheduler 的设备插件适配扩展中添加对于该 GPU 设备插件的适配代码，它的作用是将 koord-scheduler 的设备调度结果转换成该 GPU 的设备插件所识别的形式写入到 Pod 中。同样地，目前 koord-scheduler 已内置了部分三方厂商 GPU 的设备插件适配逻辑，后续也会持续接入新的三方厂商 GPU，也欢迎来自社区的贡献。但需要注意的是，如果三方厂商的设备插件本身并不支持通过调度器来进行设备调度，则无法使用这种集成方式。

## 已端到端支持的设备

- GPU
  - NVIDIA GPU
  - 华为昇腾 NPU
  - 寒武纪 MLU
- RDMA
  - 通用，无特定厂商

## 下一步是什么

- 学习[如何使用精细化设备调度](../user-manuals/fine-grained-device-scheduling.md)。

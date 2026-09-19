# 精细化设备调度

## 摘要

该提案提供了一种细粒度的管理 GPU 和 RDMA、FPGA 等设备的机制，定义了一套 API 来描述节点上的设备信息，包括 GPU、RDMA、FPGA，以及一套新的资源名称来灵活支持用户可以更细粒度地申请 GPU 资源。该机制是后续其他 GPU 调度能力如 GPU Share、GPU Overcommitment 等的基础。

## 动机

GPU 设备具有很强的计算能力，但是价格昂贵。如何更好的利用 GPU 设备，发挥 GPU 的价值，降低成本，是一个亟待解决的问题。在 K8s 社区现有的 GPU分配机制中，GPU 是由 kubelet 分配的，是一个完整的设备分配。这种方法简单可靠，但与 CPU 和内存类似，GPU 也会被浪费。因此，一些用户希望仅使用 GPU 的一部分资源，并将其余部分与其他工作负载共享以节省成本。此外，GPU 具有特殊性。比如下面提到的 NVIDIA GPU 支持的 NVLink 和超卖场景，都需要通过调度器进行中央决策，以获得全局最优的分配结果。


![image](/img/nvlink.jpg)

从图中我们可以发现，虽然该节点有8个 GPU 实例，型号为 A100/V100，但 GPU 实例之间的数据传输速度是不同的。 当一个 Pod 需要多个 GPU 实例时，我们可以为 Pod 分配具有最大数据传输速度组合关系的 GPU 实例。 此外，当我们希望一组 Pod 中的 GPU 实例具有最大数据传输速度组合关系时，调度器应该将最佳 GPU 实例批量分配给这些 Pod，并将它们分配到同一个节点。

### 目标

1. 定义 Device CRD 和资源 API。
1. 在 koordlet 中提供一个 Reporter 组件来报告设备信息和资源容量。
1. 提供一个调度器插件，支持用户更细粒度地申请 GPU 资源。
1. 在 koordlet 中提供一个新的运行时钩子插件，以支持更新由调度器分配的 GPU 容器环境变量。


### 非目标/未来工作

1. 定义灵活的分配策略，如根据 GPU 资源实现 Binpacking  和 Spread

## 设计概述

### API

#### 设备资源维度

由于 GPU 比较复杂，我们先介绍一下 GPU。众所周知，GPU 设备具有计算能力和 GPU 内存容量。通常用户会像“我想要 1/2/4/8 个 GPU”那样申请 GPU，但是如果节点支持 GPU 级别隔离机制，用户可能会像“我想要 0.5/0.25 个 GPU 资源”那样申请 GPU。此外，用户可以设置不同的计算能力和 GPU 内存容量以获得最佳资源利用率，因此用户希望像“我想要 X% 的计算能力和 Y% 的内存容量”那样申请 GPU。

我们将 GPU 资源抽象为不同的维度：

- `kubernetes.io/gpu-core` 代表 GPU 的计算能力。 与 Kuberetes MilliCPU 类似，我们将 GPU 的总算力抽象为 100，用户可以根据需要申请相应数量的 GPU 算力。
- `kubernetes.io/gpu-memory` 表示 GPU 的内存容量，以字节为单位。
- `kubernetes.io/gpu-memory-ratio` 代表 GPU 内存的百分比。

假设节点 A 有 4 个 GPU 实例，每个实例的总内存为 8GB，设备上报组件向 `Node.Status.Allocatable` 上报 GPU 容量信息时，不再上报  `nvidia.com/gpu=4`，而是上报以下信息：

```yaml
status:
  capacity:
    kubernetes.io/gpu-core: 400
    kubernetes.io/gpu-memory: "32GB"
    kubernetes.io/gpu-memory-ratio: 400
  allocatable:
    kubernetes.io/gpu-core: 400
    kubernetes.io/gpu-memory: "32GB"
    kubernetes.io/gpu-memory-ratio: 400
```

为了方便用户，定义了一个独立的资源名 `kubernetes.io/gpu`。例如，当用户想使用 GPU 实例一半的计算资源和内存资源时，用户可以直接声明 `kubernetes.io/gpu: 50`，调度器会转换为 `kubernetes.io/gpu-core: 50, kubernetes.io/gpu-memory-ratio: 50`

对于 RDMA 和 FPGA 等其他设备，节点有 1 个 RDMA 和 1 个 FGPA，会上报以下信息：

```yaml
status:
  capacity:
    kubernetes.io/rdma: 100
    kubernetes.io/fpga: 100
  allocatable:
    kubernetes.io/rdma: 100
    kubernetes.io/fpga: 100
```

为什么我们需要 `kubernetes.io/gpu-memory-ratio` 和 `kubernetes.io/gpu-memory`？当用户申请 0.5/0.25 GPU 时，用户不知道每个 GPU 的确切内存总字节数，只想使用一半或四分之一的内存，因此用户可以使用 `kubernetes.io/gpu-memory-ratio` 来申请 GPU 内存。当调度器在具体节点上分配 Pod 时，调度器将通过以下公式将 `kubernetes.io/gpu-memory-ratio` 转换为 `kubernetes.io/gpu-memory`： ***allocatedMemory = totalMemoryOf(GPU) * `kubernetes. io/gpu-memory-ratio`***，这样 GPU 隔离就能发挥作用。

在调度过滤阶段，调度器会对 `kubernetes.io/gpu-memory`和`kubernetes.io/gpu-memory-ratio` 做特殊处理。当 Pod 指定 `kubernetes.io/gpu-memory-ratio` 时，调度器会检查每个节点上的每个 GPU 实例是否有未分配或剩余资源，以确保每个 GPU 实例上的剩余内存满足比例要求。

如果用户确切知道或可以粗略估计工作负载的具体内存消耗，则可以通过 `kubernetes.io/gpu-memory` 申请 GPU 内存。所有细节都可以在下面看到。

此外，当维度值 > 100 时，意味着 Pod 需要多设备。现在只允许值可以除以 100。

#### 用户申请设备资源场景

##### 兼容 `nvidia.com/gpu`

```yaml
resources:
  requests:
    nvidia.com/gpu: "2"
    cpu: "4"
    memory: "8Gi"
```

调度器将 `nvida.com/gpu: 2` 转换为以下描述:

```yaml
resources:
  requests:
    kubernetes.io/gpu-core: "200"
    kubernetes.io/gpu-memory-ratio: "200"
    kubernetes.io/gpu-memory: "16Gi" # assume 8G memory in bytes per GPU
    cpu: "4"
    memory: "8Gi"
```

##### 申请 GPU 的​​全部或部分资源

```yaml
resources:
   requests:
    kubernetes.io/gpu: "50"
    cpu: "4"
    memory: "8Gi"
```

调度器将 `kubernetes.io/gpu: "50"` 转换为以下描述:

```yaml
resources:
  requests:
    kubernetes.io/gpu-core: "50"
    kubernetes.io/gpu-memory-ratio: "50"
    kubernetes.io/gpu-memory: "4Gi" # assume 8G memory in bytes for the GPU
    cpu: "4"
    memory: "8Gi"
```

##### 分别申请 `kubernetes.io/gpu-core` and `kubernetes.io/gpu-memory-ratio`

```yaml
resources:
  requests:
    kubernetes.io/gpu-core: "50"
    kubernetes.io/gpu-memory-ratio: "60"
    cpu: "4"
    memory: "8Gi"
```

##### 分别申请 `kubernetes.io/gpu-core` and `kubernetes.io/gpu-memory`

```yaml
resources:
  requests:
    kubernetes.io/gpu-core: "60"
    kubernetes.io/gpu-memory: "4Gi"
    cpu: "4"
    memory: "8Gi"
```

##### 申请 RDMA

```yaml
resources:
  requests:
    kubernetes.io/rdma: "100"
    cpu: "4"
    memory: "8Gi"
```

### 详细设计

#### 调度

1. 抽象新的数据结构来描述节点上每个设备的资源和健康状态。
2. 实现 Filter/Reserve/PreBind 扩展点。
3. 自动识别不同种类的设备。添加新设备时，我们不需要修改任何代码。

##### DeviceAllocation

在 PreBind 阶段，调度器会将设备（包括 GPU）的分配结果，包括设备的 Minor 和资源分配信息，以注解的形式更新到 Pod。

```go
/*
{
  "gpu": [
    {
      "minor": 0,
      "resouurces": {
        "kubernetes.io/gpu-core": 100,
        "kubernetes.io/gpu-mem-ratio": 100,
        "kubernetes.io/gpu-mem": "16Gi"
      }
    },
    {
      "minor": 1,
      "resouurces": {
        "kubernetes.io/gpu-core": 100,
        "kubernetes.io/gpu-mem-ratio": 100,
        "kubernetes.io/gpu-mem": "16Gi"
      }
    }
  ]
}
*/
type DeviceAllocation struct {
    Minor     int32
    Resources map[string]resource.Quantity
}

type DeviceAllocations map[DeviceType][]*DeviceAllocation
```

##### NodeDevicePlugin

```go
var (
	_ framework.PreFilterPlugin = &NodeDevicePlugin{}
	_ framework.FilterPlugin    = &NodeDevicePlugin{}
	_ framework.ReservePlugin   = &NodeDevicePlugin{}
	_ framework.PreBindPlugin   = &NodeDevicePlugin{}
)

type NodeDevicePlugin struct {
    frameworkHandler     framework.Handle
    nodeDeviceCache      *NodeDeviceCache
}

type NodeDeviceCache struct {
    lock        sync.Mutex
    nodeDevices map[string]*nodeDevice
}

type nodeDevice struct {
    lock        sync.Mutex
    DeviceTotal map[DeviceType]deviceResource
    DeviceFree  map[DeviceType]deviceResource
    DeviceUsed  map[DeviceType]deviceResource
    AllocateSet map[DeviceType]*corev1.PodList
}

// We use `deviceResource` to present resources per device.
// "0": {kubernetes.io/gpu-core:100, kubernetes.io/gpu-memory-ratio:100, kubernetes.io/gpu-memory: 16GB}
// "1": {kubernetes.io/gpu-core:100, kubernetes.io/gpu-memory-ratio:100, kubernetes.io/gpu-memory: 16GB}
type deviceResources map[int]corev1.ResourceList

```

我们将注册节点和设备事件 handler 来维护节点设备信息。

- 在 Filter 阶段，我们将以一个节点来构造每个设备请求(如 gpu-memory), 并尝试比较每个设备的空闲资源和 Pod 设备请求。
- 在 Reserve/Unreserve 阶段, 我们将更新 nodeDeviceCache 的已用/空闲资源和 allocateSet。现在设备选择规则仅基于设备次要 ID 顺序。
- 在 PreBind 阶段, 我们将 DeviceAllocations 写到 Pod 的注解中。
- 在 Init 阶段, 我们会 list 所有 Node/Device/Pods 来恢复节点设备信息.

#### Device Reporter

在 koordlet 中实现了一个名为 `Device Reporter` 的新组件来创建或更新 `Device` CRD 实例，其中包含每个设备的资源信息和健康状态，包括 GPU、RDMA 和 FPGA 等。这个版本我们只支持 GPU。它将执行 `nccl` 命令来获取每个次要资源，就像 k8s-gpu-device-plugins 一样。我们将应用社区的健康检查逻辑。

#### Device CRD Scheme definition
```go
type DeviceType string

const (
	GPU  DeviceType = "gpu"
	FPGA DeviceType = "fpga"
	RDMA DeviceType = "rdma"
)

type DeviceSpec struct {
	Devices []DeviceInfo `json:"devices"`
}

type DeviceInfo struct {
	// UUID represents the UUID of device
	UUID string `json:"id,omitempty"`
	// Minor represents the Minor number of Device, starting from 0
	Minor int32 `json:"minor,omitempty"`
	// Type represents the type of device
	Type DeviceType `json:"deviceType,omitempty"`
	// Health indicates whether the device is normal
	Health bool `json:"health,omitempty"`
	// Resources represents the total capacity of various resources of the device
	Resources map[string]resource.Quantity `json:"resource,omitempty"`
}

type DeviceStatus struct {}

type Device struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   DeviceSpec   `json:"spec,omitempty"`
	Status DeviceStatus `json:"status,omitempty"`
}

type DeviceList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`

	Items []Device `json:"items"`
}
```

##### 兼容性

考虑到一些用户的集群中已经存在很多 GPU Pod，需要保证 Koordinator GPU Scheduling 不会重复分配这些 GPU Pod 持有的 GPU 设备。因此，koord-scheduler 需要获取这些现有 Pod 持有的 GPU 设备的信息。这些 GPU 设备由 kubelet 分配并记录在本地文件 `/var/lib/kubelet/device-plugins/kubelet_internal_checkpoint` 中，因此 device reporter 会解析该文件获取分配给每个 Pod 的 GPU Device ID。解析时需要排除掉通过 koord-scheduler 分配 GPU 的 Pod，最后以注解的形式更新到 Device CRD。对应的注解 key 为 `node.koordinator.sh/devices-checkpoints`，注解 value 定义如下：

```go
type PodDevicesEntry struct {
	PodUID        string   `json:"podUID,omitempty"`
	ContainerName string   `json:"containerName,omitempty"`
	ResourceName  string   `json:"resourceName,omitempty"`
	DeviceIDs     []string `json:"deviceIDs,omitempty"`
	AllocResp     []byte   `json:"allocResp,omitempty"`
}

type PodDevicesEntries []PodDevicesEntry
```

#### CRD 示例
```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Device
metadata:
  name: node-1
  annotations:
    node.koordinator.sh/gpu-checkpoints: |-
      [
        {
          "podUID": "fa8983dc-bb76-4eeb-8dcc-556fbd44d7ce",
          "containerName": "cuda-container",
          "resourceName": "nvidia.com/gpu",
          "deviceIDs": ["GPU-36b27e44-b086-46f7-f2dc-73c36dc65991"]
        }
      ]
spec:
  devices:
  - health: true
    id: GPU-98583a5c-c155-9cf6-f955-03c189d3dbfb
    minor: 0
    resources:
      kubernetes.io/gpu-core: "100"
      kubernetes.io/gpu-memory: 15472384Ki
      kubernetes.io/gpu-memory-ratio: "100"
    type: gpu
  - health: true
    id: GPU-7f6410b9-bdf7-f9a5-de09-aa5ec31a7124
    minor: 1
    resources:
      kubernetes.io/gpu-core: "100"
      kubernetes.io/gpu-memory: 15472384Ki
      kubernetes.io/gpu-memory-ratio: "100"
    type: gpu
status: {}
```

#### koordlet 和 koord-runtime-proxy

我们的目标是与原始的 k8s kubelet 和 k8s 设备插件兼容，因此：

1. 我们仍然允许 kubelet 和设备插件分配具体设备，这意味着无论是否有 k8s 设备插件，我们的设计都可以正常工作。

2. 在 koord-runtime-proxy 中，我们会使用 Pod的 `DeviceAllocation` 注解来替换掉步骤1中容器的 args 和 envs 的结果。

我们会修改 koord-runtime-proxy 和 koordlet 之间的协议来添加容器环境变量：

```go
type ContainerResourceHookRequest struct {  
    ....
    Env map[string]string
}

type ContainerResourceHookResponse struct {
    ....
    Env map[string]string
}
```

然后我们将在 koordlet 的 runtimehooks 中添加一个新的 `gpu-hook`，注册到 `PreCreateContainer` 阶段。我们将通过 Pod 注解中的 GPU 分配结果生成新的 GPU 环境变量 `NVIDIA_VISIBLE_DEVICES`。

koord-runtime-proxy 可以看到这些 Pod 的环境变量，koord-runtime-proxy 将这些环境变量传递给 koordlet，koordlet 解析 GPU 相关的环境变量来找到具体的设备 id。

此外，koordlet 应将 GPU 型号上报到节点的标签，与设备插件一样，以防 Koordinator 在没有设备插件的情况下工作。

最后，修改 koord-runtime-proxy 中 `ContainerResourceExecutor` 的 `UpdateRequest` 函数，让新的 GPU 环境变量覆盖旧的 GPU 环境变量。

当我们处理热更新时，我们可以处理已调度但是在注解中没有设备分配信息的 Pod。如果 GPU 分配信息不在注解中，将从 `ContainerResourceHookRequest` 的 `Env` 中找到 GPU 分配信息，并将所有 GPU 分配信息更新到 Device CRD 实例。

### 兼容性

众所周知，kube-scheduler 的 GPU 调度与其他标量资源没有任何区别。具体的设备级别的分配由 kubelet 和 GPU device plugin 完成，生成容器的GPU 环境变量。

我们的设计与上述流程没有冲突。`Device Reporter` 组件上报 Koordinator GPU 资源用于 kubelet 更新节点资源。然后使用新设备资源帐户在我们的新插件中调度设备请求。在 `pre-bind` 阶段，我们将使用 Koordinator GPU 资源更新容器资源，这是为了让 kubelet 检查资源限制。我们还将在 Pod 的注解中添加设备分配信息。在 node 端，k8s device plugin 会先 patch 容器 env，但是我们会在 runtimeproxy 中通过 Pod 注解中的分配结果覆盖这些 env。

### 升级策略

如果使用 Koordinator GPU Scheduing 在全新的集群中调度 GPU Pod，只需安装 Koordinator 组件即可。

但是，如果要在现有集群中升级到 Koordinator GPU Scheduing，则需要避免 GPU 设备因为切换不同的调度机制而被重复分配。升级时需要注意顺序：
1. 安装 Koordinator 组件。特别要确保 koordlet 都已成功启动。
2. 停止创建新 GPU Pod 的系统或平台。
3. 停止当前负责 GPU Pod 调度的调度器，并确保当前集群中没有 pending 的 GPU Pod。
4. 等待几分钟以确保每个节点的 koordlet 创建并更新 Device CRD。
5. 修改所有创建 GPU Pod 的组件，将 Pod 的 schedulerName 切换为 koord-scheduler
6. 开始尝试创建 GPU Pod，验证 koord-scheduler GPU Scheduling 调度结果。
7. 恢复创建 GPU Pod 和旧调度器的系统或平台。

未来 Koordinator 会提供一个 webhook 来解决现有集群的升级问题。 webhook 会识别 GPU Pod，并将新创建的 GPU Pod 的 schedulerName 修改为 koord-scheduler。同时，webhook 将接管 GPU Pod 的 Binding 操作。如果 Binding 不是由 koord-scheduler 发起的，它将被拒绝。

## 未解问题

## 可选性

1. 用户可以选择是否使用 k8s-device 插件。如上所述，我们都可以兼容这两种场景。

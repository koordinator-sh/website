# NUMA 与设备拓扑分配策略

Koordinator 有两个拓扑感知的调度器插件，负责决定 **Pod 的资源在节点上落到哪块物理硬件**：

- **NodeNUMAResource** 负责在多个 NUMA 节点之间分配 CPU 与内存，并编排细粒度的 CPUSet 绑核。
- **DeviceShare** 负责在设备拓扑（device / PCIe / NUMA node）上分配异构设备——GPU、RDMA、FPGA 等。

一个 Pod 往往**同时**申请普通计算资源与加速卡，因此这两个插件必须就同一套硬件放置方案达成一致。每个插件都通过 Pod annotation、Node label 和插件参数暴露出一组分配策略——它们就是用户实际配置的"协议"。本文会先完整梳理两个插件中的每一种策略，再解释它们如何通过共享的 Topology Manager 保持**一致性**，以及在哪些地方**看起来会冲突**。

## 为什么两个插件必须协同

现代服务器是非统一内存访问（NUMA）架构。CPU 和内存被划分到不同的 NUMA 节点；GPU 和 RDMA 网卡挂在归属于特定 NUMA 节点的 PCIe switch 下。如果调度器把 Pod 的 CPU 放在 NUMA 节点 0、却把 GPU 放在 NUMA 节点 1，那么每一次 DMA 传输都要跨越 socket 间链路，性能会急剧下降。

因此 NodeNUMAResource 和 DeviceShare 不能各自独立决策。它们汇聚到同一个协调点——`frameworkext/topologymanager`——由它在绑定任何资源之前，收集**两个**插件的 NUMA 拓扑 hint，并在**同一个**策略下完成合并。

```text
Pod being scheduled onto a node
        │
        ▼
┌────────────────────────────────────────────────────────┐
│ frameworkext/topologymanager                            │
│ Resolves ONE NUMATopologyPolicy for the Pod:            │
│   pod annotation  >  node label  >  kubelet/plugin arg  │
└────────────────────────────────────────────────────────┘
        │ GetPodTopologyHints()  (both plugins implement
        │                         NUMATopologyHintProvider)
        ├───────────────────────────────┐
        ▼                               ▼
  NodeNUMAResource                  DeviceShare
  hints for cpu / memory            hints for gpu / rdma / ...
  {affinity, Preferred, Score}      {affinity, Preferred, Score}
        │                               │  (best device layout
        │                               │   scores 500 to win ties)
        └──────────────┬────────────────┘
                       ▼
              Merge all provider hints
     narrowest affinity wins; equal width → higher Score wins
                       │
                       ▼
             best NUMATopologyHint (a NUMA node bitmask)
                       │
                       ▼   Allocate(affinity) on every provider
     NodeNUMAResource binds CPUs;  DeviceShare binds devices
```

下文所有内容，都是对上图某一个环节的细化。

## Topology Manager：协议的汇聚点

### NUMATopologyPolicy——唯一的主导策略

`NUMATopologyPolicy` 决定了一个 Pod 的所有资源**必须以多严格的方式**对齐到同一批 NUMA 节点。它与上游 kubelet Topology Manager 语义一致，并且**同时**作用于 CPU、内存和设备。

| 策略 | 行为 |
| --- | --- |
| `None`（空） | 不做 NUMA 对齐。仍会产出 hint，但任何放置方案都可被接纳。 |
| `BestEffort` | 优先选择跨所有资源最窄的 NUMA 对齐；但当不存在对齐方案时，仍然接纳该 Pod（退化为使用全部 NUMA 节点）。 |
| `Restricted` | 与 `BestEffort` 类似，但当找不到足够窄的对齐方案时**拒绝**该节点。 |
| `SingleNUMANode` | **仅当**单个 NUMA 节点能满足*全部*资源请求（CPU、内存与设备一起）时才接纳该节点。 |

策略按明确的优先级解析，且矛盾会被拒绝、而非被悄悄合并：

- **Pod annotation** `koordinator.sh/numa-topology-spec` → `NUMATopologySpec.numaTopologyPolicy`
- **Node label** `node.koordinator.sh/numa-topology-policy`
- **kubelet / 插件参数** 默认值

如果 Pod 和 Node 都指定了策略且两者不同，调度会以 `ErrNotMatchNUMATopology` 失败——插件绝不会去猜谁生效。当 Pod 指定了策略时，它覆盖 Node label。

### NUMATopologyHint——共享的"通用货币"

两个插件产出的 hint 结构完全相同，这正是合并得以进行的前提：

| 字段 | 含义 |
| --- | --- |
| `NUMANodeAffinity` | 能满足该资源的 NUMA 节点位掩码（例如 `0b0011` 表示 NUMA 0 和 1）。 |
| `Preferred` | 当该 affinity 是 Pod 的优选放置时为 `true`。 |
| `Score` | 决胜权重。affinity 宽度相同时，分数更高者胜出。 |
| `Unsatisfied` | 当没有任何 affinity 能满足请求时为 `true`。 |

### 合并与决胜

Topology Manager 会枚举所有 provider hint 的组合，选出最优的合并 hint：

1. **更窄**的 affinity（NUMA 节点更少）总是胜过更宽的。
2. 宽度**相同**时，`Score` **更高**者胜出。
3. 结果会与独占策略（见下文 `SingleNUMANodeExclusive`）做校验；违反时该 hint 会被降级为非优选或直接被拒绝。

DeviceShare 会刻意给它的最优设备布局打 `500` 分，远高于 CPU hint，因此**当 CPU 与设备能在相同 NUMA 宽度下同时满足时，最终选择由设备布局主导**。这是一个有意为之、且有明确文档的优先级——而非顺序上的偶然。

## NodeNUMAResource 的分配策略

NodeNUMAResource 回答三个问题：*选哪些 NUMA 节点*、*在其中如何绑核*、以及放置*需要多独占*。

### NUMAAllocateStrategy——选哪些 NUMA 节点

通过 Node label `node.koordinator.sh/numa-allocate-strategy` 按节点配置，缺省时回退到插件级默认值。它在**已经满足请求**的 NUMA 节点之间做选择。

| 策略 | 含义 | 效果 |
| --- | --- | --- |
| `MostAllocated` | 从可用资源**最少**的 NUMA 节点分配。 | 装箱/堆叠；把完整的 NUMA 节点留给大 Pod。 |
| `LeastAllocated` | 从可用资源**最多**的 NUMA 节点分配。 | 打散负载；均衡各 NUMA 节点的使用率。 |
| `DistributeEvenly` | 将 CPU 均匀分布到各 NUMA 节点。 | 类似 interleave 的放置，适合受益于每 NUMA 容量均衡的负载。 |

> **命名提示：** `MostAllocated` 的含义是"选那个已经被分配得*最多*的节点"，即空闲资源*最少*的节点。这就是装箱；下文各 scoring 策略沿用同一套措辞，保持一致。

### CPUBindPolicy——如何绑定逻辑 CPU

通过 Pod 的 `koordinator.sh/resource-spec` 设置，可以是 `requiredCPUBindPolicy`（严格——无法满足则调度失败）或 `preferredCPUBindPolicy`（尽力而为）。

| 策略 | 含义 |
| --- | --- |
| `Default` | 对如何选取逻辑 CPU 没有强偏好。 |
| `FullPCPUs` | 将分配尽量塞进**更少的物理核**（按整核分配，超线程兄弟保持在同一物理核）。 |
| `SpreadByPCPUs` | 将逻辑 CPU 均匀**打散到各物理核**（优先每物理核放一个兄弟）。 |
| `ConstrainedBurst` | 约束 Burstable Pod 所使用的 CPU Shared Pool 范围。 |

### NodeCPUBindPolicy——节点级的强制绑核策略

通过 Node label `node.koordinator.sh/cpu-bind-policy` 设置。它约束调度器对该节点上 CPUSet Pod *必须*怎么做，并与 kubelet CPU Manager 的选项对齐。

| 策略 | 含义 |
| --- | --- |
| `None` | 无节点级约束。 |
| `FullPCPUsOnly` | 必须分配**完整物理核**（等价于 kubelet `full-pcpus-only=true`）。 |
| `SpreadByPCPUs` | 必须将逻辑 CPU 均匀打散到各物理核（等价于 kubelet `distribute-cpus-across-numa`）。 |

Pod 的 `requiredCPUBindPolicy` 优先；否则由节点策略（结合节点上报的 kubelet CPU Manager policy）决定最终生效的绑核策略。

### CPUExclusivePolicy——独占粒度

通过 Pod 的 `koordinator.sh/resource-spec` → `preferredCPUExclusivePolicy` 设置。

| 策略 | 含义 |
| --- | --- |
| `None` | 不独占。 |
| `PCPULevel` | 在**物理核**维度互斥——独占 Pod 之间不共享物理核。 |
| `NUMANodeLevel` | 在 **NUMA 节点**维度互斥——独占 Pod 之间不共享 NUMA 节点。 |

### SingleNUMANodeExclusive 与 NUMA 节点状态

`koordinator.sh/numa-topology-spec` 还携带 `singleNUMANodeExclusive`，用于控制一个已被某 Pod 独占使用的 NUMA 节点是否可被其他 Pod 共享：

| 取值 | 含义 |
| --- | --- |
| `Preferred` | 尽量不把单 NUMA 的 Pod 与多 NUMA 的 Pod 放在一起（反之亦然），但必要时允许。 |
| `Required` | 禁止此类共存。 |

为落实这一点，每个 NUMA 节点会维护一个状态——`idle`、`shared` 或 `single`——Topology Manager 在 `Admit` 阶段会用合并后的 hint 与之校验。CPU 被某个 Pod 全部绑定的节点会变为 `single`；仅被资源型 Pod 使用的节点会变为 `shared`。

### Scoring 策略

NodeNUMAResource 通过 `NodeNUMAResourceArgs` 暴露两个相互独立的 scoring 旋钮：

| 参数 | 作用域 | 类型 |
| --- | --- | --- |
| `scoringStrategy` | 对**节点**打分 | `MostAllocated`、`LeastAllocated`、`BalancedAllocation` |
| `numaScoringStrategy` | 对**节点内的 NUMA 节点**打分 | `MostAllocated`、`LeastAllocated`、`BalancedAllocation` |

`BalancedAllocation` 偏好各类资源使用率更均衡的节点。与 `NUMAAllocateStrategy` 一样，`MostAllocated` = 可用最少（装箱），`LeastAllocated` = 可用最多（打散）。

## DeviceShare 的分配策略

DeviceShare 负责分配加速卡及其他设备。它的策略作用于**设备拓扑**（device → PCIe → NUMA node → node），并且除非显式关闭，它会参与 NUMA 对齐。

### DeviceHint——按设备类型的分配 hint

通过 Pod 的 `koordinator.sh/device-allocate-hint` 设置，以设备类型（`gpu`、`rdma` 等）为 key。

| 字段 | 取值 | 含义 |
| --- | --- | --- |
| `selector` | label selector | 限定哪些设备实例可被选中。 |
| `vfSelector` | label selector | 限定哪些 SR-IOV 虚拟功能（VF）可被选中。 |
| `allocateStrategy` | `ApplyForAll`、`RequestsAsCount` | `ApplyForAll`：分配所有匹配的设备。`RequestsAsCount`：把资源请求值当作设备*数量*来解释。 |
| `requiredTopologyScope` | `Device`、`PCIe`、`NUMANode`、`Node` | 所分配设备必须共享的最紧拓扑范围（level 4 → 1）。 |
| `exclusivePolicy` | `DeviceLevel`、`PCIeLevel` | 在设备实例维度或 PCIe 维度互斥。 |

### DeviceJointAllocate——跨设备类型的联合放置

通过 Pod 的 `koordinator.sh/device-joint-allocate` 设置。它把多种设备类型分组，使它们在共享的拓扑范围内一起分配——最经典的场景就是让 GPU 与 RDMA 网卡落在同一个 PCIe switch 下。

| 字段 | 含义 |
| --- | --- |
| `deviceTypes` | 需要联合分配的设备类型（例如 `[gpu, rdma]`）。 |
| `requiredScope` | 它们必须共享的范围。`SamePCIe` 要求所有联合设备处于同一 PCIe 下。 |

### GPU 分区

对多卡 Pod 而言，GPU 之间的互联拓扑（如 NVLink）比单纯的数量更重要。分区在 `Device` CR 上用 annotation `koordinator.sh/gpu-partitions` 描述，并由 Pod 通过 `koordinator.sh/gpu-partition-spec` 请求。

`GPUPartitionSpec`（Pod）：

| 字段 | 取值 | 含义 |
| --- | --- | --- |
| `allocatePolicy` | `Restricted`、`BestEffort` | `Restricted`：**只**考虑 `allocationScore` 最高的分区。`BestEffort`（默认）：尽量追求更高的 `allocationScore`，但也接受较低的。 |
| `ringBusBandwidth` | quantity | 分区所需的最小环形总线带宽。 |

`GPUPartitionPolicy`（Node/Device label `node.koordinator.sh/gpu-partition-policy`）：

| 取值 | 含义 |
| --- | --- |
| `Honor` | **必须**遵守 `Device` CR 上标注的分区表。 |
| `Prefer`（默认） | 分区表是**优先**遵循，但非强制。 |

> **需要注意的命名冲突：** `GPUPartitionSpec.allocatePolicy` 用了 `Restricted` / `BestEffort`，但它们与同名的 `NUMATopologyPolicy` 取值**毫无关系**。这里的二者描述的是"以多严格的方式追求最优 GPU 分区分数"；那里的二者描述的是 NUMA 对齐的严格程度。两条轴彼此独立，也从不互相校验。

### 设备 Scoring 策略

`DeviceShareArgs.scoringStrategy` 用 `MostAllocated`（装箱设备）或 `LeastAllocated`（打散设备）按设备可用性对节点打分，语义与 NodeNUMAResource 的 scoring 相同。

### DisableDeviceNUMATopologyAlignment——退出 NUMA 对齐

`DeviceShareArgs.disableDeviceNUMATopologyAlignment` 把设备从 NUMA 合并中解耦。当它为 `true` 时，DeviceShare **不**产出任何 hint，于是设备放置既不再约束、也不再受约束于 Pod 的 NUMA 对齐。仅当你确实允许设备与 CPU 落在不同 NUMA 节点时才使用它。

## 一致性与冲突分析

两个插件看起来定义了大量彼此重叠的旋钮。实际上它们是分层组织的，因此大多数"冲突"要么在构造上就不可能发生，要么会被确定性地化解。本节把这些保证——以及真正存在的张力点——讲清楚。

### 共享词汇（真正一致）

以下概念只定义一次，并由两个插件通过 Topology Manager 共同消费，因此不可能各自漂移：

| 概念 | 定义处 | 消费方 |
| --- | --- | --- |
| `NUMATopologyPolicy` | `apis/extension` | 两者，经由同一次合并决策 |
| `NUMATopologyHint`（affinity / Preferred / Score） | `frameworkext/topologymanager` | 两个 hint provider |
| `NumaTopologyExclusive`（Preferred / Required） | `apis/extension` | Topology Manager 的 `Admit` |
| `NumaNodeStatus`（idle / shared / single） | `apis/extension` | Topology Manager 的 `Admit` |

### 平行但不同的词汇（易混淆之处）

有几种策略共享同一个*词*，却控制*不同的轴*。它们是正交的，而非互相竞争：

| 术语 | 插件 | 控制的轴 | 取值 |
| --- | --- | --- | --- |
| `NUMAAllocateStrategy` | NodeNUMAResource | 填充哪些 NUMA 节点 | MostAllocated / LeastAllocated / DistributeEvenly |
| `scoringStrategy` | NodeNUMAResource | 如何给节点打分 | MostAllocated / LeastAllocated / BalancedAllocation |
| `numaScoringStrategy` | NodeNUMAResource | 如何给 NUMA 节点打分 | MostAllocated / LeastAllocated / BalancedAllocation |
| `scoringStrategy` | DeviceShare | 如何按设备给节点打分 | MostAllocated / LeastAllocated |
| `DeviceHint.allocateStrategy` | DeviceShare | 如何解读设备请求 | ApplyForAll / RequestsAsCount |
| `DeviceHint.requiredTopologyScope` | DeviceShare | 设备分组粒度 | Device / PCIe / NUMANode / Node |
| `GPUPartitionSpec.allocatePolicy` | DeviceShare | GPU 分区选择 | Restricted / BestEffort |

这张表上有两条一致性保证始终成立：

- **`MostAllocated` / `LeastAllocated` 在任何地方含义都相同**——装箱 vs. 打散——无论作用于 NUMA 节点、整个节点还是设备。
- **`CPUBindPolicy` 与 `DeviceHint.exclusivePolicy` 表达的是同一个*理念***（在某个拓扑层级上独占），但作用于不同域（CPU 核 vs. device/PCIe），因此它们的取值集合有意不同。

### 冲突如何被预防或化解

| 潜在冲突 | 化解方式 |
| --- | --- |
| Pod 与 Node 对 `NUMATopologyPolicy` 意见不一致 | 以 `ErrNotMatchNUMATopology` 拒绝；绝不悄悄合并。 |
| CPU hint 与设备 hint 偏好不同的 NUMA 节点 | 在同一策略下合并；更窄的 affinity 胜出，同宽时由 `Score` 决胜（设备打 `500` 分，故同宽时设备布局领先）。 |
| 设备应当完全无视 NUMA | `disableDeviceNUMATopologyAlignment` 把设备 hint 从合并中移除。 |
| 单 NUMA 的 Pod 遇上已被独占的 NUMA 节点 | 在 `Admit` 阶段用 `SingleNUMANodeExclusive` + `NumaNodeStatus` 校验。 |

### 真正的张力点与建议

以下组合在 API 层面是*被允许*的，但在逻辑上相互对立或冗余。调度器不会拒绝它们，因此运维方应避免这样搭配：

| 组合 | 为什么存在张力 | 建议 |
| --- | --- | --- |
| `numa-allocate-strategy: DistributeEvenly` + `NUMATopologyPolicy: SingleNUMANode` | `SingleNUMANode` 把一切限制在单个 NUMA 节点，于是"跨 NUMA 节点均匀分布"无从分布。策略胜出，该 allocate strategy 变成空操作。 | 不要在同时要求 `SingleNUMANode` 的节点/Pod 上设置 `DistributeEvenly`。 |
| `requiredTopologyScope: NUMANode`（设备）+ `NUMATopologyPolicy: None` | 设备仍会尝试共享一个 NUMA 节点，但全局对齐已关闭，CPU 可能落在别处。 | 如果跨资源的 NUMA 局部性很重要，至少把策略提到 `BestEffort`。 |
| `GPUPartitionSpec.allocatePolicy: Restricted` + `gpu-partition-policy: Prefer` | Pod 只要最高分分区，而节点把分区视为可选；严格的 Pod 遇上宽松的节点会更难放置。 | 让两者对齐：当 Pod 请求 `Restricted` 时，节点使用 `Honor`。 |

### 一句话心智模型

> 每个 Pod 只有**一次** NUMA 决策，由 Topology Manager 在**同一个** `NUMATopologyPolicy` 下做出。NodeNUMAResource 和 DeviceShare 只是向这次决策*提议* hint；其余所有策略（绑核策略、allocate strategy、scoring、GPU 分区、拓扑范围）都是在细化*各插件如何构造它的提议*，或*在 NUMA 位掩码确定后如何绑定资源*。

## 下一步

推荐的后续阅读：

- 了解异构设备如何建模：[Device](./device)。
- 了解 Koordinator 的[资源模型](./resource-model)。
- 跟着[细粒度 CPU 编排](../user-manuals/fine-grained-cpu-orchestration.md)用户手册看 NodeNUMAResource 的实战。
- 跟着[细粒度设备调度](../user-manuals/fine-grained-device-scheduling.md)与 [GPU 和 RDMA 联合分配](../user-manuals/gpu-and-rdma-joint-allocation.md)用户手册看 DeviceShare 的实战。
- 阅读[细粒度设备调度](../designs/fine-grained-device-scheduling)的设计细节。

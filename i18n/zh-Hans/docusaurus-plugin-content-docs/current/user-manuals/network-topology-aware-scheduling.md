# 网络拓扑感知调度

## 简介

在大规模 AI 训练场景中，尤其是大语言模型（LLMs）训练，高效的 Pod 间通信对训练性能至关重要。模型并行技术，如张量并行（TP）、流水线并行（PP）和数据并行（DP），需要在 GPU 之间进行频繁的高带宽数据交换——通常跨越多个节点。在这些工作负载下，**网络拓扑成为关键的性能瓶颈**，通信延迟和带宽受物理网络层次结构（如 NVLink、block、spine）的严重影响。

为了优化训练效率，Koordinator 提供了**网络拓扑感知调度**能力，该能力确保：
- 当集群资源充足时，具有网络拓扑调度需求的 Pod 将根据用户指定的策略被调度到性能更好的拓扑域（例如，更低的延迟、更高的带宽）。
- 当集群资源不足时，调度器将基于网络拓扑约束通过作业级抢占为 GangGroup 抢占资源，并在 `.status.nominatedNode` 字段中记录资源预留，以确保一致的放置。

此功能与 [PodGroup/GangGroup](https://koordinator.sh/docs/next/architecture/job/) 语义无缝协作。

## 前置条件

- Kubernetes >= 1.18
- Koordinator >= 1.7.0

## 验证网络拓扑支持是否启用

虽然从 Koordinator >= 1.7.0 开始，网络拓扑感知调度**默认启用**，但建议在继续之前确认配置。

### 检查 koord-scheduler 启动参数

1. 验证 koord-scheduler 已启用网络拓扑管理器:

```bash
kubectl -n koordinator-system get deployment koord-scheduler -o yaml | grep enable-network-topology-manager
```

预期输出:

```yaml
- --enable-network-topology-manager=true
```

如果参数缺失或设置为 `false`，请更新 koord-scheduler 部署以添加此标志。

### 检查 Coscheduling 插件配置

2. 验证 Coscheduling 插件已启用网络拓扑感知:

```bash
kubectl -n koordinator-system get cm koord-scheduler-config -o yaml
```

确保 Coscheduling 插件配置包含 `awareNetworkTopology: true`：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: koord-scheduler-config
  namespace: koordinator-system
data:
  koord-scheduler-config: |
    apiVersion: kubescheduler.config.k8s.io/v1
    kind: KubeSchedulerConfiguration
    profiles:
    - pluginConfig:
      - name: Coscheduling
        args:
          apiVersion: kubescheduler.config.k8s.io/v1
          kind: CoschedulingArgs
          awareNetworkTopology: true
          enablePreemption: true
```

如果 `awareNetworkTopology` 缺失或设置为 `false`，请更新 ConfigMap 并重启 koord-scheduler Pod：

```bash
kubectl delete po -l koord-app=koord-scheduler -n koordinator-system 
```

## 配置网络拓扑

### 为节点添加拓扑信息标签

首先，使用 NVIDIA 的 [topograph](https://github.com/NVIDIA/topograph/blob/v0.1.0/docs/engines/k8s.md) 等工具为节点标记其网络拓扑位置：

```yaml
apiVersion: v1
kind: Node
metadata:
  name: node-0
  labels:
    network.topology.nvidia.com/block: b1
    network.topology.nvidia.com/spine: s1
```

### 创建 ClusterNetworkTopology

管理员通过名为 `default` 的 `ClusterNetworkTopology` CR 定义拓扑层次结构：

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: ClusterNetworkTopology
metadata:
  name: default
spec:
  networkTopologySpec:
    - labelKey:
      - network.topology.nvidia.com/spine
      topologyLayer: SpineLayer
    - labelKey:
      - network.topology.nvidia.com/block
      parentTopologyLayer: SpineLayer
      topologyLayer: BlockLayer
    - parentTopologyLayer: BlockLayer
      topologyLayer: NodeTopologyLayer
```

拓扑形成树状结构，其中每一层代表网络中的聚合级别（例如，Node → Block → Spine）。

### 验证拓扑配置

应用 ClusterNetworkTopology 后，检查其状态：

```bash
kubectl get clusternetworktopology default -o yaml
```

示例输出：

```yaml
status:
  detailStatus:
  - childTopologyLayer: SpineLayer
    childTopologyNames:
    - spine-0
    - spine-1
    - spine-2
    nodeNum: 12
    topologyInfo:
      topologyLayer: ClusterTopologyLayer
      topologyName: ""
  - childTopologyLayer: BlockLayer
    childTopologyNames:
    - block-0
    - block-1
    nodeNum: 5
    parentTopologyInfo:
      topologyLayer: ClusterTopologyLayer
      topologyName: ""
    topologyInfo:
      topologyLayer: SpineLayer
      topologyName: spine-0
  - childTopologyLayer: NodeTopologyLayer
    nodeNum: 3
    parentTopologyInfo:
      topologyLayer: SpineLayer
      topologyName: spine-0
    topologyInfo:
      topologyLayer: BlockLayer
      topologyName: block-0
  - childTopologyLayer: NodeTopologyLayer
    nodeNum: 2
    parentTopologyInfo:
      topologyLayer: SpineLayer
      topologyName: spine-0
    topologyInfo:
      topologyLayer: BlockLayer
      topologyName: block-1
  - childTopologyLayer: BlockLayer
    childTopologyNames:
    - block-2
    - block-3
    nodeNum: 4
    parentTopologyInfo:
      topologyLayer: ClusterTopologyLayer
      topologyName: ""
    topologyInfo:
      topologyLayer: SpineLayer
      topologyName: spine-1
  - childTopologyLayer: NodeTopologyLayer
    nodeNum: 2
    parentTopologyInfo:
      topologyLayer: SpineLayer
      topologyName: spine-1
    topologyInfo:
      topologyLayer: BlockLayer
      topologyName: block-2
  - childTopologyLayer: NodeTopologyLayer
    nodeNum: 2
    parentTopologyInfo:
      topologyLayer: SpineLayer
      topologyName: spine-1
    topologyInfo:
      topologyLayer: BlockLayer
      topologyName: block-3
  - childTopologyLayer: BlockLayer
    childTopologyNames:
    - block-4
    nodeNum: 3
    parentTopologyInfo:
      topologyLayer: ClusterTopologyLayer
      topologyName: ""
    topologyInfo:
      topologyLayer: SpineLayer
      topologyName: spine-2
  - childTopologyLayer: NodeTopologyLayer
    nodeNum: 3
    parentTopologyInfo:
      topologyLayer: SpineLayer
      topologyName: spine-2
    topologyInfo:
      topologyLayer: BlockLayer
      topologyName: block-4
```

基于上述 `status`，集群具有两层 **spine-block** 架构：

```
ClusterTopologyLayer
├── SpineLayer: spine-0
│   ├── BlockLayer: block-0
│   │   └── NodeTopologyLayer: 3 nodes
│   └── BlockLayer: block-1
│       └── NodeTopologyLayer: 2 nodes
│
├── SpineLayer: spine-1
│   ├── BlockLayer: block-2
│   │   └── NodeTopologyLayer: 2 nodes
│   └── BlockLayer: block-3
│       └── NodeTopologyLayer: 2 nodes
│
└── SpineLayer: spine-2
    └── BlockLayer: block-4
        └── NodeTopologyLayer: 3 nodes
```

我们可能已经注意到，此网络拓扑架构与[网络拓扑算法演示](https://koordinator.sh/docs/next/architecture/job#topology-gather-algorithm)中使用的架构一致。

## 使用示例

### 环境设置

为了演示网络拓扑感知调度，我们假设集群具有[验证拓扑配置](#验证拓扑配置)部分所示的拓扑配置：

- 总共 12 个工作节点（node-0 到 node-11）
- 3 个 Spine：
  - spine-0： 5 个节点（block-0 有 3 个节点：node-0、node-1、node-2；block-1 有 2 个节点：node-3、node-4）
  - spine-1： 4 个节点（block-2 有 2 个节点：node-5、node-6；block-3 有 2 个节点：node-7、node-8）
  - spine-2： 3 个节点（block-4 有 3 个节点：node-9、node-10、node-11）
- 每个节点配置： 8 个 CPU 核心，32 GiB 内存

```
ClusterTopologyLayer
├── SpineLayer: spine-0 (5 nodes)
│   ├── BlockLayer: block-0 (node-0, node-1, node-2)
│   └── BlockLayer: block-1 (node-3, node-4)
├── SpineLayer: spine-1 (4 nodes)
│   ├── BlockLayer: block-2 (node-5, node-6)
│   └── BlockLayer: block-3 (node-7, node-8)
└── SpineLayer: spine-2 (3 nodes)
    └── BlockLayer: block-4 (node-9, node-10, node-11)
```

我们的演示将包括：
1. **示例 1**： 使用 `PreferGather` 策略和 Binpack 算法的拓扑感知调度
2. **示例 2**： 当约束无法满足时的 `MustGather` 调度和拓扑感知抢占

### 示例 1: 使用 `PreferGather` 和 Binpack 的拓扑感知调度

此示例演示了 Koordinator 如何使用 `PreferGather` 策略调度 Pod，以实现**最优网络性能**和**最小资源浪费**。`PreferGather` 策略确保 Pod 聚集在同一拓扑域内以获得更好的网络局部性，而 Binpack 算法选择最紧凑的域以最小化资源碎片。

#### 场景

我们将在所有 12 个节点空闲时创建一个 4 Pod 训练作业：
- 每个 Pod 需要 **8 个 CPU 核心**（占用整个节点）
- 总需求： 4 个 Pod = 4 个节点
- 调度器应选择提供以下内容的最紧凑拓扑域：
  - **最佳网络性能**： Pod 聚集在同一 Spine 中以获得更低的延迟和更高的带宽
  - **最少资源浪费**： 能够容纳所有 Pod 的最小拓扑域

**预期结果**： Pod 调度到 **spine-1**（node-5 到 node-8），这是最优选择，因为：
- 它恰好有 4 个节点（完美匹配，零浪费）
- 所有 Pod 都在同一 Spine 中以获得最佳网络性能
- 其他 Spine 中没有资源碎片

#### 步骤 1: 创建具有 `PreferGather` 策略的 PodGroup

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: topology-demo-job
  namespace: default
  annotations:
    gang.scheduling.koordinator.sh/network-topology-spec: |
      {
        "gatherStrategy": [
          {
            "layer": "BlockLayer",
            "strategy": "PreferGather"
          },
          {
            "layer": "SpineLayer",
            "strategy": "PreferGather"
          }
        ]
      }
spec:
  minMember: 4
  scheduleTimeoutSeconds: 300
```

#### 步骤 2: 创建 4 Pod 训练作业

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: training-pod-0
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: topology-demo-job
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "0"
spec:
  schedulerName: koord-scheduler
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
---
apiVersion: v1
kind: Pod
metadata:
  name: training-pod-1
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: topology-demo-job
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "1"
spec:
  schedulerName: koord-scheduler
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
---
apiVersion: v1
kind: Pod
metadata:
  name: training-pod-2
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: topology-demo-job
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "2"
spec:
  schedulerName: koord-scheduler
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
---
apiVersion: v1
kind: Pod
metadata:
  name: training-pod-3
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: topology-demo-job
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "3"
spec:
  schedulerName: koord-scheduler
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
```

#### 步骤 3： 应用并验证调度结果

```bash
kubectl apply -f topology-demo-job.yaml
```

几秒钟后，检查 Pod 调度结果：

```bash
kubectl get pods -o wide | grep training-pod
```

预期输出:

```
NAME            READY   STATUS    RESTARTS   AGE   IP            NODE      NOMINATED NODE
training-pod-0  1/1     Running   0          30s   10.244.5.10   node-5    <none>
training-pod-1  1/1     Running   0          30s   10.244.6.11   node-6    <none>
training-pod-2  1/1     Running   0          30s   10.244.7.10   node-7    <none>
training-pod-3  1/1     Running   0          30s   10.244.8.11   node-8    <none>
```

#### Binpack 算法如何工作

**步骤 1： 自下而上计算 offerslots**

对于每个节点（每个 Pod 需要 8 个 CPU 核心以占用整个节点）：
- 所有节点（node-0 到 node-11）： offerslots = 1 （8 个可用核心 / 每个 Pod 8 个核心）

对于每个 Block：
- block-0 （node-0, node-1, node-2）： offerslots = 3
- block-1 （node-3, node-4）： offerslots = 2
- block-2 （node-5, node-6）： offerslots = 2
- block-3 （node-7, node-8）： offerslots = 2
- block-4 （node-9, node-10, node-11）： offerslots = 3

对于每个 Spine：
- spine-0 （block-0, block-1）： offerslots = 5
- spine-1 （block-2, block-3）： offerslots = 4
- spine-2 （block-4）： offerslots = 3

**步骤 2： 查找候选拓扑节点**

我们需要 4 个 Pod（4 个 offerslots）。只有 spine-0（5 个槽位）和 spine-1（4 个槽位）可以容纳该作业。

在 Block 级别，没有单个 block 可以容纳所有 4 个 Pod，因此候选者在 Spine 级别。

**步骤 3： 应用 Binpack 算法**

在候选 Spine 中：
- spine-0： offerslots = 5， 需要 = 4， 浪费 = 1
- spine-1： offerslots = 4， 需要 = 4， 浪费 = 0  ← **被选中（最小浪费）**

Binpack 算法选择 **spine-1**（node-5 到 node-8），放置所有 4 个 Pod 后零浪费。

**最终放置**： 所有 4 个 Pod 都调度到 **spine-1**（node-5、node-6、node-7、node-8），实现了：
- **最优网络性能（`PreferGather` 效果）**： 所有 Pod 都聚集在同一 Spine（spine-1）内，最小化跨 Spine 流量并最大化 Pod 间通信的网络带宽
- **最小资源浪费（Binpack 效果）**： spine-1 恰好有 4 个槽位供 4 个 Pod 使用（零浪费），而 spine-0 会有 1 个槽位浪费。这使得 spine-0 的所有 5 个节点都可用于未来的工作负载，防止资源碎片

### 示例 2： `MustGather` 和拓扑感知抢占

此示例演示了为什么某些工作负载需要 `MustGather` 以及抢占如何遵循网络拓扑约束。

**为什么需要 `MustGather`**： 在延迟敏感的分布式训练场景中，网络通信模式对延迟极其敏感。如果 Pod 分散在不同的 Spine 上，跨 Spine 通信开销会使训练时间增加 3-5 倍，使作业在经济上不可行。因此，**`MustGather` 不仅仅是优化——它是这些工作负载的硬性要求**。

**抢占如何遵循拓扑**： 当由于资源不足而无法满足 `MustGather` 约束时，Koordinator 执行**拓扑感知抢占**。这意味着：
1. 调度器识别需要抢占哪些低优先级 Pod
2. 抢占决策遵循与调度相同的拓扑约束
3. 调度器确保释放的资源可以满足 `MustGather` 要求
4. 通过 `nominatedNode` 预留资源以防止其他 Pod 窃取它们

#### 场景

此示例展示了以下场景：
1. 低优先级 Pod 占用 node-0、node-1 和 node-5（每个 Pod 占用整个节点）
2. 提交一个具有 `MustGather` 到 SpineLayer 的高优先级 4 Pod 作业（每个 Pod 占用整个节点）
3. **没有单个 Spine 在不抢占的情况下拥有 4 个可用节点**
4. Koordinator 执行拓扑感知抢占：抢占 node-5 上的 Pod 并将所有 4 个高优先级 Pod 调度到 node-5 到 node-8（在 spine-1 内），**在整个抢占过程中维护 `MustGather` 约束**

- 3 个低优先级 Pod 已在 node-0、node-1 和 node-5 上运行（每个占用 8 核心的整个节点）
- 一个具有严格网络要求的高优先级 4 Pod 训练作业：
  - **需要 `MustGather`** 到 SpineLayer：跨 Spine 延迟会使性能降低 3-5 倍
  - 每个 Pod 需要 **8 个 CPU 核心**（占用整个节点）
- **当前状态**： 没有单个 Spine 拥有 4 个可用节点
  - spine-0： 3 个可用节点（node-2、node-3、node-4） - node-0、node-1 被占用
  - spine-1： 3 个可用节点（node-6、node-7、node-8） - node-5 被占用
  - spine-2： 3 个可用节点（node-9、node-10、node-11）

**预期结果**： 调度器执行**拓扑感知抢占**，抢占 node-5 上的低优先级 Pod 以满足 `MustGather` 约束，并将所有 4 个高优先级 Pod 调度到 **spine-1**（node-5 到 node-8）。

#### 步骤 1： 定义 PriorityClass

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 1000000
preemptionPolicy: PreemptLowerPriority
description: "High priority for critical training jobs"
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: low-priority
value: 1000
preemptionPolicy: PreemptLowerPriority
description: "Low priority for best-effort jobs"
```

```bash
kubectl apply -f priorityclasses.yaml
```

#### 步骤 2： 在 node-0、node-1 和 node-5 上创建低优先级 Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: low-priority-pod-0
  namespace: default
spec:
  schedulerName: koord-scheduler
  priorityClassName: low-priority
  nodeName: node-0
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
---
apiVersion: v1
kind: Pod
metadata:
  name: low-priority-pod-1
  namespace: default
spec:
  schedulerName: koord-scheduler
  priorityClassName: low-priority
  nodeName: node-1
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
---
apiVersion: v1
kind: Pod
metadata:
  name: low-priority-pod-5
  namespace: default
spec:
  schedulerName: koord-scheduler
  priorityClassName: low-priority
  nodeName: node-5
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
```

```bash
kubectl apply -f low-priority-pods.yaml
```

验证 Pod 正在运行：

```bash
kubectl get pods -o wide
```

```
NAME                  READY   STATUS    RESTARTS   AGE   IP            NODE     NOMINATED NODE
low-priority-pod-0    1/1     Running   0          10s   10.244.0.10   node-0   <none>
low-priority-pod-1    1/1     Running   0          10s   10.244.1.10   node-1   <none>
low-priority-pod-5    1/1     Running   0          10s   10.244.5.10   node-5   <none>
```

#### 步骤 3： 创建具有 `MustGather` 到 SpineLayer 的高优先级作业

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: high-priority-training
  namespace: default
  annotations:
    gang.scheduling.koordinator.sh/network-topology-spec: |
      {
        "gatherStrategy": [
          {
            "layer": "SpineLayer",
            "strategy": "MustGather"
          }
        ]
      }
spec:
  minMember: 4
  scheduleTimeoutSeconds: 300
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hp-training-pod-0
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: high-priority-training
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "0"
spec:
  schedulerName: koord-scheduler
  priorityClassName: high-priority
  preemptionPolicy: PreemptLowerPriority
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
---
apiVersion: v1
kind: Pod
metadata:
  name: hp-training-pod-1
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: high-priority-training
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "1"
spec:
  schedulerName: koord-scheduler
  priorityClassName: high-priority
  preemptionPolicy: PreemptLowerPriority
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
---
apiVersion: v1
kind: Pod
metadata:
  name: hp-training-pod-2
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: high-priority-training
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "2"
spec:
  schedulerName: koord-scheduler
  priorityClassName: high-priority
  preemptionPolicy: PreemptLowerPriority
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
---
apiVersion: v1
kind: Pod
metadata:
  name: hp-training-pod-3
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: high-priority-training
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "3"
spec:
  schedulerName: koord-scheduler
  priorityClassName: high-priority
  preemptionPolicy: PreemptLowerPriority
  containers:
  - name: curlimage
    image: busybox
    imagePullPolicy: IfNotPresent
    command:
    - sleep
    - 365d
    resources:
      requests:
        cpu: 8
        memory: 32Gi
      limits:
        cpu: 8
        memory: 32Gi
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
```

#### 步骤 4： 应用并观察抢占

```bash
kubectl apply -f high-priority-training.yaml
```

提交后立即检查 Pod 状态：

```bash
kubectl get pods -o wide
```

抢占期间的预期输出：

```
NAME                  READY   STATUS        RESTARTS   AGE   IP            NODE     NOMINATED NODE
low-priority-pod-0    1/1     Running       0          2m    10.244.0.10   node-0   <none>
low-priority-pod-1    1/1     Running       0          2m    10.244.1.10   node-1   <none>
low-priority-pod-5    0/1     Terminating   0          2m    10.244.5.10   node-5   <none>
hp-training-pod-0     0/1     Pending       0          10s   <none>        <none>   node-5
hp-training-pod-1     0/1     Pending       0          10s   <none>        <none>   node-6
hp-training-pod-2     0/1     Pending       0          10s   <none>        <none>   node-7
hp-training-pod-3     0/1     Pending       0          10s   <none>        <none>   node-8
```

**理解拓扑感知抢占期间的调度器消息**

在抢占进行中（在受害 Pod 完全终止之前），高优先级 Pod 将处于 `Pending` 状态。您可以检查详细的调度器消息：

```bash
kubectl get pod hp-training-pod-0 -o yaml
```

Pod 状态将包含说明为什么调度正在等待的信息性消息：

```yaml
status:
  conditions:
  - lastProbeTime: null
    lastTransitionTime: "2025-10-23T07:35:30Z"
    message: '0/12 nodes are available: no candidate topology nodes can accommodate
      job, desiredOfferSlot: 4, topology topologyNode SpineLayer/spine-0: 3;topology
      topologyNode SpineLayer/spine-1: 3;topology topologyNode SpineLayer/spine-2:
      3. preemption: not eligible due to terminating pod on the nominated node..'
    reason: Unschedulable
    status: "False"
    type: PodScheduled
  nominatedNodeName: node-5
  phase: Pending
```

**消息中的关键信息:**

1. **拓扑约束评估**: `no candidate topology nodes can accommodate job, desiredOfferSlot: 4`
   - 作业需要在单个拓扑域内有 4 个槽位(节点)

2. **每个 Spine 的可用性**: 
   - `topology topologyNode SpineLayer/spine-0: 3` - 只有 3 个可用节点
   - `topology topologyNode SpineLayer/spine-1: 3` - 只有 3 个可用节点
   - `topology topologyNode SpineLayer/spine-2: 3` - 只有 3 个可用节点
   - **没有任何 Spine 可以在不抢占的情况下满足 `MustGather` 要求**

3. **抢占状态**: `preemption: not eligible due to terminating pod on the nominated node`
   - 已为 node-5 上的 low-priority-pod-5 触发抢占
   - 调度器正在等待受害 Pod 完全终止
   - 资源已通过 `nominatedNodeName: node-5` 预留

4. **GangGroup 协调**: 其他成员 Pod(hp-training-pod-1、hp-training-pod-2、hp-training-pod-3)将显示类似消息,表明它们由于 GangGroup 约束而等待:

```yaml
message: 'GangGroup "default/high-priority-training" gets rejected due to member Pod 
  "default/hp-training-pod-0" is unschedulable with reason "no candidate topology nodes 
  can accommodate job, desiredOfferSlot: 4...", alreadyWaitForBound: 0. preemption: 
  preemption already attempted by default/hp-training-pod-0 with message not eligible 
  due to terminating pod on the nominated node..'
```

此消息确认:
- GangGroup 中的所有 Pod 一起等待(gang 调度语义)
- 抢占在作业级别协调
- 在整个抢占过程中强制执行拓扑约束

#### 步骤 5: 验证最终调度结果

在 node-5 上的低优先级 Pod 终止后,再次检查:

```bash
kubectl get pods -o wide
```

预期的最终输出:

```
NAME                  READY   STATUS    RESTARTS   AGE   IP            NODE     NOMINATED NODE
low-priority-pod-0    1/1     Running   0          3m    10.244.0.10   node-0   <none>
low-priority-pod-1    1/1     Running   0          3m    10.244.1.10   node-1   <none>
hp-training-pod-0     1/1     Running   0          45s   10.244.5.20   node-5   <none>
hp-training-pod-1     1/1     Running   0          45s   10.244.6.20   node-6   <none>
hp-training-pod-2     1/1     Running   0          45s   10.244.7.20   node-7   <none>
hp-training-pod-3     1/1     Running   0          45s   10.244.8.20   node-8   <none>
```

#### 拓扑感知抢占如何工作

**步骤 1: 识别拓扑要求并验证 `MustGather` 约束**

高优先级作业要求所有 4 个 Pod 都在同一个 Spine 中(`MustGather` 到 SpineLayer)。这是一个**硬约束**——如果不满足此要求,作业将无法运行。每个 Pod 需要 8 个 CPU 核心(整个节点)。

**步骤 2: 评估每个 Spine 的可用资源(遵循拓扑)**

当前集群状态:
- spine-0 (5 个节点):
  - node-0: 被 low-priority-pod-0 占用(8 核心已使用,0 核心可用)
  - node-1: 被 low-priority-pod-1 占用(8 核心已使用,0 核心可用)
  - node-2: 可用(8 核心)
  - node-3: 可用(8 核心)
  - node-4: 可用(8 核心)
  - 总计: 3 个节点可用(作业需要 4 个)
  
- spine-1 (4 个节点):
  - node-5: 被 low-priority-pod-5 占用(8 核心已使用,0 核心可用)
  - node-6: 可用(8 核心)
  - node-7: 可用(8 核心)
  - node-8: 可用(8 核心)
  - 总计: 3 个节点可用(作业需要 4 个)
  
- spine-2 (3 个节点):
  - node-9: 可用(8 核心)
  - node-10: 可用(8 核心)
  - node-11: 可用(8 核心)
  - 总计: 3 个节点可用(即使抢占也无法容纳 4 个 Pod)

**关键观察**: 没有单个 Spine 在不抢占的情况下拥有足够的可用资源。**调度器必须执行拓扑感知抢占以满足 `MustGather` 约束。**

**步骤 3: 确定拓扑感知抢占策略**

调度器在**遵循 SpineLayer 拓扑约束**的同时评估最小抢占选项:

- **spine-0**: 需要抢占 1 个节点(node-0 或 node-1),结果有 4 个可用节点
  - 抢占数量: 1 个 Pod
  - 抢占后: 可以满足 `MustGather` 到 SpineLayer
  
- **spine-1**: 需要抢占 1 个节点(node-5),结果有 4 个可用节点
  - 抢占数量: 1 个 Pod
  - 抢占后: 可以满足 `MustGather` 到 SpineLayer
  
- **spine-2**: 无法容纳 4 个 Pod(总共只有 3 个节点)
  - 不是有效候选者

spine-0 和 spine-1 都需要相同数量的抢占(1 个 Pod)。Binpack 算法选择 **spine-1**,因为:
1. 它恰好有 4 个节点(完美匹配,零浪费)
2. 抢占 node-5 后: spine-1 中的所有 4 个节点都变为可用
3. 这以最小的干扰满足了 `MustGather` 约束

**步骤 4: 执行拓扑感知抢占**

Koordinator 在**维护拓扑约束**的同时执行抢占:
1. 标记 low-priority-pod-5 进行抢占(设置 DisruptionTarget 条件)
2. 为所有 4 个高优先级 Pod 设置 `nominatedNode` 到 **spine-1 内**的节点(node-5 到 node-8)
   - 这确保在资源预留期间保留拓扑约束
3. 删除 low-priority-pod-5
4. 将所有高优先级 Pod 调度到 spine-1,**满足 `MustGather` 约束**

**关键要点:**

1. **`MustGather` 是硬性要求**: 对于张量并行训练等延迟敏感的工作负载,`MustGather` 不是可选的——它对于可接受的性能至关重要。跨 Spine 通信会使作业速度降低 3-5 倍。

2. **抢占遵循拓扑约束**: 当可用资源无法满足 `MustGather` 时,调度器执行**拓扑感知抢占**。它**在每个拓扑域**(Spine)内分别评估抢占候选者,确保最终放置满足拓扑要求。

3. **最小干扰**: 调度器仅抢占了 1 个 Pod(满足 `MustGather` 约束所需的最小数量),选择 spine-1 是因为它是完美匹配(4 个节点供 4 个 Pod 使用)。

4. **资源预留维护拓扑**: `nominatedNode` 机制在**所选拓扑域**(spine-1)内预留资源,防止其他 Pod 在抢占过程中破坏拓扑约束。

5. **端到端拓扑保证**: 从抢占决策通过资源预留到最终调度,整个过程都维护 `MustGather` 约束,确保所有 4 个 Pod 都放置在 spine-1 内。

## 高级配置

### 拓扑层命名约定

建议使用清晰的命名约定来识别拓扑层:

```yaml
# 推荐的层命名
NodeTopologyLayer       # 节点层
AcceleratorLayer        # 加速器互连层(例如 NVLink)
BlockLayer              # Block 交换机层
SpineLayer              # Spine 交换机层
DatacenterLayer         # 数据中心层
```

### 拓扑策略选择指南

| 策略 | 用例 | 行为 |
|----------|----------|----------|
| `PreferGather` | 拓扑层需要良好的网络性能但可以容忍一些分散 | 尽可能聚集,但当资源不足时允许分散 |
| `MustGather` | 拓扑层具有严格的网络带宽要求 | 必须在指定层中聚集,否则调度失败 |

### 多 PodGroup 协调调度

对于包含 master 和 worker 的复杂训练作业,使用 `GangGroup` 语义:

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  annotations:
    gang.scheduling.koordinator.sh/groups: |
      ["default/llm-master", "default/llm-worker"]
    gang.scheduling.koordinator.sh/network-topology-spec: |
      {
        "gatherStrategy": [
          {
            "layer": "SpineLayer",
            "strategy": "MustGather"
          }
        ]
      }
```

确保所有相关的 PodGroup 使用相同的 `gang.scheduling.koordinator.sh/groups` 和 `gang.scheduling.koordinator.sh/network-topology-spec` 注解。

## 故障排查

### Pod 卡在 Pending 状态

**可能原因**: 网络拓扑约束过于严格,没有足够的节点满足要求

**解决方案**: 
- 检查集群拓扑配置: `kubectl get clusternetworktopology default -o yaml`
- 放宽拓扑策略,将 `MustGather` 更改为 `PreferGather`
- 添加集群节点或调整节点拓扑标签

### 拓扑感知调度未生效

**故障排查步骤**:

1. 验证 Koord-Scheduler 是否启用了网络拓扑插件:

```bash
kubectl -n koordinator-system get cm koord-scheduler-config -o yaml
```

2. 检查节点是否具有正确的拓扑标签:

```bash
kubectl get nodes --show-labels | grep network.topology
```

3. 检查 ClusterNetworkTopology 状态:

```bash
kubectl get clusternetworktopology default -o yaml
```

### 抢占未按预期发生

**检查**:

1. 确认 PriorityClass 配置正确
2. 检查 Pod 的 `preemptionPolicy` 设置
3. 查看调度器日志:

```bash
kubectl -n koordinator-system logs -l component=koord-scheduler --tail=100
```

## 最佳实践

1. **从 `PreferGather` 策略开始**: 对于初始部署,使用 `PreferGather` 了解 Pod 放置模式,然后再应用严格的 `MustGather` 约束

2. **为分布式训练使用拓扑索引**: 始终分配 `gang.scheduling.koordinator.sh/network-topology-index` 注解,以在数据并行作业中建立清晰的通信模式

3. **选择适当的拓扑层**:
   - 对于延迟敏感的推理服务: `MustGather` + `BlockLayer`
   - 对于大规模 LLM 训练: `MustGather` + `SpineLayer`
   - 对于一般分布式训练: 跨多个层的 `PreferGather` 组合

4. **为关键工作负载结合优先级**: 为生产训练作业设置高优先级,以确保它们可以在维护拓扑约束的同时抢占低优先级作业

5. **监控拓扑分布**: 定期检查 Pod 放置模式,并根据实际网络性能指标调整拓扑策略

6. **规划抢占场景**: 使用 `MustGather` 时,确保至少一个拓扑域中有足够的容量,以避免调度失败

## 参考资料

- [Job 架构](../architecture/job)
- [Job 级别抢占](../user-manuals/job-level-preemption)
- [Gang 调度](../user-manuals/gang-scheduling)
- [网络拓扑提案](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20250611-networktopology-aware-scheduling.md)

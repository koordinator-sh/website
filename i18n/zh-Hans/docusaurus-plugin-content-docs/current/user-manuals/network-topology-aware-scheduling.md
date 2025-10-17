# Network-Topology Aware Scheduling

## Introduction

在大规模 AI 训练场景中,特别是针对大语言模型(LLMs)的训练,高效的 Pod 间通信对训练性能至关重要。模型并行技术,如张量并行(TP)、流水线并行(PP)和数据并行(DP),需要在 GPU 之间进行频繁的、高带宽的数据交换——通常跨越多个节点。在这种工作负载下,**网络拓扑成为关键的性能瓶颈**,通信延迟和带宽严重受到物理网络层次结构(如 NVLink、block、spine)的影响。

为了优化训练效率,Koordinator 提供了**网络拓扑感知调度**能力,确保:
- `GangGroup` 内的 Pods 被调度到位于相同或邻近的高性能网络域的节点上,最小化节点间跳数并最大化吞吐量。
- 当集群资源充足时,具有网络拓扑调度需求的 Pods 将根据用户指定的策略被调度到性能更好(如更低延迟、更高带宽)的拓扑域中。
- 当集群资源不足时,调度器将基于网络拓扑约束通过 Job 级别抢占为 GangGroup 抢占资源,并在 `.status.nominatedNode` 字段中记录资源提名,确保一致的放置。

此功能与 [PodGroup/GangGroup](https://koordinator.sh/docs/next/architecture/job/) 语义无缝配合。

## Prerequisites

- Kubernetes >= 1.18
- Koordinator >= 1.7.0

## 配置网络拓扑

### 为节点添加拓扑标签

首先,需要使用工具(如 NVIDIA 的 [topograph](https://github.com/NVIDIA/topograph/blob/main/docs/k8s.md))为节点标注网络拓扑位置:

```yaml
apiVersion: v1
kind: Node
metadata:
  name: node-0
  labels:
    network.topology.nvidia.com/accelerator: nvl1
    network.topology.nvidia.com/block: b1
    network.topology.nvidia.com/spine: s1
    network.topology.nvidia.com/datacenter: dc1
```

### 创建 ClusterNetworkTopology

管理员通过名为 `default` 的 `ClusterNetworkTopology` CR 定义拓扑层次结构:

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

拓扑形成树状结构,其中每一层代表网络中的聚合级别(例如,Node → Block → Spine)。

### 验证拓扑配置

应用 ClusterNetworkTopology 后,检查其状态:

```bash
kubectl get clusternetworktopology default -o yaml
```

`status.detailStatus` 字段由 Koordinator 自动维护,反映集群中实际的网络拓扑结构和节点分布。它呈现从顶层(集群)到单个节点的层次视图。每个条目代表特定拓扑层的一个实例,关键字段包括:
- `topologyInfo`: 当前层的类型和名称(例如 `SpineLayer`, `s1`)
- `parentTopologyInfo`: 父层信息
- `childTopologyNames`: 下一层子域列表
- `nodeNum`: 此拓扑域内的节点数量

示例输出:

```yaml
status:
  detailStatus:
  - childTopologyLayer: SpineLayer
    childTopologyNames:
    - s1
    - s2
    nodeNum: 8
    topologyInfo:
      topologyLayer: ClusterTopologyLayer
      topologyName: ""
  - childTopologyLayer: BlockLayer
    childTopologyNames:
    - b1
    - b2
    nodeNum: 4
    parentTopologyInfo:
      topologyLayer: ClusterTopologyLayer
      topologyName: ""
    topologyInfo:
      topologyLayer: SpineLayer
      topologyName: s1
  - childTopologyLayer: NodeTopologyLayer
    nodeNum: 2
    parentTopologyInfo:
      topologyLayer: SpineLayer
      topologyName: s1
    topologyInfo:
      topologyLayer: BlockLayer
      topologyName: b1
  - childTopologyLayer: NodeTopologyLayer
    nodeNum: 2
    parentTopologyInfo:
      topologyLayer: SpineLayer
      topologyName: s1
    topologyInfo:
      topologyLayer: BlockLayer
      topologyName: b2
```

基于上述状态,集群具有两层 **spine-block** 架构:

```
ClusterTopologyLayer
├── SpineLayer: s1
│   ├── BlockLayer: b1
│   │   └── NodeTopologyLayer: 2 nodes
│   └── BlockLayer: b2
│       └── NodeTopologyLayer: 2 nodes
└── SpineLayer: s2
    ├── BlockLayer: b3
    │   └── NodeTopologyLayer: 2 nodes
    └── BlockLayer: b4
        └── NodeTopologyLayer: 2 nodes
```

## Usage Example

### 环境准备

为了演示网络拓扑感知调度,我们假设集群具有以下配置:
- 8 个 worker 节点,分布在 2 个 Spine(s1, s2)下
- 每个 Spine 下有 2 个 Block
- 每个 Block 下有 2 个节点
- 每个节点配置: 8 GPU, 96 CPU cores, 512 GiB Memory

我们的演示流程:
1. 创建网络拓扑聚合策略为 `PreferGather` 的训练作业
2. 创建网络拓扑聚合策略为 `MustGather` 的训练作业
3. 观察 Koordinator 如何根据网络拓扑约束调度 Pods

### 示例 1: 使用 PreferGather 策略

`PreferGather` 策略表示尽可能将 Pods 聚集在同一拓扑域,但如果无法满足,仍然允许调度到不同域。

#### 创建 PodGroup

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: training-job-prefer
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

#### 创建训练 Pods

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: training-worker-1
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: training-job-prefer
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "0"
spec:
  schedulerName: koord-scheduler
  containers:
  - name: trainer
    image: pytorch/pytorch:latest
    command:
    - python
    - train.py
    resources:
      limits:
        nvidia.com/gpu: 2
        cpu: 16
        memory: 64Gi
      requests:
        nvidia.com/gpu: 2
        cpu: 16
        memory: 64Gi
  restartPolicy: Never
---
apiVersion: v1
kind: Pod
metadata:
  name: training-worker-2
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: training-job-prefer
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "1"
spec:
  schedulerName: koord-scheduler
  containers:
  - name: trainer
    image: pytorch/pytorch:latest
    command:
    - python
    - train.py
    resources:
      limits:
        nvidia.com/gpu: 2
        cpu: 16
        memory: 64Gi
      requests:
        nvidia.com/gpu: 2
        cpu: 16
        memory: 64Gi
  restartPolicy: Never
---
apiVersion: v1
kind: Pod
metadata:
  name: training-worker-3
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: training-job-prefer
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "2"
spec:
  schedulerName: koord-scheduler
  containers:
  - name: trainer
    image: pytorch/pytorch:latest
    command:
    - python
    - train.py
    resources:
      limits:
        nvidia.com/gpu: 2
        cpu: 16
        memory: 64Gi
      requests:
        nvidia.com/gpu: 2
        cpu: 16
        memory: 64Gi
  restartPolicy: Never
---
apiVersion: v1
kind: Pod
metadata:
  name: training-worker-4
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: training-job-prefer
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "3"
spec:
  schedulerName: koord-scheduler
  containers:
  - name: trainer
    image: pytorch/pytorch:latest
    command:
    - python
    - train.py
    resources:
      limits:
        nvidia.com/gpu: 2
        cpu: 16
        memory: 64Gi
      requests:
        nvidia.com/gpu: 2
        cpu: 16
        memory: 64Gi
  restartPolicy: Never
```

#### 应用并验证

```bash
kubectl apply -f training-job-prefer.yaml
```

等待几秒钟后,检查 Pod 调度情况:

```bash
kubectl get pods -o wide
```

预期输出(Pods 被调度到同一个 Block 或 Spine 下):

```
NAME                 READY   STATUS    RESTARTS   AGE   IP            NODE     NOMINATED NODE
training-worker-1    1/1     Running   0          30s   10.244.1.10   node-1   <none>
training-worker-2    1/1     Running   0          30s   10.244.1.11   node-1   <none>
training-worker-3    1/1     Running   0          30s   10.244.2.10   node-2   <none>
training-worker-4    1/1     Running   0          30s   10.244.2.11   node-2   <none>
```

在此示例中,所有 4 个 Pods 都被调度到同一个 Block(b1)下的节点(node-1 和 node-2),确保了最佳的网络性能。

### 示例 2: 使用 MustGather 策略

`MustGather` 策略表示**必须**将所有 Pods 聚集在同一拓扑域,如果无法满足,则调度失败。这适用于对网络带宽有严格要求的场景。

#### 创建 PodGroup with MustGather

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: training-job-must
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
  minMember: 2
  scheduleTimeoutSeconds: 300
```

#### 创建训练 Pods

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: llm-training-master
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: training-job-must
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "0"
spec:
  schedulerName: koord-scheduler
  containers:
  - name: trainer
    image: pytorch/pytorch:latest
    command:
    - python
    - train_llm.py
    - --role=master
    resources:
      limits:
        nvidia.com/gpu: 8
        cpu: 32
        memory: 128Gi
      requests:
        nvidia.com/gpu: 8
        cpu: 32
        memory: 128Gi
  restartPolicy: Never
---
apiVersion: v1
kind: Pod
metadata:
  name: llm-training-worker
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: training-job-must
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "1"
spec:
  schedulerName: koord-scheduler
  containers:
  - name: trainer
    image: pytorch/pytorch:latest
    command:
    - python
    - train_llm.py
    - --role=worker
    resources:
      limits:
        nvidia.com/gpu: 8
        cpu: 32
        memory: 128Gi
      requests:
        nvidia.com/gpu: 8
        cpu: 32
        memory: 128Gi
  restartPolicy: Never
```

#### 应用并验证

```bash
kubectl apply -f training-job-must.yaml
```

检查调度结果:

```bash
kubectl get pods -o wide
```

预期输出:

```
NAME                   READY   STATUS    RESTARTS   AGE   IP            NODE     NOMINATED NODE
llm-training-master    1/1     Running   0          45s   10.244.1.20   node-1   <none>
llm-training-worker    1/1     Running   0          45s   10.244.2.21   node-2   <none>
```

两个 Pods 都被调度到同一个 Spine(s1)下的节点,满足 `MustGather` 约束。

### 示例 3: 多层拓扑策略组合

您可以组合多层拓扑策略以实现更精细的控制:

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: multi-layer-job
  namespace: default
  annotations:
    gang.scheduling.koordinator.sh/groups: ["default/multi-layer-master", "default/multi-layer-worker"]
    gang.scheduling.koordinator.sh/network-topology-spec: |
      {
        "gatherStrategy": [
          {
            "layer": "AcceleratorLayer",
            "strategy": "PreferGather"
          },
          {
            "layer": "BlockLayer",
            "strategy": "PreferGather"
          },
          {
            "layer": "SpineLayer",
            "strategy": "MustGather"
          }
        ]
      }
spec:
  minMember: 1
---
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: multi-layer-worker
  namespace: default
  annotations:
    gang.scheduling.koordinator.sh/groups: ["default/multi-layer-master", "default/multi-layer-worker"]
    gang.scheduling.koordinator.sh/network-topology-spec: |
      {
        "gatherStrategy": [
          {
            "layer": "AcceleratorLayer",
            "strategy": "PreferGather"
          },
          {
            "layer": "BlockLayer",
            "strategy": "PreferGather"
          },
          {
            "layer": "SpineLayer",
            "strategy": "MustGather"
          }
        ]
      }
spec:
  minMember: 3
```

此配置表示:
- 首先尝试将 Pods 聚集在加速器互联域(最高性能)
- 其次尝试聚集在同一 Block
- **必须**聚集在同一 Spine(严格要求)

### 示例 4: 网络拓扑感知调度与 Job 级别抢占结合

当集群资源不足且需要满足网络拓扑约束时,Koordinator 会触发 Job 级别抢占,同时保持拓扑约束。

#### 定义优先级类

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority-training
value: 1000000
preemptionPolicy: PreemptLowerPriority
description: "用于高优先级 AI 训练作业"
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: low-priority-training
value: 1000
preemptionPolicy: PreemptLowerPriority
description: "用于低优先级训练作业"
```

#### 创建低优先级作业占用资源

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: low-priority-job
  namespace: default
spec:
  minMember: 4
---
apiVersion: v1
kind: Pod
metadata:
  name: low-priority-worker-1
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: low-priority-job
spec:
  schedulerName: koord-scheduler
  priorityClassName: low-priority-training
  containers:
  - name: worker
    image: busybox
    command: ["sleep", "365d"]
    resources:
      requests:
        nvidia.com/gpu: 4
        cpu: 24
        memory: 96Gi
      limits:
        nvidia.com/gpu: 4
        cpu: 24
        memory: 96Gi
  restartPolicy: Never
```
(类似地创建 low-priority-worker-2, 3, 4...)

#### 创建高优先级作业触发拓扑感知抢占

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: high-priority-job
  namespace: default
  annotations:
    gang.scheduling.koordinator.sh/network-topology-spec: |
      {
        "gatherStrategy": [
          {
            "layer": "BlockLayer",
            "strategy": "MustGather"
          }
        ]
      }
spec:
  minMember: 2
---
apiVersion: v1
kind: Pod
metadata:
  name: high-priority-worker-1
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: high-priority-job
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "0"
spec:
  schedulerName: koord-scheduler
  priorityClassName: high-priority-training
  preemptionPolicy: PreemptLowerPriority
  containers:
  - name: worker
    image: pytorch/pytorch:latest
    command: ["python", "train.py"]
    resources:
      requests:
        nvidia.com/gpu: 4
        cpu: 24
        memory: 96Gi
      limits:
        nvidia.com/gpu: 4
        cpu: 24
        memory: 96Gi
  restartPolicy: Never
---
apiVersion: v1
kind: Pod
metadata:
  name: high-priority-worker-2
  namespace: default
  labels:
    pod-group.scheduling.sigs.k8s.io: high-priority-job
  annotations:
    gang.scheduling.koordinator.sh/network-topology-index: "1"
spec:
  schedulerName: koord-scheduler
  priorityClassName: high-priority-training
  preemptionPolicy: PreemptLowerPriority
  containers:
  - name: worker
    image: pytorch/pytorch:latest
    command: ["python", "train.py"]
    resources:
      requests:
        nvidia.com/gpu: 4
        cpu: 24
        memory: 96Gi
      limits:
        nvidia.com/gpu: 4
        cpu: 24
        memory: 96Gi
  restartPolicy: Never
```

#### 验证拓扑感知抢占结果

```bash
kubectl get pods -o wide
```

预期输出:

```
NAME                      READY   STATUS        RESTARTS   AGE   IP            NODE     NOMINATED NODE
high-priority-worker-1    0/1     Pending       0          20s   <none>        <none>   node-1
high-priority-worker-2    0/1     Pending       0          20s   <none>        <none>   node-2
low-priority-worker-1     0/1     Terminating   0          5m    10.244.1.30   node-1   <none>
low-priority-worker-2     0/1     Terminating   0          5m    10.244.2.31   node-2   <none>
```

Koordinator 会:
1. 识别高优先级作业需要同一 Block 下的节点
2. 在同一 Block(如 b1)中找到合适的节点(node-1, node-2)
3. 抢占这些节点上的低优先级 Pods
4. 为高优先级 Pods 设置 nominatedNode

检查被抢占的 Pod:

```bash
kubectl get pod low-priority-worker-1 -o yaml
```

```yaml
status:
  conditions:
  - type: DisruptionTarget
    status: "True"
    lastTransitionTime: "2025-10-16T10:30:00Z"
    reason: PreemptionByScheduler
    message: >-
      koord-scheduler: preempting to accommodate higher priority pods with network topology constraints,
      preemptor: default/high-priority-job, triggerpod: default/high-priority-worker-1
```

等待低优先级 Pods 终止后:

```bash
kubectl get pods -o wide
```

```
NAME                      READY   STATUS    RESTARTS   AGE   IP            NODE     NOMINATED NODE
high-priority-worker-1    1/1     Running   0          2m    10.244.1.40   node-1   <none>
high-priority-worker-2    1/1     Running   0          2m    10.244.2.41   node-2   <none>
```

高优先级 Pods 成功调度到同一 Block,满足网络拓扑约束。

## 高级配置

### 拓扑层次命名规范

建议使用清晰的命名约定来标识拓扑层次:

```yaml
# 推荐的层次命名
NodeTopologyLayer       # 节点层
AcceleratorLayer        # 加速器互联层 (如 NVLink)
BlockLayer              # Block 交换机层
SpineLayer              # Spine 交换机层
DatacenterLayer         # 数据中心层
```

### 拓扑策略选择指南

| 策略 | 适用场景 | 行为 |
|------|---------|------|
| `PreferGather` | 一般训练作业,需要较好的网络性能但可容忍一定分散 | 尽可能聚集,但资源不足时允许分散 |
| `MustGather` | 大规模 LLM 训练,对网络带宽有严格要求 | 必须聚集在指定层,否则调度失败 |

### 多 PodGroup 协同调度

对于包含 master 和 worker 的复杂训练作业,使用 GangGroup 语义:

```yaml
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

确保所有相关的 PodGroups 都使用相同的 `gang.scheduling.koordinator.sh/groups` 注解。

## 故障排查

### Pod 一直处于 Pending 状态

**可能原因 1**: 网络拓扑约束过于严格,没有足够的节点满足要求

**解决方案**: 
- 检查集群拓扑配置: `kubectl get clusternetworktopology default -o yaml`
- 放宽拓扑策略,将 `MustGather` 改为 `PreferGather`
- 增加集群节点或调整节点拓扑标签

**可能原因 2**: PodGroup 配置错误

**解决方案**:
```bash
kubectl get podgroup <podgroup-name> -o yaml
```
检查 `status` 字段中的错误信息。

### 拓扑感知调度未生效

**检查步骤**:

1. 验证 Koord-Scheduler 是否启用了网络拓扑插件:

```bash
kubectl -n koordinator-system get cm koord-scheduler-config -o yaml
```

2. 检查节点是否有正确的拓扑标签:

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

1. **合理规划拓扑层次**: 根据实际网络架构设计拓扑层次,通常 2-3 层即可满足大多数场景

2. **为 Pod 分配拓扑索引**: 使用 `gang.scheduling.koordinator.sh/network-topology-index` 注解,有助于建立清晰的通信模式

3. **选择合适的聚集策略**: 
   - 对于延迟敏感的推理服务,使用 `MustGather` + `BlockLayer`
   - 对于大规模训练,使用 `MustGather` + `SpineLayer`
   - 对于一般训练,使用 `PreferGather` 组合

4. **结合优先级使用**: 为关键训练作业设置高优先级,确保在资源竞争时能够获得最佳拓扑位置

5. **监控和优化**: 定期检查作业的网络性能指标,根据实际情况调整拓扑策略

## 参考文档

- [Job 架构设计](/docs/architecture/job)
- [Job Level Preemption](/docs/user-manuals/job-level-preemption)
- [Gang Scheduling](/docs/user-manuals/gang-scheduling)
- [Network Topology Proposal](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20250611-networktopology-aware-scheduling.md)

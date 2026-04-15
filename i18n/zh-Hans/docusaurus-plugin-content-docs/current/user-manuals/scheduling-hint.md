# 调度提示

调度提示（Scheduling Hint）是 koord-scheduler 的内部协议，允许调度相关组件向调度器提供提示，以做出更高效的调度决策。

## 介绍

调度提示为调度组件（如队列系统）提供了一个内部 API，用于向调度器提示优化的调度决策。例如，具有网络拓扑感知能力的队列组件可以建议作业 Pod 的最佳放置节点。该特性设计为可扩展的，当前版本提供了优先节点等机制，后续版本将添加更多能力。

**与 `.status.nominatedNodeName` 的比较：**

调度提示中的 `preferredNodeNames` 字段与 `.status.nominatedNodeName` 类似，都是建议调度节点，但有以下关键区别：
- 使用节点列表而非单个节点，提供备选方案
- 被提示的 Pod 在假设之前不计入节点
- 如果优先节点不满足条件，调度器会正常尝试其他节点

注意：此比较仅适用于调度提示的 `preferredNodeNames` 子字段。其他字段有不同的用途。

## 设置

### 前提条件

- Kubernetes >= 1.18
- Koordinator >= 1.8

### 安装步骤

请确保 Koordinator 的组件已经在你的集群中正确安装，如果还未正确安装，请参考[安装说明](/docs/installation)。

### 配置

调度提示在 koord-scheduler 中默认启用，无需额外配置即可使用。

## 使用调度提示

### 快速上手

1. 创建一个带有调度提示注解的 Pod：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-with-hint
  annotations:
    internal.scheduling.koordinator.sh/scheduling-hint: '{"preferredNodeNames": ["node-1", "node-2"]}'
spec:
  containers:
    - name: nginx
      image: nginx
      resources:
        requests:
          cpu: 500m
          memory: 512Mi
  schedulerName: koord-scheduler
```

2. 调度器会首先尝试将 Pod 调度到 `node-1`。如果失败，会尝试 `node-2`。如果两个优先节点都失败，调度器将继续对所有可用节点进行正常调度。

### API 规范

调度提示通过 Pod 上的 `internal.scheduling.koordinator.sh/scheduling-hint` 注解指定。注解值是一个 JSON 字符串，结构如下：

```go
type SchedulingHint struct {
    // NodeNames 是 Pod 必须调度到的节点名称列表
    NodeNames []string `json:"nodeNames,omitempty"`
    // PreferredNodeNames 是 Pod 应该优先尝试调度的节点名称有序列表
    // 建议使用尽可能少的节点以减少开销
    PreferredNodeNames []string `json:"preferredNodeNames,omitempty"`
    // Extensions 是插件的提示扩展映射
    Extensions map[string]interface{} `json:"extensions,omitempty"`
}
```

#### 字段：`nodeNames`

- 类型：`[]string`
- 描述：Pod **必须**调度到的节点名称列表。这作为硬约束 - 调度器只会考虑这些节点进行调度。

#### 字段：`preferredNodeNames`

- 类型：`[]string`
- 描述：Pod 应该优先尝试调度的节点名称有序列表。调度器会按指定顺序尝试节点。如果所有优先节点都失败，会继续对其他节点进行正常调度。
- 注意：建议使用尽可能少的节点以减少调度开销。

#### 字段：`extensions`

- 类型：`map[string]interface{}`
- 描述：调度插件的提示扩展映射。允许插件定义自定义提示数据。

### 示例

#### 示例：优先节点

使用 `preferredNodeNames` 来建议节点而不强制硬约束：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-preferred-nodes
  annotations:
    internal.scheduling.koordinator.sh/scheduling-hint: |
      {
        "preferredNodeNames": ["high-performance-node-1", "high-performance-node-2"]
      }
spec:
  containers:
    - name: app
      image: my-app:latest
      resources:
        requests:
          cpu: 2
          memory: 4Gi
  schedulerName: koord-scheduler
```

在这个示例中，调度器会：
1. 首先尝试调度到 `high-performance-node-1`
2. 如果失败，尝试 `high-performance-node-2`
3. 如果两个都失败，继续正常调度

#### 示例：必需节点

使用 `nodeNames` 来强制执行节点选择的硬约束：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-required-nodes
  annotations:
    internal.scheduling.koordinator.sh/scheduling-hint: |
      {
        "nodeNames": ["zone-a-node-1", "zone-a-node-2"]
      }
spec:
  containers:
    - name: app
      image: my-app:latest
      resources:
        requests:
          cpu: 1
          memory: 2Gi
  schedulerName: koord-scheduler
```

在这个示例中，调度器**只会**考虑 `zone-a-node-1` 和 `zone-a-node-2` 进行调度。如果两个节点都无法容纳 Pod，调度将失败。

#### 示例：与网络拓扑感知调度结合使用

当使用调度提示与网络拓扑感知调度时，提示会与其他约束一起考虑：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-with-topology-hint
  annotations:
    internal.scheduling.koordinator.sh/scheduling-hint: |
      {
        "preferredNodeNames": ["topology-optimized-node-1", "topology-optimized-node-2"]
      }
spec:
  containers:
    - name: app
      image: my-app:latest
      resources:
        requests:
          cpu: 4
          memory: 8Gi
  schedulerName: koord-scheduler
```

**注意：** 当用户同时启用网络拓扑感知调度，并且 FindOneNode 插件根据最佳计划生成 PreFilterResult 时，优先提示会被忽略。SchedulingHint 插件会考虑原始 PreFilterResult 的交集。当优先节点不在 PreFilterResult 中时，调度器不会破坏现有 PreFilter 的约束，而是中止提示。

#### 示例：作业队列场景

此示例展示队列系统如何使用调度提示来优化 Pod 放置：

```yaml
# 由作业队列系统出队的带有优先节点的 Pod
apiVersion: v1
kind: Pod
metadata:
  name: job-pod-1
  annotations:
    internal.scheduling.koordinator.sh/scheduling-hint: |
      {
        "preferredNodeNames": ["node-with-gpu-1", "node-with-gpu-2"]
      }
  labels:
    queue: high-priority
spec:
  containers:
    - name: ml-training
      image: ml-training:latest
      resources:
        requests:
          cpu: 4
          memory: 16Gi
          nvidia.com/gpu: 1
  schedulerName: koord-scheduler
```

队列系统可以根据其调度决策设置优先节点，允许调度器首先尝试这些节点而无需完整调度的开销。

### 兼容性说明

1. **NominatedNodeName vs 调度提示**：与 `.status.nominatedNodeName` 的比较仅适用于 `preferredNodeNames` 字段。与 `nominatedNodeName` 不同，`preferredNodeNames` 使用节点列表，被提示的 Pod 在假设之前不计入节点。

2. **抢占**：过滤优先级与抢占优先级不同。调度提示目前专注于过滤阶段。

3. **网络拓扑**：当启用网络拓扑感知调度并生成 PreFilterResult 时，优先提示可能会被忽略以遵守拓扑约束。

4. **废弃注解**：旧的注解键 `scheduling.koordinator.sh/scheduling-hint` 已废弃。请使用 `internal.scheduling.koordinator.sh/scheduling-hint` 替代。

## 使用场景

### 1. 网络拓扑感知的队列系统

具有网络拓扑感知能力的队列组件可以建议作业 Pod 的最佳放置节点，实现更高效的调度决策。

### 2. 作业队列系统

队列系统可以在 Pod 出队后提供关于最优节点放置的提示，实现更快的调度决策。

### 3. 多调度器环境

当涉及多个调度器或队列组件时，调度提示可以协调各组件间的 Pod 放置偏好。

### 4. 性能优化

通过提供优先节点，可以减少调度延迟，避免调度器评估所有节点的需要。

## 后续扩展

调度提示设计为可扩展的内部协议。当前版本提供了 `preferredNodeNames` 机制，后续版本将添加更多能力以支持额外的调度优化场景。

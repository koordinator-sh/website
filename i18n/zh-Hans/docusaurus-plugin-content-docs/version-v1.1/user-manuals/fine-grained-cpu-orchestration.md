# 精细化 CPU 编排

koord-scheduler 为了提升 CPU 密集型工作负载的性能提供了精细化 CPU 编排能力。

## Introduction

越来越多的系统利用 CPU 和硬件加速器的组合来支持实时计算和高吞吐的并行计算。 许多应用程序都需要高性能环境，包括电信、科学计算、机器学习、金融服务和数据分析。

但是，Kubernetes 集群中的 Pod 在多种资源维度上都是共享的，存在相互干扰的问题。 CPU 资源的共享几乎是不可避免的，例如 SMT 线程（即逻辑处理器）共享同一个物理核，同一个芯片中的物理核共享同一个 L3 缓存。 资源竞争会减慢这些对 CPU 敏感的工作负载的运行质量，从而导致延迟升高。

为了提高对 CPU 敏感的工作负载的性能，koord-scheduler 提供了一种精细化的 CPU 编排机制。 它增强了 Kubernetes 的 CPU 管理，并支持详细的 NUMA 局部性和 CPU 排除。

有关详细信息，请参阅[设计：细粒度 CPU 编排](/docs/designs/fine-grained-cpu-orchestration)。

## 设置

### 前置条件

- Kubernetes >= 1.18
- Koordinator >= 0.6

### 安装

请确保 Koordinator 组件已正确安装在你的集群中。 如果没有，请参考[安装文档](/docs/installation)。

### 配置全局参数

精细化 CPU 编排能力是默认开启的。用户不需要额外的配置即可使用。

对于高级用户，可以按需修改 Helm Chart 中的配置文件 `koord-scheduler-config` 设置精细化 CPU 编排的参数。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: koord-scheduler-config
  ...
data:
  koord-scheduler-config: |
    apiVersion: kubescheduler.config.k8s.io/v1beta2
    kind: KubeSchedulerConfiguration
    profiles:
      - schedulerName: koord-scheduler
      - pluginConfig:
        - name: NodeNUMAResource
          args:
            apiVersion: kubescheduler.config.k8s.io/v1beta2
            kind: NodeNUMAResourceArgs
            # The default CPU Binding Policy. The default is FullPCPUs
            # If the Pod belongs to LSE/LSR Prod Pods, and if no specific CPU binding policy is set, 
            # the CPU will be allocated according to the default core binding policy.
            defaultCPUBindPolicy: FullPCPUs
            # the scoring strategy
            scoringStrategy:
              # the scoring strategy ('MostAllocated', 'LeastAllocated')
              # - MostAllocated(default): prefer the node with the least available resources
              # - LeastAllocated: prefer the node with the most available resources
              type: MostAllocated
              # the weights of each resource type
              resources:
              - name: cpu
                weight: 1
        plugins:
          # enable the NodeNUMAResource plugin
          preFilter:
            enabled:
              - name: NodeNUMAResource
          filter:
            enabled:
              - name: NodeNUMAResource
              ...
          score:
            enabled:
              - name: NodeNUMAResource
                weight: 1
              ...
          reserve:
            enabled:
              - name: NodeNUMAResource
          preBind:
            enabled:
              - name: NodeNUMAResource
```

koord-descheduler 是通过 Configmap 加载[调度器配置](https://kubernetes.io/docs/reference/scheduling/config/)的。因此需要通过重启调度器才能使用最新的配置。


| 字段 | 说明 | 版本 |
|-------|-------------|---------|
| defaultCPUBindPolicy | 默认的 CPU 绑定策略。 默认值为 FullPCPUs。 如果 Pod 属于 LSE/LSR Prod Pod，并且没有设置具体的 CPU 绑定策略，CPU 则会按照默认的 CPU 绑定策略进行分配。 可选值为 FullPCPUs 和 SpreadByPCPUs | >= v0.6.0 |
| scoringStrategy | 打分策略，可选值为 MostAllocated 和 LeastAllocated | >= v0.6.0 |

### 按节点配置

用户可以单独的为节点设置不同的 CPU 绑定策略和 NUMA Node 选择策略。

#### CPU 绑定策略

Label `node.koordinator.sh/cpu-bind-policy` 约束了调度时如何按照指定的策略分配和绑定CPU。具体的值定义如下：

| 值 | 描述 | 版本 |
|-------|-------------|---------|
| None or empty | 不执行任何策略。 | >= v0.6.0 |
| FullPCPUsOnly | 要求调度器必须分配完整的物理核。等价于 kubelet CPU manager policy option full-pcpus-only=true. | >= v0.6.0 |
| SpreadByPCPUs | 要求调度器必须按照物理核维度均匀的分配逻辑核。 | >= v1.1.0 |

如果节点 Label 上没有 `node.koordinator.sh/cpu-bind-policy`，调度器将会按照 Pod 指定的 CPU 绑定策略或者调度器配置的默认策略分配 CPU。

#### NUMA Node 选择策略

Label `node.koordinator.sh/numa-allocate-strategy` 表示调度时应该如何选择 NUMA Node。具体的值定义如下：

| 值 | 描述 | 版本 |
|-------|-------------|---------|
| MostAllocated | MostAllocated 表示选择资源剩余最少的 NUMA Node。| >= v.0.6.0 |
| LeastAllocated | LeastAllocated 表示选择资源剩余最多的NUMA Node。| >= v.0.6.0 |

如果 `node.koordinator.sh/numa-allocate-strategy` 和 `kubelet.koordinator.sh/cpu-manager-policy` 都设置了, 优先使用 `node.koordinator.sh/numa-allocate-strategy`。


## 使用精细化 CPU 编排

1. 按照下面的 YAM了 创建 Deployment `nginx`。

> 使用精细化 CPU 编排时，Pod 需要在 Label 中指定具体的 [QoSClass](/docs/architecture/qos#definition) 并指定具体的绑定策略。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-lsr
  labels:
    app: nginx-lsr
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx-lsr
  template:
    metadata:
      name: nginx-lsr
      labels:
        app: nginx-lsr
        koordinator.sh/qosClass: LSR # set the QoS class as LSR, the binding policy is FullPCPUs by default
        # in v0.5, binding policy should be specified.
        # e.g. to set binding policy as FullPCPUs (prefer allocating full physical CPUs of the same core):
        #annotations:
          #scheduling.koordinator.sh/resource-spec: '{"preferredCPUBindPolicy": "FullPCPUs"}'
    spec:
      schedulerName: koord-scheduler # use the koord-scheduler
      containers:
      - name: nginx
        image: nginx
        resources:
          limits:
            cpu: '2'
          requests:
            cpu: '2'
      priorityClassName: koord-prod
```

2. 创建 `nginx` deployment 并检查调度结果。

```bash
$ kubectl create -f nginx-deployment.yaml
deployment/nginx-lsr created
$ kubectl get pods -o wide | grep nginx
nginx-lsr-59cf487d4b-jwwjv   1/1     Running   0       21s     172.20.101.35    node-0   <none>         <none>
nginx-lsr-59cf487d4b-4l7r4   1/1     Running   0       21s     172.20.101.79    node-1   <none>         <none>
nginx-lsr-59cf487d4b-nrb7f   1/1     Running   0       21s     172.20.106.119   node-2   <none>         <none>
```

3. 检查 Pod 的 CPU 分配结果 `scheduling.koordinator.sh/resource-status`.

```bash
$ kubectl get pod nginx-lsr-59cf487d4b-jwwjv -o jsonpath='{.metadata.annotations.scheduling\.koordinator\.sh/resource-status}'
{"cpuset":"2,54"}
```

我们可以看到 Pod `nginx-lsr-59cf487d4b-jwwjv` 绑定了 2 个逻辑核，对应的逻辑核 ID 分别是 2 和 54，这两个逻辑核属于同一个物理核。

4. 更改 `nginx` deployment 的 CPU 绑定策略。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-lsr
  labels:
    app: nginx-lsr
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx-lsr
  template:
    metadata:
      name: nginx-lsr
      labels:
        app: nginx-lsr
        koordinator.sh/qosClass: LSR # set the QoS class as LSR
      annotations:
        # set binding policy as SpreadByPCPUs (prefer allocating physical CPUs of different cores)
        scheduling.koordinator.sh/resource-spec: '{"preferredCPUBindPolicy": "SpreadByPCPUs"}'
    spec:
      schedulerName: koord-scheduler # use the koord-scheduler
      containers:
      - name: nginx
        image: nginx
        resources:
          limits:
            cpu: '2'
          requests:
            cpu: '2'
      priorityClassName: koord-prod
```

5. 更新 `nginx` deployment 并检查调度结果。

```bash
$ kubectl apply -f nginx-deployment.yaml
deployment/nginx-lsr created
$ kubectl get pods -o wide | grep nginx
nginx-lsr-7fcbcf89b4-rkrgg   1/1     Running   0       49s     172.20.101.35    node-0   <none>         <none>
nginx-lsr-7fcbcf89b4-ndbks   1/1     Running   0       49s     172.20.101.79    node-1   <none>         <none>
nginx-lsr-7fcbcf89b4-9v8b8   1/1     Running   0       49s     172.20.106.119   node-2   <none>         <none>
```

6. 检查 Pod 最新的 CPU 分配结果 `scheduling.koordinator.sh/resource-status`。

```bash
$ kubectl get pod nginx-lsr-7fcbcf89b4-rkrgg -o jsonpath='{.metadata.annotations.scheduling\.koordinator\.sh/resource-status}'
{"cpuset":"2-3"}
```

现在我们可以看到 Pod `nginx-lsr-59cf487d4b-jwwjv` 绑定了两个逻辑核，对应的 ID 分别是 2,3, 属于两个不同的物理核。

7. (可选) 高级配置.

```yaml
  labels:
    # koordinator QoS class of the pod. (use 'LSR' or 'LSE' for binding CPUs)
    koordinator.sh/qosClass: LSR
  annotations:
    # `resource-spec` indicates the specification of resource scheduling, here we need to set `preferredCPUBindPolicy`.
    # `preferredCPUBindPolicy` indicating the CPU binding policy of the pod ('None', 'FullPCPUs', 'SpreadByPCPUs')
    # - None: perform no exclusive policy
    # - FullPCPUs(default): a bin-packing binding policy, prefer allocating full physical cores (SMT siblings)
    # - SpreadByPCPUs: a spread binding policy, prefer allocating logical cores (SMT threads) evenly across physical cores (SMT siblings)
    scheduling.koordinator.sh/resource-spec: '{"preferredCPUBindPolicy": "FullPCPUs"}'
```

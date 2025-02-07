# 增强的 NodeResourceFit 插件

<!-- toc -->
- [概括](#概括)
- [动机](#动机)
- [设计考虑](#设计考虑)
  - [目标](#目标)
  - [非目标](#非目标)
- [提议](#提议)
- [设计细节](#设计细节)
  - [NodeResourcesFitPlus](#noderesourcesfitplus)
  - [ScarceResourceAvoidance](#scarceresourceavoidance)
- [例子](#例子)
  - [调度器配置](#调度器配置)
    - [GPU](#gpu)
    - [CPU](#cpu)
  - [适配原生插件](#适配原生插件)
    - [MostAllocated](#mostallocated)
    - [LeastAllocated](#leastallocated)  
  
<!-- /toc -->


## 概括

原生k8s的NodeResourcesFit插件只能对所有资源采用一类策略，比如MostRequestedPriority、LeastRequestedPriority。但在工业实践中，这种设计并不适用于某些场景。例如：在AI场景中，申请GPU的​​业务优先选择占用整个GPU机器，以防止GPU碎片；申请CPU和MEM的业务优先分散到非GPU机器上，防止GPU机器上CPU和MEM的过度消耗，导致真正申请GPU的​​任务。由于非 GPU 资源不足而待处理
。因此，扩展了两个插件来解决这个常见问题。

## 动机
case:
- GPU任务优先占满GPU整机
- CPU&MEM任务优先打散到CPU机器

## 设计考虑

- 该方案更加通用，不限于AI集群或CPU集群，也不限于普通CPU资源或扩展GPU资源。

- 可以针对不同的集群类型配置不同的资源策略，并以权重的形式进行优先级区分

- 易于扩展

### 目标

- 不同类型的资源可以配置不同的策略，以权重的形式对其进行优先级区分

- 防止未申请稀缺资源的Pod被调度到资源稀缺的节点。

### 非目标

- None.

## 提议

扩展两个插件即可满足上述需求

- NodeResourcesFitPlus
- ScarceResourceAvoidance

## 设计细节

### NodeResourcesFitPlus
config：
```
resources: 
  nvidia.com/gpu:
    type: MostAllocated
    weight: 2
  cpu:
    type: LeastAllocated
    weight: 1
  memory:
    type: LeastAllocated
    weight: 1
```
策略描述：

![image](/img/node-resource-fit-plus-scoring-cn.png)

node打分公式:
```
finalScoreNode = [(weight1 * resource1) + (weight2 * resource2) + … + (weightN* resourceN)] /(weight1+weight2+ … +weightN)
```

### ScarceResourceAvoidance
config：
```
resources: 
- nvidia.com/gpu 
```
策略描述：
- 获取pod申请的资源类型和节点可分配的资源类型列表
- node多余资源类型 = node总资源类型-pod申请资源类型
- node多余资源类型中核心资源类型个数=node多余资源类型与核心资源类型列表取交集
- node多余资源类型中核心资源类型个数越多，分数越低

node打分公式:
```
finalScoreNode = (allocatablesResourcesNum - requestsResourcesNum) * framework.MaxNodeScore / allocatablesResourcesNum
```

## 例子
### 调度器配置

```

profiles:
- pluginConfig:
  - args:
      apiVersion: kubescheduler.config.k8s.io/v1beta2
      kind: ResourceTypesArgs
      resources: 
        nvidia.com/gpu:
          type: MostAllocated
          weight: 2
        cpu:
          type: LeastAllocated
          weight: 1
        memory:
          type: LeastAllocated
          weight: 1
    name: NodeResourcesFitPlus
  - args:
      resources: 
      - nvidia.com/gpu
    name: ScarceResourceAvoidance
  plugins:
    score:
      enabled:
      - name: NodeResourcesFitPlus
        weight: 2
      - name: ScarceResourceAvoidance
        weight: 2
      disabled:
      - name: "*"
  schedulerName: koord-scheduler
```

#### gpu

deployment资源申请

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-scheduler1
spec:
  replicas: 1
  selector:
    matchLabels:
      app: test-scheduler1
  template:
    metadata:
      labels:
        app: test-scheduler1
    spec:
      schedulerName: koord-scheduler
      containers:
        - image: dockerpull.com/nginx
          imagePullPolicy: IfNotPresent
          name: nginx
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: "100"
              memory: "100"
              nvidia.com/gpu: 2
            limits:
              cpu: "100"
              memory: "100"
              nvidia.com/gpu: 2
```

节点分配率信息
```
node1: cpu 58%, memory 21%, nvidia.com/gpu 6 (共8卡)

node2: cpu 22%, memory 5%, nvidia.com/gpu 0 (共8卡)
```

结果: 优先GPU机器并且聚拢GPU资源

日志查看 => ```Top10 scores for pod```
```
| # | Pod | Node | Score | NodeResourcesFitPlus | ScarceResourceAvoidance |
| 0 | test-scheduler1-xxx | node1 | 358 | 158 | 200 |
| 1 | test-scheduler1-xxx | node2 | 296 | 96 | 200 |
```

#### cpu

deployment资源申请

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-scheduler1
spec:
  replicas: 1
  selector:
    matchLabels:
      app: test-scheduler1
  template:
    metadata:
      labels:
        app: test-scheduler1
    spec:
      schedulerName: koord-scheduler
      containers:
        - image: dockerpull.com/nginx
          imagePullPolicy: IfNotPresent
          name: nginx
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: "100"
              memory: "100"
            limits:
              cpu: "100"
              memory: "100"
```

节点分配率信息
```
node1: cpu 22%, memory 10%, nvidia.com/gpu 6 (共8卡)
node2: cpu 40%, memory 50%
node3: cpu 30%, memory 20%
```

结果: 优先CPU机器并且打散CPU，MEM资源

日志查看 => ```Top10 scores for pod```
```
| # | Pod | Node | Score | NodeResourcesFitPlus | ScarceResourceAvoidance |
| 0 | test-scheduler1-xxx | node1 | 310 | 144 | 166 |
| 1 | test-scheduler1-xxx | node2 | 262 | 62 | 200 |
| 2 | test-scheduler1-xxx | node3 | 326 | 126 | 200 |
```

### 适配原生插件

#### mostAllocated
原生配置
```
apiVersion: v1
kind: ConfigMap
metadata:
  name: scheduler-config
  namespace: kube-system
data:
  scheduler-config.yaml: |
    apiVersion: kubescheduler.config.k8s.io/v1beta2
    kind: KubeSchedulerConfiguration
    profiles:
    - schedulerName: koord-scheduler
     pluginConfig:
       - args:
           scoringStrategy:
             resources:
             - name: cpu
               weight: 2
             - name: memory
               weight: 1
             type: MostAllocated
         name: NodeResourcesFit
      plugins:
        score:
          enabled:
          - name: "NodeResourcesFit"
```

plus配置
```
apiVersion: v1
kind: ConfigMap
metadata:
  name: scheduler-config
  namespace: kube-system
data:
  scheduler-config.yaml: |
    apiVersion: kubescheduler.config.k8s.io/v1beta2
    kind: KubeSchedulerConfiguration
    profiles:
    - schedulerName: koord-scheduler
     pluginConfig:
       - args:
          apiVersion: kubescheduler.config.k8s.io/v1beta2
          kind: ResourceTypesArgs
          resources: 
            cpu:
              type: MostAllocated
              weight: 2
            memory:
              type: MostAllocated
              weight: 1
         name: NodeResourcesFitPlus
      plugins:
        score:
          enabled:
          - name: "NodeResourcesFitPlus"
```
#### leastAllocated
原生配置
```
apiVersion: v1
kind: ConfigMap
metadata:
  name: scheduler-config
  namespace: kube-system
data:
  scheduler-config.yaml: |
    apiVersion: kubescheduler.config.k8s.io/v1beta2
    kind: KubeSchedulerConfiguration
    profiles:
    - schedulerName: koord-scheduler
     pluginConfig:
       - args:
           scoringStrategy:
             resources:
             - name: cpu
               weight: 2
             - name: memory
               weight: 1
             type: LeastAllocated
         name: NodeResourcesFit
      plugins:
        score:
          enabled:
          - name: "NodeResourcesFit"
```

plus配置
```
apiVersion: v1
kind: ConfigMap
metadata:
  name: scheduler-config
  namespace: kube-system
data:
  scheduler-config.yaml: |
    apiVersion: kubescheduler.config.k8s.io/v1beta2
    kind: KubeSchedulerConfiguration
    profiles:
    - schedulerName: koord-scheduler
     pluginConfig:
       - args:
          apiVersion: kubescheduler.config.k8s.io/v1beta2
          kind: ResourceTypesArgs
          resources: 
            cpu:
              type: LeastAllocated
              weight: 2
            memory:
              type: LeastAllocated
              weight: 1
         name: NodeResourcesFitPlus
      plugins:
        score:
          enabled:
          - name: "NodeResourcesFitPlus"
```
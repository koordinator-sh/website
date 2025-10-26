# 增强的 NodeResourceFit

## 介绍

原生的 Kubernetes NodeResourcesFit 插件只能为所有资源采用一种策略，例如 MostRequestedPriority 和 LeastRequestedPriority。然而，在实际工业应用中，这种设计并不适用于某些场景。例如：

1. 在 AI 场景中，申请 GPU 的 Pod 优先占用整台 GPU 机器，以防止 GPU 碎片化。
2. 申请 CPU 和内存的 Pod 会被优先分配到非 GPU 机器上，以防止 GPU 机器上的 CPU 和内存被过度消耗，从而导致需要 GPU 的实际任务因非 GPU 资源不足而待处理。

因此，希望这两种策略都能提供以满足这一业务需求。Koordinator 提供 NodeResourcesFitPlus 和 ScarceResourceAvoidance 插件来支持这两个场景的需求，从而：

- 不同类型的资源可以配置不同的策略，并通过权重的形式进行优先级排序。
- 防止未申请稀缺资源的 Pod 被调度到具有稀缺资源的节点上。

## 插件逻辑介绍

### NodeResourcesFitPlus

NodeResourcesFitPlus 插件的调度器参数可以配置如下：

```yaml
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
这两种策略的评分计算方法和效果如下：
![image](/img/node-resource-fit-plus-scoring-en.png)

最终的节点评分可以按如下方式计算：
```
finalScoreNode = [(weight1 * resource1) + (weight2 * resource2) + … + (weightN* resourceN)] /(weight1+weight2+ … +weightN)
```

### ScarceResourceAvoidance
ScarceResourceAvoidance 插件的调度器参数可以按如下方式配置：
```yaml
resources: 
- nvidia.com/gpu
- scarceResource1
- scarceResource2
```
从配置中获取稀缺资源类型后，插件将按如下方式对节点和 Pod 的匹配性进行评分：

1. 获取 Pod 请求的资源类型集合以及节点可以分配的资源类型集合。
2. ResourceTypesUnused = ResourceTypesTotal - ResourceTypesRequested
3. ScarceResourceTypesUnused = intersection(ResourceTypesUnused, ScarceResourceTypes)

未使用的稀缺资源类型越多，评分越低。

## 例子
### SchedulerConfiguration 样例
我们可以按如下方式配置 schedulerConfiguration：
```yaml
profiles:
- pluginConfig:
  - args:
      apiVersion: kubescheduler.config.k8s.io/v1
      kind: NodeResourcesFitPlusArgs
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
      apiVersion: kubescheduler.config.k8s.io/v1
      kind: ScarceResourceAvoidanceArgs
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

### GPU 应用和节点打分
```yaml
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

节点分配率信息：
```
node1: cpu 58%, memory 21%, nvidia.com/gpu 6 (total 8)

node2: cpu 22%, memory 5%, nvidia.com/gpu 0 (total 8)
```

结果：优先选择 GPU 机器并 Binpack GPU 资源

查看打分 => ```Top10 scores for pod```
```
| # | Pod | Node | Score | NodeResourcesFitPlus | ScarceResourceAvoidance |
| 0 | test-scheduler1-xxx | node1 | 358 | 158 | 200 |
| 1 | test-scheduler1-xxx | node2 | 296 | 96 | 200 |
```

### CPU 应用和节点打分
```yaml
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

节点分配率信息：
```
node1: cpu 22%, memory 10%, nvidia.com/gpu 6 (total 8)
node2: cpu 40%, memory 50%
node3: cpu 30%, memory 20%
```

结果：优先选择 GPU 机器并 Binpack GPU 资源

查看打分 => ```Top10 scores for pod```
```
| # | Pod | Node | Score | NodeResourcesFitPlus | ScarceResourceAvoidance |
| 0 | test-scheduler1-xxx | node1 | 310 | 144 | 166 |
| 1 | test-scheduler1-xxx | node2 | 262 | 62 | 200 |
| 2 | test-scheduler1-xxx | node3 | 326 | 126 | 200 |
```

## 与原生 NodeResourceFit 兼容

### MostAllocated
原生配置：
```yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: scheduler-config
  namespace: kube-system
data:
  scheduler-config.yaml: |
    apiVersion: kubescheduler.config.k8s.io/v1
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

NodeResourcesFitPlus 配置:
```yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: scheduler-config
  namespace: kube-system
data:
  scheduler-config.yaml: |
    apiVersion: kubescheduler.config.k8s.io/v1
    kind: KubeSchedulerConfiguration
    profiles:
    - schedulerName: koord-scheduler
     pluginConfig:
       - args:
          apiVersion: kubescheduler.config.k8s.io/v1
          kind: NodeResourcesFitPlusArgs
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
### LeastAllocated
原生配置:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: scheduler-config
  namespace: kube-system
data:
  scheduler-config.yaml: |
    apiVersion: kubescheduler.config.k8s.io/v1
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
NodeResourcesFitPlus 配置:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: scheduler-config
  namespace: kube-system
data:
  scheduler-config.yaml: |
    apiVersion: kubescheduler.config.k8s.io/v1
    kind: KubeSchedulerConfiguration
    profiles:
    - schedulerName: koord-scheduler
     pluginConfig:
       - args:
          apiVersion: kubescheduler.config.k8s.io/v1
          kind: NodeResourcesFitPlus
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
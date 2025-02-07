# Enhanced NodeResourceFit Plugin

<!-- toc -->
- [Summary](#Summary)
- [Motivation](#Motivation)
- [Design Consideration](#DesignConsideration)
  - [Goals](#Goals)
  - [Non-Goals](#NonGoals)
- [Proposal](#Proposal)
- [Design Details](#DesignDetails)
  - [NodeResourcesFitPlus](#NodeResourcesFitPlus)
  - [ScarceResourceAvoidance](#ScarceResourceAvoidance)
- [Example](#Example)
  - [Scheduler Configuration](#SchedulerConfiguration)
    - [GPU](#GPU)
    - [CPU](#CPU)
  - [Adapt to native plugins](#AdaptToNativePlugins)
    - [MostAllocated](#Mostallocated)
    - [LeastAllocated](#Leastallocated)
<!-- /toc -->


## Summary

The NodeResourcesFit plug-in of native k8s can only adopt a type of strategy for all resources, such as MostRequestedPriority and LeastRequestedPriority. However, in industrial practice, this design does not apply to some scenarios. For example: In AI scenarios, businesses that apply for GPUs prefer to occupy the entire GPU machine first to prevent GPU fragmentation; businesses that apply for CPU & MEM are prioritized and dispersed to non-GPU machines to prevent excessive consumption of CPU & MEM on GPU machines, resulting in real tasks of applying for GPUs. Pending due to insufficient non-GPU resources
. It is therefore hoped that both strategies can be extended to address this business need.

## Motivation
case:
- GPU tasks take priority over the entire GPU
- CPU&MEM tasks are distributed to the CPU machine first

## DesignConsideration

- The solution is more versatile, not limited to AI clusters or CPU clusters, and not limited to common CPU resources or extended GPU resources.

- Different resource policies can be configured for different cluster types and prioritized in the form of weights.

- Easy to expand

### Goals

- Different types of resources can be configured with different strategies to prioritize them in the form of weights

- Prevent pods that have not applied for scarce resources from being scheduled to nodes with scarce resources.

### NonGoals

- None.

## Proposal

Extend two plug-ins to meet the above needs

- NodeResourcesFitPlus
- ScarceResourceAvoidance

## DesignDetails

### NodeResourcesFitPlus
config:
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
config description:

![image](/img/node-resource-fit-plus-scoring-en.png)

node score:
```
finalScoreNode = [(weight1 * resource1) + (weight2 * resource2) + … + (weightN* resourceN)] /(weight1+weight2+ … +weightN)
```

### ScarceResourceAvoidance
config:
```
resources: 
- nvidia.com/gpu 
```
config description:
- Obtain the resource type requested by the pod and the list of resource types that the node can allocate
- Node redundant resource type = node total resource type - pod application resource type
- The number of core resource types in the node redundant resource type = the intersection of the node redundant resource type and the core resource type list
- The more core resource types there are in the redundant resource types of node, the lower the score will be.

node score:
```
finalScoreNode = (allocatablesResourcesNum - requestsResourcesNum) * framework.MaxNodeScore / allocatablesResourcesNum
```

## Example
### SchedulerConfiguration

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

#### GPU

deployment Resource application

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

Node allocation rate information
```
node1: cpu 58%, memory 21%, nvidia.com/gpu 6 (total 8)

node2: cpu 22%, memory 5%, nvidia.com/gpu 0 (total 8)
```

Result: Prioritize GPU machines and pool GPU resources

Log view => ```Top10 scores for pod```
```
| # | Pod | Node | Score | NodeResourcesFitPlus | ScarceResourceAvoidance |
| 0 | test-scheduler1-xxx | node1 | 358 | 158 | 200 |
| 1 | test-scheduler1-xxx | node2 | 296 | 96 | 200 |
```

#### CPU

deployment Resource application

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

Node allocation rate information
```
node1: cpu 22%, memory 10%, nvidia.com/gpu 6 (total 8)
node2: cpu 40%, memory 50%
node3: cpu 30%, memory 20%
```

Result: Prioritize CPU machines and disperse CPU and MEM resources

Log view => ```Top10 scores for pod```
```
| # | Pod | Node | Score | NodeResourcesFitPlus | ScarceResourceAvoidance |
| 0 | test-scheduler1-xxx | node1 | 310 | 144 | 166 |
| 1 | test-scheduler1-xxx | node2 | 262 | 62 | 200 |
| 2 | test-scheduler1-xxx | node3 | 326 | 126 | 200 |
```

### AdaptToNativePlugins

#### MostAllocated
native configuration
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

plus configuration
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
#### LeastAllocated
native configuration
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

plus configuration
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
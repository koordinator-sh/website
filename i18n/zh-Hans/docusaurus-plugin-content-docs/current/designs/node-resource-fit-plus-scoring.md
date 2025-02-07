# 增强的 NodeResourceFit 插件

<!-- toc -->
- [概括](#概括)
- [动机](#动机)
- [设计考虑](#设计考虑)
  - [目标](#目标)
  - [非目标](#非目标)
- [提议](#提议)
- [用户故事](#用户故事)
  - [故事1](#故事1)
  - [故事1](#故事2)
- [设计细节](#设计细节)
  - [NodeResourcesFitPlus](#noderesourcesfitplus)
  - [ScarceResourceAvoidance](#scarceresourceavoidance)
  - [测试计划](#测试计划)
  - [毕业标准](#毕业标准)
    - [Alpha](#alpha)
    - [Beta](#beta)
- [补充解释](#补充解释)
- [实施历史](#实施历史)
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

## 用户故事

### 故事1
- 用户希望不同的资源类型可以采用不同的资源策略,例如AI场景下,希望申请了GPU资源的pod尽量占满一台机器,而只申请CPU资源的pod经历均衡分散到不同的机器上.

### 故事2
- 用户希望没有申请GPU资源的pod,尽量不要调度到有GPU资源的机器上,防止当真正需要GPU资源的pod在发布时因为GPU的机器上的CPU不足而产生pending

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

### 测试计划

将添加全面的单元测试，以确保每个功能按预期工作。

### 毕业标准

#### Alpha

- 实现 NodeResourcesFitPlus 和 ScarceResourceAvoidance 调度程序插件
- 提供 NodeResourcesFitPlus 和 ScarceResourceAvoidance 的参考实现
- 单元测试和集成测试

#### Beta

- 添加E2E测试.
- 提供测试级文档.

## 补充解释

- 为什么没有采用节点亲和性调度策略来实类似ScarceResourceAvoidance的能力？
  - 节点亲和性策略需要提前为节点打标签,同时需要负载发版时增加亲和性配置,在资源类型复杂的真实集群里,这样的维护成本很高,也容易造成紊乱,所以遵守最小化设计原则,采用ScarceResourceAvoidance策略将会在此场景下事半功倍.

- 为什么没有采用多调度器配置文件的形式来让不同类型的资源走不同的策略？
  - 依旧是维护和使用成本的考量,遵守最小化设计原则,收敛到统一策略中,可以避免交叉紊乱带来的稳定性影响,采用NodeResourcesFitPlus策略将会在此场景下事半功倍.

## 实施历史

- 2024-12-24: KEP created
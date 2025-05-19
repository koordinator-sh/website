# PodGroup's Network topology aware scheduling

## Summary

在大语言模型训练场景中，模型并行对用于交换数据的网络吞吐量有着极高的要求，这使得网络成为了关键瓶颈。
业务方要求工作负载能够被调度至具有最高吞吐量和最低延时的最佳性能域，以便为训练加速网络数据的交换。
以Spine-leaf架构为例，需要把PodGroup的pod调度到同一个leaf下， 从而满足Pod间低延迟的数据交换的需求。
- 调度器需要感知k8s集群中的node网络拓扑结构。
- 调度器需要把PodGroup调度一组node上， 满足最佳性能域。

本文提出一种方案， 实现：
- 基于Spine-leaf架构的网络拓扑亲和性调度的功能。
- 支持抢占场景下的网络拓扑亲和性调度。


## Motivation

### 1. 网络架构
下图为典型的Spine-leaf网络架构。
- Node间通信，经过的交换机跳数越少，通信延迟越低。
- Node间通信，经过的交换机跳数越多，通信延迟越高， 核心交换机拥塞的可能性越大。
  ![image](/img/networktopo-1.png)

### 2. 大模型训练多种混合并行策略

![image](/img/networktopo-2-dp-and-pp.png)
上图为一个PytorchJob训练任务：
- 共创建 12个Pod （PP*DP = 4*3  ）。
- 每个Pod申请了node上全部8张GPU卡。

通信特性：
- Pod内的8卡通信通过nvlink进行通信。 无需调度器关注。
- Pod间通信需要RDMA高速网络进行通信， 调度器需要把DP*PP个pod调度到一组高性能通信域下。

### 3. 网络拓扑亲和性调度预期结果
PodGroup按照以下策略进行调度：
- 如果空闲节点满足策略1， 则调度完成，绑定pod到node。
- 如果不满足策略1， 则进行尝试策略2、策略3、等。以此类推。

|     | 调度策略说明                         | Demo                                                                                              |
|-----|--------------------------------|---------------------------------------------------------------------------------------------------|
| 策略1 | 一个任务所有的节点在同一个unit下。            | case1： 所有pod都在unit0下。                                                                             |
| 策略2 | 同一个DP组内的节点在同一个unit下，不同DP组跨unit | case2：pod-2-0, pod-2-1 在unit0。   pod-2-2, pod-2-3 在unit1                                          |
| 策略3 | 一个任务所有的节点在同一个leaf下             | case3：4个pod都位于同一个leaf0下。                                                                          |
| 策略4 | 同一个DP组内的节点在同一个unit下，不同DP组跨leaf | case4：  <br/>pod-4-0,pod-4-1,pod-4-2位于leaf0下的unit1。  <br/> pod-4-3,pod-4-4,pod-4-5位于leaf1下的unit3。 |
| 策略5 | 同一个DP组内的节点在同一个leaf下，不同DP组跨leaf | case5：  <br/>pod-5-0,pod-5-1,pod-5-2位于leaf0下 。   <br/>pod-5-3,pod-5-4,pod-5-5位于leaf1下                 |
| 策略6 | 一个任务所有的节点在同一个spine下            | case6: 所有pod都放在一个spine0下                                                                          |


调度策略Demo：
![image](/img/networktopo-3-strategy-demo.png)




### Goals
调度器需要从N个空闲的Node中， 根据网络拓扑算法选择最优性能域的M（M = PodGroupMinNumber）个Node， 并把PodGroup中的Pod按照一定顺序调度上去。

- 当N>M，即资源充足时，根据调度算法， 为PodGroup匹配最优的调度策略即可。
- 当N<M，即资源不足时，如果可以抢占，则需要抢占M-N个Node进行调度。 


## Proposal

### User stories
集群中所有Node网络拓扑架构如下图，Node处于空闲状态，无任务申请。

![image](/img/networktopo-4-user-story.png)
|         | 空闲节点                   | 创建任务                                                                 | 调度结果                                                                                                                                                                                                                    |
|---------|------------------------|----------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Story 1 | Node0~Node11， 共12个Node | podGroup.minNumber=4 (DP=2, PP=2)  <br/>priority_class = best-effort | pod-1-0:node0,  <br/>pod-1-1:node1,  <br/>pod-1-2:node2,  <br/>pod-1-3:node3                                                                                                                                            |
| Story 2 | Node4~Node11， 共8个Node。 | podGroup.minNumber=4( DP=2, PP=2)  <br/>priority_class = best-effort | pod-2-0:node4,  <br/>pod-2-1:node5,  <br/>pod-2-2:node6,  <br/>pod-2-3:node7                                                                                                                                            |
| Story 3 | Node8~Node11， 共4个Node。 | podGroup.minNumber=8( Dp=2, PP=4)  <br/>priority_class = Guarantee   | pod-2-0, pod-2-1, pod-2-2, pod-2-3 被驱逐。  <br/><br/>调度结果：<br/>pod-3-0:node4,<br/>pod-3-1:node5,<br/>pod-3-2:node6,  <br/>pod-3-3:node7,  <br/>pod-3-4:node8,  <br/>pod-3-5:node9,  <br/>pod-3-6:node10,  <br/>pod-3-7:node11 |


### Implementation Details

#### Design Strategy
我们需要实现一个网络拓扑（networktopologyaware）插件：实现2个功能
- 构建最优拓扑：根据可用Node，寻找最佳拓扑Node
- 分配Node：给PodGroup中Pod分配最优的Node。


##### 方案1：PreScore+Score
**方案**
- PreScore阶段：当PodGroup的首个Pod调度时，计算整个PodGroup的最优拓扑结构。
- Score阶段：为每个PodGroup中的Pod选择最佳的Node，并打分BestScore。
  ![image](/img/networktopo-5-framework.png)

**问题**  
在抢占场景下，此方案会失效（N=空闲Node， M = PodGroupMinNumber）
- 抢占前：
    - N个空闲Node必须先被分配给N个Pod，剩余的M-N个Pod在调度时感知资源不足才会发生抢占。
    - 拓扑算法只能计算前N个Node的最优分配方式， 剩余的M-N个Node无法参与算法的计算。无法做到网络拓扑最优。
- 抢占后，
    - 调度器会按照Pod.spec.nominated字段把pod直接调度对应的Node上，无法参与网络拓扑计算。

实现网络拓扑抢占插件无法解决问题：
- 抢与占不是原子操作：多个pod同时抢占同一个node时， 哪个pod最终获得node是未知的。
- 抢占完成后， 所有pod处于Permit阶段，网络拓扑算法已经无法影响调度结果。除非Reject整个PodGroup所有pod，重新调度。   而重新调度时，资源可能被其他pod占用。

**核心问题**

在抢占的场景下， 满足网络拓扑最优。
- 实现组抢占：发现资源不满足PodGroup时， 抢占所需所有资源。不是一个一个pod抢占。
- 资源预留：抢占完成后，把node资源预留给PodGroup所有pod。一次调度可完成。



##### 方案2：基于AfterPreFilter方案
即本文方案。


#### 架构设计
网络拓扑（networktopologyaware）插件实现拓展点：
- AfterPreFilter
- Filter
- PostFilter


##### AfterPreFilter
AfterPreFilter扩展点负责构建网络拓扑。
```
pg可用资源 = 空闲Node + podGroup所有pod.nominated  
资源满足pg = len(pg可用资源） >  podGroup.spec.minNumber
```
- 当资源充足pg时：
  - 构建网络拓扑，给每个Pod寻找最佳Node， 并给修改pod.nominated=bestNode。
- 当资源不足pg时， 通知Filter阶段， 返回FitError。 PostFilter执行抢占逻辑。
  - 抢占完成后意味着有了足够的资源，执行网络拓扑构建逻辑。
  - 预留Node： pod.nominated=bestNode。

![image](/img/networktopo-6-afterprefilter.png)

##### Filter
直接返回资源不足，触发抢占。


##### PostFilter
> 抢占的核心逻辑是： 抢占完成后， 如何预留下来资源。 否则可能被其他PodGroup占用。

判断是否可抢占：存在优先级更低的pod，抢占完后资源可满足PodGroup使用。
- 不可抢占：清空PodGroup所有pod的nominated字段。
- 可抢占：
    - 抢占：一次性抢占PodGroup所需的资源。并驱逐victim pod
    - 重新计算网络拓扑：空闲node  +  抢占的node，
    - 给podGroup所有的pod.nominated字段赋值bestNode

![image](/img/networktopo-7-postfilter.png)


#### 详细设计

##### 1. 网络拓扑的管理
   通过节点标签描述网络拓扑，在集群内生成网络拓扑的configmap。

##### 2. 网络拓扑的核心结构定义
- HyperNode：是一个性能域，它由一组节点或子性能域构成。在一个超节点内，网络带宽和时延是相同的。这个自定义资源（CRD）用于描述 Kubernetes 集群中的网络拓扑结构。
- Tier：是区分不同性能域的一种方式。在同一层级内，带宽和时延是相同的。层级的数值越小，带宽就越高。例如，计算网络和存储网络可以处于不同的层级，又或者在计算网络中，存在若干层级（spine、leaf）交换机，每一级都可被认定为一个层级。
  例如网络架构1（spine-leaf），假设连接8个节点，如下图所示（单平面、多平面都能支持）：
  ![image](/img/networktopo-8-spine-leaf.png)

ConfigMap的格式如下：
```
[
 {
    "layer": 2,
    "name": "s2",
    "children": [
      "s0",
      "s1"
    ]
  },
  {
    "layer": 1,
    "name": "s0",
    "parents": [
      "s2"
    ],
    "children": [
      "node0",
      "node1"
    ]
  },
  {
    "layer": 1,
    "name": "s1",
    "parents": [
      "s2"
    ],
    "children": [
      "node2",
      "node3"
    ]
  }
]

```


##### 3. 网络拓扑的创建和更新
网络拓扑的发现和探测工具：
![image](/img/networktopo-9-topo-gen.png)


##### 4. 网络拓扑算法
```

// FindBestNode find N best node . （N = minNumberWorker）
// 1.all node in the same tor
// 2.all pipeline parallel node in the same tor, but all node in the same leaf
// 3.all node in the same leaf
// 4.all pipeline parallel node in the same tor, but all node in the same spine
// 4.all pipeline parallel node in the same leaf, but all node in the same spine
// 5.all node in the same spine
func (nt *NetWorkTopology) FindBestNode(minNumberWorker int, pipelineParallel int, hyperNodeTree map[string][][]string) ([]string, int) {
    nt.printHyperNodeTree(hyperNodeTree)
    // 1.all node in the same tor
    tieIndex := 0
    for _, hyperNodes := range hyperNodeTree[tieIndex] {
       if len(hyperNodes) >= minNumberWorker {
          return hyperNodes[:minNumberWorker], TorTierIndex
       }
    }
    // 2.all pipeline parallel node in the same tor, but all node in the same leaf
    resNode := []string{}
    dataParallel := minNumberWorker / pipelineParallel
    dpRemainCnt := dataParallel
    hasFoundAllNode := false
    for _, hyperNodes := range hyperNodeTree[indexKey] {
       eachTorCnt := pipelineParallel
       for beginIndex := 0; eachTorCnt <= len(hyperNodes); beginIndex += pipelineParallel {
          resNode = append(resNode, hyperNodes[beginIndex:beginIndex+pipelineParallel]...)
          eachTorCnt += pipelineParallel
          dpRemainCnt -= 1
          if dpRemainCnt == 0 {
             klog.V(3).Infof("get all pipeline parallel node in the same tor: %v", resNode)
             hasFoundAllNode = true
             break
          }
       }
       if hasFoundAllNode {
          break
       }
    }
    if hasFoundAllNode {
       leafIndexKey := TierKeyWord + strconv.Itoa(LeafTierIndex)
       for _, hyperNodes := range hyperNodeTree[leafIndexKey] {
          if resNodeInSameLeaf := nt.isSubHyperNode(hyperNodes, resNode); resNodeInSameLeaf {
             klog.V(3).Infof("get all pipeline parallel node in the same tor and all node in same leaf: %v", resNode)
             return resNode, TorTierIndex
          }
       }
    }

    // 3.all node in the same leaf
    indexKey = TierKeyWord + strconv.Itoa(LeafTierIndex)
    for _, hyperNodes := range hyperNodeTree[indexKey] {
       if len(hyperNodes) >= minNumberWorker {
          klog.V(3).Infof("get node in the same tor: %v", hyperNodes[:minNumberWorker])
          return hyperNodes[:minNumberWorker], TorTierIndex
       }
    }
    // 4.all pipeline parallel node in the same tor, but all node in the same spine
    if hasFoundAllNode {
       klog.V(3).Infof("get all pipeline parallel node in the same tor and all node in same spine: %v", resNode)
       return resNode, LeafTierIndex
    }
    // 5.all pipeline parallel node in the same leaf, but all node in the same spine
    resNode = []string{}
    dpRemainCnt = dataParallel
    for _, hyperNodes := range hyperNodeTree[indexKey] {
       eachTorCnt := pipelineParallel
       for beginIndex := 0; eachTorCnt <= len(hyperNodes); beginIndex += pipelineParallel {
          resNode = append(resNode, hyperNodes[beginIndex:beginIndex+pipelineParallel]...)
          eachTorCnt += pipelineParallel
          dpRemainCnt -= 1
          if dpRemainCnt == 0 {
             klog.V(3).Infof("get all pipeline parallel node in the same tor: %v", resNode)
             return resNode, TorTierIndex
          }
       }
    }
    // 6.all node in the same spine
    indexKey = TierKeyWord + strconv.Itoa(SpineTierIndex)
    for _, hyperNodes := range hyperNodeTree[indexKey] {
       if len(hyperNodes) >= minNumberWorker {
          klog.V(3).Infof("get node in the same tor: %v", hyperNodes[:minNumberWorker])
          return hyperNodes[:minNumberWorker], TorTierIndex
       }
    }
    return nil, -1
}

```

### Compatibility

## Unsolved Problems
在实际测试过程中， 发现PodGroup所有的pod可能同时进入unscheduleable队列，并等待5分钟后重试。 这个期间，资源可能被其他PodGroup占用。

## Alternatives
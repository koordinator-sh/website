---
sidebar_position: 4
---

# 使用Koordiantor将Hadoop YARN与K8s混部

## 背景介绍
Koordinator已经支持了K8s生态内的在离线混部，通过Batch超卖资源以及BE QoS，离线任务可以使用到集群内的空闲资源，提升资源使用效率。然而，
在K8s生态外，仍有相当数量的用户会选择将大数据任务运行其他资源管理系统，例如[Apache Hadoop YARN](https://hadoop.apache.org/docs/current/hadoop-yarn/hadoop-yarn-site/YARN.html) 。
作为大数据生态下的资源管理系统，YARN承载了包括MapReduce、Spark、Flink以及Presto等在内的多种计算引擎。虽然目前一些计算引擎提供了K8s operator可以
将任务融入到K8s生态，但不可否认的是，目前YARN生态依然保持一定的活跃度，典型的例子是包括阿里云在内的一系列主流云厂商仍然提供类似[E-MapReduce](https://www.aliyun.com/product/bigdata/emapreduce)
的产品，支持用户将大数据作业提交到YARN上运行，这点从产品的受欢迎程度上可见一斑。

因此，为了进一步丰富Koordinator支持的在离线混部场景，Koordinator社区会同来自阿里云、小红书、蚂蚁金服的开发者们共同启动了Hadoop YARN与K8s混部
项目，支持将超卖的Batch资源提供给Hadoop YARN使用，进一步提升集群资源的使用效率，该项目目前已经在小红书生产环境正式投入使用。

## 技术原理
### 设计原则
- 离线作业的提交入口依然为YARN保持不变。
- 基于Hadoop YARN开源版本，原则上不对YARN做侵入式改造。
- Koordinator提供的混部资源，既可被K8s Pod使用，也可被YARN task使用，不同类型的离线应用可在同一节点内共存。
- 单机QoS策略由Koordlet统一管理，并兼容YARN Task的运行时。

### 资源分配与仲裁
在Koordinator中，节点超卖的Batch资源量由koord-manager根据节点资源负载情况动态计算得出，并以extended-resource形式更新在K8s的Node对象中。
对于YARN场景的适配，将由koord-yarn-operator组件负责将节点的Batch资源量同步给YARN RM。此外，由于K8s调度器和YARN调度器共享Batch账本，因此
在资源同步时需要将另一个系统中已经分配的Batch资源排除。具体过程如下：

1. koord-manager计算原始Batch总量`origin_batch_total`，并将其记录在K8s的node annotation中。
2. koord-yarn-operator从YARN RM收集YARN节点已经分配的资源量`yarn_requested`，并将其记录在K8s的node annotation中。
3. 在koord-manager更新K8s的Batch资源总量时，排除YARN已经分配的资源量：`k8s_batch_total = origin_batch_total – yarn_requested`
4. yarn-operator向YARN RM更新资源时，排除K8s已经分配的资源量：`yarn_batch_total = origin_batch_total – k8s_batch_requested`

![image](/img/koord-yarn-operator.svg)

在双调度器的工作模式下，由于资源申请量的同步存在时序先后，节点的Batch可能会被过量分配，koordlet将在单机侧对资源进行二次仲裁。不过，与kubelet仲裁
机制不同的是，koordlet将以"避免干扰在线"，以及"确保离线资源质量"为目标，复用当前的QoS策略作为仲裁手段，既结合节点实际的资源使用情况，非必要不驱逐
离线任务。

### 节点运行时管理
Node Manager是YARN的节点组件，主要负责离线任务的生命周期管理，在K8s混部场景下NM将以DaemonSet形式部署。为了对资源进行更精细的管理，
YARN Task将与NM的资源管理相互独立，NM在部署时只需按自身开销申请Batch混部资源。

![image](/img/node-manager-runtime.svg)

为了能够通过cgroup来管理YARN任务的资源使用，Koordinator要求YARN NM开启[LinuxContainerExecutor](https://apache.github.io/hadoop/hadoop-yarn/hadoop-yarn-site/NodeManagerCgroups.html)
模式，并指定cgroup路径，确保可以和其他K8s Pod一样，统一在besteffort分组下管理。

![image](/img/node-manager-cgroup.svg)

### 单机QoS策略适配

koodlet目前在单机支持了一系列的QoS策略，这些同样需要针对YARN场景进行适配。对于资源隔离参数，例如Group Identity，Memory QoS，L3 Cache隔离等，
koordlet将根据设计的cgroup层级进行适配。而对于驱逐和压制这类动态策略，koordlet将新增一个sidecar模块koord-yarn-copilot，用于对接YARN场景的各类数据和操作，
包括YARN Task元信息采集、资源指标采集、Task驱逐操作等，所有QoS策略仍然保留在koordlet内，koordlet内部相关模块将以plugin形式对接koord-yarn-copilot接口。
同时，koord-yarn-copilot的接口设计将保留一定的扩展性，后续可用于对接其他资源框架。

![image](/img/koord-yarn-copilot.svg)

koordlet将在后续版本中陆续完成各类QoS策略对YARN场景的适配。

## 如何使用
支持K8s与YARN混部的相关功能目前已经基本研发完成，Koordinator团队目前正努力完成发布前的一系列准备工作，敬请期待！

如果您也有意参与项目的合作共建，或是对`K8s & YARN`混部感兴趣，欢迎您到[专项讨论区](https://github.com/koordinator-sh/koordinator/discussions/1297) 下方留言，
我们将第一时间联系您**参与试用**。参考留言格式：

```
联系人(gihub-id)：, e.g. @koordinator-dev

您任职/就读/参与的公司/学校/组织名称：e.g. koordinator community

社区参与意向：e.g. 希望能够参与研发/学习大数据&云原生混部/将K8s&YARN混部功能在生产环境落地/其它。

您对"K8s&YARN混部"的期待：
```
---
slug: release-v1.2.0
title: "Koordinator v1.2: 支持节点资源预留，兼容社区重调度策略"
authors: [zwzhang0107]
tags: [release]
---

## 背景
Koordinator 是一个开源项目，基于阿里巴巴在容器调度领域多年累积的经验孵化诞生，可以提升容器性能，降低集群资源成本。通过混部、资源画像、调度优化等技术能力，
能够提高延迟敏感的工作负载和批处理作业的运行效率和可靠性，优化集群资源使用效率。

从 2022 年 4 月发布以来，Koordinator 迄今一共迭代发布了 10 个版本，吸引了了包括阿里巴巴、小米、小红书、爱奇艺、360、有赞 等在内的大量优秀工程师参与贡献。
随着2023年春天的来临，Koordinator也迎来了它的一周年诞辰，在此我们很高兴的向大家宣布，Koordinator v1.2版本正式发布。新版本中Koordinator支持了节点资源预留功能，
并兼容了K8s社区的重调度策略，同时在单机侧增加了对AMD环境L3 Cache和内存带宽隔离的支持。

在新版本中，共有12位新加入的开发者参与到了Koordiantor社区的建设，他们是@Re-Grh，@chengweiv5，@kingeasternsun，@shelwinnn，@yuexian1234，@Syulin7，@tzzcfrank
@Dengerwei，@complone，@AlbeeSo，@xigang，@leason00，感谢以上开发者的贡献和参与。

## 版本功能特性解读

### 节点资源预留
混部场景中包含的应用形态多种多样，除了已经完成云原生化的容器，还包含很多尚未完成容器化的应用，这部分应用会以进程的形式在宿主机上与K8s容器共同运行。
为了减少K8s应用和其他类型应用在节点侧的资源竞争，Koordinator 支持将一部分资源预留，使其既不参与调度器的资源调度，也不参与节点侧的资源分配，达到资源分隔使用的效果。
在v1.2版本中，Koordiantor已经支持CPU和内存资源维度的预留，并允许直接指定预留的CPU编号，具体如下。

#### 节点资源预留声明
在Node上可以配置需要预留的资源量或具体的CPU编号，举例如下：
```yaml
apiVersion: v1
kind: Node
metadata:
  name: fake-node
  annotations: # specific 5 cores will be calculated, e.g. 0, 1, 2, 3, 4, and then those core will be reserved.
    node.koordinator.sh/reservation: '{"resources":{"cpu":"5"}}'
---
apiVersion: v1
kind: Node
metadata:
  name: fake-node
  annotations: # the cores 0, 1, 2, 3 will be reserved.
    node.koordinator.sh/reservation: '{"reservedCPUs":"0-3"}'
```
单机组件Koordlet在上报节点资源拓扑信息时，会将具体预留的CPU编号更新到NodeResourceTopology对象的Annotation中。

#### 调度及重调度场景适配
调度器在分配资源的过程中，涉及了多种情况的资源校验，包括Quota管理，节点容量校验，CPU拓扑校验等等，这些场景都需要增加对节点预留资源的考虑，例如，调度器在计算节点CPU容量时，需要将节点预留的资源进行扣除。
```
cpus(alloc) = cpus(total) - cpus(allocated) - cpus(kubeletReserved) - cpus(nodeAnnoReserved)
```
此外，对于Batch混部超卖资源的计算同样需要将这部分资源扣除，而考虑到节点中还包括一部分系统进程的资源消耗，Koord-Manager在计算时会取节点预留和系统用量的最大值，具体为：
```
reserveRatio = (100-thresholdPercent) / 100.0
node.reserved = node.alloc * reserveRatio
system.used = max(node.used - pod.used, node.anno.reserved)
Node(BE).Alloc = Node.Alloc - Node.Reserved - System.Used - Pod(LS).Used
```
对于重调度，各插件策略需要在节点容量、利用率计算等场景感知节点预留资源量，此外，若已经有容器占用了节点的预留资源，重调度需要考虑将其进行驱逐，确保节点容量得到正确管理，
避免资源竞争。这部分重调度相关的功能，我们将在后续版本进行支持，也欢迎广大爱好者们一起参与共建。

#### 单机资源管理
对于LS类型的Pod，单机Koordlet组件会根据CPU分配情况动态计算共享CPU池，对于节点预留的CPU核心会将其排除在外，确保LS类型pod和其他非容器化的进程资源隔离。
同时，对于单机相关的QoS策略，例如CPUSuppress压制策略在计算节点利用率时，会将预留资源量考虑在内。
```
suppress(BE) := node.Total * SLOPercent - pod(LS).Used - max(system.Used, node.anno.reserved)
```
关于节点资源预留功能的详细说明，可以参考 [设计文档](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20221227-node-resource-reservation.md) 中的介绍。

### 兼容社区重调度策略
得益于 Koordinator Descheduler 的框架日益成熟，在 Koordinator v1.2 版本中，通过引入一种接口适配机制，可以无缝的对 Kubernetes Desceheduler 已有插件进行兼容，在使用时您只需部署Koordinator Descheduler，即可使用到上游的全部功能，以及Koordinator的增强。
Koordinator Descheduler支持上游所有的插件和参数配置，在运行时也保障一样的效果。并且这些上游的插件都可以配置使用 koord-descheduler 内置的 MigrationController，复用优先预留资源保障资源交付的能力和内置增强的稳定性机制实现更安全的重调度。

兼容的插件列表包括：
- HighNodeUtilization
- LowNodeUtilization
- PodLifeTime
- RemoveFailedPods
- RemoveDuplicates
- RemovePodsHavingTooManyRestarts
- RemovePodsViolatingInterPodAntiAffinity
- RemovePodsViolatingNodeAffinity
- RemovePodsViolatingNodeTaints
- RemovePodsViolatingTopologySpreadConstraint
- DefaultEvictor

在使用时，可以参考如下的方式配置，以 RemovePodsHavingTooManyRestarts 为例：
```yaml
apiVersion: descheduler/v1alpha2
kind: DeschedulerConfiguration
clientConnection:
  kubeconfig: "/Users/joseph/asi/koord-2/admin.kubeconfig"
leaderElection:
  leaderElect: false
  resourceName: test-descheduler
  resourceNamespace: kube-system
deschedulingInterval: 10s
dryRun: true
profiles:
- name: koord-descheduler
  plugins:
    evict:
      enabled:
        - name: MigrationController
   deschedule:
     enabled:
       - name: RemovePodsHavingTooManyRestarts
  pluginConfig:
    - name: RemovePodsHavingTooManyRestarts
      args:
        apiVersion: descheduler/v1alpha2
        kind: RemovePodsHavingTooManyRestartsArgs
        podRestartThreshold: 10
```
### 资源预留调度能力增强
Koordinator 在比较早期的版本中引入了 Reservation 机制，通过预留资源并复用给指定特征的 Pod 使用，用于帮助解决资源交付确定性问题。
例如重调度场景中期望被驱逐的 Pod 一定有资源可以使用，而不是被驱逐后无资源可用导致引起稳定性问题；又或者需要扩容时，
一些 PaaS 平台希望能够先确定是否满足应用调度编排的资源，再决定是否扩容，或者提前做一些预备工作等。

Koordinator Reservation 通过 CRD 定义，每个 Reservation 对象会在 koord-scheduler 内伪造成一个 Pod 进行调度，
这样的 Pod 我们称为 Reserve PodReserve Pod 就可以复用已有的调度插件和打分插件找到合适的节点，并最终在调度器内部状态中占据对应的资源。
Reservation 在创建时都会指定预留的资源将来要给哪些 Pod 使用，可以指定具体某个 Pod，也可以指定某些 workload 对象，或者具备某些标签的 Pod 使用。
当这些 Pod 通过 koord-scheduler 调度时，调度器会找到可以被该 Pod 使用的 Reservation 对象，并且优先使用 Reservation 的资源。
并且 Reservation Status 中会记录被哪个 Pod 使用，以及 Pod Annotations 中也会记录使用了哪个 Reservation。
Reservation 被使用后，会自动的清理内部状态，确保其他 Pod 不会因为 Reservation 导致无法调度。

原有版本实现中，我们对 Reservation 的功能做了诸多限制，例如要求 Pod 只能使用 Reservation 持有的资源，不能结合节点剩余的资源一起分配，
并且也不支持精细化管理的资源，例如不能预留 CPU 核，也不支持预留 GPU 设备等。另外就是 Reservation 默认是可以被重复使用的，
即 Reservation 预留的资源可以被多个 Pod 使用（当然并不会超卖资源，保证不会使用超过 Reservation预留的量）。

在 Koordinator v1.2 中，我们做了大幅度的优化。首先我们放开了只能使用 Reservation 持有的资源的限制，允许跨出 Reservation 的资源边界，
既可以使用 Reservation 预留的资源，也可以使用节点上剩余的资源。而且我们通过非侵入式的方式扩展了 kube scheduler framework，
支持预留精细化管理的资源，即可以预留 CPU 核和 GPU 设备等。我们也修改了 Reservation 可以被重复使用的默认行为，改为 AllocateOnce，
即 Reservation 一旦被某个 Pod 使用，该 Reservation 会被废弃。这样的改动是考虑到，AllocateOnce 更能覆盖大部分场景，这样作为默认行为，大家在使用时会更简单。

### 支持AMD环境下的L3 Cache和内存带宽隔离
在v0.3.0版本中，Koordiantor已经支持了Intel环境的L3 Cache和内存带宽隔离，在最新的1.2.0版本中我们新增了对AMD环境的支持。
Linux内核L3 Cache和内存带宽隔离能力提供了统一的resctrl接口，同时支持Intel和AMD环境，主要区别在于，Intel提供的内存带宽隔离接口为百分比格式，
而AMD提供的内存带宽隔离接口为绝对值格式，具体如下。
```
# Intel Format
# resctrl schema
L3:0=3ff;1=3ff
MB:0=100;1=100

# AMD Format
# resctrl schema
L3:0=ffff;1=ffff;2=ffff;3=ffff;4=ffff;5=ffff;6=ffff;7=ffff;8=ffff;9=ffff;10=ffff;11=ffff;12=ffff;13=ffff;14=ffff;15=ffff
MB:0=2048;1=2048;2=2048;3=2048;4=2048;5=2048;6=2048;7=2048;8=2048;9=2048;10=2048;11=2048;12=2048;13=2048;14=2048;15=2048
```
接口格式包含两部分，L3表示对应的socket或CCD可用的“路数”（way），以16进制的数据格式表示，每个比特位表示一路
MB表示对应的socket或CCD可以使用的内存带宽范围，Intel可选范围为0~100的百分比格式，AMD对应的为绝对值格式，单位为Gb/s，2048表示不限制。
Koordiantor统一提供了百分比格式的接口，并自动感知节点环境是否为AMD，决定resctrl接口中填写的格式。
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: slo-controller-config
  namespace: koordinator-system
data:
  resource-qos-config: |-
    {
      "clusterStrategy": {
        "lsClass": {
           "resctrlQOS": {
             "enable": true,
             "catRangeStartPercent": 0,
             "catRangeEndPercent": 100,
             "MBAPercent": 100
           }
         },
        "beClass": {
           "resctrlQOS": {
             "enable": true,
             "catRangeStartPercent": 0,
             "catRangeEndPercent": 30,
             "MBAPercent": 100
           }
         }
      }
    }
```

### 其他功能
通过 [v1.2 release](https://github.com/koordinator-sh/koordinator/releases/tag/v1.2.0) 页面，可以看到更多版本所包含的新增功能。

## 未来计划
在接下来的版本中，Koordiantor重点规划了以下功能，具体包括：
- 硬件拓扑感知调度，综合考虑节点CPU、内存、GPU等多个资源维度的拓扑关系，在集群范围内进行调度优化。
- 对重调度器的可观测性和可追溯性进行增强。
- GPU资源调度能力的增强。

Koordinator 是一个开放的社区，非常欢迎广大云原生爱好者们通过各种方式一起参与共建，无论您在云原生领域是初学乍练还是驾轻就熟，我们都非常期待听到您的声音！

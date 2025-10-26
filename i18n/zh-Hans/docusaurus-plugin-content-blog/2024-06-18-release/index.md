---
slug: release-v1.5.0
title: "Koordinator v1.5: 持续优化，进入 CNCF Sandbox"
authors: [saintube, ZiMengSheng]
tags: [release]
---

## 背景

[Koordinator](https://koordinator.sh/) 是一个开源项目，基于阿里巴巴在容器调度领域的多年经验积累而生，自发布以来经历了个版本的迭代，持续不断地为 Kubernetes 生态系统带来创新和增强。旨在提供混部工作负载编排、混部资源调度、混部资源隔离和混部性能调优的综合解决方案，帮助用户优化容器性能，并提升集群资源使用效率，管理和优化延迟敏感型工作负载和批处理作业的运行效率和可靠性。

在此，我们向大家宣布 Koordinator v1.5.0 版本的发布，这是自2022年4月正式开源以来，Koordinator 迭代发布的第13个大版本。在2年多的时间里，Koordinator 很荣幸吸引了包括阿里巴巴、蚂蚁科技、Intel、小红书、小米、爱奇艺、360、有赞等众多企业的优秀工程师参与，贡献了众多的想法、代码和场景。
在 v1.5.0 版本中，Koordinator 带来了众多的功能优化，新增了 Pod 级别 NUMA 对齐策略、网络 QoS、Core Scheduling 等功能支持。

此外，Koordinator 项目近期通过了 CNCF TOC 投票，顺利被 CNCF 基金会接受为 Sandbox 项目，CNCF 全称 Cloud Native Computing Foundation（云原生计算基金会），旨在为云原生软件构建可持续发展的生态系统，服务于厂商中立的快速增长的开源项目，如 Kubernetes、Prometheus 等。

>![koordinator-aboard-cncf-sandbox-img](/img/koordinator-aboard-cncf-sandbox.jpg)
> 投票地址：https://github.com/cncf/sandbox/issues/51

## 版本功能特性解读

### Pod级别NUMA对齐策略

在过去的 v1.4.0 版本中，Koordinator 支持了用户在节点上加标签为不同节点配置不同的 NUMA 对齐策略。然而这意味着用户需要提前将集群中的节点拆分为不同 NUMA 对齐策略的节点池，引入了额外管理节点的负担。
Koordinator 在 v1.5.0 中引入了 Pod 级别的 NUMA 对齐策略来解决该问题。举例，我们可以为 `pod-1` 设置 `SingleNUMANode`：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-1
  annotations:
    scheduling.koordinator.sh/numa-topology-spec: |-
      {
        "numaTopologyPolicy": "SingleNUMANode",
      }
spec:
  containers:
    - name: container-1
      resources:
        requests:
          cpu: '1'
        limits:
          cpu: '1'
```

引入 Pod 级别的 NUMA 策略后，必然会出现不同 NUMA 策略的节点部署在同一个 NUMA Node 的情况。
举例，`node-1` 有两个 NUMA Node，`pod-1` 采用 `SingleNUMANode` 策略使用了 `numa-0`，`pod-2` 采用 `Restricted` 策略使用了 `numa-0` 和 `numa-1`。
由于 Pod 设置 Limit 只能限制 Pod 在整机维度最多能使用多少资源，无法限制在某个 NUMA 节点下最多能使用多少 NUMA 资源，所以 `pod-2` 在 `numa-0` 使用的资源可能超过调度器分配给它的资源量。这时候 `pod-2` 和 `pod-1` 在 `numa-0` 上存在资源竞争。
为了解决上述问题，Koordinator 支持用户为 `SingleNUMANode` 的 Pod 配置独占策略。举例，我们可以配置 Pod 为 `SingleNUMANode` 且不与跨 NUMA 共存在一个机器上：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-1
  annotations:
    scheduling.koordinator.sh/numa-topology-spec: |-
      {
        "numaTopologyPolicy": "SingleNUMANode",
        "singleNUMANodeExclusive": "Required", # Required or Preferred
      }
spec:
  containers:
    - name: container-1
      resources:
        requests:
          cpu: '1'
        limits:
          cpu: '1'
```

另外，Pod 级别的 NUMA 策略的引入并不意味着废弃 Node 级别的 NUMA 策略，而是相互兼容的。
因此，如果 Pod 和节点上的策略不同，Pod 将不会被调度到该节点上；如果节点上的策略为 `""`, 则表示该节点能够放置任何 Pod；如果 Pod 上的策略为 `""`，则表示 Pod 可以调度到任何节点上。

|                    | SingleNUMANode node | Restricted node | BestEffort node |
|--------------------|---------------------|-----------------|-----------------|
| SingleNUMANode pod | [✓]                 | [x]             | [x]             |
| Restricted pod     | [x]                 | [✓]             | [x]             |
| BestEffort pod     | [x]                 | [x]             | [✓]             |
| ""                 | [✓]                 | [✓]             | [✓]             |

关于 Pod 级别 NUMA 对齐策略的更多信息，请见 [Proposal: Pod-level NUMA Policy](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20240131-pod-level-numa-policy.md)。

### Terway网络QoS

在 v1.5.0 版本中，Koordinator 联动 Terway 社区提供了网络 QoS 能力。
[Terway QoS](https://github.com/AliyunContainerService/terway-qos) 的诞生是为了解决混部场景下的网络带宽争抢问题，它支持按单个 Pod 或 QoS 类型进行带宽限制，与其他方案相比具备以下优势：
1. 支持按业务类型限制带宽，适用于多种业务混部的场景。
2. 支持动态调整 Pod 带宽限制。
3. 提供整机带宽限制，支持多网卡，支持容器网络和 HostNetwork Pod 的带宽限制。

Terway QoS 包括3种网络带宽的优先级，对应的 Koordinator 默认 QoS 映射如下：

| Koordinator QoS |    Kubernetes QoS    | Terway Net QoS |
|:---------------:|:--------------------:|:--------------:|
|     SYSTEM      |          --          |       L0       |
|       LSE       |      Guaranteed      |       L1       |
|       LSR       |      Guaranteed      |       L1       |
|       LS        | Guaranteed/Burstable |       L1       |
|       BE        |      BestEffort      |       L2       |

在混部场景中，我们希望在线业务具有最大的带宽保障，以避免争抢；在空闲时，离线业务也可以充分利用所有带宽资源。

因此，用户可以为业务流量定义为3个优先级，从高到低依次为：L0、L1、L2。我们定义争用场景为：当 L0+L1+L2 的总流量超过整机带宽时。
L0 的最大带宽根据 L1 和 L2 的实时流量动态调整。它可以高至整机带宽，低至“整机带宽 - L1 最小带宽 - L2 最小带宽”。在任何情况下，L1 和 L2 的带宽都不会超过各自的上限。在争用场景中，L1 和 L2 的带宽不会低于各自的下限。在争用场景中，带宽将按 L2、L1 和 L0 的顺序进行限制。由于 Terway QoS 只有三个优先级，因此只能设置 LS 和 BE 的全机带宽限制，其余L0部分根据整机的带宽上限计算。

下面是一个配置示例：

```yaml
# unit: bps
resource-qos-config: |
  {
    "clusterStrategy": {
      "policies": {"netQOSPolicy":"terway-qos"},
      "lsClass": {
        "networkQOS": {
          "enable": true,
          "ingressRequest": "50M",
          "ingressLimit": "100M",
          "egressRequest": "50M",
          "egressLimit": "100M"
        }
      },
      "beClass": {
        "networkQOS": {
          "enable": true,
          "ingressRequest": "10M",
          "ingressLimit": "200M",
          "egressRequest": "10M",
          "egressLimit": "200M"
        }
      }
    }
  }
system-config: |-
  {
    "clusterStrategy": {
      "totalNetworkBandwidth": "600M"
    }
  }
```

此外，网络 QoS 能力也支持 Pod 维度的带宽限制，采用以下 annotations 协议：

| Key	                      | Value                                            |
|---------------------------|--------------------------------------------------|
| koordinator.sh/networkQOS | 	'{"IngressLimit": "10M", "EgressLimit": "20M"}' |

关于网络 QoS 能力的更多信息，请见 [Network Bandwidth Limitation Using Terway QoS](/docs/user-manuals/network-qos-with-terwayqos) 和 [Terway](https://github.com/AliyunContainerService/terway) 社区。

### Core Scheduling

在 v1.5.0 版本中，Koordinator 提供了容器维度的 Core Scheduling 能力，用于多租户场景下降低侧信道（Side Channel Attack）攻击风险，也可以作为 CPU QoS 能力增强混部隔离。

[Linux Core Scheduling](https://docs.kernel.org/admin-guide/hw-vuln/core-scheduling.html) 支持在用户态定义可以共享物理核的任务分组。属于同一分组的任务将赋予相同的 cookie 作为标识，同一物理核（SMT 维度）在同一时刻只会运行一种 cookie 的任务。通过将这种机制应用到安全方面或性能方面，我们可以做到以下事情：
1. 对不同租户的任务进行物理核维度的隔离。
2. 避免离线任务争抢在线服务的物理资源。

Koordinator 使能内核的 Core Scheduling 机制，实现容器维度的分组隔离策略，最终形成了以下两种能力：
1. Pod 运行时物理核隔离：对 Pods 进行分组，不同分组的 Pods 不能同时共享物理核，保障多租户隔离。
2. 下一代 CPU QoS 策略：作为 Group Identity 机制以外，兼顾安全的 CPU QoS 能力。

#### Pod运行时物理核隔离

Koordinator 提供 Pod Label 协议，标识 Pod 的 Core Scheduling 分组。

| Key	                               | Value        |
|------------------------------------|--------------|
| koordinator.sh/coreSchedulingGroup | 	"xxx-group" |

不同分组的 Pods 运行时在物理核层面互斥，可以规避了一些物理核、L1 cache、L2 cache 维度的侧信道攻击，适用于多租户场景。

![container-core-scheduling-img](/img/container-core-scheduling.svg)

区别于绑核调度，Pod 运行的物理核范围并不固定，同一物理核在不同时刻可能运行着不同分组的 Pods，物理核资源可以被分时复用。

#### 下一代CPU QoS策略

Koordinator 基于 [Anolis OS](https://openanolis.cn/anolisos) 内核提供的 Core Scheduling 和 CGroup Idle 机制，构建了新的 CPU QoS 策略。
- BE 容器启用 CGroup Idle 特性，最小化调度权重和优先级。
- LSR/LS 容器启用 Core Scheduling 特性，支持驱逐物理核上同分组的 BE 任务。

用户可以通过在 slo-controller-config 中指定 `cpuPolicy="coreSched"` 来启用该策略。

```yaml
# Example of the slo-controller-config ConfigMap.
apiVersion: v1
kind: ConfigMap
metadata:
  name: slo-controller-config
  namespace: koordinator-system
data:
  resource-qos-config: |
    {
      "clusterStrategy": {
        "policies": {
          "cpuPolicy": "coreSched"
        },
        "lsClass": {
          "cpuQOS": {
            "enable": true,
            "coreExpeller": true,
            "schedIdle": 0
          }
        },
        "beClass": {
          "cpuQOS": {
            "enable": true,
            "coreExpeller": false,
            "schedIdle": 1
          }
        }
      }
    }
```

关于 Core Scheduling 能力的更多信息，请见 [CPU QoS](/docs/user-manuals/cpu-qos)。

### 其他功能

除了上述新功能特性以外，Koordinator v1.5.0 版本还包含了以下一系列的功能增强和稳定性优化：
1. 功能增强：Reservation Restricted 模式下支持通过 Annotation 控制哪些资源严格遵循 Restricted 语义；将 NUMA 对齐策略 Restricted 的语义跟上游对齐；Coscheduling 实现完全公平的调度队列排队规则，确保同一个 GangGroup 的 Pod 一起出队，不同 Gang 以及裸 Pod 之间按照上次调度时间排队；NRI 模式支持重连机制；koordlet 优化监控指标分类，增加性能指标；BlkioReconcile 配置能力增强。
2. BugFixes：修复 koordlet CPU 压制功能的内存泄露问题；修复 runtimeproxy 的 panic 问题；修正 CPICollector、BECPUEvict、CPUBurst 模块计算逻辑。
3. 环境适配：所有组件升级到 K8S 1.28；koordlet 支持非 CUDA 镜像的部署；koordlet 适配 kubelet 1.28 配置，优化 cpu manager 兼容逻辑；适配 cri-o 运行时。
4. 重构优化：koordlet 优化 Resctrl 更新逻辑；优化单机驱逐接口逻辑；优化节点 GPU 资源和卡型号同步逻辑；优化 Batch 账本计算逻辑。
5. CI/CD：修复多个 flaky tests。

通过 [v1.5.0 Release](https://github.com/koordinator-sh/koordinator/releases/tag/v1.5.0) 页面，可以看到更多包含在 v1.5.0 版本的新增功能。

## 欢迎社区新成员

Koordinator 是一个开放的社区，在 v1.5.0 版本中，共有 10 位新的开发者参与到了 Koordinator 的建设，他们是 @georgexiang、@googs1025、@l1b0k、@ls-2018、@PeterChg、@sjtufl、@testwill、@yangfeiyu20102011、@zhifanggao、@zwForrest。

Koordinator 社区目前有许多来自不同行业的企业级贡献者，其中不少同学成为了项目的 Maintainer 和 Member，近期新加入的 Maintainer 成员有 @songzh215、@j4ckstraw、@lucming、@kangclzjc。
在此感谢各位新同学的积极参与和老同学的持续投入，也欢迎更多优秀的同学参与到 [Koordinator](https://github.com/koordinator-sh/koordinator) 社区～

## 未来计划

在接下来的版本中，Koordinator 目前规划了以下工作：
- 调度性能优化：调度性能是调度器能否应对大规模集群的关键指标。接下来的版本中，Koordinator 将给出基本的压测环境搭建手册以及常见压测场景，并着手提升 Koord-Scheduler 的调度性能。
- 设备联合分配。在 AI 大模型分布式训练场景中，不同机器 GPU 之间通常需要通过高性能网卡相互通信，且 GPU 和高性能网卡就近分配的时候性能更好。Koordinator 正在推进支持多种异构资源的联合分配，目前已经在协议上和调度器分配逻辑上支持联合分配；单机侧关于网卡资源的上报逻辑正在探索中。
- Job 粒度的抢占实现：在大规模共享集群中，有些配额可能非常繁忙，有些配额可能处于空闲状态。在 ElasticQuota 插件中，我们已经支持从空闲的 ElasticQuota 借用资源。但是，当被借用的 ElasticQuota 关联的 Pod 需要取回资源时，并没有考虑到 Job 粒度。对于属于同一个 Job 的 Pod，我们需要以 Job 粒度进行抢占，以确保获得足够的资源来满足 Job 的需求，提高资源交付效率。之前社区已经通过了 [Proposal](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20240115-support-job-level-preemption.md)，接下来 Koordinator 将推进该提案的实现。
- 负载感知调度针对 inflight pods 的优化：负载感知调度当前基于节点真实利用率进行多个维度的调度过滤和打分，可以用于优化节点利用率的分布，降低 Pod 调度到高负载节点的风险；不过，由于节点利用率视图存在同步延迟，各个阶段的 inflight pods 可能影响利用率信息的准确性，接下来，负载感知调度将完善这部分优化，更充分地规避调度到过载节点，优化节点间的负载均衡度。
- 细粒度的末级缓存及内存带宽隔离策略：容器间争抢共享的末级缓存和内存带宽资源，可能导致应用访存性能的抖动；当前 Koordinator 提供了 ResctrlQoS 能力，在满足隔离分组的数量限制的前提下，用来对 QoS 维度隔离末级缓存和内存带宽资源，降低离线负载对在线应用的干扰。下一步，Koordinator 将基于 v1.3 版本支持的 [NRI (Node Resource Interface) 框架](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/20230608-nri-mode-resource-management.md)，增强末级缓存及内存带宽的隔离策略，提供 Pod 维度的隔离能力，增强功能的灵活性和时效性。

## 致谢

自开源以来，Koordinator 已经共计发布了19个小版本，吸引了80多名贡献者的参与，社区的不断发展壮大，离不开广大工程师的积极参与，在此真诚感谢各位社区同学们的贡献和持续投入。同时，也特别感谢 CNCF 社区同仁对项目发展的提供的大力支持。

欢迎更多开发者和用户参与 Koordinator 社区建设，是您们的积极参与和宝贵意见让 Koordinator 不断进步。我们期待您继续提供反馈，并欢迎新的贡献者[加入我们](https://github.com/koordinator-sh/koordinator?tab=readme-ov-file#community)。
无论您在云原生领域是初学乍练还是驾轻就熟，我们都非常期待听到您的声音！

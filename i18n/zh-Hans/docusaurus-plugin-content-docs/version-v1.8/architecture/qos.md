# QoS

QoS 用于表达节点上 Pod 的运行质量，如获取资源的方式、获取资源的比例、QoS 保障策略等。

## 定义

Koordinator 调度系统支持的 QoS 有五种类型:

QoS | 特点 | 说明
--- | ---- | -------------
SYSTEM | 系统进程，资源受限 | 对于 DaemonSets 等系统服务，虽然需要保证系统服务的延迟，但也需要限制节点上这些系统服务容器的资源使用，以确保其不占用过多的资源
LSE(Latency Sensitive Exclusive) | 保留资源并组织同 QoS 的 pod 共享资源 | 很少使用，常见于中间件类应用，一般在独立的资源池中使用
LSR(Latency Sensitive Reserved) | 预留资源以获得更好的确定性 | 类似于社区的 Guaranteed，CPU 核被绑定
LS(Latency Sensitive) | 共享资源，对突发流量有更好的弹性 | 微服务工作负载的典型QoS级别，实现更好的资源弹性和更灵活的资源调整能力
BE(Best Effort) | 共享不包括 LSE 的资源，资源运行质量有限，甚至在极端情况下被杀死 | 批量作业的典型 QoS 水平，在一定时期内稳定的计算吞吐量，低成本资源

## QoS CPU 编排隔离与共享

![img](/img/qos-cpu-orchestration.png)

## Koordinator QoS与 Kubernetes QoS 的对比

从[定义](#定义)部分可以看出，Koordinator 的 QoS 比 Kubernetes 的 QoS 更复杂，因为在混部场景下，我们需要对延迟敏感的工作负载的 QoS 进行微调，以满足混部时性能的需求。

Koordinator 和 Kubernetes QoS 之间是有对应关系的:

Koordinator QoS | Kubernetes QoS
--------------- | --------------
SYSTEM  | ---
LSE | Guaranteed
LSR | Guaranteed
LS | Guaranteed/Burstable
BE | BestEffort

Koordlet 根据 Pod 的优先级和 QoS 定义，触发相应的资源隔离和 QoS 保障。

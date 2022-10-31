# QoS

QoS用于表达节点上Pod的运行质量，如获取资源的方式、获取资源的比例、QoS保障策略等。

## 定义

Koordinator调度系统支持的QoS有五种类型:

QoS | 特点 | 说明
--- | ---- | -------------
SYSTEM | 系统进程，资源受限 | 对于DaemonSets等系统服务，需要保证延迟，但需要限制节点上运行的所有容器的资源使用限制，以确保系统进程不占用过多的资源
LSE(Latency Sensitive Exclusive) | 保留资源并组织同QoS的pod共享资源 | 很少使用，常见于中间件类应用，一般在独立的资源池中使用
LSR(Latency Sensitive Reserved) | 预留资源以获得更好的确定性 | 类似于社区的Guaranteed，CPU核被绑定
LS(Latency Sensitive) | 共享资源，对突发流量有更好的弹性 | 微服务工作负载的典型QoS级别，实现更好的资源弹性和更灵活的资源调整能力
BE(Best Effort) | 共享不包括LSE的资源，资源运行质量有限，甚至在极端情况下被杀死 | 批量作业的典型QoS水平，在一定时期内稳定的计算吞吐量，低成本资源

## Koordinator QoS与Kubernetes QoS的对比

从[定义](#定义)部分可以看出，Koordinator的QoS比Kubernetes的QoS更复杂，因为在混部场景下，我们需要对延迟敏感的工作负载的QoS进行微调，以满足混部时性能的需求。

Koordinator和Kubernetes QoS之间是有对应关系的:

Koordinator QoS | Kubernetes QoS
--------------- | --------------
SYSTEM  | ---
LSE | Guaranteed
LSR | Guaranteed
LS | Guaranteed/Burstable
BE | BestEffort

Koordlet根据Pod的优先级和QoS定义，触发相应的资源隔离和QoS保证。
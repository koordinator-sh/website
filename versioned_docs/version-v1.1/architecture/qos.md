# QoS

QoS is used to express the running quality of the Pod on the node, such as the way to obtain resources, the proportion of resources obtained, and the QoS guarantee policy.

## Definition

There are five types of QoS supported by the Koordinator scheduling system:

QoS	| feature |	Description
--- | ---- | -------------
SYSTEM |	system process, resource constrained	| For system services such as DaemonSets, the latency needs to be guaranteed but it needs to limit the resource usage limit of all containers running on the node to ensure that system processes do not occupy too many resources
LSE(Latency Sensitive Exclusive) | reserve resources and organizing co-located pods to share resources | Rarely used, common in middleware-type applications, generally in independent resource pools
LSR(Latency Sensitive Reserved)	 | reserve resources for better certainty	    |  Similar to Guaranteed by the community, CPU cores are bound
LS(Latency Sensitive)	         | share resources for better resilience to burst traffic	    |  Typical QoS level for microservice workloads to achieve better resource elasticity and more flexible resource adjustment capabilities
BE(Best Effort)	                 | share resource exclude LSE, the quality of resource operation is limited, or even killed in extreme cases |	Typical QoS level for batch jobs, stable computing throughput within a certain period, low-cost resources

## QoS CPU Orchestration

![img](/img/qos-cpu-orchestration.png)


## Koordinator QoS vs. Kubernetes QoS

As seen in the [Definition](#definition) section, Koordinator's QoS is more complicated than Kubernetes QoS, because in colocation scenarios, we need to fine-tune the QoS for latency-sensitive workloads to meet the needs of co-located performance.

There is a correspondence between Koordinator and Kubernetes QoS:

Koordinator QoS | Kubernetes QoS 
--------------- | -------------- 
SYSTEM |  --- 
LSE | Guaranteed 
LSR | Guaranteed 
LS | Guaranteed/Burstable 
BE | BestEffort 

Koordlet triggers corresponding resource isolation and QoS guarantee according to Pod's Priority and QoS definition.

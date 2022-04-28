# Architecture

This topic describes the architecture, components, and core concepts associated with Koordinator deployments to Kubernetes. Koordinator consists of two control planes ([Koordinator Scheduler](#koordinator-scheduler)/[Koordinator Manager](#koordinator-manager)) and one DaemonSet component ([Koordlet](#koordlet)). 
Koordinator adds co-location capabilities on top of the original kubernetes, and maintains the compatibility of the original kubernetes workloads.

![Architecture](/img/architecture.png)

## Koordinator Scheduler

The Koordinator Scheduler is deployed as a ```Deployment```, which is used to enhance the resource scheduling capabilities of kubernetes in colocation scenarios, including:

- More scenario support, including elastic quota scheduling, resource overcommitment, resource reservation, gang scheduling, heterogeneous resource scheduling.
- Better performance, including dynamic index optimization, equivalence class scheduling, random relaxation algorithm optimization.
- Safer descheduling, including workload availability awareness, deterministic pod migration, fine grained flow control, and modification audit support.


## Koordinator Manager

The Koordinator Manager is deployed as a ``` Deployment ```, usually consists of two instances, one leader and one backup. The Koordinator Manager consists of several controllers and webhooks, which are used to orchestrate co-located workloads and support resource overcommitment scheduling and SLO management.

Currently, three components are provided:
- Colocation Profile, which used to support colocation without requiring modification of workloads. Users only need to do a small amount of configuration in the cluster, and the original workload can be run in a colocation mode, learn more about [Colocation Profile](../user-manuals/colocation-profile.md).
- SLO Controller, which is used for resource overcommitment model management, and dynamically adjusts the overcommitment ratio of the cluster according to the running status of the node co-location. The core responsibility of this controller is to manage co-located SLOs, such as intelligently identifying abnormal nodes in the cluster and lowering their weights, and dynamically adjusting the water level and suppression strategy of co-located, so as to ensure the stability and efficiency of Pods in the cluster.
- Recommender(coming soon), it uses histograms to count and predict the resource usage details of the workloads, which are used to estimate the peak resource requirements of the workloads, thereby supporting better hotspot dispersion and improving the efficiency of co-location. In addition, resource profiling will also be used to simplify the complexity of user resource specification configuration, such as to support automatic specification hosting (VPA).


## Koordlet

The Koordlet is deployed as a ``` DaemonSet ``` in kubernetes cluster, which is used to support colocation resource overcommitment, interference detection, QoS guarantee, etc.

Inside Koordlet, it mainly includes the following modules:
- Resource Profiling, which estimates the actual usage of Pod resources, and reclaims allocated but unused resources for overcommit low-priority pods according to the reclaimed resource.
- Resource Isolation, set resource isolation parameters for different types of Pods to avoid low-priority pods affecting the stability and performance of high-priority pods.
- Interference detection, for running Pods, dynamically detect resource contention, including CPU scheduling, memory allocation delay, network, disk IO delay, etc.
- QoS Manager, which dynamically adjusts the water level of node colocation based on resource profiling, interference detection results and SLO configuration, suppressing Pods that affect service quality.
- Resource Tuning, container resource tuning for co-located scenarios, optimize the container's CPU Throttle, OOM, etc., to improve the quality of service operation.


## What's Next

Here are some recommended next steps:

- Learn Koordinator's [Resource Model](./resource-model).
- Learn Koordinator's [Priority](./priority).
- Learn Koordinator's [QoS](./qos).

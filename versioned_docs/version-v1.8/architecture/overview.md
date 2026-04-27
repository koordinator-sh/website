# Overview

This topic describes the architecture, components, and core concepts associated with Koordinator deployments to Kubernetes. Koordinator consists of two control planes ([Koordinator Scheduler](#koordinator-scheduler)/[Koordinator Manager](#koordinator-manager)) and one DaemonSet component ([Koordlet](#koordlet)).
Koordinator adds co-location capabilities on top of the original kubernetes, and maintains the compatibility of the original kubernetes workloads.

![Architecture](/img/architecture.png)

## Koord-Scheduler

The Koordinator Scheduler is deployed as a ```Deployment```, which is used to enhance the resource scheduling capabilities of kubernetes in QoS-aware, differentiated SLO management, and job scheduling. Specifically including:

- QoS-aware scheduling, including load-aware scheduling to make node load more balanced, resource overcommitment to run more computing workloads with low priority. 
- Differentiated SLO management, including fine-grained CPU orchestration, different QoS policy(cfs/LLC/memory bw/net bw/blkio) for different workloads. 
- Job scheduling, including elastic quota scheduling, gang scheduling, heterogeneous resource scheduling, to support big-data and AI workloads.

In order to better support different workloads, the scheduler also provides a series of general capability enhancements:
- Reservation, an ability for reserving node resources for specific pods or workloads, which is widely used in descheduling, resource preemption and fragmentation optimization.
- Node reservation, an ability for reserving node resources for workloads out of kubernetes, which is typically used for non-containerized workloads.

## Koord-Descheduler

The Koordinator Descheduler is deployed as a ```Deployment```, which is an enhanced version of the community descheduler:

- Framework, a descheduling framework with better scalability, determinism and security, for more [details](../designs/descheduler-framework).
- Load-aware descheduling, a descheduling plugins to support node load rebalancing, which supports user-defined CPU load level of nodes to avoids hotspot nodes.

## Koord-Manager

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

## Koord-RuntimeProxy

The Koord-RuntimeProxy is deployed as a ``` systemd service ``` in kubernetes node, which is designed to intercept CRI request, and apply some resource management policies, such as setting different cgroup parameters by pod priorities under hybrid workload orchestration scenario, applying new isolation policies for latest Linux kernel, CPU architecture, and etc.

## What's Next

Here are some recommended next steps:

- Learn Koordinator's [Resource Model](./resource-model).
- Learn Koordinator's [Priority](./priority).
- Learn Koordinator's [QoS](./qos).

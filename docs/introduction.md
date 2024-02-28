---
title: Introduction
slug: /
---

# Introduction

Welcome to Koordinator!

## Overview

Koordinator is a QoS-based scheduling for efficient orchestration of microservices, AI, and big data workloads on Kubernetes. It aims to improve the runtime efficiency and reliability of both latency sensitive workloads and batch jobs, simplify the complexity of resource-related configuration tuning, and increase pod deployment density to improve resource utilizations.


## Key Features

Koordinator enhances the kubernetes user experiences in the workload management by providing the following:

- Well-designed priority and QoS mechanism to co-locate different types of workloads in a cluster and run different types of pods on a single node.
- Allowing for resource overcommitments to achieve high resource utilizations but still satisfying the QoS guarantees by leveraging an application profiling mechanism.
- Fine-grained resource orchestration and isolation mechanism to improve the efficiency of latency-sensitive workloads and batch jobs.
- Flexible job scheduling mechanism to support workloads in specific areas, e.g., big data, AI, audio and video.
- A set of tools for monitoring, troubleshooting and operations.


## Koordinator vs. Other Concept

### Koordinator QoS vs Kubernetes QoS

Kubernetes provides three types of QoS: Guaranteed/Burstable/BestEffort, of which Guaranteed/Burstable is widely used and BestEffort is rarely used. Koordinator is compatible with Kubernetes QoS and has numerous enhancements on each type. In order to avoid interfering with the native QoS semantics, Koordinator introduces an independent field ```koordinator.sh/qosClass``` to describe the co-location QoS. This QoS describes the service quality of the Pod running on the node in the co-location scenario. It is the most critical semantics of the mixed system.

Koordinator is compatible with Kubernetes QoS and has numerous enhancements on each type.

### Koordinator scheduler vs kube-scheduler

Koordinator scheduler is **not** designed to replace kube-scheduler, but to make co-located workloads run **better** on kubernetes.

Koordinator scheduler is developed based on schedule-framework, adding scheduling plugins related to co-location and priority preemption on top of native scheduling capabilities. Koordinator will be committed to promoting related enhancements into the upstream community of kubernetes and promoting the standardization of co-location technology.


## What's Next

Here are some recommended next steps:

- Start to [install Koordinator](./installation).
- Learn Koordinator's [Overview](architecture/overview).



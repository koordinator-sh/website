# Fine-grained CPU Orchestration

Fine-grained CPU Orchestration is an ability of koord-scheduler for improving the performance of CPU-sensitive workloads.

## Introduction

There is an increasing number of systems that leverage a combination of CPUs and hardware accelerators to support
latency-critical execution and high-throughput parallel computation. A high-performance environment is expected in
plenty of applications including in telecommunications, scientific computing, machine learning, financial services, and
data analytics.

However, pods in the Kubernetes cluster may interfere with others' running when they share the same physical resources
and both demand many resources. The sharing of CPU resources is almost inevitable. e.g. SMT threads (i.e. logical
processors) share execution units of the same core, and cores in the same chip share one last-level cache. The resource
contention can slow down the running of these CPU-sensitive workloads, resulting in high response latency (RT).

To improve the performance of CPU-sensitive workloads, koord-scheduler provides a mechanism of fine-grained CPU
orchestration. It enhances the CPU management of Kubernetes and supports detailed NUMA-locality and CPU exclusions.

For more information, please see [Design: Fine-grained CPU orchestration](/docs/designs/fine-grained-cpu-orchestration).

## Setup

### Prerequisite

- Kubernetes >= 1.18
- Koordinator >= 0.5

### Installation

Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to [Installation](/docs/installation).

### Configurations

Fine-grained CPU orchestration is *Enabled* by default. You can use it without any modification on the koord-scheduler config.

#### (Optional) Advanced Settings

For users who need deep insight, please configure the rules of fine-grained CPU orchestration by modifying the ConfigMap
`koord-scheduler-config` in the helm chart.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: koord-scheduler-config
  ...
data:
  koord-scheduler-config: |
    apiVersion: kubescheduler.config.k8s.io/v1beta2
    kind: KubeSchedulerConfiguration
    profiles:
      - schedulerName: koord-scheduler
      - pluginConfig:
        - name: NodeNUMAResource
          args:
            apiVersion: kubescheduler.config.k8s.io/v1beta2
            kind: NodeNUMAResource
            # the NUMA allocation strategy ('MostAllocated', 'LeastAllocated')
            # - MostAllocated: allocate from the NUMA node with the least available resources
            # - LeastAllocated(default): allocates from the NUMA node with the most available resources
            numaAllocateStrategy: LeastAllocated
            # the scoring strategy
            scoringStrategy:
              # the scoring strategy ('MostAllocated', 'LeastAllocated')
              # - MostAllocated(default): prefer the node with the least available resources
              # - LeastAllocated: prefer the node with the most available resources
              type: MostAllocated
              # the weights of each resource type
              resources:
              - name: cpu
                weight: 1
        plugins:
          # enable the NodeNUMAResource plugin
          preFilter:
            enabled:
              - name: NodeNUMAResource
          filter:
            enabled:
              - name: NodeNUMAResource
              ...
          score:
            enabled:
              - name: NodeNUMAResource
                weight: 1
              ...
          reserve:
            enabled:
              - name: NodeNUMAResource
          preBind:
            enabled:
              - name: NodeNUMAResource
```

The koord-scheduler takes this ConfigMap as [scheduler Configuration](https://kubernetes.io/docs/reference/scheduling/config/).
New configurations will take effect after the koord-scheduler restarts.

## Use Fine-grained CPU Orchestration

1. Create an `nginx` deployment with the YAML file below.

> Fine-grained CPU Orchestration allows pods to bind CPUs exclusively. To use fine-grained CPU orchestration, pods should set a label of [QoS Class](/docs/architecture/qos#definition)) and specify the cpu binding policy.

<!--
TODO: binding policy may not be required by default. to be done in v0.6.
-->

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-lsr
  labels:
    app: nginx-lsr
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx-lsr
  template:
    metadata:
      name: nginx-lsr
      labels:
        app: nginx-lsr
        koordinator.sh/qosClass: LSR # set the QoS class as LSR
      annotations:
        # set binding policy as FullPCPUs (prefer allocating full physical CPUs of the same core)
        scheduling.koordinator.sh/resource-spec: '{"preferredCPUBindPolicy": "FullPCPUs"}'
    spec:
      schedulerName: koord-scheduler # use the koord-scheduler
      containers:
      - name: nginx
        image: nginx
        resources:
          limits:
            cpu: '2'
          requests:
            cpu: '2'
      priorityClassName: koord-prod
```

2. Deploy the `nginx` deployment and check the scheduling result.

```bash
$ kubectl create -f nginx-deployment.yaml
deployment/nginx-lsr created
$ kubectl get pods -o wide | grep nginx
nginx-lsr-59cf487d4b-jwwjv   1/1     Running   0       21s     172.20.101.35    node-0   <none>         <none>
nginx-lsr-59cf487d4b-4l7r4   1/1     Running   0       21s     172.20.101.79    node-1   <none>         <none>
nginx-lsr-59cf487d4b-nrb7f   1/1     Running   0       21s     172.20.106.119   node-2   <none>         <none>
```

3. Check the CPU binding results of pods on `scheduling.koordinator.sh/resource-status` annotations.

```bash
$ kubectl get pod nginx-lsr-59cf487d4b-jwwjv -o jsonpath='{.metadata.annotations.scheduling\.koordinator\.sh/resource-status}'
{"cpuset":"2,54"}
```

We can see that the pod `nginx-lsr-59cf487d4b-jwwjv` binds 2 CPUs, and the IDs are 2,54, which are the logical
processors of the **same** core.

4. Change the binding policy in the `nginx` deployment with the YAML file below.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-lsr
  labels:
    app: nginx-lsr
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx-lsr
  template:
    metadata:
      name: nginx-lsr
      labels:
        app: nginx-lsr
        koordinator.sh/qosClass: LSR # set the QoS class as LSR
      annotations:
        # set binding policy as SpreadByPCPUs (prefer allocating physical CPUs of different cores)
        scheduling.koordinator.sh/resource-spec: '{"preferredCPUBindPolicy": "SpreadByPCPUs"}'
    spec:
      schedulerName: koord-scheduler # use the koord-scheduler
      containers:
      - name: nginx
        image: nginx
        resources:
          limits:
            cpu: '2'
          requests:
            cpu: '2'
      priorityClassName: koord-prod
```

5. Update the `nginx` deployment and check the scheduling result.

```bash
$ kubectl apply -f nginx-deployment.yaml
deployment/nginx-lsr created
$ kubectl get pods -o wide | grep nginx
nginx-lsr-7fcbcf89b4-rkrgg   1/1     Running   0       49s     172.20.101.35    node-0   <none>         <none>
nginx-lsr-7fcbcf89b4-ndbks   1/1     Running   0       49s     172.20.101.79    node-1   <none>         <none>
nginx-lsr-7fcbcf89b4-9v8b8   1/1     Running   0       49s     172.20.106.119   node-2   <none>         <none>
```

6. Check the new CPU binding results of pods on `scheduling.koordinator.sh/resource-status` annotations.

```bash
$ kubectl get pod nginx-lsr-7fcbcf89b4-rkrgg -o jsonpath='{.metadata.annotations.scheduling\.koordinator\.sh/resource-status}'
{"cpuset":"2-3"}
```

Now we can see that the pod `nginx-lsr-59cf487d4b-jwwjv` binds 2 CPUs, and the IDs are 2,3, which are the logical
processors of the **different** core.

7. (Optional) Advanced configurations.

```yaml
  labels:
    # koordinator QoS class of the pod. ('LSR', 'LSE')
    koordinator.sh/qosClass: LSR
  annotations:
    # `resource-spec` indicates the specification of resource scheduling, here we need to set `preferredCPUBindPolicy`.
    # `preferredCPUBindPolicy` indicating the CPU binding policy of the pod ('None', 'FullPCPUs', 'SpreadByPCPUs')
    # - None(default): perform no exclusive policy
    # - FullPCPUs: a bin-packing binding policy, prefer allocating full physical cores (SMT siblings)
    # - SpreadByPCPUs: a spread binding policy, prefer allocating logical cores (SMT threads) evenly across physical cores (SMT siblings)
    scheduling.koordinator.sh/resource-spec: '{"preferredCPUBindPolicy": "FullPCPUs"}'
```

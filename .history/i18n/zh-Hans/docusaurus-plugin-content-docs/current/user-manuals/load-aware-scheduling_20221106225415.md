# 负载均衡调度

Load Aware Scheduling 是 koord-scheduler 根据每个节点的实时负载平衡 Pod 调度的能力.

## 简介

负载均衡是资源调度中的常见问题. 未充分利用的节点会给集群带来很大的资源浪费, 而过度使用的节点可能会导致性能下降. 他们都不是有效的资管管理.

原生 Kubernetes scheduler 调度程序根据请求和节点分配来调度 Pod，既不考虑实时负载，也不考虑估计使用量。 当我们想要平衡每个节点上的 Pod 调度，使负载与原生调度器相同时，我们需要为应用程序设置精确的资源需求。 此外，由于 Koordinator 启用资源过度使用以实现更好的资源效率，我们需要一种机制来降低性能下降的概率并避免过度使用。

Koord-scheduler 可以通过与 koordlet 协作来检索节点指标。它能够根据节点利用率平衡在线 pod（LSE/LSR/LS）和离线 pod（BE）的调度。

![图片](/img/load-aware-scheduling-arch.svg)

For more information, please see [Design: Load Aware Scheduling](/docs/designs/load-aware-scheduling).

## 设置

### 前提条件

- Kubernetes >= 1.18
- Koordinator >= 0.4

### 安装

请确保 Koordinator 组件已正确安装在你的集群中. 如果没有，请参考[安装](/docs/installation).

### 配置

默认情况下，负载感知调度是启用的, 您可以在不修改 koord-scheduler 配置的情况下使用它.

#### （可选）高级设置

对于需要深入了解的用户, 请通过修改helm chart中的 ConfigMap `koord-scheduler-config` 规则来配置负载感知调度.

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
        plugins:
          # enable the LoadAwareScheduling plugin
          filter:
            enabled:
              - name: LoadAwareScheduling
              ...
          score:
            enabled:
              - name: LoadAwareScheduling
                weight: 1
              ...
          reserve:
            enabled:
              - name: LoadAwareScheduling
          ...
        pluginConfig:
        # configure the thresholds and weights for the plugin
        - name: LoadAwareScheduling
          args:
            apiVersion: kubescheduler.config.k8s.io/v1beta2
            kind: LoadAwareSchedulingArgs
            # whether to filter nodes where koordlet fails to update NodeMetric
            filterExpiredNodeMetrics: true
            # the expiration threshold seconds when using NodeMetric
            nodeMetricExpirationSeconds: 300
            # weights of resources
            resourceWeights:
              cpu: 1
              memory: 1
            # thresholds (%) of resource utilization
            usageThresholds:
              cpu: 75
              memory: 85
            # the factor (%) for estimating resource usage
            estimatedScalingFactors:
              cpu: 80
              memory: 70
```

koord-scheduler 将 ConfigMap [scheduler Configuration](https://kubernetes.io/docs/reference/scheduling/config/).
新配置将在 koord-scheduler 重新启动后生效.

## 使用负载感知调度

1. 使用下面的 YAML 文件部署一个 `stress` pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: stress-demo
  labels:
    name: stress-demo
spec:
  containers:
    - args:
        - '--vm'
        - '2'
        - '--vm-bytes'
        - '2G'
        - '-c'
        - '2'
        - '--vm-hang'
        - '2'
      command:
        - stress
      image: polinux/stress
      imagePullPolicy: Always
      name: stress
      resources:
        limits:
          cpu: '2'
          memory: 4Gi
        requests:
          cpu: 200m
          memory: 1Gi
  restartPolicy: Always
  schedulerName: koord-scheduler # use the koord-scheduler
```

```bash
$ kubectl create -f stress-demo.yaml
pod/stress-demo created
```

2. 观察pod的状态，直到它开始运行.

```bash
$ kubectl get pod stress-demo -w
NAME          READY   STATUS    RESTARTS   AGE    IP             NODE     NOMINATED NODE   READINESS GATES
stress-demo   1/1     Running   0          20s    172.20.100.6   node-0   <none>           <none>
```

这个 pod 调度在 node `node-0`.

3. 检查每个node节点的负载.

```bash
$ kubectl top node
NAME     CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
node-0   6450m        19%    25091Mi         19%
node-2   3280m        10%    17535Mi         13%
node-1   2687m        8%     9631Mi          7%
```
按照以上顺序，当节点 `node-1` 负载最低时节点 `node-0` 的负载最高。

1. 使用下面的 YAML 文件部署 `nginx` deployment.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      name: nginx
      labels:
        app: nginx
    spec:
      schedulerName: koord-scheduler # use the koord-scheduler
      containers:
      - name: nginx
        image: nginx
        resources:
          limits:
            cpu: 500m
          requests:
            cpu: 500m
```

```bash
$ kubectl create -f nginx-deployment.yaml
deployment/nginx created
```

5. 检查 `nginx` pods 的调度结果.

```bash
$ kubectl get pods | grep nginx
nginx-7585b886cb-5b6vq   1/1     Running   0       32s     172.20.101.6    node-1   <none>         <none>
nginx-7585b886cb-4mdlh   1/1     Running   0       32s     172.20.106.20   node-2   <none>         <none>
```

现在我们可以看到 `nginx` pods 被调度在 `node-0`  (负载最高的节点) 以外的节点上.
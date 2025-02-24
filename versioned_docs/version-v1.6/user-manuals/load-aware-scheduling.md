# Load Aware Scheduling

Load Aware Scheduling is an ability of koord-scheduler for balancing pods scheduling based on the real-time load of each node.

## Introduction

Load balancing is a common issue in resource scheduling. Under-utilized nodes bring much resource waste to the
cluster, while over-utilized nodes are likely to cause performance degradation. Neither of them is suitable for
efficient resource management.

The native Kubernetes scheduler schedules pods based on the requests and the allocation of nodes, considering neither
the real-time load nor the estimated usage. When we want to balance the pod scheduling on each node and make the loads
even with the native scheduler, we need to set precise resource requirements for the applications. Moreover, since
Koordinator enables resource overcommitment to achieve better resource efficiency, we need a mechanism to reduce the
probability of performance degradation and avoid over-utilization.

Koord-scheduler can retrieve node metrics by cooperating with the koordlet. It provides the ability to balance the
scheduling of both the online (LSE/LSR/LS) pods and offline (BE) pods based on node utilization.

![image](/img/load-aware-scheduling-arch.svg)

For more information, please see [Design: Load Aware Scheduling](/docs/designs/load-aware-scheduling).

## Setup

### Prerequisite

- Kubernetes >= 1.18
- Koordinator >= 0.4

### Installation

Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to [Installation](/docs/installation).

### Global Configuration via plugin args

Load-aware scheduling is *Enabled* by default. You can use it without any modification on the koord-scheduler config.

For users who need deep insight, please configure the rules of load-aware scheduling by modifying the ConfigMap
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
            # thresholds (%) of resource utilization of Prod Pods
            prodUsageThresholds:
              cpu: 55
              memory: 65
            # enable score according Prod usage
            scoreAccordingProdUsage: true
            # the factor (%) for estimating resource usage
            estimatedScalingFactors:
              cpu: 80
              memory: 70
            # enable resource utilization filtering and scoring based on percentile statistics
            aggregated:
              usageThresholds:
                cpu: 65
                memory: 75
              usageAggregationType: "p99"
              scoreAggregationType: "p99"
```

The koord-scheduler takes this ConfigMap as [scheduler Configuration](https://kubernetes.io/docs/reference/scheduling/config/).
New configurations will take effect after the koord-scheduler restarts.

| Field | Description | Version |
|-------|-------------| --------|
| filterExpiredNodeMetrics | filterExpiredNodeMetrics indicates whether to filter nodes where koordlet fails to update NodeMetric. Enabled by default but in Helm chart, it's disabled. | >= v0.4.0 |
| nodeMetricExpirationSeconds | nodeMetricExpirationSeconds indicates the NodeMetric expiration in seconds. When NodeMetrics expired, the node is considered abnormal. Default is 180 seconds.| >= v0.4.0 |
| resourceWeights | resourceWeights indicates the weights of resources. The weights of CPU and Memory are both 1 by default.| >= v0.4.0 |
| usageThresholds | usageThresholds indicates the resource utilization threshold of the whole machine. The default for CPU is 65%, and the default for memory is 95%.| >= v0.4.0 |
| estimatedScalingFactors | estimatedScalingFactors indicates the factor when estimating resource usage. The default value of CPU is 85%, and the default value of Memory is 70%. | >= v0.4.0 |
| prodUsageThresholds| prodUsageThresholds indicates the resource utilization threshold of Prod Pods compared to the whole machine. Not enabled by default. | >= v1.1.0 |
| scoreAccordingProdUsage | scoreAccordingProdUsage controls whether to score according to the utilization of Prod Pod. | >= v1.1.0 |
| aggregated | aggregated supports resource utilization filtering and scoring based on percentile statistics. | >= v1.1.0 |

The fields of Aggregated:

| Field | Description | Version |
|-------|-------------| --------|
| usageThresholds | usageThresholds indicates the resource utilization threshold of the machine based on percentile statistics. | >= v1.1.0|
| usageAggregationType | usageAggregationType indicates the percentile type of the machine's utilization when filtering. Currently supports `avg`, `p50`, `p90`, `p95` and `p99`.  | >= v1.1.0 |
| usageAggregatedDuration | usageAggregatedDuration indicates the statistical period of the percentile of the machine's utilization when filtering. When this field is not set, the scheduler uses the data of the maximum period in NodeMetrics by default. | >= v1.1.0|
| scoreAggregationType | scoreAggregationType indicates the percentile type of the machine's utilization when scoring. Currently supports `avg`, `p50`, `p90`, `p95` and `p99`. | >= v1.1.0
| scoreAggregatedDuration | scoreAggregatedDuration indicates the statistical period of the percentile of Prod Pod's utilization when scoring. When this field is not set, the scheduler uses the data of the maximum period in NodeMetrics by default. | >= v1.1.0 |

### Configure filter thresholds by Node

The configuration through the plugin can be used as the default global configuration of the cluster, and users can also set the load thresholds of the node dimension by appending annotation to the node. When the annotation exists on the node, it will be filtered according to the parameters specified by the annotation.

The annotation is defined as follows:

```go
const (
  AnnotationCustomUsageThresholds = "scheduling.koordinator.sh/usage-thresholds"
)

// CustomUsageThresholds supports user-defined node resource utilization thresholds.
type CustomUsageThresholds struct {
	// UsageThresholds indicates the resource utilization threshold of the whole machine.
	UsageThresholds map[corev1.ResourceName]int64 `json:"usageThresholds,omitempty"`
	// ProdUsageThresholds indicates the resource utilization threshold of Prod Pods compared to the whole machine
	ProdUsageThresholds map[corev1.ResourceName]int64 `json:"prodUsageThresholds,omitempty"`
	// AggregatedUsage supports resource utilization filtering and scoring based on percentile statistics
	AggregatedUsage *CustomAggregatedUsage `json:"aggregatedUsage,omitempty"`
}

type CustomAggregatedUsage struct {
	// UsageThresholds indicates the resource utilization threshold of the machine based on percentile statistics
	UsageThresholds map[corev1.ResourceName]int64 `json:"usageThresholds,omitempty"`
	// UsageAggregationType indicates the percentile type of the machine's utilization when filtering
	UsageAggregationType slov1alpha1.AggregationType `json:"usageAggregationType,omitempty"`
	// UsageAggregatedDuration indicates the statistical period of the percentile of the machine's utilization when filtering
	UsageAggregatedDuration *metav1.Duration `json:"usageAggregatedDuration,omitempty"`
}
```

## Use Load Aware Scheduling

### Load-aware scheduling by the whole machine load 

The example cluster in this article has three 4-core 16GiB nodes.

1. Deploy a `stress` pod with the YAML file below.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stress-demo
  namespace: default
  labels:
    app: stress-demo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: stress-demo
  template:
    metadata:
      name: stress-demo
      labels:
        app: stress-demo
    spec:
      containers:
        - args:
            - '--vm'
            - '2'
            - '--vm-bytes'
            - '1600M'
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
              cpu: '2'
              memory: 4Gi
      restartPolicy: Always
      schedulerName: koord-scheduler # use the koord-scheduler
```

```bash
$ kubectl create -f stress-demo.yaml
deployment.apps/stress-demo created
```

2. Watch the pod status util it becomes running.

```bash
$ kubectl get pod -o wide
NAME                           READY   STATUS    RESTARTS   AGE   IP           NODE                    NOMINATED NODE   READINESS GATES
stress-demo-7fdd89cc6b-gcnzn   1/1     Running   0          82s   10.0.3.114   cn-beijing.10.0.3.112   <none>           <none>
```

The pod `stress-demo-7fdd89cc6b-gcnzn` is scheduled on `cn-beijing.10.0.3.112`.

3. Check the load of each node.

```bash
$ kubectl top node
NAME                    CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
cn-beijing.10.0.3.110   92m          2%     1158Mi          9%
cn-beijing.10.0.3.111   77m          1%     1162Mi          9%
cn-beijing.10.0.3.112   2105m        53%    3594Mi          28%
```

In above order, `cn-beijing.10.0.3.112` has the highest load, while `cn-beijing.10.0.3.111` has the lowest load.

4. Deploy an `nginx` deployment with the YAML file below.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-with-loadaware
  labels:
    app: nginx
spec:
  replicas: 6
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
$ kubectl create -f nginx-with-loadaware.yaml
deployment/nginx-with-loadawre created
```

5. Check the scheduling results of `nginx` pods.

```bash
$ kubectl get pods | grep nginx
nginx-with-loadaware-5646666d56-224jp   1/1     Running   0          18s   10.0.3.118   cn-beijing.10.0.3.110   <none>           <none>
nginx-with-loadaware-5646666d56-7glt9   1/1     Running   0          18s   10.0.3.115   cn-beijing.10.0.3.110   <none>           <none>
nginx-with-loadaware-5646666d56-kcdvr   1/1     Running   0          18s   10.0.3.119   cn-beijing.10.0.3.110   <none>           <none>
nginx-with-loadaware-5646666d56-qzw4j   1/1     Running   0          18s   10.0.3.113   cn-beijing.10.0.3.111   <none>           <none>
nginx-with-loadaware-5646666d56-sbgv9   1/1     Running   0          18s   10.0.3.120   cn-beijing.10.0.3.111   <none>           <none>
nginx-with-loadaware-5646666d56-z79dn   1/1     Running   0          18s   10.0.3.116   cn-beijing.10.0.3.111   <none>           <none>
```

Now we can see `nginx` pods get scheduled on the nodes other than `cn-beijing.10.0.3.112` (node with the highest load).


### Load-aware scheduling by the Prod Pods

If there are many BestEffort Pods scheduled in one Node, the latency-sensitive Pods may fail to schedule cause the load of node has reached the limit of usage.  In Koordinator v1.1.0, load-aware scheduling is optimized for this scenario. For latency-sensitive(LSE/LSR/LS) Pods, priority is given to scheduling to the nodes with low total utilization of the Prod Pods. BestEffort(BE) Pods are scheduled according to the utilization level of the whole node.

Enable relevant optimizations by setting the following parameters:

| Field | Description | Version |
|-------|-------------| --------|
| prodUsageThresholds| prodUsageThresholds indicates the resource utilization threshold of Prod Pods compared to the whole machine. Not enabled by default. | >= v1.1.0 |
| scoreAccordingProdUsage | scoreAccordingProdUsage controls whether to score according to the utilization of Prod Pod. | >= v1.1.0 |

### Load-aware scheduling based on percentile statistics

In Koordinator v1.0 and previous versions, load-aware scheduling is filtered and scored according to the average utilization data reported by koordlet. But the average value hides a lot of information, so in Koordinator v1.1, koordlet adds utilization aggregation data based on percentile statistics. Corresponding adaptations have also been made on the scheduler side.

Enable relevant optimizations by setting the following parameters:

| Field | Description | Version |
|-------|-------------| --------|
| aggregated | aggregated supports resource utilization filtering and scoring based on percentile statistics. | >= v1.1.0 |

The fields of Aggregated:

| Field | Description | Version |
|-------|-------------| --------|
| usageThresholds | usageThresholds indicates the resource utilization threshold of the machine based on percentile statistics. | >= v1.1.0|
| usageAggregationType | usageAggregationType indicates the percentile type of the machine's utilization when filtering. Currently supports `avg`, `p50`, `p90`, `p95` and `p99`.  | >= v1.1.0 |
| usageAggregatedDuration | usageAggregatedDuration indicates the statistical period of the percentile of the machine's utilization when filtering. When this field is not set, the scheduler uses the data of the maximum period in NodeMetrics by default. | >= v1.1.0|
| scoreAggregationType | scoreAggregationType indicates the percentile type of the machine's utilization when scoring. Currently supports `avg`, `p50`, `p90`, `p95` and `p99`. | >= v1.1.0
| scoreAggregatedDuration | scoreAggregatedDuration indicates the statistical period of the percentile of Prod Pod's utilization when scoring. When this field is not set, the scheduler uses the data of the maximum period in NodeMetrics by default. | >= v1.1.0 |

The `aggregated` and the `usageThresholds` parameter are mutually exclusive. When both are configured, the `aggregated` will be used.
In addition, Pod type awareness is not currently supported.
# Load Aware Descheduling

The load-aware scheduling supported in the scheduler can select nodes with lower loads to run new Pods during scheduling, but as time, cluster environment changes, and changes in traffic/requests faced by workloads, the utilization of nodes will change dynamically Changes in the cluster will break the original load balance between nodes in the cluster, and even extreme load imbalance may occur, affecting the runtime quality of the workload.

koord-descheduler perceives changes in the load of nodes in the cluster, automatically optimizes nodes that exceed the safety load to prevents extreme load imbalance.

## Introduction

The LowNodeLoad plugin in the koord-descheduler is responsible for sensing the load of the node, and reducing the load hotspot by evict/migrate Pod. The `LowNodeLoad` plugin is different from the Kubernetes native descheduler plugin LowNodeUtilization in that `LowNodeLoad` decides to deschedule based on the actual utilization of nodes, while LowNodeUtilization decides to deschedule based on the resource allocation.

The `LowNodeLoad` plugin has two most important parameters:

- `highThresholds` defines the target usage threshold of resources. The Pods on nodes exceeding this threshold will be evicted/migrated.
- `lowThresholds` defines the low usage threshold of resources. The Pods on nodes below this threshold will not be evicted/migrated.

Take the following figure as an example, `lowThresholds` is 45%, `highThresholds` is 70%, we can classify nodes into three categories:

1. Idle Node. Nodes with resource utilization below 45%;
2. Normal Node. For nodes whose resource utilization is higher than 45% but lower than 70%, this load water level range is a reasonable range we expect
3. Hotspot Node. If the node resource utilization rate is higher than 70%, the node will be judged as unsafe and belongs to the hotspot node, and some pods should be expelled to reduce the load level so that it does not exceed 70%.

![image](/img/low-node-load.png)

After identifying which nodes are hotspots, descheduler will perform a eviction/migration operation to evict some Pods from hotspot nodes to idle nodes.

If the total number of idle nodes in a cluster is not many, descheduling will be terminated. This can be helpful in large clusters where some nodes may be underutilized frequently or for short periods of time. By default, `numberOfNodes` is set to zero. This capability can be enabled by setting the parameter `numberOfNodes`.
Before migration, descheduler will calculate the actual free capacity to ensure that the sum of the actual utilization of the Pods to be migrated does not exceed the total free capacity in the cluster. These actual free capacities come from idle nodes, and the actual free capacity of an idle node = `(highThresholds - current load of the node) * total capacity of the node`. Suppose the load level of node A is 20%, the highThresholdss is 70%, and the total CPU of node A is 96C, then `(70%-20%) * 96 = 48C`, and this 48C is the free capacity that can be carried.

In addition, when migrating hotspot nodes, the Pods on the nodes will be filtered. Currently, descheduler supports multiple filtering parameters, which can avoid migration and expulsion of very important Pods:

- Filter by namespace. Can be configured to filter only certain namespaces or filter out certain namespaces
- Filter by pod selector. Pods can be filtered out through the label selector, or Pods with certain Labels can be excluded
- Configure `nodeFit` to check whether the scheduling rules have candidate nodes. When enabled, descheduler checks whether there is a matching Node in the cluster according to the Node Affinity/Node Selector/Toleration corresponding to the candidate Pod. If not, the Pod will not be evicted for migration. If you set `nodeFit` to false, the migration controller in the descheduler will complete the capacity reservation at this time, and start the migration after ensuring that there are resources.

After the Pods are filtered out, these Pods are sorted from multiple dimensions such as QoSClass, Priority, actual usage, and creation time.

After pods have been filtered and sorted, the migration operation begins. Before migration, it will check whether the remaining free capacity is satisfied and whether the load the current node is higher than the target safety threshold. If one of these two conditions cannot be met, descheduling will stop. Every time a Pod is migrated, the remaining free capacity will be withheld, and the load of the current node will be adjusted at the same time until the remaining capacity is insufficient or the load reaches the safety threshold.

## Setup

### Prerequisite

- Kubernetes >= 1.18
- Koordinator >= 1.1.0

### Installation

Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to [Installation](/docs/installation).

### Global Configuration via plugin args

Load-aware descheduling is *Disabled* by default. You can modify the ConfigMap `koord-descheduler-config` to enable the plugin.

For users who need deep insight, please configure the rules of load-aware descheduling by modifying the ConfigMap
`koord-descheduler-config` in the helm chart. New configurations will take effect after the koord-descheduler restarts.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: koord-descheduler-config
  ...
data:
  koord-descheduler-config: |
    apiVersion: descheduler/v1alpha2
    kind: DeschedulerConfiguration
    ...
    # Execute the LowNodeLoad plugin every 60s
    deschedulingInterval: 60s  
    profiles:
      - name: koord-descheduler
        plugins:
          deschedule:
            disabled:
              - name: "*"
          balance:
            enabled:
              - name: LowNodeLoad  # Configure to enable the LowNodeLoad plugin
          ....
        pluginConfig:
        - name: LowNodeLoad
          args:
            apiVersion: descheduler/v1alpha2
            kind: LowNodeLoadArgs
            evictableNamespaces:
            # include and exclude are mutually exclusive, only one of them can be configured.
            # include indicates that only the namespace configured below will be processed
            # include:
            #   - test-namespace
              # exclude means to only process namespaces other than those configured below
              exclude:
                - "kube-system"
                - "koordinator-system"
            # lowThresholds defines the low usage threshold of resources
            lowThresholds:
              cpu: 20
              memory: 30
            # highThresholds defines the target usage threshold of resources
            highThresholds:
              cpu: 50
              memory: 60
        ....
```

| Field | Description | Version |
|-------|-------------| --------|
| numberOfNodes | NumberOfNodes can be configured to activate the strategy only when the number of under utilized nodes are above the configured value. This could be helpful in large clusters where a few nodes could go under utilized frequently or for a short period of time. By default, NumberOfNodes is set to zero. | >= v1.1.0 |
| evictableNamespaces | Naming this one differently since namespaces are still considered while considering resources used by pods but then filtered out before eviction. | >= v1.1.0 |
| nodeSelector | NodeSelector selects the nodes that matched labelSelector. | >= v1.1.0 |
| podSelectors | PodSelectors selects the pods that matched labelSelector. | >= v1.1.0 |
| nodeFit | NodeFit if enabled, it will check whether the candidate Pods have suitable nodes, including NodeAffinity, TaintTolerance, and whether resources are sufficient. By default, NodeFit is set to true. | >= v1.1.0 |
| useDeviationThresholds | If UseDeviationThresholds is set to `true`, the thresholds are considered as percentage deviations from mean resource usage. `lowThresholds` will be deducted from the mean among all nodes and `highThresholds` will be added to the mean. A resource consumption above (resp. below) this window is considered as overutilization (resp. underutilization). | >= v1.1.0 |
| highThresholds | HighThresholds defines the target usage threshold of resources | >= v1.1.0 |
| lowThresholds | LowThresholds defines the low usage threshold of resources | >= v1.1.0 |

## Use Load Aware Descheduling

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

4. Update `koord-descheduler-config` to enable `LowNodeLoad` plugin.

5. Observe the Pod changes and wait for the koord-descheduler to execute the eviction/migration operation.

```bash
$ kubectl get pod -w
NAME                           READY   STATUS               RESTARTS   AGE     IP           NODE                    NOMINATED NODE   READINESS GATES
stress-demo-7fdd89cc6b-l7psv   1/1     Running              0          4m45s   10.0.3.127   cn-beijing.10.0.3.121   <none>           <none>
stress-demo-7fdd89cc6b-l7psv   1/1     Terminating          0          8m34s   10.0.3.127   cn-beijing.10.0.3.121   <none>           <none>
stress-demo-7fdd89cc6b-b4c5g   0/1     Pending              0          0s      <none>       <none>                  <none>           <none>
stress-demo-7fdd89cc6b-b4c5g   0/1     Pending              0          0s      <none>       <none>                  <none>           <none>
stress-demo-7fdd89cc6b-b4c5g   0/1     Pending              0          0s      <none>       cn-beijing.10.0.3.124   <none>           <none>
stress-demo-7fdd89cc6b-b4c5g   0/1     ContainerCreating    0          0s      <none>       cn-beijing.10.0.3.124   <none>           <none>
stress-demo-7fdd89cc6b-b4c5g   0/1     ContainerCreating    0          3s      <none>       cn-beijing.10.0.3.124   <none>           <none>
stress-demo-7fdd89cc6b-b4c5g   1/1     Running              0          20s     10.0.3.130   cn-beijing.10.0.3.124   <none>           <none>
```

5. Observe the Event, you can see the following migration records

```bash
$ kubectl get event |grep stress-demo-7fdd89cc6b-l7psv
2m45s       Normal    Evicting                  podmigrationjob/20c8c445-7fa0-4cf7-8d96-7f03bb1097d9   Try to evict Pod "default/stress-demo-7fdd89cc6b-l7psv"
2m12s       Normal    EvictComplete             podmigrationjob/20c8c445-7fa0-4cf7-8d96-7f03bb1097d9   Pod "default/stress-demo-7fdd89cc6b-l7psv" has been evicted
11m         Normal    Scheduled                 pod/stress-demo-7fdd89cc6b-l7psv                       Successfully assigned default/stress-demo-7fdd89cc6b-l7psv to cn-beijing.10.0.3.121
11m         Normal    AllocIPSucceed            pod/stress-demo-7fdd89cc6b-l7psv                       Alloc IP 10.0.3.127/24
11m         Normal    Pulling                   pod/stress-demo-7fdd89cc6b-l7psv                       Pulling image "polinux/stress"
10m         Normal    Pulled                    pod/stress-demo-7fdd89cc6b-l7psv                       Successfully pulled image "polinux/stress" in 12.687629736s
10m         Normal    Created                   pod/stress-demo-7fdd89cc6b-l7psv                       Created container stress
10m         Normal    Started                   pod/stress-demo-7fdd89cc6b-l7psv                       Started container stress
2m14s       Normal    Killing                   pod/stress-demo-7fdd89cc6b-l7psv                       Stopping container stress
11m         Normal    SuccessfulCreate          replicaset/stress-demo-7fdd89cc6b                      Created pod: stress-demo-7fdd89cc6b-l7psv
```

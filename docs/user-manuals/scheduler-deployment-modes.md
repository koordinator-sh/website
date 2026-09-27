# Koord-Scheduler Deployment Modes

Koord-scheduler can run as part of a complete Koordinator installation, as a standalone scheduler component, or as multiple scheduler instances for sharded scheduling. This document describes the scheduler-specific deployment choices and the configuration that should be changed when other Koordinator components are not installed.

## Standalone Scheduler

Use standalone mode when the cluster only needs koord-scheduler capabilities, such as Resource Reservation, and does not need koordlet, koord-manager, koord-device-daemon, or koord-descheduler.

### Prerequisites

- Kubernetes >= 1.18.
- Koordinator CRDs required by the scheduler features you use. For a simple and compatible setup, install the Koordinator CRDs from the chart version that matches the scheduler image.
- The `koord-scheduler` Deployment, its `koord-scheduler-config` ConfigMap, and the `koord-scheduler` RBAC resources.
- Workloads that should use Koordinator scheduling must set `spec.schedulerName: koord-scheduler`, unless you configure another scheduler name in the scheduler profile.

### Render Scheduler Resources

The Helm chart installs all Koordinator components by default. For a standalone scheduler deployment, render the chart and apply only the scheduler resources plus CRDs.

```bash
helm repo add koordinator-sh https://koordinator-sh.github.io/charts/
helm repo update

helm pull koordinator-sh/koordinator --version 1.8.0 --untar
kubectl create namespace koordinator-system --dry-run=client -o yaml | kubectl apply -f -
```

Render the CRDs and scheduler manifests from the same chart:

```bash
helm template koordinator ./koordinator \
  --namespace koordinator-system \
  --show-only templates/crd/analysis.koordinator.sh_recommendations.yaml \
  --show-only templates/crd/config.koordinator.sh_clustercolocationprofiles.yaml \
  --show-only templates/crd/quota.koordinator.sh_elasticquotaprofiles.yaml \
  --show-only templates/crd/scheduling.koordinator.sh_clusternetworktopologies.yaml \
  --show-only templates/crd/scheduling.koordinator.sh_devices.yaml \
  --show-only templates/crd/scheduling.koordinator.sh_podmigrationjobs.yaml \
  --show-only templates/crd/scheduling.koordinator.sh_reservations.yaml \
  --show-only templates/crd/scheduling.koordinator.sh_scheduleexplanations.yaml \
  --show-only templates/crd/scheduling.sigs.k8s.io_elasticquotas.yaml \
  --show-only templates/crd/scheduling.sigs.k8s.io_podgroups.yaml \
  --show-only templates/crd/slo.koordinator.sh_nodemetrics.yaml \
  --show-only templates/crd/slo.koordinator.sh_nodeslos.yaml \
  --show-only templates/crd/topology.node.k8s.io_noderesourcetopologies.yaml \
  --show-only templates/rbac/koord-scheduler.yaml \
  --show-only templates/koord-scheduler-config.yaml \
  --show-only templates/koord-scheduler.yaml \
  > koord-scheduler-standalone.yaml

kubectl apply -f koord-scheduler-standalone.yaml
```

Do not apply the templates for `koord-manager`, `koordlet`, `koord-device-daemon`, `koord-descheduler`, or webhook configurations when the goal is a scheduler-only installation.

### Disable Plugins That Depend on Other Components

The default scheduler profile enables some plugins that consume data reported by other Koordinator components. In standalone mode, remove these plugins from `koord-scheduler-config`:

| Plugin | Depends on | Standalone action |
| --- | --- | --- |
| `LoadAwareScheduling` | `NodeMetric` data reported by Koordinator components | Remove from `pluginConfig`, `filter`, `score`, and `reserve`. |
| `NodeNUMAResource` | `NodeResourceTopology` data reported by koordlet | Remove from `preFilter`, `filter`, `score`, `reserve`, and `preBind`. |
| `DeviceShare` | `Device` data reported by koord-device-daemon or koordlet | Remove from `pluginConfig`, `preFilter`, `filter`, `score`, `reserve`, and `preBind`. |

For example, keep the Reservation plugin and the default Kubernetes scheduler plugins, but remove the component-dependent plugins:

```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
leaderElection:
  leaderElect: true
  resourceLock: leases
  resourceName: koord-scheduler
  resourceNamespace: koordinator-system
profiles:
- schedulerName: koord-scheduler
  pluginConfig:
  - name: NodeResourcesFit
    args:
      apiVersion: kubescheduler.config.k8s.io/v1
      kind: NodeResourcesFitArgs
      scoringStrategy:
        type: LeastAllocated
        resources:
        - name: cpu
          weight: 1
        - name: memory
          weight: 1
  plugins:
    preFilter:
      enabled:
      - name: SchedulingHint
      - name: Reservation
      - name: Coscheduling
      - name: ElasticQuota
    filter:
      enabled:
      - name: Reservation
    postFilter:
      disabled:
      - name: "*"
      enabled:
      - name: Reservation
      - name: Coscheduling
      - name: ElasticQuota
      - name: DefaultPreemption
    preScore:
      enabled:
      - name: Reservation
      - name: Coscheduling
    score:
      enabled:
      - name: Reservation
        weight: 5000
      - name: Coscheduling
        weight: 1
    reserve:
      enabled:
      - name: Reservation
      - name: Coscheduling
      - name: ElasticQuota
    permit:
      enabled:
      - name: Coscheduling
    preBind:
      enabled:
      - name: Reservation
      - name: Coscheduling
      - name: DefaultPreBind
    bind:
      disabled:
      - name: "*"
      enabled:
      - name: Reservation
      - name: DefaultBinder
    postBind:
      enabled:
      - name: Coscheduling
```

If you only need Resource Reservation, keep the `Reservation` plugin enabled. The Reservation controller is embedded in koord-scheduler, so no separate koord-manager deployment is required for the scheduler to update Reservation status.

### Supported Features in Standalone Mode

Standalone mode supports scheduler-only capabilities, including:

- Kubernetes scheduler framework plugins and default filtering behavior.
- Resource Reservation.
- Scheduling Hint.
- Coscheduling and ElasticQuota when their CRDs are installed and their plugins/controllers are kept enabled.

Features that require other Koordinator components are unavailable or degraded in standalone mode:

- Load-aware scheduling without `NodeMetric` reports.
- NUMA-aware scheduling without `NodeResourceTopology` reports.
- Device scheduling without `Device` reports.
- Runtime QoS, CPU suppression, CPU burst, memory QoS, and other node-level features without koordlet.
- Descheduling features without koord-descheduler.

### Verify Standalone Mode

```bash
kubectl -n koordinator-system get deploy koord-scheduler
kubectl -n koordinator-system get lease koord-scheduler -o jsonpath='{.spec.holderIdentity}'
kubectl -n koordinator-system logs deploy/koord-scheduler
```

For Resource Reservation, create a Reservation and a matching Pod as described in [Resource Reservation](./resource-reservation), then verify that the Reservation becomes `Available` and the owner Pod is scheduled by `koord-scheduler`.

## High Availability

The default Helm values set `scheduler.replicas` to `2`. With one scheduler profile and one leader-election lock, this is an active/standby deployment: only the elected leader schedules Pods, and the other replicas are ready to take over.

```yaml
leaderElection:
  leaderElect: true
  resourceLock: leases
  resourceName: koord-scheduler
  resourceNamespace: koordinator-system
profiles:
- schedulerName: koord-scheduler
```

Check the current leader:

```bash
kubectl -n koordinator-system get lease koord-scheduler -o jsonpath='{.spec.holderIdentity}'
```

Keep the same `leaderElection.resourceName` for replicas of the same scheduler instance. Use different leader-election locks only when you intentionally run independent scheduler instances.

## Multi-Scheduler Mode

Multi-scheduler mode, also called multi-master scheduler mode, runs multiple independent koord-scheduler instances so scheduling work can be sharded across scheduler names or tenants.

Use this mode when:

- Different tenants or workload classes should be handled by different scheduler instances.
- Scheduling throughput should be scaled horizontally by splitting queues.
- Each scheduler shard can own a distinct `schedulerName`.

### Configure Scheduler Shards

Create one scheduler Deployment and one scheduler ConfigMap per shard. Each shard should have:

- A unique Deployment name.
- A unique `leaderElection.resourceName`.
- One or more profiles whose `schedulerName` values belong to that shard.
- A workload-routing rule that sends Pods to the shard's scheduler name.

Example shard A:

```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
leaderElection:
  leaderElect: true
  resourceLock: leases
  resourceName: koord-scheduler-a
  resourceNamespace: koordinator-system
profiles:
- schedulerName: koord-scheduler-a
```

Example shard B:

```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
leaderElection:
  leaderElect: true
  resourceLock: leases
  resourceName: koord-scheduler-b
  resourceNamespace: koordinator-system
profiles:
- schedulerName: koord-scheduler-b
```

Route workloads by setting `spec.schedulerName`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: example
spec:
  schedulerName: koord-scheduler-a
  containers:
  - name: pause
    image: registry.k8s.io/pause:3.9
```

Koordinator also supports the label `scheduling.koordinator.sh/scheduler-name` as an internal scheduler-name override. This is useful when another component or policy decides the target scheduler shard.

```yaml
metadata:
  labels:
    scheduling.koordinator.sh/scheduler-name: koord-scheduler-b
spec:
  schedulerName: koord-scheduler
```

### Controller Plugins

Some scheduler plugins start embedded controllers, such as `Reservation`, `Coscheduling`, and `ElasticQuota`. In a multi-scheduler topology, decide which scheduler instance should run shared controllers. Disable controller plugins on the other instances with `--controller-plugins`.

Examples:

```text
--controller-plugins=Reservation
--controller-plugins=-Reservation,-Coscheduling,-ElasticQuota
--controller-plugins=*,-ElasticQuota
```

If the chart template does not expose this argument directly, add it to the `koord-scheduler` container args in the scheduler Deployment template used for that shard.

### Verify Multi-Scheduler Mode

```bash
kubectl -n koordinator-system get lease koord-scheduler-a koord-scheduler-b
kubectl get pods -A -o custom-columns=NAMESPACE:.metadata.namespace,NAME:.metadata.name,SCHEDULER:.spec.schedulerName,NODE:.spec.nodeName
```

Each shard should have its own leader lease. Pods routed to `koord-scheduler-a` should be scheduled by the `koord-scheduler-a` instance, and Pods routed to `koord-scheduler-b` should be scheduled by the `koord-scheduler-b` instance.

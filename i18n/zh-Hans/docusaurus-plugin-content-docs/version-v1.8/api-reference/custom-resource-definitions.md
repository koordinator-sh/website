# Custom Resource Definitions

## Introduction
Koordinator extends Kubernetes functionality through Custom Resource Definitions (CRDs) that enable advanced scheduling, resource management, and performance optimization. These CRDs provide declarative interfaces for configuring and managing various aspects of cluster behavior, including resource recommendations, colocation policies, quota management, reservations, and system-level objectives. This documentation provides comprehensive details on each CRD, including schema definitions, field descriptions, validation rules, and usage patterns.

## API Groups and Versions
Koordinator's CRDs are organized into several API groups, each serving a specific purpose within the system architecture:

- **analysis.koordinator.sh**: Provides resource optimization recommendations
- **config.koordinator.sh**: Manages colocation profiles for workload placement
- **quota.koordinator.sh**: Handles elastic quota profiles for resource allocation
- **scheduling.koordinator.sh**: Manages resource reservations and scheduling policies
- **slo.koordinator.sh**: Defines Service Level Objectives for node performance and resource quality

All CRDs are currently at version **v1alpha1**, indicating they are in early development and subject to change. The CRDs follow Kubernetes API conventions with proper metadata, spec, and status fields, and leverage controller patterns for reconciliation and lifecycle management.

## Recommendation CRD
The Recommendation CRD in the analysis.koordinator.sh API group provides resource optimization suggestions for workloads based on historical usage patterns.

### Schema Documentation
```go
type Recommendation struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`
    Spec   RecommendationSpec   `json:"spec,omitempty"`
    Status RecommendationStatus `json:"status,omitempty"`
}
```

#### Spec Fields
- **target**: Defines the analysis target with the following subfields:
  - **type**: Specifies the target type (workload or podSelector)
  - **workload**: References a Kubernetes workload object when type is "workload"
  - **podSelector**: Label selector for targeting specific pods when type is "podSelector"

#### Status Fields
- **podStatus**: Contains resource recommendations with:
  - **containerStatuses**: Array of container-specific recommendations
    - **containerName**: Name of the container
    - **resources**: Recommended resource amounts (CPU, memory)
- **updateTime**: Timestamp of the last recommendation update
- **conditions**: Lifecycle and status conditions

#### Validation Rules
- The target field is required
- Type must be either "workload" or "podSelector"
- When type is "workload", the workload field must be specified
- When type is "podSelector", the podSelector field must be specified

#### Default Values
No default values are explicitly defined in the schema.

**Section sources**
- [recommendation_types.go](https://github.com/koordinator-sh/koordinator/tree/main/apis/analysis/v1alpha1/recommendation_types.go#L95-L115)
- [analysis.koordinator.sh_recommendations.yaml](https://github.com/koordinator-sh/koordinator/tree/main/config/crd/bases/analysis.koordinator.sh_recommendations.yaml#L1-L245)

## ClusterColocationProfile CRD
The ClusterColocationProfile CRD in the config.koordinator.sh API group defines policies for workload colocation and QoS configuration.

### Schema Documentation
```go
type ClusterColocationProfile struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`
    Spec              ClusterColocationProfileSpec   `json:"spec,omitempty"`
    Status            ClusterColocationProfileStatus `json:"status,omitempty"`
}
```

#### Spec Fields
- **namespaceSelector**: Label selector to filter namespaces (optional, defaults to all)
- **selector**: Label selector to filter pods (optional, defaults to all)
- **probability**: Probability (0-100%) that the profile will be applied
- **qosClass**: QoS class to assign (LSE, LSR, LS, BE, SYSTEM)
- **priorityClassName**: Priority class to inject into pods
- **koordinatorPriority**: Sub-priority value for Koordinator scheduling
- **labels**: Key-value pairs to inject as pod labels
- **annotations**: Key-value pairs to inject as pod annotations
- **labelKeysMapping**: Maps existing label keys to new keys
- **annotationKeysMapping**: Maps existing annotation keys to new keys
- **labelSuffixes**: Appends suffixes to existing label values
- **schedulerName**: Scheduler to dispatch pods
- **patch**: Raw extension for patching pod templates

#### Validation Rules
- qosClass must be one of: LSE, LSR, LS, BE, SYSTEM
- namespaceSelector and selector follow standard Kubernetes label selector validation
- probability must be a valid integer or string percentage

#### Default Values
- namespaceSelector and selector default to empty (matches all)
- probability has no default (optional)

**Section sources**
- [cluster_colocation_profile_types.go](https://github.com/koordinator-sh/koordinator/tree/main/apis/config/v1alpha1/cluster_colocation_profile_types.go#L114-L134)
- [config.koordinator.sh_clustercolocationprofiles.yaml](https://github.com/koordinator-sh/koordinator/tree/main/config/crd/bases/config.koordinator.sh_clustercolocationprofiles.yaml#L1-L225)

## ElasticQuotaProfile CRD
The ElasticQuotaProfile CRD in the quota.koordinator.sh API group manages quota profiles for flexible resource allocation.

### Schema Documentation
```go
type ElasticQuotaProfile struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`
    Spec   ElasticQuotaProfileSpec   `json:"spec,omitempty"`
    Status ElasticQuotaProfileStatus `json:"status,omitempty"`
}
```

#### Spec Fields
- **quotaName**: Required name of the associated quota
- **quotaLabels**: Labels to apply to the quota
- **resourceRatio**: Ratio to address resource fragmentation (e.g., "0.9")
- **nodeSelector**: Required node selector to target specific nodes

#### Validation Rules
- quotaName is required
- nodeSelector is required
- resourceRatio must be a valid string representation of a ratio

#### Default Values
No default values are explicitly defined.

**Section sources**
- [elastic_quota_profile_types.go](https://github.com/koordinator-sh/koordinator/tree/main/apis/quota/v1alpha1/elastic_quota_profile_types.go#L49-L69)
- [quota.koordinator.sh_elasticquotaprofiles.yaml](https://github.com/koordinator-sh/koordinator/tree/main/config/crd/bases/quota.koordinator.sh_elasticquotaprofiles.yaml#L1-L108)

## Reservation CRD
The Reservation CRD in the scheduling.koordinator.sh API group enables resource reservation for future workload placement.

### Schema Documentation
```go
type Reservation struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`
    Spec   ReservationSpec   `json:"spec,omitempty"`
    Status ReservationStatus `json:"status,omitempty"`
}
```

#### Spec Fields
- **template**: Pod template specifying resource requirements and scheduling constraints
- **owners**: Array of reservation owners (object reference, controller reference, or label selector)
- **ttl**: Time-to-live duration (default: 24h)
- **expires**: Absolute expiration timestamp
- **preAllocation**: Allows overcommitment when set
- **allocateOnce**: Limits allocation to first successful owner (default: true)
- **allocatePolicy**: Allocation policy (Aligned, Restricted)
- **unschedulable**: Controls reservation schedulability
- **taints**: Taints applied to the reservation

#### Status Fields
- **phase**: Current phase (Pending, Available, Succeeded, Waiting, Failed)
- **conditions**: Status conditions with type, status, reason, and message
- **currentOwners**: Currently allocated owners
- **nodeName**: Node where resources are reserved
- **allocatable**: Total allocatable resources
- **allocated**: Currently allocated resources

#### Validation Rules
- template and owners are required
- ttl and expires are mutually exclusive
- allocatePolicy must be Aligned or Restricted
- preAllocation and allocateOnce have specific interaction rules

#### Default Values
- ttl defaults to "24h"
- allocateOnce defaults to true
- phase defaults to "Pending"

**Section sources**
- [reservation_types.go](https://github.com/koordinator-sh/koordinator/tree/main/apis/scheduling/v1alpha1/reservation_types.go#L219-L240)
- [scheduling.koordinator.sh_reservations.yaml](https://github.com/koordinator-sh/koordinator/tree/main/config/crd/bases/scheduling.koordinator.sh_reservations.yaml#L1-L409)

## NodeMetric CRD
The NodeMetric CRD in the slo.koordinator.sh API group collects and reports node-level resource metrics.

### Schema Documentation
```go
type NodeMetric struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`
    Spec   NodeMetricSpec   `json:"spec,omitempty"`
    Status NodeMetricStatus `json:"status,omitempty"`
}
```

#### Spec Fields
- **metricCollectPolicy**: Collection policy with:
  - **aggregateDurationSeconds**: Aggregation period in seconds
  - **reportIntervalSeconds**: Reporting interval in seconds
  - **nodeAggregatePolicy**: Target grain for node aggregation
  - **nodeMemoryCollectPolicy**: Memory collection method (usageWithHotPageCache, usageWithoutPageCache, usageWithPageCache)

#### Status Fields
- **updateTime**: Last update timestamp
- **nodeMetric**: Node resource usage metrics
  - **nodeUsage**: Total node resource usage
  - **aggregatedNodeUsages**: Historical usage aggregates
  - **systemUsage**: System-level resource usage
  - **aggregatedSystemUsages**: Historical system usage aggregates
- **podsMetric**: Array of pod-level metrics
- **hostApplicationMetric**: Metrics for host applications
- **prodReclaimableMetric**: Reclaimable resource indicators

#### Validation Rules
- nodeMemoryCollectPolicy must be one of the defined enum values
- Duration fields must be valid time durations

#### Default Values
- nodeMemoryCollectPolicy defaults to usageWithoutPageCache

**Section sources**
- [nodemetric_types.go](https://github.com/koordinator-sh/koordinator/tree/main/apis/slo/v1alpha1/nodemetric_types.go#L134-L151)
- [slo.koordinator.sh_nodemetrics.yaml](https://github.com/koordinator-sh/koordinator/tree/main/config/crd/bases/slo.koordinator.sh_nodemetrics.yaml#L1-L799)

## NodeSLO CRD
The NodeSLO CRD in the slo.koordinator.sh API group defines Service Level Objectives for node performance and resource quality.

### Schema Documentation
```go
type NodeSLO struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`
    Spec   NodeSLOSpec   `json:"spec,omitempty"`
    Status NodeSLOStatus `json:"status,omitempty"`
}
```

#### Spec Fields
- **resourceUsedThresholdWithBE**: Resource threshold strategy for BE workloads
- **resourceQOSStrategy**: QoS configuration strategy for different workload classes
- **cpuBurstStrategy**: CPU burst configuration
- **systemStrategy**: Node-level system configuration
- **extensions**: Third-party extensions
- **hostApplications**: QoS management for host applications

The resourceQOSStrategy supports detailed configuration for CPU, memory, block I/O, network, and resctrl QoS across different workload classes (LSR, LS, BE, SYSTEM).

#### Validation Rules
- Various percentage fields have minimum and maximum constraints (0-100)
- CPU and memory burst policies have specific value ranges
- Network bandwidth values must be non-negative

#### Default Values
Many fields have sensible defaults for production environments, such as:
- cpuSuppressThresholdPercent: 65
- memoryEvictThresholdPercent: 70
- cpuEvictTimeWindowSeconds: 300

**Section sources**
- [nodeslo_types.go](https://github.com/koordinator-sh/koordinator/tree/main/apis/slo/v1alpha1/nodeslo_types.go#L472-L493)
- [slo.koordinator.sh_nodeslos.yaml](https://github.com/koordinator-sh/koordinator/tree/main/config/crd/bases/slo.koordinator.sh_nodeslos.yaml#L1-L799)

## Usage Examples
### Creating Resources with kubectl
```bash
# Create a Recommendation
kubectl apply -f recommendation.yaml

# Create a ClusterColocationProfile
kubectl apply -f cluster-colocation-profile.yaml

# Create an ElasticQuotaProfile
kubectl apply -f elastic-quota-profile.yaml

# Create a Reservation
kubectl apply -f reservation.yaml

# Create a NodeMetric
kubectl apply -f nodemetric.yaml

# Create a NodeSLO
kubectl apply -f nodeslo.yaml
```

### Programmatic Creation with Go Client
```go
// Example of creating a Reservation programmatically
reservation := &schedulingv1alpha1.Reservation{
    ObjectMeta: metav1.ObjectMeta{
        Name: "example-reservation",
    },
    Spec: schedulingv1alpha1.ReservationSpec{
        Template: &corev1.PodTemplateSpec{
            // Template specification
        },
        Owners: []schedulingv1alpha1.ReservationOwner{
            {
                LabelSelector: &metav1.LabelSelector{
                    MatchLabels: map[string]string{"app": "example"},
                },
            },
        },
        TTL: &metav1.Duration{Duration: 24 * time.Hour},
    },
}

createdReservation, err := client.SchedulingV1alpha1().Reservations().Create(context.TODO(), reservation, metav1.CreateOptions{})
```

### Sample YAML Manifests
#### Recommendation
```yaml
apiVersion: analysis.koordinator.sh/v1alpha1
kind: Recommendation
metadata:
  name: example-recommendation
spec:
  target:
    type: workload
    workload:
      kind: Deployment
      name: example-app
      apiVersion: apps/v1
```

#### ClusterColocationProfile
```yaml
apiVersion: config.koordinator.sh/v1alpha1
kind: ClusterColocationProfile
metadata:
  name: high-priority
spec:
  selector:
    matchLabels:
      priority: high
  qosClass: LSE
  priorityClassName: system-cluster-critical
```

#### ElasticQuotaProfile
```yaml
apiVersion: quota.koordinator.sh/v1alpha1
kind: ElasticQuotaProfile
metadata:
  name: gpu-quota-profile
spec:
  quotaName: gpu-quota
  nodeSelector:
    matchLabels:
      accelerator: gpu
  resourceRatio: "0.8"
```

#### Reservation
```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Reservation
metadata:
  name: batch-job-reservation
spec:
  template:
    spec:
      containers:
      - name: placeholder
        resources:
          requests:
            cpu: "8"
            memory: "32Gi"
  owners:
  - labelSelector:
      matchLabels:
        job-type: batch
  ttl: "12h"
```

#### NodeMetric
```yaml
apiVersion: slo.koordinator.sh/v1alpha1
kind: NodeMetric
metadata:
  name: node-sample
spec:
  metricCollectPolicy:
    aggregateDurationSeconds: 60
    reportIntervalSeconds: 15
    nodeMemoryCollectPolicy: usageWithoutPageCache
```

#### NodeSLO
```yaml
apiVersion: slo.koordinator.sh/v1alpha1
kind: NodeSLO
metadata:
  name: production-node-slo
spec:
  resourceUsedThresholdWithBE:
    enable: true
    cpuSuppressThresholdPercent: 70
    memoryEvictThresholdPercent: 75
  resourceQOSStrategy:
    beClass:
      cpuQOS:
        enable: true
        groupIdentity: 1
      memoryQOS:
        enable: true
        minLimitPercent: 20
        lowLimitPercent: 40
        throttlingPercent: 80
```

**Section sources**
- [examples/spark-jobs/cluster-colocation-profile.yaml](https://github.com/koordinator-sh/koordinator/tree/main/examples/spark-jobs/cluster-colocation-profile.yaml)
- [config/samples/analysis_v1aplha1_recommendation.yaml](https://github.com/koordinator-sh/koordinator/tree/main/config/samples/analysis_v1aplha1_recommendation.yaml)
- [config/samples/scheduling_v1alpha1_reservation.yaml](https://github.com/koordinator-sh/koordinator/tree/main/config/samples/scheduling_v1alpha1_reservation.yaml)
- [config/samples/slo_v1alpha1_nodemetric.yaml](https://github.com/koordinator-sh/koordinator/tree/main/config/samples/slo_v1alpha1_nodemetric.yaml)

## Controller Integration
Koordinator's CRDs integrate with the Kubernetes controller pattern through dedicated controllers that reconcile the desired state defined in the spec with the actual cluster state.

### Controller Responsibilities
- **RecommendationController**: Analyzes workload resource usage and generates optimization recommendations
- **ColocationProfileController**: Applies colocation policies to matching pods during admission
- **QuotaProfileController**: Manages elastic quota profiles and their application to workloads
- **ReservationController**: Handles resource reservation lifecycle, scheduling, and allocation
- **NodeMetricController**: Collects and aggregates node resource metrics
- **NodeSLOController**: Enforces node-level SLOs and QoS policies

### Reconciliation Process
Each controller follows the standard reconciliation loop:
1. Watches for CRD events (create, update, delete)
2. Fetches the current resource state
3. Compares spec (desired state) with status (current state)
4. Takes actions to reconcile differences
5. Updates status to reflect current state
6. Emits events and conditions for observability

Controllers use Kubernetes client-go libraries for API interactions and leverage informers for efficient event handling. They also implement proper error handling and retry mechanisms to ensure reliability.

**Section sources**
- [pkg/controller/colocationprofile/colocationprofile_controller.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/controller/colocationprofile/colocationprofile_controller.go)
- [pkg/slo-controller/nodemetric/nodemetric_controller.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/slo-controller/nodemetric/nodemetric_controller.go)
- [pkg/slo-controller/nodeslo/nodeslo_controller.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/slo-controller/nodeslo/nodeslo_controller.go)

## Common Configuration Pitfalls
### Invalid Field Combinations
- Setting both ttl and expires in Reservation (mutually exclusive)
- Specifying conflicting QoS policies in NodeSLO
- Using invalid enum values for qosClass or allocationPolicy

### Missing Required Fields
- Omitting quotaName or nodeSelector in ElasticQuotaProfile
- Not specifying template or owners in Reservation
- Forgetting to set required selectors in ClusterColocationProfile

### Validation Errors
- Exceeding percentage limits (e.g., cpuSuppressThresholdPercent > 100)
- Using invalid duration formats in TTL fields
- Providing malformed label selectors or match expressions

### Best Practices
- Use descriptive names and labels for easy identification
- Set appropriate TTL values to avoid resource leaks
- Test colocation profiles in staging environments before production
- Monitor reservation utilization to optimize resource allocation
- Regularly review and update NodeSLO configurations based on workload patterns

**Section sources**
- [pkg/util/sloconfig/validator.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/util/sloconfig/validator.go)
- [pkg/webhook](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook)
- [pkg/scheduler/plugins](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/plugins)
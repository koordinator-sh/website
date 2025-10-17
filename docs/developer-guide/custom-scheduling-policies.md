# Custom Scheduling Policies

## Introduction
Koordinator provides an extensible scheduling framework for developing custom policies addressing specific workload requirements. This document details existing plugin implementations (co-scheduling, device sharing, elastic quota) as examples for building new policies. The framework extends Kubernetes scheduling with well-defined interfaces, enabling sophisticated resource management that integrates seamlessly with Koordinator.

## Scheduling Framework Extension Points
Koordinator's framework provides extension points for custom plugins to participate in scheduling at various stages. The framework extender factory manages plugin registration, enabling plugins to access Koordinator-specific resources through the ExtendedHandle interface.

Plugins register via PluginFactoryProxy, which passes FrameworkExtender as the handle parameter. Key extension interfaces include SchedulingTransformer (modify scheduling state), ReservationRestorePlugin (manage reserved resources), and AllocatePlugin (fine-grained resource allocation). The framework also supports ResizePodPlugin (modify pod resources before assume) and PreBindExtensions (apply patches during binding).

The framework maintains a plugin registry per profile, allowing different plugin sets for different scenarios. When scheduling begins, the framework extender is created for the specific profile, and plugins are initialized at appropriate extension points.

**Section sources**
- [framework_extender_factory.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/frameworkext/framework_extender_factory.go#L103-L390)
- [interface.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/frameworkext/interface.go#L37-L268)

## Implementation of Key Scheduling Policies

### Co-Scheduling Policy Implementation
The co-scheduling policy ensures related pods are scheduled together, preventing partial deployments. Implemented through pod annotations defining gang membership, minimum available count, and scheduling mode (strict/non-strict).

Leverages Permit and PreBind extension points to coordinate gang member scheduling. During Permit, the scheduler checks if sufficient resources exist for minimum required pods. If insufficient, all gang members are delayed until resources are available or timeout occurs. Supports network topology awareness for connectivity requirements.

Handles partial failures and dynamic membership changes. In strict mode, pod failures abort entire gang scheduling. Non-strict mode proceeds with reduced pods, balancing reliability and resource efficiency.

**Section sources**
- [coscheduling.go](https://github.com/koordinator-sh/koordinator/tree/main/apis/extension/coscheduling.go#L0-L166)

### Device Sharing Policy Implementation
The device sharing policy enables efficient utilization of specialized hardware (GPUs, FPGAs, RDMA) by allowing multiple pods to share these resources. Provides fine-grained control through annotations specifying allocation strategies, topology requirements, and exclusive policies.

Components:
- **PreFilter**: Analyzes pod requests and extracts device requirements from annotations
- **Filter**: Evaluates node suitability based on available devices and topology
- **Reserve**: Allocates specific devices and updates node cache
- **PreBind**: Injects device allocation into pod annotations for device plugins

Supports joint allocation of multiple device types, ensuring related devices (GPU and memory) are allocated from the same physical unit for optimal performance. Supports hierarchical topology scopes (device, PCIe, NUMA, node) for allocation constraints.

**Device Sharing Plugin Class Structure:**

Core classes and relationships:

- **DeviceSharePlugin** (Device sharing plugin)
  - Methods: `Name()`, `PreFilter()`, `Filter()`, `Reserve()`, `PreBind()`
  - Manages DeviceAllocations
  - Uses DeviceAllocateHints

- **DeviceAllocations** (Device allocation set)
  - Fields: `DeviceType[]`, `Resources ResourceList`, `ID string`
  - Contains DeviceAllocation (single device allocation)

- **DeviceAllocateHints** (Device allocation hints)
  - Fields: `Selector LabelSelector`
  - `AllocateStrategy DeviceAllocateStrategy` (allocation strategy)
  - `RequiredTopologyScope DeviceTopologyScope` (topology scope)

**Diagram sources **
- [device_share.go](https://github.com/koordinator-sh/koordinator/tree/main/apis/extension/device_share.go#L0-L394)
- [plugin.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/plugins/deviceshare/plugin.go#L0-L727)

**Section sources**
- [device_share.go](https://github.com/koordinator-sh/koordinator/tree/main/apis/extension/device_share.go#L0-L394)
- [plugin.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/plugins/deviceshare/plugin.go#L0-L727)

### Elastic Quota Policy Implementation
The elastic quota policy provides hierarchical quota management with flexible resource allocation across teams and applications. Unlike traditional Kubernetes quotas, supports resource borrowing between siblings and dynamic adjustment based on usage.

Uses a tree structure with parent quotas governing total limits for children. Each quota specifies minimum guaranteed resources and maximum limits, with ability to lend unused resources to other quotas in the subtree. Tracks allocated and actual usage for accurate admission control and reclaiming.

Integrates via PreFilter and Reserve extension points. PreFilter checks if resources are available within the pod's quota, considering guaranteed and borrowable resources. Reserve updates quota usage and prevents over-allocation. Includes controllers for quota lifecycle and resource reclaiming when quotas exceed limits.

**Elastic Quota Plugin Class Structure:**

Core classes and relationships:

- **ElasticQuotaPlugin** (Elastic quota plugin)
  - Methods: `Name()`, `PreFilter()`, `PostFilter()`, `Reserve()`, `Unreserve()`
  - Uses GroupQuotaManager
  - Accesses QuotaInfo

- **GroupQuotaManager** (Group quota manager)
  - Methods: `GetQuotaInfoByName()`, `ReservePod()`, `UnreservePod()`, `InitHookPlugins()`
  - Manages QuotaInfo

- **QuotaInfo** (Quota information)
  - Fields: `Name string`
  - `Min ResourceList` (minimum guaranteed resources)
  - `Max ResourceList` (maximum limit resources)
  - `Used ResourceList` (used resources)
  - `NonPreemptibleUsed ResourceList` (non-preemptible resources)

**Diagram sources **
- [elastic_quota.go](https://github.com/koordinator-sh/koordinator/tree/main/apis/extension/elastic_quota.go#L0-L232)
- [plugin.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/plugins/elasticquota/plugin.go#L0-L377)

**Section sources**
- [elastic_quota.go](https://github.com/koordinator-sh/koordinator/tree/main/apis/extension/elastic_quota.go#L0-L232)
- [plugin.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/plugins/elasticquota/plugin.go#L0-L377)

## Policy Integration and Configuration
Integrating custom policies requires careful configuration and parameter tuning. Policies configure through scheduler's component configuration with enable/disable controls and specific parameters. Configuration supports static and dynamic reloading without scheduler restarts.

Key parameters include resource scoring strategies, timeout values, and topology constraints. Device sharing configures GPU templates and topology alignment. Elastic quota configures minimum scaling and system quota limits. Parameters tune based on cluster characteristics and workload requirements.

Follow established patterns for error handling and logging. Provide clear error messages explaining scheduling decisions. Use framework utilities for diagnostics and metrics to facilitate troubleshooting.

**Section sources**
- [framework_extender_factory.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/frameworkext/framework_extender_factory.go#L103-L390)
- [interface.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/frameworkext/interface.go#L37-L268)

## Common Development Challenges and Solutions
Developing custom policies presents several common challenges:

1. **Race Conditions**: During concurrent scheduling, use framework's state management and atomic resource updates
2. **Partial Failures**: Handle unavailable components with retry mechanisms and fallback strategies
3. **Performance Optimization**: Minimize expensive operations in critical paths and leverage caching
4. **Backward Compatibility**: Introduce new features behind feature gates and maintain deprecated functionality

Utilize framework mechanisms for parallelizing operations and optimizing resource filtering. Ensure comprehensive testing including unit, integration, and end-to-end tests for policy correctness and performance.

**Section sources**
- [framework_extender_factory.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/frameworkext/framework_extender_factory.go#L103-L390)
- [interface.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/scheduler/frameworkext/interface.go#L37-L268)

## Conclusion
Koordinator's extensible scheduling framework provides a robust foundation for developing custom policies addressing specific workload requirements. By understanding existing policy implementations (co-scheduling, device sharing, elastic quotas), developers can create sophisticated resource management solutions that integrate seamlessly with Kubernetes. The framework's well-defined extension points, comprehensive interfaces, and modular architecture enable policies that enhance resource utilization, improve performance, and simplify cluster management.
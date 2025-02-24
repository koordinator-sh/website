# Developing Custom Plugins in koord-descheduler

## Background
Koordinator Descheduler (koord-descheduler) helps manage cluster resource utilization by descheduling Pods to address resource contention, load imbalance, and compliance issues. Built on the [Koordinator Descheduler Framework](https://koordinator.sh), it abstracts descheduling strategies as plugins, providing users with an easy way to develop custom descheduling strategies. Users only need to implement a few simple interfaces to add custom descheduling strategies as needed.
## Development Environment
This document is based on the following software versions:

- Koordinator v1.5.0
    - branch: main
    - commit: b5b8abfe5ff59343f47c6379546247b8c5fa0abe
- Kubernetes v1.28.7
- Go 1.20
## Framework Overview
The Koordinator Descheduler Framework abstracts descheduling plugins as Plugin interfaces, which only need to implement the `Name()` method to uniquely identify the plugin using a string. This manages whether the plugin is enabled and matches the plugin's configuration parameters.

Descheduling plugins are divided into `DeschedulePlugin`and `BalancePlugin` types. Each plugin can implement specific descheduling logic through the `Deschedule()` or `Balance()` methods. Each descheduling plugin selects Pods to be evicted according to its eviction rules, filters, pre-eviction checks, and sorts them, and finally requests the Pod Evictor to evict the target Pods. The plugin interfaces are defined in the `pkg/descheduler/framework/types.go` file.
```go
// Plugin is the parent type for all the descheduling framework plugins.
type Plugin interface {
    Name() string
}

type DeschedulePlugin interface {
    Plugin
    Deschedule(ctx context.Context, nodes []*corev1.Node) *Status
}

type BalancePlugin interface {
    Plugin
    Balance(ctx context.Context, nodes []*corev1.Node) *Status
}
```
Each descheduling plugin is managed by the `Registry` in the Descheduler Framework. The Descheduler Framework reads the user configuration and determines whether to instantiate the plugin based on the enabled plugin names.
The Descheduler Framework arranges the execution order of all plugins. It ensures that all enabled plugins' `Deschedule()` methods are executed first in each cycle, followed by the `Balance()` methods. Although it is possible for a plugin to implement both methods, it is not recommended.
## Development Process

1. **Determine Plugin Type**
   To prevent the uniformity achieved by `Balance` plugins from being disrupted by subsequent `Deschedule` plugins, the Descheduler Framework always executes all `Deschedule()` methods first. Based on this execution order, please confirm which plugin type fits your custom logic to ensure it executes as expected.
    - **Deschedule Plugins**: Checks each Pod against current scheduling constraints and evicts them one by one if they no longer meet the constraints (e.g., evicting Pods that no longer satisfy node affinity or anti-affinity rules).
    - **Balance Plugins**: Optimizes the distribution of all or a group of Pods across the cluster and decides which Pods to evict (e.g., evicting Pods from load hotspots based on actual node utilization).
2. **Write Plugin Code**
   Add your plugin directory under `/pkg/descheduler/framework/plugins`. It's recommended to name the directory after the plugin or use a phrase that describes its function (e.g., `loadaware`). In the plugin directory, write your plugin code. For example, here is the code for the `LowNodeLoad` plugin in `/pkg/descheduler/framework/plugins/loadaware/low_node_load.go`:
```go
const (
    LowNodeLoadName = "LowNodeLoad"
)

var _ framework.BalancePlugin = &LowNodeLoad{}

type LowNodeLoad struct {
    handle               framework.Handle
    podFilter            framework.FilterFunc
    nodeMetricLister     koordslolisters.NodeMetricLister
    args                 *deschedulerconfig.LowNodeLoadArgs
    nodeAnomalyDetectors *gocache.Cache
}

func NewLowNodeLoad(args runtime.Object, handle framework.Handle) (framework.Plugin, error) {
    return &LowNodeLoad{
        handle:               handle,
        nodeMetricLister:     nodeMetricInformer.Lister(),
        args:                 loadLoadUtilizationArgs,
        podFilter:            podFilter,
        nodeAnomalyDetectors: nodeAnomalyDetectors,
    }, nil
}

func (pl *LowNodeLoad) Name() string {
    return LowNodeLoadName
}

func (pl *LowNodeLoad) Balance(ctx context.Context, nodes []*corev1.Node) *framework.Status {
    return nil
}
```
This plugin becomes a `BalancePlugin` type within the Descheduler Framework by implementing the `Name()` and `Balance()` methods.

3. **Register Plugin with Framework**
   The Descheduler Framework manages all plugins through the `Registry`, a map where keys are plugin name strings and values are factory methods for instantiating the plugins. The registry code is defined in `/pkg/descheduler/framework/runtime/registry.go`:
```go
type Registry map[string]PluginFactory

type PluginFactory func(args runtime.Object, handle framework.Handle) (framework.Plugin, error)
```
The `args` parameter typically represents the configurable variables that your plugin offers to users. After the Descheduler Framework reads the user configuration from the ConfigMap, it parses the configuration for each plugin and converts it into a `runtime.Object` type. The `handle` parameter is a service handle provided by the Descheduler Framework to assist plugins in their functionality. Common services include a globally unique Evictor, etc.
You need to write an initialization method of the `PluginFactory` type for your custom plugin to register it with the Descheduler Framework. For example, the `LowNodeLoad` plugin implements the `NewLowNodeLoad` method to accept user-defined parameters for plugin instantiation:
```go
// NewLowNodeLoad builds plugin from its arguments while passing a handle
func NewLowNodeLoad(args runtime.Object, handle framework.Handle) (framework.Plugin, error) {
    // convert args to internal type
    loadLoadUtilizationArgs, ok := args.(*deschedulerconfig.LowNodeLoadArgs)
    
    return &LowNodeLoad{
        handle:               handle,
        ...
        args:                 loadLoadUtilizationArgs,
        ...
    }, nil
}
```
To register your custom plugin with the Descheduler Framework, add it to the `InTreeRegistry`. For example, the `LowNodeLoad` plugin is registered as follows in the `/pkg/descheduler/framework/plugins/registry.go` file:
```go
func NewInTreeRegistry() runtime.Registry {
    registry := runtime.Registry{
        loadaware.LowNodeLoadName: loadaware.NewLowNodeLoad,
    }
    kubernetes.SetupK8sDeschedulerPlugins(registry)
    return registry
}
```

4. **Provide Configurable Parameters for Plugin (Optional)**
   We recommend providing configurable parameters for your plugin to customize its functionality. These parameters allow users to configure the plugin in the [DeschedulerConfiguration API](https://koordinator.sh/configuration). Add parameter code in the `/pkg/descheduler/apis/config` directory. Define internal types in this directory and external types in the `v1alpha2` directory, using JSON tags to provide ConfigMap parsing for users.

Example internal type in `types_loadaware.go`:
```go
type LowNodeLoadArgs struct {
    ...
	
    // HighThresholds defines the target usage threshold of node resources
	HighThresholds ResourceThresholds

	// LowThresholds defines the low usage threshold of node resources
	LowThresholds ResourceThresholds
    
    ...
}
```
Example external type in `v1alpha2/types_loadaware.go`:
```go
type LowNodeLoadArgs struct {
	...
    
	// HighThresholds defines the target usage threshold of node resources
	HighThresholds ResourceThresholds `json:"highThresholds,omitempty"`

	// LowThresholds defines the low usage threshold of node resources
	LowThresholds ResourceThresholds `json:"lowThresholds,omitempty"`

	...
}
```
## Integration and Deployment Testing

1. We recommend writing unit tests for your code to improve overall quality.
2. Once your custom plugin is complete, you can compile `koord-descheduler` using the following command from the Koordinator project root directory:
```bash
make build-koord-descheduler
```
You can also create a Docker image for `koord-descheduler` and deploy it directly to your K8S cluster:
```bash
make docker-build-koord-descheduler
```
Check the Makefile for supported shortcut commands. The Dockerfile for `koord-descheduler` is located in the `/docker` directory.
## Additional Information

1. **Custom Evictor Plugins**
   The Descheduler Framework also supports custom Evictor plugins. The development process is similar, and the Evictor interface is defined as follows:
```go
type Evictor interface {
    Plugin
    Filter(pod *corev1.Pod) bool
    Evict(ctx context.Context, pod *corev1.Pod, evictOptions EvictOptions) bool
}
```

2. **Contributing to the Community**
   We welcome contributions of your custom plugins to the Koordinator community, helping your work benefit more users. Please review the [Koordinator's Code of Conduct](https://koordinator.sh/code-of-conduct) and [Contributing to Koordinator](https://koordinator.sh/contributing)to ensure your code has a good style and sufficient unit tests.
## References

- [Koordinator Descheduler Framework](https://koordinator.sh)
- [Koordinator Configuration](https://koordinator.sh/configuration)
- [Koordinator's Code of Conduct](https://koordinator.sh/code-of-conduct)
- [Contributing to Koordinator](https://koordinator.sh/contributing)

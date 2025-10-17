# 开发自定义的koord-descheduler插件

## 背景
Koordinator Descheduler (koord-descheduler) 通过重新调度 Pods 来解决资源争夺、负载不平衡和合规性问题，从而帮助管理集群中的资源利用率。该组件基于 [Descheduler Framework ](https://koordinator.sh/zh-Hans/docs/designs/descheduler-framework/)实现，将重调度策略抽象为插件（Plugin），这为用户快速上手 Koordinator Descheduler 的二次开发提供了便捷的可能性。用户只需实现几个简单的接口，就可以按需增加定制化的重调度策略。
## 开发环境
本文基于以下软件版本进行编写：

- Koordinator v1.5.0
    - branch: main
    - commit: b5b8abfe5ff59343f47c6379546247b8c5fa0abe
- Kubernetes v1.28.7
- Go 1.20
## 框架介绍
Koordinator Descheduler Framework 将重调度插件抽象为 `Plugin` 接口，该接口只需要实现 `Name()` 方法，将插件的名字用字符串类型进行唯一标识，管理插件是否开启并匹配插件的配置参数。

重调度插件分为 `DeschedulePlugin`  和 `BalancePlugin` 两种。每个插件可以通过 `Deschedule()` 或 `Balance()` 方法来实现特定的重调度逻辑。每个重调度插件会按照自身的驱逐规则选择待驱逐的 Pod，然后对符合规则的 Pod 进行过滤、检查和排序，最终请求 Pod 驱逐器完成对目标 Pod 的驱逐。您可以在`pkg/descheduler/framework/types.go`文件中找到插件接口的定义。
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
每一个重调度插件都交由 Descheduler Framework 中的注册中心进行管理。Descheduler Framework 读取用户配置，通过配置中开启的插件名决定是否将插件进行实例化。
Descheduler Framework 对所有插件的执行顺序进行编排。Descheduler Framework对插件的调用是方法级别的，每一个执行周期内确保先执行所有开启的插件中的 `Deschedule()`  方法，再执行所有开启的插件中的 `Balance()` 方法。因此，插件本身可以同时实现这两个方法，尽管这并不是我们推荐的方式。
## 开发流程

1. **确定插件类型**

为了防止Balance插件实现的分布均匀性被其后运行的Deschedule插件打破，Descheduler Framework总是先执行所有的Deschedule方法。基于这一执行顺序，请先确认您的自定义逻辑符合哪一种插件类型，以确保您的插件能够有符合预期的执行效果。通常情况下插件的类型及其特性对应如下：

- Deschedule类型：逐个检查 Pod 是否符合当前的调度约束，并依次进行驱逐，例如逐一驱逐不再满足节点亲和性或反亲和性的 Pod。
- Balance类型：优化所有 Pod 或一组 Pod 在集群中的分布均匀性，继而决定驱逐哪些 Pod，例如基于节点的真实利用率驱逐负载热点上的 Pod。
2. **编写插件代码**

在 `/pkg/descheduler/framework/plugins` 目录下添加您的插件目录，建议以插件名命名该目录，或使用描述插件功能的短语进行命名，如 `loadaware`。在插件目录下，编写插件代码，以 `LowNodeLoad` 插件为例，以下是 `/pkg/descheduler/framework/plugins/loadaware/low_node_load.go` 的代码示例：
```go
const (
    LowNodeLoadName = "LowNodeLoad"
)

var _ framework.BalancePlugin = &LowNodeLoad{}

// LowNodeLoad evicts pods from overutilized nodes to underutilized nodes.
// Note that the plugin refers to the actual usage of the node.
type LowNodeLoad struct {
    handle               framework.Handle
    ...
    args                 *deschedulerconfig.LowNodeLoadArgs
    ...
}

// Name retrieves the plugin name
func (pl *LowNodeLoad) Name() string {
    return LowNodeLoadName
}

// Balance extension point implementation for the plugin
func (pl *LowNodeLoad) Balance(ctx context.Context, nodes []*corev1.Node) *framework.Status {
    
    ... // Check pods that can be evicted and request Evictor to evict pods.
    
    return nil
}
```
注意到，该插件通过实现`Name()`和`Balance()`方法，成为Descheduler Framework中的`BalancePlugin`类型。

3. **注册插件到框架中**

Descheduler Framework通过Registry注册中心管理所有的插件，Registry是一个map类型，key是插件名字符串，value是该插件用于实例化的工厂方法。注册中心的代码定义于`/pkg/descheduler/framework/runtime/registry.go`文件中：
```go
type Registry map[string]PluginFactory

type PluginFactory func(args runtime.Object, handle framework.Handle) (framework.Plugin, error)
```
其中，`args`参数通常是您的插件向用户提供的可配置变量。Descheduler Framework从ConfigMap中读取用户配置后解析每一个插件的配置并统一转换成`runtime.Object`类型。`handle`参数是Descheduler Framework为各个插件提供的服务句柄，协助插件实现其功能。常见的服务功能有全局唯一的驱逐器`Evictor`等。
您需要为您的自定义插件编写PluginFactory类型的初始化方法，使其注册到Descheduling Framework。以LowNodeLoad为例，该插件实现`NewLowNodeLoad`方法接收用户自定义参数，用于插件的实例化：
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
您可以直接将自定义插件置于Descheduler Framework的`InTreeRegistry`中，其代码定义在`pkg/descheduler/framework/plugins/registry.go`文件中：
```go
func NewInTreeRegistry() runtime.Registry {
    registry := runtime.Registry{
        loadaware.LowNodeLoadName: loadaware.NewLowNodeLoad,
    }
    kubernetes.SetupK8sDeschedulerPlugins(registry)
    return registry
}
```

4. **为插件提供可配置参数（可选）**

通常情况下，我们推荐您为插件的用户提供可配置的参数，以定制化插件的具体功能。这些参数将为用户提供`DeschedulerConfiguration` API中进行配置的可能性。
Koordinator使用 `DeschedulerConfiguration`[ API ](https://koordinator.sh/docs/user-manuals/load-aware-descheduling/#global-configuration-via-plugin-args)来管理重调度模版和插件配置，示例如下：
```yaml
apiVersion: descheduler/v1alpha2
kind: DeschedulerConfiguration
profiles:
- name: custom-descheduler
  plugins:
    deschedule:
      enabled:
        - name: CustomDeschedulePlugin
    balance:
      disabled:
        - name: CustomBalancePlugin
  pluginConfig:
  - name: CustomDeschedulePlugin
    args:
      # Your custom arguments here
  - name: CustomBalancePlugin
    args:
      # Your custom arguments here
```
为此，您需要在 `/pkg/descheduler/apis/config` 目录下增加插件参数代码，在该目录中添加配置参数的内部类型。
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
在 `/pkg/descheduler/apis/config/v1alpha2` 目录中添加外部类型，在外部类型中用 `json tag` 为用户提供 ConfigMap 解析的入口。
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
## 集成与部署测试

1. 我们推荐您为您的代码编写单元测试，这将提升代码的整体质量。
2. 当您编写完成您的自定义插件，您可以直接在Koordinator项目根目录下使用如下命令编译koord-descheduler。
```bash
make build-koord-descheduler
```
也可以使用如下命令制作koord-descheduler的Docker镜像，将其直接部署至K8S集群中。
```bash
make docker-build-koord-descheduler
```
在 `Makefile` 文件中查看支持的快捷命令，`koord-descheduler` 的 Dockerfile 存放于 `/docker` 目录中。
## 其他

1. Descheduler Framework还支持自定义`Evictor`插件，开发流程类似，本文不给出详细方法。`Evictor`插件的接口定义如下：
```go
type Evictor interface {
    Plugin
    Filter(pod *corev1.Pod) bool
    Evict(ctx context.Context, pod *corev1.Pod, evictOptions EvictOptions) bool
}
```

2. 我们欢迎您将您的自定义插件提交至Koordinator社区，使您的工作惠及更多用户。请查阅Koordinator的[编程规范](https://github.com/koordinator-sh/koordinator/blob/main/CODE_OF_CONDUCT.md)和[提交规范](https://github.com/koordinator-sh/koordinator/blob/main/CONTRIBUTING.md)，确保代码具备良好的代码风格和足够的单元测试。
## Reference

- [Koordinator Descheduler Framework ](https://koordinator.sh/zh-Hans/docs/designs/descheduler-framework/)
- [koord-descheduler configuration](https://koordinator.sh/docs/user-manuals/load-aware-descheduling/#global-configuration-via-plugin-args)
- [Koordinator's Code of Conduct](https://github.com/koordinator-sh/koordinator/blob/main/CODE_OF_CONDUCT.md)
- [Contributing to Koordinator](https://github.com/koordinator-sh/koordinator/blob/main/CONTRIBUTING.md)

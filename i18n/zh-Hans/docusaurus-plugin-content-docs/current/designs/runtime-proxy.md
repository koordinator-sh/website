# RuntimeProxy

## 摘要

KoordRuntimeProxy 充当 Kubelet 和 Containerd 之间的代理（ Dockershim 场景下是 Dockerd ），它用于拦截 CRI 请求，并应用一些资源管理策略，
如混合工作负载编排场景下按实例优先级设置不同的 cgroup 参数，针对最新的 Linux 内核、CPU 架构应用新的隔离策略等。

这里涉及两个组件，KoordRuntimeProxy 和 RuntimePlugins。

![image](/img/koord-runtime-proxy-architecture.svg)

## 目标

- 增强基于 QoS 的调度的资源管理。
- 为 CRI 不支持的新隔离特性提供接口。

## 组件

### KoordRuntimeProxy

KoordRuntimeProxy 负责在 Pod 的生命周期内拦截请求，例如 RunPodSandbox、CreateContainer 等，
在请求从后端 Containerd(Dockerd) 到 Kubelet 之间的传输过程中，会调用 RuntimePlugins 做资源隔离策略。
KoordRuntimeProxy 提供了一个隔离策略执行框架，允许注册的自定义插件执行指定的隔离策略，这些插件称为 RuntimePlugins。 KoordRuntimeProxy 本身不执行任何隔离策略。

### RuntimePlugins

RuntimePlugins 将事件（如 RunPodSandbox 等）注册到 KoordRuntimeProxy 并在事件发生时接收通知。
RuntimePlugins 应该根据通知消息完成资源隔离策略，然后响应给 KoordRuntimeProxy，KoordRuntimeProxy 将根据插件的响应决定将请求转移到后端 Containerd 或丢弃。

如果没有注册 RuntimePlugins，KoordRuntimeProxy 将成为 Kubelet 和 Containerd 之间的透明代理。

## 架构

![image](/img/koord-runtime-proxy-design.svg)

KoordRounmeProxy 有4个主要组件。

### CRI Server

KoordRuntimeProxy 作为 Kubelet 和 Containerd 之间的代理，充当 Kubelet 的 CRI 服务器（Dockershim 场景下的 Http 服务器）。它应该拦截来自 Kubelet 的所有请求，并在与后端 Containerd(Dockerd) 调用之前和之后生成与插件调用的协议。

### Plugins Manager

PluginsManager 负责动态解析来自 `/etc/runtime/hookserver.d` 的插件注册信息。

### Runtime Dispatcher

RuntimeDispatcher 旨在管理与插件的通信。

### Store

作为代理，KoordRuntimeProxy 最好设计为无状态，但有时候现实并不完美。
以 StartContainer hook 为例，CRI StartContainerRequest 中只有 ContainerID，这不足以让插件调整策略，因为插件可能不会在本地存储 Pod/Container 信息（如 Meta、Priority）。所以 KoordRuntimeProxy 应该在 RunPodSandbox/CreateContainer 阶段存储 Pod/Container 信息。当 StartContainer 请求到来时，KoordRuntimeProxy 可以通过 ContainerID 获取 Pod/Container 信息，然后使用 Pod/Container 信息调用插件。

有了 Store，每次 KoordRuntimeProxy 调用插件都会有 Pod/Container 信息，所以插件不需要特别存储 Pod/Container 信息，插件可以设计成无状态的。

考虑到性能，Store 位于内存中，不会产生外部 IO 到磁盘。

## Runtime Plugins

### 如何注册插件
所有的插件配置文件都应该放在 `/etc/runtime/hookserver.d` 并带有 `.json` 后缀。您可以使用 RuntimeProxy 注册 Koordlet 实现的插件：

1. touch /etc/runtime/hookserver.d/koordlet.json
2. 将以下内容复制到 /etc/runtime/hookserver.d/koordlet.json
```
{
    "remote-endpoint": "/var/run/koordlet/koordlet.sock",
    "failure-policy": "Ignore",
    "runtime-hooks": [
        "PreRunPodSandbox",
        "PreCreateContainer",
        "PreStartContainer"
    ]
}
```


涉及3个字段：
- remote-endpoint: KoordRuntimeProxy 与插件对话端点，由插件生成。
- failure-policy: 调用插件失败时的策略，失败或忽略，默认为忽略。
- runtime-hooks: 目前有7个钩点：
    1. PreRunPodSandbox
    2. PreCreateContainer
    3. PreStartContainer
    4. PostStartContainer
    5. PreUpdateContainerResources
    6. PostStopContainer
    7. PostStopPodSandbox

带有前缀 “Pre” 的挂钩点表示在将请求传输到 Contianerd(Dockerd) 之前调用插件。带有前缀 “Post“ 的挂钩点意味着在收到来自 Containerd(Dockerd) 的响应后调用插件。插件提供者可以将任何钩子组合设置为“运行时钩子”。

### KoordRunmeProxy 和 Plugins 之间的协议
[Protocols](https://github.com/koordinator-sh/koordinator/blob/main/apis/runtime/v1alpha1/api.proto)

### Runtime Plugins 例子
[koordlet-runtime-plugin-design](https://github.com/koordinator-sh/koordinator/blob/main/docs/design-archive/koordlet-runtime-hooks.md)

## 安装

### 源代码安装
获取源代码：`git clone https://github.com/koordinator-sh/koordinator.git`

构建：`cd koordinator; make build-koord-runtime-proxy`

### 包安装
下载最新发布的程序包：`https://github.com/koordinator-sh/koordinator/releases`

### 配置 Kubelet
在 Containerd 场景下，为了让 koord-runtime-proxy 成为 Kubelet 和 Containerd 之间的代理，Kubelet 的参数需要修改如下：
```
kubelet <other options> --container-runtime=remote --container-runtime-endpoint=unix:///var/run/koord-runtimeproxy/runtimeproxy.sock
```

在 Docker 场景下，为了让 koord-runtime-proxy 成为 Kubelet 和 Dockerd 之间的代理，Kubelet 的参数需要修改如下：
```
kubelet <other options> --docker-endpoint=unix:///var/run/koord-runtimeproxy/runtimeproxy.sock
```

### 配置 KoordRuntimeProxy
首先，请确保您的运行时后端是 Containerd 或 Dockerd。

在 Containerd 场景下，koord-runtime-proxy 可以使用以下命令设置：
```
koord-runtime-proxy --remote-runtime-service-endpoint=<runtime sockfile path>
    --remote-image-service-endpoint=<image sockfile path>
```
如果 Containerd 在默认 `/var/run/koord-runtimeproxy/runtimeproxy.sock` 上监听 CRI 请求，koord-runtime-proxy 可以通过以下方式设置：
```
koord-runtime-proxy
```

在 Docker 场景下，koord-runtime-proxy 应该使用附加参数 `--backend-runtime-mode Docker` 设置，并且没有 `remote-image-service-endpoint`：
```
koord-runtime-proxy --backend-runtime-mode=Docker --remote-runtime-service-endpoint=<runtime sockfile path>
```

# 安装

Koordinator 依赖 **Kubernetes version >= 1.18**。

Koordinator 需要从 kubelet 只读端口收集指标（默认设置为禁用）。
更多信息 [here](https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet/).

为了最好的体验，koordinator 推荐 **linux kernel 4.19** 或者更高版本。


## 使用 Helm 安装

Koordinator 可以使用 Helm v3.5+ 安装, Helm 是一个简单的命令行工具，更多信息 [here](https://github.com/helm/helm/releases).

```bash
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Install the latest version.
$ helm install koordinator koordinator-sh/koordinator --version 1.3.0
```

## 使用 Helm 升级

```bash
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Upgrade the latest version.
$ helm upgrade koordinator koordinator-sh/koordinator --version 1.3.0 [--force]
```

注意：

1. 升级前，为确保你了解新版本中的重大更改，你 **必须** 先阅读 [变更日志](https://github.com/koordinator-sh/koordinator/blob/master/CHANGELOG.md)。
2. 如果你想删除或者新增旧版本中的 Chart 参数，推荐在 `helm upgrade` 命令中添加参数 `--reset-values` 。否则，你应该使用 `--reuse-values` 参数来恢复上一个版本的值。

## 可选：手动下载 Charts

如果你在生产环境中连接到 `https://koordinator-sh.github.io/charts/` 时遇到问题，你可能需要从 [此处](https://github.com/koordinator-sh/charts/releases) 手动下载 Charts 进行安装或升级。

```bash
$ helm install/upgrade koordinator /PATH/TO/CHART
```

## 启用 NRI 资源管理模式

### 前置条件

- Containerd >= 1.7.0 且配置启用 NRI。请确保 NRI 已在 containerd 中启用，否则请参考 [Enable NRI in Containerd](https://github.com/containerd/containerd/blob/main/docs/NRI.md)。
- Koordinator >= 1.3

### 配置方式

NRI 资源管理模式是*默认启用*的。你无需修改 koordlet 配置就可以使用它，也可以通过设置 `enable-nri-runtime-hook=false` 的 koordlet 启动参数来禁用它。当它的前置条件不满足时，启用也不会影响其他功能。

## 安装 koord-runtime-proxy

koord-runtime-proxy 充当 Kubelet 和 Containerd 之间的代理（Dockershim 场景下的 Dockerd），旨在拦截 CRI 请求, 并应用一些资源管理策略，比如在混合工作负载编排场景下通过 Pod 优先级设置不同的 CGroup 参数，为最新的 Linux 内核应用新的隔离策略, CPU 架构等等。

### 1、下载二进制文件

从 Github 下载：
```bash
$ # select the version
$ wget https://github.com/koordinator-sh/koordinator/releases/download/v1.3.0/koord-runtime-proxy_1.3.0.linux_x86_64 -O koord-runtime-proxy
$ chmod +x koord-runtime-proxy
```

或者，你可以从源代码开始构建：
```bash
$ git clone https://github.com/koordinator-sh/koordinator.git
$ cd koordinator
$ make build-koord-runtime-proxy
```

### 2、设置 koord-runtime-proxy

首先，请确保你的运行时后端是 Containerd 或 Dockerd。

在 Containerd 场景下，如果 Containerd 在默认的 `/var/run/containerd/containerd.sock` 监听 CRI 请求，koord-runtime-proxy 可以这样设置(无需任何参数)：

```
koord-runtime-proxy
```

或者使用以下命令设置：

```
koord-runtime-proxy \
   --remote-runtime-service-endpoint=<runtime socketFile path> \
   --remote-image-service-endpoint=<image socketFile path>
```

在 Docker 的场景下，koord-runtime-proxy 应该使用附加参数设置 `--backend-runtime-mode Docker`，无需 `remote-image-service-endpoint`:

```
koord-runtime-proxy \
   --backend-runtime-mode=Docker \
   --remote-runtime-service-endpoint=<runtime socketFile path>
```

koord-runtime-proxy 将监听 `/var/run/koord-runtimeproxy/runtimeproxy.sock`。

### 3、设置 Kubelet

要使 koord-runtime-proxy 成为 Kubelet 和 Containerd 之间的代理，应修改 Kubelet 参数，如下所示：

```
kubelet <other options> \
   --container-runtime=remote \
   --container-runtime-endpoint=unix:///var/run/koord-runtimeproxy/runtimeproxy.sock
```

在 Docker 的场景下, 应修改 Kubelet 参数如下：

```
kubelet <other options> --docker-endpoint=unix:///var/run/koord-runtimeproxy/runtimeproxy.sock
```


## 可选

请注意，直接安装这个 Chart 意味着使用 Koordinator 的默认模板值。

如果将其部署到生产集群中，或者你想要配置 `feature-gates`，你可能需要设置特定配置。

### 可选： Chart 参数

下表列出了 Chart 可配置参数及其默认值。

| Parameter                                 | Description                                                      | Default                         |
| ----------------------------------------- | ---------------------------------------------------------------- |---------------------------------|
| `featureGates`                            | Feature gates for Koordinator, empty string means all by default | ` `                             |
| `installation.namespace`                  | namespace for Koordinator installation                           | `koordinator-system`            |
| `installation.createNamespace`            | Whether to create the installation.namespace                     | `true`                          |
| `imageRepositoryHost`                     | Image repository host                                            | `ghcr.io`                       |
| `manager.log.level`                       | Log level that koord-manager printed                             | `4`                             |
| `manager.replicas`                        | Replicas of koord-manager deployment                             | `2`                             |
| `manager.image.repository`                | Repository for koord-manager image                               | `koordinatorsh/koord-manager`   |
| `manager.image.tag`                       | Tag for koord-manager image                                      | `v1.3.0`                        |
| `manager.resources.limits.cpu`            | CPU resource limit of koord-manager container                    | `1000m`                         |
| `manager.resources.limits.memory`         | Memory resource limit of koord-manager container                 | `1Gi`                           |
| `manager.resources.requests.cpu`          | CPU resource request of koord-manager container                  | `500m`                          |
| `manager.resources.requests.memory`       | Memory resource request of koord-manager container               | `256Mi`                         |
| `manager.metrics.port`                    | Port of metrics served                                           | `8080`                          |
| `manager.webhook.port`                    | Port of webhook served                                           | `9443`                          |
| `manager.nodeAffinity`                    | Node affinity policy for koord-manager pod                       | `{}`                            |
| `manager.nodeSelector`                    | Node labels for koord-manager pod                                | `{}`                            |
| `manager.tolerations`                     | Tolerations for koord-manager pod                                | `[]`                            |
| `manager.resyncPeriod`                    | Resync period of informer koord-manager, defaults no resync      | `0`                             |
| `manager.hostNetwork`                     | Whether koord-manager pod should run with hostnetwork            | `false`                         |
| `scheduler.log.level`                     | Log level that koord-scheduler printed                           | `4`                             |
| `scheduler.replicas`                      | Replicas of koord-scheduler deployment                           | `2`                             |
| `scheduler.image.repository`              | Repository for koord-scheduler image                             | `koordinatorsh/koord-scheduler` |
| `scheduler.image.tag`                     | Tag for koord-scheduler image                                    | `v1.3.0`                        |
| `scheduler.resources.limits.cpu`          | CPU resource limit of koord-scheduler container                  | `1000m`                         |
| `scheduler.resources.limits.memory`       | Memory resource limit of koord-scheduler container               | `1Gi`                           |
| `scheduler.resources.requests.cpu`        | CPU resource request of koord-scheduler container                | `500m`                          |
| `scheduler.resources.requests.memory`     | Memory resource request of koord-scheduler container             | `256Mi`                         |
| `scheduler.port`                          | Port of metrics served                                           | `10251`                         |
| `scheduler.nodeAffinity`                  | Node affinity policy for koord-scheduler pod                     | `{}`                            |
| `scheduler.nodeSelector`                  | Node labels for koord-scheduler pod                              | `{}`                            |
| `scheduler.tolerations`                   | Tolerations for koord-scheduler pod                              | `[]`                            |
| `scheduler.hostNetwork`                   | Whether koord-scheduler pod should run with hostnetwork          | `false`                         |
| `koordlet.log.level`                      | Log level that koordlet printed                                  | `4`                             |
| `koordlet.image.repository`               | Repository for koordlet image                                    | `koordinatorsh/koordlet`        |
| `koordlet.image.tag`                      | Tag for koordlet image                                           | `v1.3.0`                        |
| `koordlet.resources.limits.cpu`           | CPU resource limit of koordlet container                         | `500m`                          |
| `koordlet.resources.limits.memory`        | Memory resource limit of koordlet container                      | `256Mi`                         |
| `koordlet.resources.requests.cpu`         | CPU resource request of koordlet container                       | `0`                             |
| `koordlet.resources.requests.memory`      | Memory resource request of koordlet container                    | `0`                             |
| `koordlet.enableServiceMonitor`           | Whether to enable ServiceMonitor for koordlet                    | `false`                         |
| `webhookConfiguration.failurePolicy.pods` | The failurePolicy for pods in mutating webhook configuration     | `Ignore`                        |
| `webhookConfiguration.timeoutSeconds`     | The timeoutSeconds for all webhook configuration                 | `30`                            |
| `crds.managed`                            | Koordinator will not install CRDs with chart if this is false    | `true`                          |
| `imagePullSecrets`                        | The list of image pull secrets for koordinator image             | `false`                         |

使用 `helm install` 或 `helm upgrade` 的 `--set key=value[，key=value]` 参数指定每个参数。

### 可选: feature-gate

Feature-Gate 控制 Koordinator 中的一些有影响力的功能：

| Name                      | Description                                                       | Default | Effect (if closed)                     |
| ------------------------- | ----------------------------------------------------------------  | ------- | -------------------------------------- |
| `PodMutatingWebhook`      | Whether to open a mutating webhook for Pod **create**             | `true`  | Don't inject koordinator.sh/qosClass, koordinator.sh/priority and don't replace koordinator extend resources ad so on |
| `PodValidatingWebhook`    | Whether to open a validating webhook for Pod **create/update**    | `true`  | It is possible to create some Pods that do not conform to the Koordinator specification, causing some unpredictable problems |


如果要配置 feature-gate ，只需在安装或升级时设置参数即可。如：

```bash
$ helm install koordinator https://... --set featureGates="PodMutatingWebhook=true\,PodValidatingWebhook=true"
```

如果要启用所有 feature-gates ，请将参数设置为 `featureGates=AllAlpha=true` 。

### 可选: 中国本地镜像

如果你在中国并且无法从官方 DockerHub 拉取镜像，你可以使用托管在阿里云上的镜像仓库：

```bash
$ helm install koordinator https://... --set imageRepositoryHost=registry.cn-beijing.aliyuncs.com
```

## 最佳实践

### AWS EKS 的安装参数

在 EKS 上使用自定义 CNI（例如 Weave 或 Calico）时，默认情况下无法访问 webhook。发生这种情况是因为在 EKS 上控制平面无法配置运行自定义 CNI ，因此控制平面和工作节点之间的 CNI 不同。

为了解决这个问题，使用 helm install 或 upgrade 时设置 `--set manager.hostNetwork=true`，webhook 可以在主机网络中运行。

## 卸载

请注意，这将导致 Koordinator 创建的所有资源，包括 Webhook 配置、Services、Namespace、CRD 和由 Koordinator 控制器管理的 CR 实例，都被删除！
请在充分了解后果的情况下才这样做。

卸载通过 Chart 安装的 Koordinator ：

```bash
$ helm uninstall koordinator
release "koordinator" uninstalled
```

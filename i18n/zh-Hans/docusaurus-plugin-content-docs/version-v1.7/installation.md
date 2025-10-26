# 安装

Koordinator 依赖 **Kubernetes version >= 1.18**。

Koordinator 可能会从 kubelet 只读端口收集指标（默认设置为禁用，即采用了安全端口）。
更多信息请见 [here](https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet/).

为了最好的体验，koordinator 推荐 **linux kernel 4.19** 或者更高版本。

## 使用 Helm 安装

Koordinator 可以使用 Helm v3.5+ 安装, Helm 是一个简单的命令行工具，更多信息 [here](https://github.com/helm/helm/releases).

```bash
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Install the latest version.
$ helm install koordinator koordinator-sh/koordinator --version 1.7.0
```

## 使用 Helm 升级

```bash
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Upgrade the latest version.
$ helm upgrade koordinator koordinator-sh/koordinator --version 1.7.0 [--force]
```

注意：

1. 升级前，为确保你了解新版本中的重大更改，你 **必须** 先阅读 [变更日志](https://github.com/koordinator-sh/koordinator/blob/master/CHANGELOG.md)。
2. 如果你想删除或者新增旧版本中的 Chart 参数，推荐在 `helm upgrade` 命令中添加参数 `--reset-values` 。否则，你应该使用 `--reuse-values` 参数来恢复上一个版本的值。

## 可选：手动下载 Charts

如果你在生产环境中连接到 `https://koordinator-sh.github.io/charts/` 时遇到问题，你可能需要从 [此处](https://github.com/koordinator-sh/charts/releases) 手动下载 Charts 进行安装或升级。

```bash
$ helm install/upgrade koordinator /PATH/TO/CHART
```

## 可选：启用 NRI 资源管理模式

### 前置条件

- Containerd >= 1.7.0 且配置启用 NRI。请确保 NRI 已在 containerd 中启用，否则请参考 [Enable NRI in Containerd](https://github.com/containerd/containerd/blob/main/docs/NRI.md)。
- Koordinator >= 1.3

### 配置方式

NRI 资源管理模式是*默认启用*的。你无需修改 koordlet 配置就可以使用它，也可以通过设置 `enable-nri-runtime-hook=false` 的 koordlet 启动参数来禁用它。当它的前置条件不满足时，启用也不会影响其他功能。

更多细节，请参考[NRI资源管理模式](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/20230608-nri-mode-resource-management.md)。

## 可选

请注意，直接安装这个 Chart 意味着使用 Koordinator 的默认模板值。

如果将其部署到生产集群中，或者你想要配置 `feature-gates`，你可能需要设置特定配置。

### 可选： Chart 参数

下表列出了 Chart 可配置参数及其默认值。

| Parameter                                          | Description                                                      | Default                         |
|----------------------------------------------------|------------------------------------------------------------------|---------------------------------|
| `featureGates`                                     | Feature gates for Koordinator, empty string means all by default | ` `                             |
| `installation.namespace`                           | namespace for Koordinator installation                           | `koordinator-system`            |
| `installation.createNamespace`                     | Whether to create the installation.namespace                     | `true`                          |
| `imageRepositoryHost`                              | Image repository host                                            | `ghcr.io`                       |
| `manager.log.level`                                | Log level that koord-manager printed                             | `4`                             |
| `manager.replicas`                                 | Replicas of koord-manager deployment                             | `2`                             |
| `manager.image.repository`                         | Repository for koord-manager image                               | `koordinatorsh/koord-manager`   |
| `manager.image.tag`                                | Tag for koord-manager image                                      | `v1.7.0`                        |
| `manager.resources.limits.cpu`                     | CPU resource limit of koord-manager container                    | `1000m`                         |
| `manager.resources.limits.memory`                  | Memory resource limit of koord-manager container                 | `1Gi`                           |
| `manager.resources.requests.cpu`                   | CPU resource request of koord-manager container                  | `500m`                          |
| `manager.resources.requests.memory`                | Memory resource request of koord-manager container               | `256Mi`                         |
| `manager.metrics.port`                             | Port of metrics served                                           | `8080`                          |
| `manager.webhook.port`                             | Port of webhook served                                           | `9876`                          |
| `manager.healthProbe.port`                         | Port of health probe served                                      | `8000`                          |
| `manager.nodeAffinity`                             | Node affinity policy for koord-manager pod                       | `{}`                            |
| `manager.nodeSelector`                             | Node labels for koord-manager pod                                | `{}`                            |
| `manager.tolerations`                              | Tolerations for koord-manager pod                                | `[]`                            |
| `manager.resyncPeriod`                             | Resync period of informer koord-manager, defaults no resync      | `0`                             |
| `manager.hostNetwork`                              | Whether koord-manager pod should run with hostnetwork            | `false`                         |
| `scheduler.log.level`                              | Log level that koord-scheduler printed                           | `4`                             |
| `scheduler.replicas`                               | Replicas of koord-scheduler deployment                           | `2`                             |
| `scheduler.image.repository`                       | Repository for koord-scheduler image                             | `koordinatorsh/koord-scheduler` |
| `scheduler.image.tag`                              | Tag for koord-scheduler image                                    | `v1.7.0`                        |
| `scheduler.resources.limits.cpu`                   | CPU resource limit of koord-scheduler container                  | `1000m`                         |
| `scheduler.resources.limits.memory`                | Memory resource limit of koord-scheduler container               | `1Gi`                           |
| `scheduler.resources.requests.cpu`                 | CPU resource request of koord-scheduler container                | `500m`                          |
| `scheduler.resources.requests.memory`              | Memory resource request of koord-scheduler container             | `256Mi`                         |
| `scheduler.port`                                   | Port of metrics served                                           | `10251`                         |
| `scheduler.nodeAffinity`                           | Node affinity policy for koord-scheduler pod                     | `{}`                            |
| `scheduler.nodeSelector`                           | Node labels for koord-scheduler pod                              | `{}`                            |
| `scheduler.tolerations`                            | Tolerations for koord-scheduler pod                              | `[]`                            |
| `scheduler.hostNetwork`                            | Whether koord-scheduler pod should run with hostnetwork          | `false`                         |
| `koordlet.log.level`                               | Log level that koordlet printed                                  | `4`                             |
| `koordlet.image.repository`                        | Repository for koordlet image                                    | `koordinatorsh/koordlet`        |
| `koordlet.image.tag`                               | Tag for koordlet image                                           | `v1.7.0`                        |
| `koordlet.resources.limits.cpu`                    | CPU resource limit of koordlet container                         | `200m`                          |
| `koordlet.resources.limits.memory`                 | Memory resource limit of koordlet container                      | `256Mi`                         |
| `koordlet.resources.requests.cpu`                  | CPU resource request of koordlet container                       | `0`                             |
| `koordlet.resources.requests.memory`               | Memory resource request of koordlet container                    | `0`                             |
| `koordlet.nodeAffinity`                            | Node affinity policy for koordlet pod                            | `{}`                            |
| `koordlet.runtimeClassName`                        | RuntimeClassName for koordlet pod                                | ` `                             |
| `koordlet.enableServiceMonitor`                    | Whether to enable ServiceMonitor for koordlet                    | `false`                         |
| `koordlet.metrics.port`                            | Port of metrics served                                           | `9316`                          |
| `scheduler.featureGates`                           | Feature gates for koord-scheduler                                | ` `                             |
| `scheduler.enableJobPreemption`                    | Whether to enable job preemption in koord-scheduler              | `true`                          |
| `descheduler.log.level`                            | Log level that koord-descheduler printed                         | `4`                             |
| `descheduler.replicas`                             | Replicas of koord-descheduler deployment                         | `2`                             |
| `descheduler.image.repository`                     | Repository for koord-descheduler image                           | `koordinatorsh/koord-descheduler` |
| `descheduler.image.tag`                            | Tag for koord-descheduler image                                  | `v1.7.0`                        |
| `descheduler.resources.limits.cpu`                 | CPU resource limit of koord-descheduler container                | `1000m`                         |
| `descheduler.resources.limits.memory`              | Memory resource limit of koord-descheduler container             | `1Gi`                           |
| `descheduler.resources.requests.cpu`               | CPU resource request of koord-descheduler container              | `500m`                          |
| `descheduler.resources.requests.memory`            | Memory resource request of koord-descheduler container           | `256Mi`                         |
| `descheduler.port`                                 | Port of metrics served                                           | `10251`                         |
| `descheduler.featureGates`                         | Feature gates for koord-descheduler                              | ` `                             |
| `descheduler.nodeAffinity`                         | Node affinity policy for koord-descheduler pod                   | `{}`                            |
| `descheduler.nodeSelector`                         | Node labels for koord-descheduler pod                            | `{}`                            |
| `descheduler.tolerations`                          | Tolerations for koord-descheduler pod                            | `[]`                            |
| `descheduler.hostNetwork`                          | Whether koord-descheduler pod should run with hostnetwork        | `false`                         |
| `deviceDaemon.log.level`                           | Log level that koord-device-daemon printed                       | `4`                             |
| `deviceDaemon.image.repository`                    | Repository for koord-device-daemon image                         | `koordinatorsh/koord-device-daemon` |
| `deviceDaemon.image.tag`                           | Tag for koord-device-daemon image                                | `v1.7.0`                        |
| `deviceDaemon.resources.limits.cpu`                | CPU resource limit of koord-device-daemon container              | `200m`                          |
| `deviceDaemon.resources.limits.memory`             | Memory resource limit of koord-device-daemon container           | `256Mi`                         |
| `deviceDaemon.resources.requests.cpu`              | CPU resource request of koord-device-daemon container            | `0`                             |
| `deviceDaemon.resources.requests.memory`           | Memory resource request of koord-device-daemon container         | `0`                             |
| `deviceDaemon.nodeAffinity`                        | Node affinity policy for koord-device-daemon pod                 | `{}`                            |
| `webhookConfiguration.failurePolicy.pods`          | The failurePolicy for pods in mutating webhook configuration     | `Ignore`                        |
| `webhookConfiguration.failurePolicy.elasticquotas` | The failurePolicy for elasticQuotas in all webhook configuration | `Ignore`                        |
| `webhookConfiguration.failurePolicy.nodeStatus`    | The failurePolicy for node.status in all webhook configuration   | `Ignore`                        |
| `webhookConfiguration.failurePolicy.nodes`         | The failurePolicy for nodes in all webhook configuration         | `Ignore`                        |
| `webhookConfiguration.failurePolicy.reservations`  | The failurePolicy for reservations in all webhook configuration  | `Ignore`                        |
| `webhookConfiguration.timeoutSeconds`              | The timeoutSeconds for all webhook configuration                 | `30`                            |
| `crds.managed`                                     | Koordinator will not install CRDs with chart if this is false    | `true`                          |
| `imagePullSecrets`                                 | The list of image pull secrets for koordinator image             | `false`                         |

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

### 可选: 安装指定的 CRDs

如果要在安装或升级途中跳过指定的 CRDs ，只需将参数 `crds.<crdPluralName>` 设置为 `false` 并手动安装或升级它们。

```bash
# skip install the CRD noderesourcetopologies.topology.node.k8s.io
$ helm install koordinator https://... --set crds.managed=true,crds.noderesourcetopologies=false
# only upgrade specific CRDs
$ helm upgrade koordinator https://... --set crds.managed=true,crds.recommendations=true,crds.clustercolocationprofiles=true,crds.elasticquotaprofiles=true,crds.elasticquotas=true,crds.devices=true,crds.podgroups=true,crds.podmigrationjobs=true,crds.clusternetworktopologies=true,crds.scheduleexplanations=true
```

### 可选: 中国本地镜像

如果你在中国并且无法从官方 DockerHub 拉取镜像，你可以使用托管在阿里云上的镜像仓库：

```bash
$ helm install koordinator https://... --set imageRepositoryHost=registry.cn-beijing.aliyuncs.com
```

## 最佳实践

### AWS EKS 的安装参数

在 EKS 上使用自定义 CNI（例如 Weave 或 Calico）时，默认情况下无法访问 webhook。发生这种情况是因为在 EKS 上控制平面无法配置运行自定义 CNI ，因此控制平面和工作节点之间的 CNI 不同。

为了解决这个问题，使用 helm install 或 upgrade 时设置 `--set manager.hostNetwork=true`，webhook 可以在主机网络中运行。

### 阿里云 ACK 的安装参数

为了在阿里云 ACK 上安装或升级 Koordinator，需要跳过一些 CRDs，因为 ACK 集群应该已经准备好它们，且它们无法被 Helm 接管。

例如，你可能会收到以下报错：

```bash
$ helm install koordinator koordinator-sh/koordinator --version 1.7.0
Error: INSTALLATION FAILED: rendered manifests contain a resource that already exists. Unable to continue with install: CustomResourceDefinition "reservations.scheduling.koordinator.sh" in namespace "" exists and cannot be imported into the current release: invalid ownership metadata; label validation error: missing key "app.kubernetes.io/managed-by": must be set to "Helm"; annotation validation error: missing key "meta.helm.sh/release-name": must be set to "koordinator"; annotation validation error: missing key "meta.helm.sh/release-namespace": must be set to "default"
```

为了解决冲突报错，你可以在安装或升级中关闭冲突的 CRDs。请参考 [可选：安装指定的CRDs](#可选-安装指定的-crds)。

1. (可选) 检查已经在 ACK 上部署的 Koordinator 相关的 CRDs。

```bash
# for the latest CRDs, please refer to https://github.com/koordinator-sh/koordinator/blob/main/charts/koordinator/crds/crds.yaml
$ kubectl get crd | grep "nodemetrics\|noderesourcetopologies\|elasticquotas\|podgroup\|reservations"
elasticquotas.scheduling.sigs.k8s.io                             1970-01-01T00:00:00Z
nodemetrics.slo.koordinator.sh                                   1970-01-01T00:00:00Z
noderesourcetopologies.topology.node.k8s.io                      1970-01-01T00:00:00Z
podgroups.scheduling.sigs.k8s.io                                 1970-01-01T00:00:00Z
reservations.scheduling.koordinator.sh                           1970-01-01T00:00:00Z
```

2. 安装或升级时排除掉已部署的 CRDs。

```bash
# install without the deployed CRDs
$ helm install koordinator https://... --set crds.managed=true,crds.nodemetrics=false,crds.noderesourcetopologies=false,crds.elasticquotas=false,crds.podgroups=false,crds.reservations=false

# upgrade without the deployed CRDs
$ helm upgrade koordinator https://... --set crds.managed=true,crds.nodemetrics=false,crds.noderesourcetopologies=false,crds.elasticquotas=false,crds.podgroups=false,crds.reservations=false
```

3. Kind 集群安装

在 Kind 集群上部署 Koordinator 时，需要考虑以下配置原因：

Kind 使用基于容器的节点，默认使用的 cgroup 根路径为 `/kubelet`。
Koordlet 预期监控的 cgroup 路径是 `/host-cgroup/kubepods.slice`，如果 kubelet 的 cgroupRoot 没有设置为 /，该路径可能不存在。
为了确保 Koordinator 在 Kind 中能够成功部署和正常运行，请按照以下步骤操作：

- 创建自定义 Kubelet 配置的 Kind 集群
```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
   - role: control-plane
   - role: worker
   - role: worker
kubeadmConfigPatches:
   - |
      kind: InitConfiguration
      nodeRegistration:
        kubeletExtraArgs:
          "cgroup-root": "/"
      ---
      kind: KubeletConfiguration
      cgroupRoot: /
```
然后使用该配置创建集群：

```yaml
kind create cluster --config=kind-config.yaml
```

- 通过 Helm 安装 Koordinator

添加 Koordinator 的 Helm 仓库：


```bash
helm repo add koordinator-sh https://koordinator-sh.github.io/koordinator/
helm repo update
```

使用以下命令安装 Koordinator：


```bash
helm install koordinator koordinator-sh/koordinator --version 1.7.0
```

## 卸载

请注意，这将导致 Koordinator 创建的所有资源，包括 Webhook 配置、Services、Namespace、CRD 和由 Koordinator 控制器管理的 CR 实例，都被删除！
请在充分了解后果的情况下才这样做。

卸载通过 Chart 安装的 Koordinator ：

```bash
$ helm uninstall koordinator
release "koordinator" uninstalled
```

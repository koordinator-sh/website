# Installation

Since v0.1.0 (alpha/beta), Koordinator requires **Kubernetes version >= 1.18**.

Koordinator need collect metrics from kubelet read-only port(default is disabled).
you can get more info form [here](https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet/).

For the best experience, koordinator recommands **linux kernel 4.19** or higher.


## Install with helms

Koordinator can be simply installed by helm v3.5+, which is a simple command-line tool and you can get it from [here](https://github.com/helm/helm/releases).

```bash
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Install the latest version.
$ helm install koordinator koordinator-sh/koordinator --version 0.7.0
```

## Upgrade with helm

```bash
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Upgrade the latest version.
$ helm upgrade koordinator koordinator-sh/koordinator --version 0.7.0 [--force]
```

Note that:

1. Before upgrade, you **must** firstly read the [Change Log](https://github.com/koordinator-sh/koordinator/blob/master/CHANGELOG.md)
   to make sure that you have understand the breaking changes in the new version.
2. If you want to drop the chart parameters you configured for the old release or set some new parameters,
   it is recommended to add `--reset-values` flag in `helm upgrade` command.
   Otherwise you should use `--reuse-values` flag to reuse the last release's values.

## Optional: download charts manually

If you have problem with connecting to `https://koordinator-sh.github.io/charts/` in production, you might need to download the chart from [here](https://github.com/koordinator-sh/charts/releases) manually and install or upgrade with it.

```bash
$ helm install/upgrade koordinator /PATH/TO/CHART
```

## Install koord-runtime-proxy

koord-runtime-proxy acts as a proxy between kubelet and containerd(dockerd under dockershim scenario), which is designed to intercept CRI request, and apply some resource management policies, such as setting different cgroup parameters by pod priorities under hybrid workload orchestration scenario, applying new isolation policies for latest Linux kernel, CPU architecture, and etc.

### 1、Get binary

Download from github releases:
```bash
$ # select the version
$ wget https://github.com/koordinator-sh/koordinator/releases/download/v0.7.0/koord-runtime-proxy_0.7.0_linux_x86_64 -O koord-runtime-proxy
$ chmod +x koord-runtime-proxy
```

Or you can build from source:
```bash
$ git clone https://github.com/koordinator-sh/koordinator.git
$ cd koordinator
$ make build-koord-runtime-proxy
```

### 2、Setup koord-runtime-proxy

Firstly, please make sure your runtime backend is containerd or dockerd.

Under containerd scenario, if your containerd listening CRI request on default `/var/run/containerd/containerd.sock`, koord-runtime-proxy can be setup by(no need to set any parameters):

```
koord-runtime-proxy
```

Or koord-runtime-proxy can be setup with command:

```
koord-runtime-proxy \
   --remote-runtime-service-endpoint=<runtime socketFile path> \
   --remote-image-service-endpoint=<image socketFile path>
```

Under docker scenario, koord-runtime-proxy should be setup with the additional parameter `--backend-runtime-mode Docker`, and without `remote-image-service-endpoint`:

```
koord-runtime-proxy \
   --backend-runtime-mode=Docker \
   --remote-runtime-service-endpoint=<runtime socketFile path>
```

koord-runtime-proxy will listen on `/var/run/koord-runtimeproxy/runtimeproxy.sock`.

### 3、Setup Kubelet

To make koord-runtime-proxy a proxy between kubelet and containerd, kubelet parameters should be altered as shown below:

```
kubelet <other options> \
   --container-runtime=remote \
   --container-runtime-endpoint=/var/run/koord-runtimeproxy/runtimeproxy.sock
```

Under docker scenario, to make koord-runtime-proxy a proxy between kubelet and dockerd, kubelet parameters should be altered as shown below:

```
kubelet <other options> --docker-endpoint=/var/run/koord-runtimeproxy/runtimeproxy.sock
```


## Options

Note that installing this chart directly means it will use the default template values for Koordinator.

You may have to set your specific configurations if it is deployed into a production cluster, or you want to configure feature-gates.

### Optional: chart parameters

The following table lists the configurable parameters of the chart and their default values.

| Parameter                                 | Description                                                      | Default                         |
| ----------------------------------------- | ---------------------------------------------------------------- |---------------------------------|
| `featureGates`                            | Feature gates for Koordinator, empty string means all by default | ` `                             |
| `installation.namespace`                  | namespace for Koordinator installation                           | `koordinator-system`            |
| `installation.createNamespace`            | Whether to create the installation.namespace                     | `true`                          |
| `imageRepositoryHost`                     | Image repository host                                            | `ghcr.io`                       |
| `manager.log.level`                       | Log level that koord-manager printed                             | `4`                             |
| `manager.replicas`                        | Replicas of koord-manager deployment                             | `2`                             |
| `manager.image.repository`                | Repository for koord-manager image                               | `koordinatorsh/koord-manager`   |
| `manager.image.tag`                       | Tag for koord-manager image                                      | `0.7.0`                         |
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
| `scheduler.image.tag`                     | Tag for koord-scheduler image                                    | `0.7.0`                         |
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
| `koordlet.image.tag`                      | Tag for koordlet image                                           | `0.7.0`                         |
| `koordlet.resources.limits.cpu`           | CPU resource limit of koordlet container                         | `500m`                          |
| `koordlet.resources.limits.memory`        | Memory resource limit of koordlet container                      | `256Mi`                         |
| `koordlet.resources.requests.cpu`         | CPU resource request of koordlet container                       | `0`                             |
| `koordlet.resources.requests.memory`      | Memory resource request of koordlet container                    | `0`                             |
| `webhookConfiguration.failurePolicy.pods` | The failurePolicy for pods in mutating webhook configuration     | `Ignore`                        |
| `webhookConfiguration.timeoutSeconds`     | The timeoutSeconds for all webhook configuration                 | `30`                            |
| `crds.managed`                            | Koordinator will not install CRDs with chart if this is false    | `true`                          |
| `imagePullSecrets`                        | The list of image pull secrets for koordinator image             | `false`                         |

Specify each parameter using the `--set key=value[,key=value]` argument to `helm install` or `helm upgrade`.

### Optional: feature-gate

Feature-gate controls some influential features in Koordinator:

| Name                      | Description                                                       | Default | Effect (if closed)                     |
| ------------------------- | ----------------------------------------------------------------  | ------- | -------------------------------------- |
| `PodMutatingWebhook`      | Whether to open a mutating webhook for Pod **create**             | `true`  | Don't inject koordinator.sh/qosClass, koordinator.sh/priority and don't replace koordinator extend resources ad so on |
| `PodValidatingWebhook`    | Whether to open a validating webhook for Pod **create/update**    | `true`  | It is possible to create some Pods that do not conform to the Koordinator specification, causing some unpredictable problems |


If you want to configure the feature-gate, just set the parameter when install or upgrade. Such as:

```bash
$ helm install koordinator https://... --set featureGates="PodMutatingWebhook=true\,PodValidatingWebhook=true"
```

If you want to enable all feature-gates, set the parameter as `featureGates=AllAlpha=true`.

### Optional: the local image for China

If you are in China and have problem to pull image from official DockerHub, you can use the registry hosted on Alibaba Cloud:

```bash
$ helm install koordinator https://... --set imageRepositoryHost=registry.cn-beijing.aliyuncs.com
```

## Best Practices

### Installation parameters for AWS EKS

When using a custom CNI (such as Weave or Calico) on EKS, the webhook cannot be reached by default. This happens because the control plane cannot be configured to run on a custom CNI on EKS, so the CNIs differ between control plane and worker nodes.

To address this, the webhook can be run in the host network so it can be reached, by setting `--set manager.hostNetwork=true` when use helm install or upgrade.

## Uninstall

Note that this will lead to all resources created by Koordinator, including webhook configurations, services, namespace, CRDs and CR instances managed by Koordinator controller, to be deleted!

Please do this ONLY when you fully understand the consequence.

To uninstall koordinator if it is installed with helm charts:

```bash
$ helm uninstall koordinator
release "koordinator" uninstalled
```

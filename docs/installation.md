# Installation

Koordinator requires **Kubernetes version >= 1.18**.

Koordinator may collect metrics from kubelet read-only port (disabled by default, where the secure port is used).
You can get more info form [here](https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet/).

For the best experience, koordinator recommends **linux kernel 4.19** or higher.

## Install with helms

Koordinator can be simply installed by helm v3.5+, which is a simple command-line tool, and you can get it from [here](https://github.com/helm/helm/releases).

```bash
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Install the latest version.
$ helm install koordinator koordinator-sh/koordinator --version 1.6.0
```

## Upgrade with helm

```bash
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Upgrade the latest version.
$ helm upgrade koordinator koordinator-sh/koordinator --version 1.6.0 [--force]
```

Note that:

1. Before upgrade, you **must** firstly read the [Change Log](https://github.com/koordinator-sh/koordinator/blob/master/CHANGELOG.md)
   to make sure that you have understand the breaking changes in the new version.
2. If you want to drop the chart parameters you configured for the old release or set some new parameters,
   it is recommended to add `--reset-values` flag in `helm upgrade` command.
   Otherwise, you should use `--reuse-values` flag to reuse the last release's values.

## Optional: download charts manually

If you have problem with connecting to `https://koordinator-sh.github.io/charts/` in production, you might need to download the chart from [here](https://github.com/koordinator-sh/charts/releases) manually and install or upgrade with it.

```bash
$ helm install/upgrade koordinator /PATH/TO/CHART
```

## Optional: Enable NRI Mode Resource Management

### Prerequisite

- Containerd >= 1.7.0 and enable NRI.  Please make sure NRI is enabled in containerd. If not, please refer to [Enable NRI in Containerd](https://github.com/containerd/containerd/blob/main/docs/NRI.md)
- Koordinator >= 1.3

### Configurations

NRI mode resource management is *Enabled* by default. You can use it without any modification on the koordlet config. You can also disable it to set `enable-nri-runtime-hook=false` in koordlet start args. It doesn't matter if all prerequisites are not meet. You can use all other features as expected.

For more details, please refer to [NRI Mode Resource Management](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/20230608-nri-mode-resource-management.md).

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
| `manager.image.tag`                       | Tag for koord-manager image                                      | `v1.6.0`                        |
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
| `scheduler.image.tag`                     | Tag for koord-scheduler image                                    | `v1.6.0`                        |
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
| `koordlet.image.tag`                      | Tag for koordlet image                                           | `v1.6.0`                        |
| `koordlet.resources.limits.cpu`           | CPU resource limit of koordlet container                         | `500m`                          |
| `koordlet.resources.limits.memory`        | Memory resource limit of koordlet container                      | `256Mi`                         |
| `koordlet.resources.requests.cpu`         | CPU resource request of koordlet container                       | `0`                             |
| `koordlet.resources.requests.memory`      | Memory resource request of koordlet container                    | `0`                             |
| `koordlet.enableServiceMonitor`           | Whether to enable ServiceMonitor for koordlet                    | `false`                         |
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

### Optional: install or upgrade specific CRDs

If you want to skip specific CRDs during the installation or the upgrade, you can set the parameter `crds.<crdPluralName>` to `false` and install or upgrade them manually.

```bash
# skip install specific CRD
$ helm install koordinator https://... --set crds.managed=true,crds.noderesourcetopologies=false
# only upgrade specific CRDs
$ helm upgrade koordinator https://... --set crds.managed=false,crds.recommendations=true,crds.clustercolocationprofiles=true,crds.elasticquotaprofiles=true,crds.elasticquotas=true,crds.devices=true,crds.podgroups=true
```

### Optional: the local image for China

If you are in China and have problem to pull image from official DockerHub, you can use the registry hosted on Alibaba Cloud:

```bash
$ helm install koordinator https://... --set imageRepositoryHost=registry.cn-beijing.aliyuncs.com
```

## Best Practices

### Installation parameters for AWS EKS

When using a custom CNI (such as Weave or Calico) on EKS, the webhook cannot be reached by default. This happens because the control plane cannot be configured to run on a custom CNI on EKS, so the CNIs differ between control plane and worker nodes.

To address this, the webhook can be run in the host network, so it can be reached, by setting `--set manager.hostNetwork=true` when use helm install or upgrade.

### Installation parameters for Alibaba Cloud ACK

To install or upgrade Koordinator on Alibaba Cloud ACK, you need to skip some CRDs because the ACK cluster should already prepare them, and they cannot be takeover by the Helm.

e.g. You may get the error below:

```bash
$ helm install koordinator koordinator-sh/koordinator --version 1.6.0
Error: INSTALLATION FAILED: rendered manifests contain a resource that already exists. Unable to continue with install: CustomResourceDefinition "reservations.scheduling.koordinator.sh" in namespace "" exists and cannot be imported into the current release: invalid ownership metadata; label validation error: missing key "app.kubernetes.io/managed-by": must be set to "Helm"; annotation validation error: missing key "meta.helm.sh/release-name": must be set to "koordinator"; annotation validation error: missing key "meta.helm.sh/release-namespace": must be set to "default"
```

To resolve the conflict error, you can install or upgrade with the conflict CRDs disabled. Please refer to [Optional: install or upgrade specific CRDs](#optional-install-or-upgrade-specific-crds).

1. (Optional) Check the Koordinator-related CRDs already deployed by ACK.

```bash
# for the latest CRDs, please refer to https://github.com/koordinator-sh/koordinator/blob/main/charts/koordinator/crds/crds.yaml
$ kubectl get crd | grep "nodemetrics\|noderesourcetopologies\|elasticquotas\|podgroup\|reservations"
elasticquotas.scheduling.sigs.k8s.io                             1970-01-01T00:00:00Z
nodemetrics.slo.koordinator.sh                                   1970-01-01T00:00:00Z
noderesourcetopologies.topology.node.k8s.io                      1970-01-01T00:00:00Z
podgroups.scheduling.sigs.k8s.io                                 1970-01-01T00:00:00Z
reservations.scheduling.koordinator.sh                           1970-01-01T00:00:00Z
```

2. Install or upgrade Koordinator without the deployed CRDs.

```bash
# install without the deployed CRDs
$ helm install koordinator https://... --set crds.managed=true,crds.nodemetrics=false,crds.noderesourcetopologies=false,crds.elasticquotas=false,crds.podgroups=false,crds.reservations=false

# upgrade without the deployed CRDs
$ helm upgrade koordinator https://... --set crds.managed=true,crds.nodemetrics=false,crds.noderesourcetopologies=false,crds.elasticquotas=false,crds.podgroups=false,crds.reservations=false
```

3. Installation for Kind Clusters.

When deploying Koordinator on a Kind cluster, we need to consider the configurations due to:

Kind uses container-based nodes, which may use a different cgroup root (`/kubelet` by default).
Koordlet expects to monitor cgroup paths like `/host-cgroup/kubepods.slice`, which may not exist if kubelet's cgroupRoot is not set to /.
To ensure successful deployment and operation of Koordinator in Kind, follow these steps:

- Create a Kind Cluster with Custom Kubelet Configuration

Create a kind-config.yaml file with the following content to configure kubelet to use `cgroupRoot: /`:

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

Then create the cluster:

```yaml
kind create cluster --config=kind-config.yaml
```

- Install Koordinator via Helm

Add the Koordinator Helm repository:

```bash
helm repo add koordinator-sh https://koordinator-sh.github.io/koordinator/
helm repo update
```

Install Koordinator using the following command:

```bash
helm install koordinator koordinator-sh/koordinator --version 1.6.0
```

## Uninstall

Note that this will lead to all resources created by Koordinator, including webhook configurations, services, namespace, CRDs and CR instances managed by Koordinator controller, to be deleted!

Please do this ONLY when you fully understand the consequence.

To uninstall koordinator if it is installed with helm charts:

```bash
$ helm uninstall koordinator
release "koordinator" uninstalled
```

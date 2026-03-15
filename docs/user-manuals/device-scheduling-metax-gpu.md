# Device Scheduling - Metax GPU

## Background

Koordinator supports Metax GPUs in Kubernetes. Through the `koord-device-daemon` and `koordlet` components, heterogeneous GPU resources are reported and aggregated into the `Device` object for topology-aware scheduling.

## Usage

### Prerequisites

Metax GPU virtualization requires the following components to be installed and configured:
- Metax Driver
- [metax-container-runtime](https://developer.metax-tech.com/api/client/document/preview/1006/k8s/03_component.html#container-runtime)
- [metax-gpu-device (enable sGPU parameter configuration)](https://developer.metax-tech.com/api/client/document/preview/1006/k8s/03_component.html#device-config)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: metax-device-config
  annotations:
    # sGPU startup configuration
data:
  version: v1
  cluster-config: |
    mode: "native" # sgpu/shared/vgpu, cluster scope
  nodes-config: |
    - nodeName: "sample-node1"
      mode: "sgpu" # sgpu/shared/vgpu, node scope
```

- Koordinator components (>= v1.7.0)
  - Set `DevicePluginAdaption=true` in the chart's `scheduler.featureGates` to enable this feature.

> **Note:** [sGPU](https://developer.metax-tech.com/api/client/document/preview/1009/k8s/04_sgpu.html#sgpu) is Metax's software-based compute slicing solution that can create up to 16 virtual GPU instances from a single physical GPU, primarily targeting cloud-based inference and small-scale model training scenarios with containers.

### Steps to Use

1. Verify the Metax GPU is recognized by the `Device` resource:
   ```bash
   kubectl get device <node-name> -o yaml
   ```
> **Note:**
> - The label `node.koordinator.sh/gpu-vendor` should have the value `metax`

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Device
metadata:
  labels:
    node.koordinator.sh/gpu-model: C500 # The model of the Metax card.
    node.koordinator.sh/gpu-vendor: metax # The vendor of the card.
  name: sample-node1
spec:
  devices:
  - health: true
    id: 89033010-2354-0000-0000-000000000000 # The UUID of the Metax card (mocked value).
    minor: 0 # The minor number of the Metax card.
    resources:
      koordinator.sh/gpu-core: "100" # The total compute capacity of the Metax card in percentage.
      koordinator.sh/gpu-memory: "64Gi" # The total GPU memory of the Metax card.
      koordinator.sh/gpu-memory-ratio: "100" # The total GPU memory ratio in percentage.
    topology:
      busID: 0000:38:00.0 # The PCI bus ID.
      nodeID: 3 # The NUMA node ID.
      pcieID: pci0000:3a # The PCI root ID.
      socketID: -1
    type: gpu
    conditions:
    - lastTransitionTime: "2025-03-15T10:00:00Z"
      message: device is healthy
      reason: DeviceHealthy
      status: "True"
      type: Healthy
status: {}
```

2. Verify the Metax GPU resources are registered on the node:
   `kubectl get node <node-name> -o yaml` Check `status.allocatable` and `status.capacity` for GPU resources.

```yaml
apiVersion: v1
kind: Node
metadata:
  name: sample-node1
  ...
status:
    allocatable:
      ...
      koordinator.sh/gpu.shared: "100" # Reported by koordinator
      koordinator.sh/gpu-core: "100" # Reported by koordinator
      koordinator.sh/gpu-memory: 64Gi # Reported by koordinator
      koordinator.sh/gpu-memory-ratio: "100" # Reported by koordinator
      metax-tech.com/sgpu: "16" # Reported by metax-gpu-device
    capacity:
      ...
      koordinator.sh/gpu.shared: "100" # Reported by koordinator
      koordinator.sh/gpu-core: "100" # Reported by koordinator
      koordinator.sh/gpu-memory: 64Gi # Reported by koordinator
      koordinator.sh/gpu-memory-ratio: "100" # Reported by koordinator
      metax-tech.com/sgpu: "16" # Reported by metax-gpu-device
```

3. Create a Pod to request a Metax GPU. The following example demonstrates the virtual GPU scenario. **Note: Metax does not support multi-GPU virtualization**.

   > **Notes:**
   > - This example uses Ubuntu; use an appropriate image for your workload.
   > - Configure both `resources.limits` and `resources.requests`:
   >   - **Virtual GPU scenario** (using Metax C500 as an example):
   >     - `koordinator.sh/gpu.shared`: Set to `1` to request a virtual GPU.
   >     - `koordinator.sh/gpu-core`: Specify the compute percentage required.
   >     - `koordinator.sh/gpu-memory`: Specify the GPU memory amount.
   >     - `metax-tech.com/sgpu`: Specify the number of virtual GPUs.
   > - Configure the QoS policy in `metadata.annotations`:
   >   - `fixed-share`: Guaranteed resources.
   >   - `best-effort`: Burstable resources.

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: demo-sleep
  name: test-metax-sgpu
  namespace: default
  annotations:
     metax-tech.com/sgpu-qos-policy: "fixed-share" # fixed-share/best-effort
spec:
  containers:
  - command:
    - sleep
    - infinity
    image: ubuntu:22.04
    imagePullPolicy: IfNotPresent
    name: demo-sleep
    resources:
      limits:
        cpu: "32"
        memory: 64Gi
        koordinator.sh/gpu.shared: "1"
        koordinator.sh/gpu-memory: "1Gi"
        koordinator.sh/gpu-core: "10"
        metax-tech.com/sgpu: "1"
      requests:
        cpu: "32"
        memory: 64Gi
        koordinator.sh/gpu.shared: "1"
        koordinator.sh/gpu-memory: "1Gi"
        koordinator.sh/gpu-core: "10"
        metax-tech.com/sgpu: "1"
```

4. Verify GPU allocation by checking device files inside the container:
   ```bash
   kubectl exec -it <pod-name> -- ls /dev/mx*
   ```
   If the command lists device files (e.g., `/dev/mxcd`), the GPU is successfully allocated.

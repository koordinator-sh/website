# Device Scheduling - cambricon-mlu

## Background

Currently, Koordinator supports the use of Cambricon cards in K8s. Based on the `koord-device-daemon` and `koordlet` components, heterogeneous GPU resources are reported, and heterogeneous card information is aggregated into the `Device` object for topology scheduling by the scheduler.

## Usage
### Prerequisites
The use of Cambricon cards requires prior installation and configuration of the following components:
- Cambricon Driver
- [Cambricon Device Plugin (enable virtualization parameter configuration)](https://github.com/Cambricon/cambricon-k8s-device-plugin)
``` startup parameters
args:
  - --mode=dynamic-smlu # device plugin mode: default, dynamic-smlu, env-share, mim, topology-aware
  - --virtualization-num=1 # virtualization number for each MLU, used only in env-share mode, set to 110 to support multi cards per container in env-share mode
  - --mlulink-policy=best-effort # MLULink topology policy: best-effort, guaranteed or restricted, used only in topology-aware mode
  - --cnmon-path=/usr/bin/cnmon # host machine cnmon path, must be absolute path. comment out this line to avoid mounting cnmon
  - --log-level=info # log level: trace/debug/info/warn/error/fatal/panic" default:"info"
  - --min-dsmlu-unit=256 # minimum unit for dsmu, used only in dynamic-smlu mode" default:"0" env:"MIN-DSMLU-UNIT"
```
- Koordinator-related components

### Steps to Use
1. Confirm that the Cambricon card has been successfully recognized by the `Device`. An example is shown below. You can view the `Device` resource using: `kubectl get device <node-name> -o yaml`.
- **Note**
  - The label `node.koordinator.sh/gpu-vendor` should have the value `cambricon`
```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Device
metadata:
  labels:
    node.koordinator.sh/gpu-model: MLU-370
    node.koordinator.sh/gpu-vendor: cambricon
  name: node-1
spec:
  devices:
  - health: true
    id: 89033010-2354-0000-0000-000000000000
    minor: 0
    resources:
      huawei.com/gpu-core: "100"
      koordinator.sh/gpu-memory: 24Gi
      koordinator.sh/gpu-memory-ratio: "100"
    topology:
      busID: 0000:47:00.0
      nodeID: 3
      pcieID: pci0000:3a
      socketID: -1
    type: gpu
    conditions:
    - lastTransitionTime: "2025-04-25T10:00:00Z"
      message: device is healthy
      reason: DeviceHealthy
      status: "True"
      type: Healthy
status: {}
```
2. Create a Pod to request the use of Cambricon cards. The example below shows a virtual card scenario. Cambricon **does not support multi-card virtualization**.

- **Notes**
  - The image here uses a basic Ubuntu image; users can select an appropriate image based on actual needs.
  - Both `resources.limits` and `resources.requests` must be configured with additional resources.
    - **Virtual card scenario**: Taking MLU-370 in virtualization mode as an example:
      - `koordinator.sh/gpu.shared`
        - Apply for virtual card → fill in 1.
      - `koordinator.sh/gpu-core`
        - Fill in the exact computing power required, represented as a percentage.
      - `cambricon.com/mlu.smlu.vcore`
        - Fill in the exact computing power required, represented as a percentage.
      - `cambricon.com/mlu.smlu.vmemory`
        - Fill in the number of memory slices required. For example, for 1GB:  
          If each slice = 256Mi (configured in Cambricon Device Plugin via `min-dsmlu-unit`), formula: `slice_count = 1GB / 256Mi`.

```yaml partial-card
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: demo-sleep
  name: test-cambricon-partial
  namespace: default
spec:
  containers:
  - command:
    - sleep
    - infinity
    image: ubuntu:18.04
    imagePullPolicy: IfNotPresent
    name: demo-sleep
    resources:
      limits:
        cpu: "32"
        memory: 64Gi
        koordinator.sh/gpu.shared: "1"
        koordinator.sh/gpu-memory: "1Gi"
        koordinator.sh/gpu-core: "10"
        cambricon.com/mlu.smlu.vcore: "10" # percentage
        cambricon.com/mlu.smlu.vmemory: "4" # slice counts, actual allocated memory: 4*256Mi=1Gi
      requests:
        cpu: "32"
        memory: 64Gi
        koordinator.sh/gpu.shared: "1"
        koordinator.sh/gpu-memory: "1Gi"
        koordinator.sh/gpu-core: "10"
        cambricon.com/mlu.smlu.vcore: "10"
        cambricon.com/mlu.smlu.vmemory: "4" 
```

3. Enter the container (`kubectl exec -it {pod-name} -- bash`), and run: `ls /dev/cambricon*` inside the container to check the devices. If it outputs normally, it indicates that the card has been successfully allocated to the Pod.

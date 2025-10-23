# Device Scheduling - ascend-npu

## Background

Currently, Koordinator supports the use of Ascend cards in K8s. Based on the `koord-device-daemon` and `koordlet` components, heterogeneous GPU resources are reported, and heterogeneous card information is aggregated into the `Device` object for topology scheduling by the scheduler. It currently supports both Ascend virtualization templates and full cards.

## Usage
### Prerequisites
The use of Ascend cards requires prior installation and configuration of the following components:
- Ascend Driver
- [Ascend Docker Runtime](https://gitcode.com/Ascend/mind-cluster/releases)
- [Ascend Device Plugin (enable virtualization parameter configuration)](https://gitcode.com/Ascend/mind-cluster/releases)
``` startup parameters
args:
  - --volcanoType=true
  - --presetVirtualDevice=false
  - --useAscendDocker=true
```
- Koordinator related components (koordinator >= v1.7.0)

### Steps to Use
1. Confirm that the Ascend card has been successfully recognized by the `Device`. An example is shown below. You can view the `Device` resource using: `kubectl get device -o yaml`.

- **Note**
  - `node.koordinator.sh/gpu-vendor` label value should be `huawei`.
  - The value of `scheduling.koordinator.sh/gpu-partitions` means: on this node, cards 0, 1, 2, and 3 form a single partition with HCCS affinity, cards 4,5,6,7 from another partition. Multi-cards scheduling must respect this affinity; crossing partitions can lead to inter-cards communication errors.
```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Device
metadata:
  labels:
    node.koordinator.sh/gpu-partition-policy: "Honor" # Enforce partition policy during scheduling.
    node.koordinator.sh/gpu-model: Ascend-910B3 # Model of the Ascend card.
    node.koordinator.sh/gpu-vendor: huawei # Vendor of the card.
  annotations:
    scheduling.koordinator.sh/gpu-partitions: |
      {
        "4": [
                {
                    "minors": [
                       0,1,2,3  # Minor numbers of cards in this partition
                    ],
                    "gpuLinkType": "HCCS", # Indicate the type of inter-card link within the partition.
                    "allocationScore": "1" # Indicate the overall allocation quality for the node after the partition has been assigned away.
                }
        ],
        "4": [
                {
                    "minors": [
                       4,5,6,7 
                    ],
                    "gpuLinkType": "HCCS",
                    "allocationScore": "1"
                }
        ]
      }
  name: node-1
spec:
  devices:
    - health: true
      id: GPU-fd971b33-4891-fd2e-ed42-ce6adf324615 # The UUID of the Ascend card (mocked value).
      minor: 0 # Every card has a unique minor number. Card 0.
      resources:
        huawei.com/npu-core: "20" # Number of aicore on the Ascend card.
        huawei.com/npu-cpu: "7"  # Number of aicpu on the Ascend card.
        huawei.com/npu-dvpp: "100" # There exists dvpp on the Ascend card.
        koordinator.sh/gpu-core: "100" # The total compute capacity of the Ascend card in percentage.
        koordinator.sh/gpu-memory: 64Gi # The total memory capacity of the Ascend card.
        koordinator.sh/gpu-memory-ratio: "100" # The total memory capacity of the Ascend card in percentage.
      topology:
        busID: 0000:3b:00.0 # PCI bus ID.
        nodeID: 0 # NUMA node ID.
        pcieID: pci0000:3a # PCIe root ID.
        socketID: -1
      type: gpu
      conditions:
        - lastTransitionTime: "2025-04-25T10:00:00Z"
          message: device is healthy
          reason: DeviceHealthy
          status: "True"
          type: Healthy
    - health: true
      id: GPU-ab123c45-6789-d001-e234-f567890abcde
      minor: 1 # Card 1.
      resources:
        huawei.com/npu-core: "20"
        huawei.com/npu-cpu: "7"
        huawei.com/npu-dvpp: "100"
        koordinator.sh/gpu-core: "100"
        koordinator.sh/gpu-memory: 64Gi
        koordinator.sh/gpu-memory-ratio: "100"
      topology:
        busID: 0000:3b:00.1
        nodeID: 1
        pcieID: pci0000:3a
        socketID: -1
      type: gpu
      conditions:
        - lastTransitionTime: "2025-04-25T10:00:00Z"
          message: device is healthy
          reason: DeviceHealthy
          status: "True"
          type: Healthy
    - health: true
      id: GPU-bc234d56-7890-e112-f345-678901bcdefa
      minor: 2
      resources:
        huawei.com/npu-core: "20"
        huawei.com/npu-cpu: "7"
        huawei.com/npu-dvpp: "100"
        koordinator.sh/gpu-core: "100"
        koordinator.sh/gpu-memory: 64Gi
        koordinator.sh/gpu-memory-ratio: "100"
      topology:
        busID: 0000:3b:00.2
        nodeID: 2
        pcieID: pci0000:3a
        socketID: -1
      type: gpu
      conditions:
        - lastTransitionTime: "2025-04-25T10:00:00Z"
          message: device is healthy
          reason: DeviceHealthy
          status: "True"
          type: Healthy
    - health: true
      id: GPU-cd345e67-8901-f223-4567-890123cdefab
      minor: 3
      resources:
        huawei.com/npu-core: "20"
        huawei.com/npu-cpu: "7"
        huawei.com/npu-dvpp: "100"
        koordinator.sh/gpu-core: "100"
        koordinator.sh/gpu-memory: 64Gi
        koordinator.sh/gpu-memory-ratio: "100"
      topology:
        busID: 0000:3b:00.3
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
    - health: true
      id: GPU-de456f78-9012-f334-5678-901234defabc
      minor: 4
      resources:
        huawei.com/npu-core: "20"
        huawei.com/npu-cpu: "7"
        huawei.com/npu-dvpp: "100"
        koordinator.sh/gpu-core: "100"
        koordinator.sh/gpu-memory: 64Gi
        koordinator.sh/gpu-memory-ratio: "100"
      topology:
        busID: 0000:3b:00.4
        nodeID: 4
        pcieID: pci0000:3b
        socketID: -1
      type: gpu
      conditions:
        - lastTransitionTime: "2025-04-25T10:00:00Z"
          message: device is healthy
          reason: DeviceHealthy
          status: "True"
          type: Healthy
    - health: true
      id: GPU-ef567g89-0123-f445-6789-012345efabcd
      minor: 5
      resources:
        huawei.com/npu-core: "20"
        huawei.com/npu-cpu: "7"
        huawei.com/npu-dvpp: "100"
        koordinator.sh/gpu-core: "100"
        koordinator.sh/gpu-memory: 64Gi
        koordinator.sh/gpu-memory-ratio: "100"
      topology:
        busID: 0000:3b:00.5
        nodeID: 5
        pcieID: pci0000:3b
        socketID: -1
      type: gpu
      conditions:
        - lastTransitionTime: "2025-04-25T10:00:00Z"
          message: device is healthy
          reason: DeviceHealthy
          status: "True"
          type: Healthy
    - health: true
      id: GPU-fg678h90-1234-f556-7890-123456fgabce
      minor: 6
      resources:
        huawei.com/npu-core: "20"
        huawei.com/npu-cpu: "7"
        huawei.com/npu-dvpp: "100"
        koordinator.sh/gpu-core: "100"
        koordinator.sh/gpu-memory: 64Gi
        koordinator.sh/gpu-memory-ratio: "100"
      topology:
        busID: 0000:3b:00.6
        nodeID: 6
        pcieID: pci0000:3b
        socketID: -1
      type: gpu
      conditions:
        - lastTransitionTime: "2025-04-25T10:00:00Z"
          message: device is healthy
          reason: DeviceHealthy
          status: "True"
          type: Healthy
    - health: true
      id: GPU-gh789i01-2345-f667-8901-234567ghabcd
      minor: 7
      resources:
        huawei.com/npu-core: "20"
        huawei.com/npu-cpu: "7"
        huawei.com/npu-dvpp: "100"
        koordinator.sh/gpu-core: "100"
        koordinator.sh/gpu-memory: 64Gi
        koordinator.sh/gpu-memory-ratio: "100"
      topology:
        busID: 0000:3b:00.7
        nodeID: 7
        pcieID: pci0000:3b
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
2. Verify that the Ascend card resource information has been correctly registered on the Ascend node. For example, you can run `kubectl get node <node-name> -o yaml` to check the node.status.allocatable and node.status.capacity resources.
```yaml
apiVersion: v1
kind: Node
metadata:
  name: node-1
  ...
status:
    allocatable:
      ...
      koordinator.sh/gpu.shared: "800" # Reported by koordinator
      koordinator.sh/gpu-core: "800" # Reported by koordinator
      koordinator.sh/gpu-memory: 512Gi # Reported by koordinator
      koordinator.sh/gpu-memory-ratio: "800" # Reported by koordinator
      huawei.com/npu-core: "160" # Reported by ascend device plugin
      huawei.com/npu-cpu: "56" # Reported by Koordinator
      huawei.com/npu-dvpp: "800" #  Reported Koordinator
    capacity:
      ...
      koordinator.sh/gpu.shared: "800" # Reported by koordinator
      koordinator.sh/gpu-core: "800" # Reported by koordinator
      koordinator.sh/gpu-memory: 512Gi # Reported by koordinator
      koordinator.sh/gpu-memory-ratio: "800" # Reported by koordinator
      huawei.com/npu-core: "160" # Reported by ascend device plugin
      huawei.com/npu-cpu: "56" # Reported by Koordinator
      huawei.com/npu-dvpp: "800" # Reported Koordinator

```

3. Create a Pod to request the use of Ascend cards. Examples below demonstrate both full-card and virtual-card scenarios.

- **Note**
  - The image used here is the official Ascend-provided inference base image. Users can choose a suitable image according to their needs.
  - Both `resources.limits` and `resources.requests` must be explicitly configured with additional resources:
    - **Full-card scenario**: Taking 910B3's full-card specs as an example, Ascend supports multi-card full-card scenarios.
      - `huawei.com/npu-core`
        - A single card contains 20 `npucore`; applying for 1 card requires 20 `npucore`.  
          Formula: `number_to_fill = card_count * npucore_per_card`
      - `koordinator.sh/gpu-memory-ratio`
        - For the full-card scenario, 1 card corresponds to a `gpu-memory-ratio` of 100.  
          Formula: `number_to_fill = card_count * 100`
    - **Virtual-card scenario**: Taking 910B3's virtual spec `virt10_3c_32g` as an example (see [Ascend Virtual Specification](#ascend-card-virtual-specification)), which means 10 `npucore`, 3 `npucpu`, and 32GB VRAM. **Ascend does not support multi-card virtualization**.
      - `koordinator.sh/gpu.shared`
        - Applying for virtual card → fill in 1.
      - `koordinator.sh/gpu-memory`
        - Applying for 1 virtual card → request 32GB `gpu-memory`. Formula: `number_to_fill = gpu-memory_in_spec`
      - `huawei.com/npu-core`
        - Applying for 1 virtual card → request 10 `npucore`. Formula: `number_to_fill = npucore_in_spec`
      - `huawei.com/npu-cpu`
        - Applying for 1 virtual card → request 3 `npucpu`. Formula: `number_to_fill = npucpu_in_spec`
      - `huawei.com/npu-dvpp`
        - Applying for 1 virtual card → request 0 `dvpp` according to spec (0 in this example). Formula: `number_to_fill = dvpp_in_spec`

```yaml full-card
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: demo-sleep
  name: test-ascend-full-1
  namespace: default
spec:
  containers:
  - command:
    - sleep
    - infinity
    image: swr.cn-south-1.myhuaweicloud.com/ascendhub/ascend-infer:24.0.0-ubuntu20.04
    imagePullPolicy: IfNotPresent
    name: demo-sleep
    resources:
      limits:
        cpu: "32"
        memory: 64Gi
        koordinator.sh/gpu-memory-ratio: "100" # card_count * 100
        huawei.com/npu-core: "20" # card_count * npucore_per_card
      requests:
        cpu: "32"
        memory: 64Gi
        koordinator.sh/gpu-memory-ratio: "100"
        huawei.com/npu-core: "20"
```

```yaml partial-card
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: demo-sleep
  name: test-ascend-partial-1
  namespace: default
spec:
  containers:
  - command:
    - sleep
    - infinity
    image: swr.cn-south-1.myhuaweicloud.com/ascendhub/ascend-infer:24.0.0-ubuntu20.04
    imagePullPolicy: IfNotPresent
    name: demo-sleep
    resources:
      limits:
        cpu: "32"
        memory: 64Gi
        koordinator.sh/gpu.shared: "1"
        koordinator.sh/gpu-memory: "32Gi"
        huawei.com/npu-core: "10"
        huawei.com/npu-cpu: "3"
      requests:
        cpu: "32"
        memory: 64Gi
        koordinator.sh/gpu.shared: "1"
        koordinator.sh/gpu-memory: "32Gi"
        huawei.com/npu-core: "10"
        huawei.com/npu-cpu: "3"
```
4. Enter the container (`kubectl exec -it {pod-name} -- bash`), and run `npu-smi` inside to check card usage. If the data is displayed correctly, the card has been successfully allocated to the Pod.

### Ascend Card Virtual Specification
The table below describes the virtual specifications for Ascend cards. Users can choose the appropriate virtual spec according to their actual needs.

``` yaml ascend-virtual-spec
huawei-Ascend-310P:
vir01:
  huawei.com/npu-core: "1"
  huawei.com/npu-cpu: "1"
  huawei.com/npu-dvpp: "12"
  koordinator.sh/gpu-memory: 3Gi
vir02:
  huawei.com/npu-core: "2"
  huawei.com/npu-cpu: "2"
  huawei.com/npu-dvpp: "25"
  koordinator.sh/gpu-memory: 6Gi
vir02_1c:
  huawei.com/npu-core: "2"
  huawei.com/npu-cpu: "1"
  huawei.com/npu-dvpp: "25"
  koordinator.sh/gpu-memory: 6Gi
vir04:
  huawei.com/npu-core: "4"
  huawei.com/npu-cpu: "4"
  huawei.com/npu-dvpp: "50"
  koordinator.sh/gpu-memory: 12Gi
vir04_3c:
  huawei.com/npu-core: "4"
  huawei.com/npu-cpu: "3"
  huawei.com/npu-dvpp: "50"
  koordinator.sh/gpu-memory: 12Gi
vir04_3c_ndvpp:
  huawei.com/npu-core: "4"
  huawei.com/npu-cpu: "3"
  koordinator.sh/gpu-memory: 12Gi
vir04_4c_dvpp:
  huawei.com/npu-core: "4"
  huawei.com/npu-cpu: "4"
  huawei.com/npu-dvpp: "100"
  koordinator.sh/gpu-memory: 12Gi
huawei-Ascend-310P3:
vir01:
  huawei.com/npu-core: "1"
  huawei.com/npu-cpu: "1"
  huawei.com/npu-dvpp: "12"
  koordinator.sh/gpu-memory: 3Gi
vir02:
  huawei.com/npu-core: "2"
  huawei.com/npu-cpu: "2"
  huawei.com/npu-dvpp: "25"
  koordinator.sh/gpu-memory: 6Gi
vir02_1c:
  huawei.com/npu-core: "2"
  huawei.com/npu-cpu: "1"
  huawei.com/npu-dvpp: "25"
  koordinator.sh/gpu-memory: 6Gi
vir04:
  huawei.com/npu-core: "4"
  huawei.com/npu-cpu: "4"
  huawei.com/npu-dvpp: "50"
  koordinator.sh/gpu-memory: 12Gi
vir04_3c:
  huawei.com/npu-core: "4"
  huawei.com/npu-cpu: "3"
  huawei.com/npu-dvpp: "50"
  koordinator.sh/gpu-memory: 12Gi
vir04_3c_ndvpp:
  huawei.com/npu-core: "4"
  huawei.com/npu-cpu: "3"
  koordinator.sh/gpu-memory: 12Gi
vir04_4c_dvpp:
  huawei.com/npu-core: "4"
  huawei.com/npu-cpu: "4"
  huawei.com/npu-dvpp: "100"
  koordinator.sh/gpu-memory: 12Gi
huawei-Ascend-910:
vir02:
  huawei.com/npu-core: "2"
  huawei.com/npu-cpu: "1"
  koordinator.sh/gpu-memory: 2Gi
vir04:
  huawei.com/npu-core: "4"
  huawei.com/npu-cpu: "1"
  koordinator.sh/gpu-memory: 4Gi
vir08:
  huawei.com/npu-core: "8"
  huawei.com/npu-cpu: "3"
  koordinator.sh/gpu-memory: 8Gi
vir16:
  huawei.com/npu-core: "16"
  huawei.com/npu-cpu: "7"
  koordinator.sh/gpu-memory: 16Gi
huawei-Ascend-910B1:
vir03_1c_8g:
  huawei.com/npu-core: "3"
  huawei.com/npu-cpu: "1"
  koordinator.sh/gpu-memory: 8Gi
vir06_1c_16g:
  huawei.com/npu-core: "6"
  huawei.com/npu-cpu: "1"
  koordinator.sh/gpu-memory: 16Gi
vir12_3c_32g:
  huawei.com/npu-core: "12"
  huawei.com/npu-cpu: "3"
  koordinator.sh/gpu-memory: 32Gi
huawei-Ascend-910B2:
vir03_1c_8g:
  huawei.com/npu-core: "3"
  huawei.com/npu-cpu: "1"
  koordinator.sh/gpu-memory: 8Gi
vir06_1c_16g:
  huawei.com/npu-core: "6"
  huawei.com/npu-cpu: "1"
  koordinator.sh/gpu-memory: 16Gi
vir12_3c_32g:
  huawei.com/npu-core: "12"
  huawei.com/npu-cpu: "3"
  koordinator.sh/gpu-memory: 32Gi
huawei-Ascend-910B2C:
vir03_1c_8g:
  huawei.com/npu-core: "3"
  huawei.com/npu-cpu: "1"
  koordinator.sh/gpu-memory: 8Gi
vir06_1c_16g:
  huawei.com/npu-core: "6"
  huawei.com/npu-cpu: "1"
  koordinator.sh/gpu-memory: 16Gi
vir12_3c_32g:
  huawei.com/npu-core: "12"
  huawei.com/npu-cpu: "3"
  koordinator.sh/gpu-memory: 32Gi
huawei-Ascend-910B3:
vir05_1c_16g:
  huawei.com/npu-core: "5"
  huawei.com/npu-cpu: "1"
  koordinator.sh/gpu-memory: 16Gi
vir10_3c_32g:
  huawei.com/npu-core: "10"
  huawei.com/npu-cpu: "3"
  koordinator.sh/gpu-memory: 32Gi
huawei-Ascend-910B4:
vir05_1c_8g:
  huawei.com/npu-core: "5"
  huawei.com/npu-cpu: "1"
  huawei.com/npu-dvpp: "25"
  koordinator.sh/gpu-memory: 8Gi
vir10_3c_16g:
  huawei.com/npu-core: "10"
  huawei.com/npu-cpu: "3"
  huawei.com/npu-dvpp: "50"
  koordinator.sh/gpu-memory: 16Gi
vir10_3c_16g_nm:
  huawei.com/npu-core: "10"
  huawei.com/npu-cpu: "3"
  koordinator.sh/gpu-memory: 16Gi
vir10_4c_16g_m:
  huawei.com/npu-core: "10"
  huawei.com/npu-cpu: "4"
  huawei.com/npu-dvpp: "100"
  koordinator.sh/gpu-memory: 16Gi
```
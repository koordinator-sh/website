
# Network Bandwidth Limitation Using Terway QoS

## Introduction

The birth of terway-qos is to address the issue of network bandwidth contention in mixed deployment scenarios. It supports bandwidth limitation by individual Pods and by business type.
Compared to other solutions, terway-qos has the following advantages:

Supports bandwidth limitation by business type, accommodating mixed deployment of various business types.
Supports dynamic adjustment of Pod bandwidth limitations.
Provides whole-machine bandwidth limitation, supporting multiple network cards.
Supports bandwidth limitation for container networks and HostNetwork Pods.

Terway QoS includes three bandwidth priority levels, which correspond to Koordinator’s default QoS mapping as follows.

You can set QoS priority for Pods using the familiar Koordinator configuration.


| Koordinator QoS | Kubernetes QoS       | Terway Net QoS |
| :-------------- | :------------------- | :------------- |
| SYSTEM          | --                   | L0             |
| LSE             | Guaranteed           | L1             |
| LSR             | Guaranteed           | L1             |
| LS              | Guaranteed/Burstable | L1             |
| BE              | BestEffort           | L2             |

## Configuration Parameters

### Setting Whole-Machine Bandwidth Limitation

In mixed deployment scenarios, we expect online businesses to have maximum bandwidth assurance to avoid contention. During idle times, offline businesses can also make full use of all bandwidth resources.

Thus, users can define three priority levels for business traffic: L0, L1, L2. Their priority decreases in that order.
Definition of contention scenario: When the total traffic of L0 + L1 + L2 exceeds the whole-machine bandwidth.

L0’s maximum bandwidth dynamically adjusts based on the real-time traffic of L1 and L2. It can be as high as the whole-machine bandwidth and as low as whole-machine bandwidth - L1’s minimum bandwidth - L2’s minimum bandwidth.
Under any circumstances, the bandwidth of L1 and L2 does not exceed their respective upper limits.
In a contention scenario, the bandwidth of L1 and L2 will not fall below their respective lower limits.
In a contention scenario, bandwidth will be limited in the order of L2, L1, and L0. As Terway QoS has only three priority levels, the whole-machine bandwidth limitation can only be set for LS and BE, and the remaining L0 part is calculated based on the whole-machine’s bandwidth cap. 

Here is an example configuration:

```yaml
resource-qos-config: |
    {
      "clusterStrategy": {
        "policies": {"netQOSPolicy":"terway-qos"},
        "lsClass": {
          "networkQOS": {
            "enable": true,
            "ingressRequest": "50M",
            "ingressLimit": "100M",
            "egressRequest": "50M",
            "egressLimit": "100M"
          }
        },
        "beClass": {
          "networkQOS": {
            "enable": true,
            "ingressRequest": "10M",
            "ingressLimit": "200M",
            "egressRequest": "10M",
            "egressLimit": "200M"
          }
        }
      }
    }
system-config: |-
    {
      "clusterStrategy": {
        "totalNetworkBandwidth": "600M"
      }
    }

```

Please note:

- `clusterStrategy.policies.netQOSPolicy` 需配置为 `erway-qos`

> 单位 `bps`

### Pod Bandwidth Limitation

To specify bandwidth limitations for a Pod:

| Key                       | Value                                           |
| :------------------------ | :---------------------------------------------- |
| koordinator.sh/networkQOS | '{"IngressLimit": "10M", "EgressLimit": "20M"}' |

> Unit `bps`

## Kernel Version

- Supports kernel version 4.19 and above.
- Tested on 5.10 (Alinux3). 
 
On kernel 5.1 and above, EDT is used for Egress direction rate limiting. Other kernel versions and Ingress direction limitations use Token Bucket for rate limiting.

### Limitation

Under Kernel 5.0, `HostNetwork` pod's priority is not supported.

## Deploying Koordinator

1. Ensure that koordinator is installed and that the koordinator version is 1.5 or higher.
2. The koordlet needs to be configured with RuntimeHook.

```sh
helm install koordinator koordinator-sh/koordinator --version 1.5.0 --set koordlet.features="TerwayQoS=true\,BECPUEvict=true\,BEMemoryEvict=true\,CgroupReconcile=true\,Accelerators=true"
```

## Deploying Terway QoS

Execute the following command to install. After starting, it will mount the tc eBPF program on the ingress and egress directions of the host network card.

```sh
helm install -nkube-system terway-qos --set qos.qosConfigSource=file oci://registry-1.docker.io/l1b0k/terway-qos --version 0.3.1
```

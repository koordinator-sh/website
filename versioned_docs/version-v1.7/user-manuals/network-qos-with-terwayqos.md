
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

- `clusterStrategy.policies.netQOSPolicy` must set to `terway-qos`

> Unit `bps`

### Pod Bandwidth Limitation

To specify bandwidth limitations for a Pod:

| Key                       | Value                                           |
| :------------------------ | :---------------------------------------------- |
| koordinator.sh/networkQOS | '{"IngressLimit": "10M", "EgressLimit": "20M"}' |

> Unit `bps`

## Kernel Version

- Supports kernel version 4.19 and above.
- Tested on 5.10 (Alinux3), 4.19 (Alinux2). 
 
On kernel 5.1 and above, EDT is used for Egress direction rate limiting. Other kernel versions and Ingress direction limitations use Token Bucket for rate limiting.

### Limitation

Under Kernel 5.10, `HostNetwork` pod's priority is not supported. As we use `bpf_skb_cgroup_classid` to get priority by cgroup , and the helper only work above 5.10.

## Deploying Koordinator

1. Ensure that koordinator is installed and that the koordinator version is 1.5 or higher.
2. The koordlet needs to be configured with RuntimeHook.

```sh
helm install koordinator koordinator-sh/koordinator --version 1.5.0 --set koordlet.features="TerwayQoS=true\,BECPUEvict=true\,BEMemoryEvict=true\,CgroupReconcile=true\,Accelerators=true"
```

## Deploying Terway QoS

Execute the following command to install. After starting, it will mount the tc eBPF program on the ingress and egress directions of the host network card.

```sh
helm install -nkube-system terway-qos --set qos.qosConfigSource=file oci://registry-1.docker.io/l1b0k/terway-qos --version 0.3.2
```

## Usage Effects


| Key     | request | limit |
|:--------|:--------|:------|
| total   | 600     | 600   |
| ls (l1) | 200     | 300   |
| be (l2) | 100     | 200   |

Under no contention, both l1 and l2 can utilize their maximum bandwidth.

```sh
# iperf3 -R -c server-ls
Connecting to host server-be, port 5201
Reverse mode, remote host server-be is sending
[  4] local 172.16.1.217 port 53242 connected to 172.16.0.197 port 5201
[ ID] Interval           Transfer     Bandwidth
[  4]   0.00-1.00   sec  23.7 MBytes   199 Mbits/sec
[  4]   1.00-2.00   sec  23.9 MBytes   200 Mbits/sec
[  4]   2.00-3.00   sec  23.8 MBytes   199 Mbits/sec
[  4]   3.00-4.00   sec  23.8 MBytes   200 Mbits/sec
[  4]   4.00-5.00   sec  23.8 MBytes   200 Mbits/sec
[  4]   5.00-6.00   sec  23.8 MBytes   200 Mbits/sec
[  4]   6.00-7.00   sec  23.8 MBytes   200 Mbits/sec
[  4]   7.00-8.00   sec  23.8 MBytes   200 Mbits/sec
[  4]   8.00-9.00   sec  23.8 MBytes   200 Mbits/sec
[  4]   9.00-10.00  sec  23.8 MBytes   200 Mbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID] Interval           Transfer     Bandwidth       Retr
[  4]   0.00-10.00  sec   246 MBytes   207 Mbits/sec    0             sender
[  4]   0.00-10.00  sec   238 MBytes   200 Mbits/sec                  receiver

# iperf3 -R -c server-ls
Connecting to host server-ls, port 5201
Reverse mode, remote host server-ls is sending
[  4] local 172.16.1.217 port 43426 connected to 172.16.0.187 port 5201
[ ID] Interval           Transfer     Bandwidth
[  4]   0.00-1.00   sec  35.2 MBytes   295 Mbits/sec
[  4]   1.00-2.00   sec  35.2 MBytes   296 Mbits/sec
[  4]   2.00-3.00   sec  35.3 MBytes   296 Mbits/sec
[  4]   3.00-4.00   sec  35.2 MBytes   296 Mbits/sec
[  4]   4.00-5.00   sec  35.2 MBytes   296 Mbits/sec
[  4]   5.00-6.00   sec  35.2 MBytes   296 Mbits/sec
[  4]   6.00-7.00   sec  35.3 MBytes   296 Mbits/sec
[  4]   7.00-8.00   sec  35.3 MBytes   296 Mbits/sec
[  4]   8.00-9.00   sec  35.2 MBytes   296 Mbits/sec
[  4]   9.00-10.00  sec  34.9 MBytes   293 Mbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID] Interval           Transfer     Bandwidth       Retr
[  4]   0.00-10.00  sec   360 MBytes   302 Mbits/sec    0             sender
[  4]   0.00-10.00  sec   352 MBytes   295 Mbits/sec                  receiver
```

Under contention

```sh
# iperf3 -R -c server-be -t 30
Connecting to host server-be, port 5201
Reverse mode, remote host server-be is sending
[  4] local 172.16.1.217 port 42142 connected to 172.16.0.187 port 5201
[ ID] Interval           Transfer     Bandwidth
[  4]   0.00-1.00   sec  23.8 MBytes   199 Mbits/sec
[  4]   1.00-2.00   sec  23.8 MBytes   200 Mbits/sec
[  4]   2.00-3.00   sec  21.9 MBytes   183 Mbits/sec
[  4]   3.00-4.00   sec  14.4 MBytes   121 Mbits/sec
[  4]   4.00-5.00   sec  11.0 MBytes  92.3 Mbits/sec
[  4]   5.00-6.00   sec  11.0 MBytes  92.2 Mbits/sec
[  4]   6.00-7.00   sec  8.53 MBytes  71.6 Mbits/sec
[  4]   7.00-8.00   sec  10.9 MBytes  91.3 Mbits/sec
[  4]   8.00-9.00   sec  10.8 MBytes  90.8 Mbits/sec
[  4]   9.00-10.00  sec  11.0 MBytes  92.3 Mbits/sec
[  4]  10.00-11.00  sec  11.0 MBytes  92.7 Mbits/sec
[  4]  11.00-12.00  sec  11.0 MBytes  92.1 Mbits/sec

# iperf3  -R -c server-ls -t 30
Connecting to host server-ls, port 5201
Reverse mode, remote host server-ls is sending
[  4] local 172.16.1.217 port 56826 connected to 172.16.0.197 port 5201
[ ID] Interval           Transfer     Bandwidth
[  4]   0.00-1.00   sec  35.2 MBytes   295 Mbits/sec
[  4]   1.00-2.00   sec  35.3 MBytes   296 Mbits/sec
[  4]   2.00-3.00   sec  35.2 MBytes   296 Mbits/sec
[  4]   3.00-4.00   sec  26.4 MBytes   221 Mbits/sec
[  4]   4.00-5.00   sec  16.9 MBytes   142 Mbits/sec
[  4]   5.00-6.00   sec  20.6 MBytes   173 Mbits/sec
[  4]   6.00-7.00   sec  21.6 MBytes   181 Mbits/sec
[  4]   7.00-8.00   sec  21.1 MBytes   177 Mbits/sec
[  4]   8.00-9.00   sec  21.6 MBytes   182 Mbits/sec
[  4]   9.00-10.00  sec  21.2 MBytes   178 Mbits/sec
[  4]  10.00-11.00  sec  21.8 MBytes   183 Mbits/sec
```
# 使用 Terway QoS 进行网络带宽限制

## Introduction

terway-qos 的诞生是为了解决混部场景下，容器网络带宽争抢问题。支持按单Pod、按业务类型限制带宽。

相比于其他方案，terway-qos 有以下优势：

1. 支持按业务类型限制带宽，支持多种业务类型混部
2. 支持 Pod 带宽限制动态调整
3. 整机带宽限制，支持多个网卡
4. 支持容器网络、HostNetwork Pod 带宽限制

Terway QoS 总共包含了3个带宽优先级，对应 Koordinator 默认 QoS 映射如下。
你可以通过熟悉的 Koordinator 配置为Pod 设置 QoS 优先级。

| Koordinator QoS | Kubernetes QoS       | Terway Net QoS |
|:----------------|:---------------------|:---------------|
| SYSTEM          | --                   | L0             |
| LSE             | Guaranteed           | L1             |
| LSR             | Guaranteed           | L1             |
| LS              | Guaranteed/Burstable | L1             |
| BE              | BestEffort           | L2             |

## 配置参数

### 设置整机带宽限制

混部场景下，我们期望在线业务有最大带宽的保证，从而避免争抢。在空闲时，离线业务也能尽可能使用全部带宽资源。  
由此用户可为业务流量定义三种优先级，L0，L1，L2。其优先级顺序依次递减。

争抢场景定义： 当 `L0 + L1 + L2` 总流量大于整机带宽

- L0 最大带宽依据 L1， L2 实时流量而动态调整。最大为整机带宽，最小为 `整机带宽- L1 最小带宽- L2 最小带宽`。
- 任何情况下，L1、L2 其带宽不超过各自带宽上限。
- 争抢场景下， L1、L2 其带宽不会低于各自带宽下限。
- 争抢场景下，将按照 L2 、L1 、L0 的顺序对带宽进行限制。

Terway QoS 只有三个优先级，所以整机带宽限制只能设置为`LS`、`BE`两个，剩余`L0`部分是通过整机的带宽上限计算的。

下面是一个配置示例：

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

请注意

- `clusterStrategy.policies.netQOSPolicy` 需配置为 `terway-qos`

> 单位 `bps`

### Pod 带宽限制

为 Pod 指定带宽限制:

| Key                       | Value                                           |
|:--------------------------|:------------------------------------------------|
| koordinator.sh/networkQOS | '{"IngressLimit": "10M", "EgressLimit": "20M"}' |

> 单位 `bps`

## 内核版本

- 支持内核版本 4.19 以上
- 测试过 5.10 (Alinux3)，4.19 (Alinux2)

在5.1 以上内核中 Egress 方向使用 EDT 进行限速。
其他内核版本和 Ingress 方向限制，使用 Token Bucket 进行限速。

### 约束

内核版本 5.10 以下，不支持`HostNetwork` Pod优先级配置。 因为依赖 `bpf_skb_cgroup_classid` 来获取优先级，这个方法只在 5.10
以上支持。

## 部署 Koordinator

1. 确保已经安装了 koordinator，且 koordinator 版本大于等于 1.5
2. koordlet 需配置 RuntimeHook

```sh
helm install koordinator koordinator-sh/koordinator --version 1.5.0 --set koordlet.features="TerwayQoS=true\,BECPUEvict=true\,BEMemoryEvict=true\,CgroupReconcile=true\,Accelerators=true"
```

## 部署 Terway QoS

执行下面命令安装，启动后会在主机网卡的 ingress 和 egress 方向挂载 tc eBPF 程序。

```sh
helm install -nkube-system terway-qos --set qos.qosConfigSource=file oci://registry-1.docker.io/l1b0k/terway-qos --version 0.3.2
```

## 使用效果

| Key     | request | limit |
|:--------|:--------|:------|
| total   | 600     | 600   |
| ls (l1) | 200     | 300   |
| be (l2) | 100     | 200   |

无争抢情况下，l1,l2 均可以使用到自己最大带宽

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

争抢情况下

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
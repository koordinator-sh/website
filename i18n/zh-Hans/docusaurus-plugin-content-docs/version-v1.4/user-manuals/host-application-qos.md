# 宿主机应用QoS管理

## 简介
在实际生产环境中，除了已经运行在K8s上的应用，往往还会存在一些非容器化的带外引用，以裸进程的方式直接部署在在宿住机上。Koordinator目前已经支持了
[节点资源预留](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20221227-node-resource-reservation.md)
机制，使得koord-scheduler在调度过程中可以将这部分资源考虑进来。事实上，除了资源调度方面的约束，这些应用同样有不同的QoS属性，例如LS或BE。
因此，在单机QoS管理方面，koordlet也需要支持为这些宿主机d带外应用设置不同的QoS参数。例如对于一个时延敏感型的带外应用，koordlet需要将其标记为
高优先级并采取同类型的QoS策略，以避免BE类型的应用对其产生干扰。

由于大多数的QoS策略都是基于cgroup机制来实施的，因此在使用该功能前，koordlet要求这部分带外应用的进程必须已经由相应的cgroup分组进行了托管。

![image](/img/host-application.svg)

Koordinator目前已经支持了一系列QoS等级和管理策略，其中针对宿主机带外应用的支持情况如下：
- LS (Latency Sensitive)
  - CPU QoS(Group Identity): 应用进程必须已经运行在cgroup的cpu子系统中，`koordlet`根据CPU QoS的配置`resource-qos-config`为其设置Group Identity参数。
  - CPUSet Allocation: : 应用进程必须已经运行在cgroup的cpu子系统中，`koordlet`将为其设置cpu share pool中的所有CPU核心。
- BE (Best-effort)
  - CPU QoS(Group Identity): 应用进程必须已经运行在cgroup的cpu子系统中，`koordlet`根据CPU QoS的配置为其设置Group Identity参数。

## 使用限制
请确保Koordinator已正确安装在你的集群中。若未安装，请参考[安装文档](https://koordinator.sh/docs/installation)。

带外应用的进程必须已经运行在对应的cgroup分组内，请参考[内核文档](https://docs.kernel.org/admin-guide/cgroup-v1/cgroups.html)使用cgroup来管理应用进程。

| 组件 | 版本要求 |
| --- | ------- |
| Kubernetes | ≥v1.18 |
| koordinator | ≥v1.4.0 |

## 操作步骤

1. 以nginx应用为例，将其以带外应用的形式在宿主机启动，并将进程加入到cgroup子系统`cpu`和`cpuset`分组 `host-latency-sensitive/nginx/` 中。
需要注意的是，cpuset子系统中的`cpuset.cpus` and `cpuset.mems` 参数必须先完成初始化，可使用cgroup根组中的内容完成配置，示例如下：
```shell script
# init cgroup dir on cgroup v1
$ mkdir -p /sys/fs/cgroup/cpuset/host-latency-sensitive/nginx/
$ mkdir -p /sys/fs/cgroup/cpu/host-latency-sensitive/nginx/
$ cat /sys/fs/cgroup/cpuset/cpuset.cpus > /sys/fs/cgroup/cpuset/host-latency-sensitive/cpuset.cpus
$ cat /sys/fs/cgroup/cpuset/cpuset.cpus > /sys/fs/cgroup/cpuset/host-latency-sensitive/nginx/cpuset.cpus
$ cat /sys/fs/cgroup/cpuset/cpuset.mems > /sys/fs/cgroup/cpuset/host-latency-sensitive/cpuset.mems
$ cat /sys/fs/cgroup/cpuset/cpuset.mems > /sys/fs/cgroup/cpuset/host-latency-sensitive/nginx/cpuset.mems

# bind application to corresponding cgroups 
$ echo ${your-application-pids} > /sys/fs/cgroup/cpuset/host-latency-sensitive/nginx/tasks
$ echo ${your-application-pids} > /sys/fs/cgroup/cpu/host-latency-sensitive/nginx/tasks
```

2. 使用以下ConfigMap，创建configmap.yaml文件。
```yaml
apiVersion: v1
data:
  host-application-config: |
    {
      "applications": [
        {
          "name": "nginx",
          "qos": "LS",
          "cgroupPath": {
            "base": "CgroupRoot",
            "parentDir": "host-latency-sensitive/",
            "relativePath": "nginx/"
          }
        }
      ]
    }
  resource-qos-config: |
    {
      "clusterStrategy": {
        "lsClass": {
          "cpuQOS": {
            "enable": true,
            "groupIdentity": 2
          }
        },
        "beClass": {
          "cpuQOS": {
            "enable": true,
            "groupIdentity": -1
          }
        }
      }
    }
kind: ConfigMap
metadata:
  name: slo-controller-config
  namespace: koordinator-system
```

   | Configuration item | Parameter | Valid values | Description                                                  |
   | :-------------- | :------ | :-------- | :----------------------------------------------------------- |
   | `applications`        | []HostApplicationSpec | N/A | 宿主机带外应用的配置描述，支持配置多个。 |
   | `name` | String     | N/A      | 宿主机带外应用的名字，用于标识。 |
   | `qos` | String     | LS/BE      | 宿主机带外应用的QoS等级。 |
   | `cgroupPath` | CgroupPath     | N/A      | 宿主机带外应用对应的cgroup分组，实际目录为`${base}/${parentDir}/${relativePath}`组成。 |
   | `cgroupPath.base` | String     | CgroupRoot/Kubepods/KubepodsBurstable/KubepodsBesteffort | cgroup分组的根目录，枚举类型，实际目录与cgroup驱动有关。 |
   | `cgroupPath.parentDir` | String     | N/A      | cgroup分组的父目录，LS对应的默认值为"host-latency-sensitive/"，BE对应的默认值为"host-latency-sensitive/"。 |
   | `cgroupPath.relativePath` | String     | N/A      | cgroup分组的子目录。 |

3. 查看安装的命名空间下是否存在ConfigMap，以命名空间`koordinator-system`和ConfigMap名字`slo-controller-config`为例，具体以实际安装配置为准。

   - 若存在ConfigMap `slo-controller-config`，请使用PATCH方式进行更新，避免干扰ConfigMap中其他配置项。

     ```bash
     kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"
     ```

   - 若不存在ConfigMap `slo-controller-config`，请执行以下命令进行创建ConfigMap。

     ```bash
     kubectl apply -f configmap.yaml
     ```
     
4. 检查带外应用nginx对应的cgroup配置，其中CPU QoS策略的cgroup配置文件`cpu.bvt_warp_ns`应与QoS等级LS的配置一致，cpuset核心应与节点的share pool一致，
示例如下：
```shell script
$ cat /sys/fs/cgroup/cpu/host-latency-sensitive/nginx/cpu.bvt_warps_ns
$ 2

$ cat /sys/fs/cgroup/cpuset/host-latency-sensitive/nginx/cpuset.cpus
$ 1-5,8-23,32-47,50-51,53,56-71,80-103

$ kubectl get noderesourcetopology ${your-node-id} -o yaml | grep node.koordinator.sh/cpu-shared-pools
    node.koordinator.sh/cpu-shared-pools: '[{"socket":0,"node":0,"cpuset":"1-5,8-23,53,56-71"},{"socket":1,"node":1,"cpuset":"32-47,50-51,80-103"}]'
```
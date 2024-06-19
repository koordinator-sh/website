# QoS Management for Out-of-Band Applications on Host

## Introduction
In a production environment, there could be more than just containerized applications managed by Kubernetes, but also
out-of-band applications running on hosts. Koordinator has supported 
[node resources reservation](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20221227-node-resource-reservation.md)
so that koord-scheduler can take them into account during allocation. However, these applications also have various QoS 
level during runtime such as LS or BE. So, as for the QoS management, koordlet should also support setting QoS parameters
for these processes running on hosts. For example the out-of-band processes could be latency-sensitive types, and koordlet
should set them as high-priority in case they got interference for BE pods.

Since most QoS strategies relies on cgroup mechanism, koordlet requires these applications must running under its own
cgroup if they need the QoS management.

![image](/img/host-application.svg)

Here are the supported QoS levels and strategies for out-of-band applications.
- LS (Latency Sensitive)
  - CPU QoS(Group Identity): applications must run with cpu cgroup subsystem, and `koordlet` will set cpu.bvt_warp_ns according to the `resource-qos-config`. 
  - CPUSet Allocation: applications must run with cpuset cgroup subsystem, and `koorldet` will set **all cpus** in share-pools for them.
 
- BE (Best-effort)
  - CPU QoS(Group Identity): applications must run with cpu cgroup subsystem, and `koorldet` will set cpu.bvt_warp_ns according to the `resource-qos-config`.

## Prerequisite
Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to 
[Installation](/docs/installation).

Host applications should already run with cgroup, see the [kernel manual](https://docs.kernel.org/admin-guide/cgroup-v1/cgroups.html)
for more details.

| Component | Version Requirement |
| --- | ------- |
| Kubernetes | ≥v1.18 |
| koordinator | ≥v1.4.0 |

## Use QoS management for out-of-band applications on host

1. Run host application under cgroup `host-latency-sensitive/nginx/` with cpu and cpuset subsystem. It should be noted
that `cpuset.cpus` and `cpuset.mems` of each level must be initialized with manually, which could be equal to the cgroup root path.
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

2. Create a configmap file base on the following ConfigMap content:
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
   | `applications`        | []HostApplicationSpec | N/A | spec description of host applications. |
   | `name` | String     | N/A      | name of the host application. |
   | `qos` | String     | LS/BE      | QoS class of the application. |
   | `cgroupPath` | CgroupPath     | N/A      | cgroup path of the application, the directory equals to `${base}/${parentDir}/${relativePath}`。 |
   | `cgroupPath.base` | String     | CgroupRoot/Kubepods/KubepodsBurstable/KubepodsBesteffort | cgroup base dir of the application, the format is various across cgroup drivers. |
   | `cgroupPath.parentDir` | String     | N/A      | cgroup parent path under base dir. By default it is "host-latency-sensitive/" for LS and "host-latency-sensitive/" for BE. |
   | `cgroupPath.relativePath` | String     | N/A      | cgroup relative path under parent dir. |

3. Check whether a ConfigMap named `slo-controller-config` exists in the `koordinator-system` namespace.

  - If a ConfigMap named  `slo-controller-config`  exists, we commend that you run the kubectl patch command to update the ConfigMap. This avoids changing other settings in the ConfigMap.

    ```bash
    kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"
    ```

  - If no ConfigMap named `slo-controller-config`  exists, run the kubectl patch command to create a ConfigMap named ack-slo-config:

    ```bash
    kubectl apply -f configmap.yaml
    ```
    
4. Check the cgroup value of host application, then you can find the content of `cpu.bvt_warp_ns` equals to the LS class,
and the cpuset.cpus equals to the LS CPU share pool.
```shell script
$ cat /sys/fs/cgroup/cpu/host-latency-sensitive/nginx/cpu.bvt_warps_ns
$ 2

$ cat /sys/fs/cgroup/cpuset/host-latency-sensitive/nginx/cpuset.cpus
$ 1-5,8-23,32-47,50-51,53,56-71,80-103

$ kubectl get noderesourcetopology ${your-node-id} -o yaml | grep node.koordinator.sh/cpu-shared-pools
    node.koordinator.sh/cpu-shared-pools: '[{"socket":0,"node":0,"cpuset":"1-5,8-23,53,56-71"},{"socket":1,"node":1,"cpuset":"32-47,50-51,80-103"}]'
```
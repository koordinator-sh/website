---
sidebar_position: 4
---

# Running Hadoop YARN with K8s by Koordinator

## Introduction

Koordinator has supported hybrid orchestration workloads on Kubernetes, so that batch jobs can use the requested but 
unused resource as `koord-batch` priority and `BE` QoS class to improve the cluster utilization. However, there are
still lots of applications running beyond K8s such as Apache Haddop YARN. As a resource management platform in BigData
ecosystem, YARN has supported numbers of computing engines including MapReduce, Spark, Flink, Presto, etc.

In order to extend the co-location scenario of Koordinator, now the community has provided Hadoop YARN extended suits 
`Koordinator YARN Copilot` in BigData ecosystem, supporting running Hadoop YARN jobs by koord-batch resources with other 
K8s pods. The `Koordinator YARN Copilot` has following characteristics:

- Open-Source native: implement against open-sourced version of Hadoop YARN; so there is no hack inside YARN modules.
- Unifed resource priority and QoS strategy: the suits aims to the `koord-batch` priority of Koordinator, and also managed by QoS strategies of koordlet.
- Resource sharing on node level: node resources of `koord-batch` priority can be requested by tasks of YARN or `Batch` pods both.
- Adaptive for multiple environments: the suits can be run under any environment, including public cloud or IDC.

## Prerequisite

- Kuberenetes >= 1.18
- Koordinator >= 1.4
- Koordinator YARN Copilot >= 0.1
- Hadoop YARN >= 3.2.1

## Installation
All charts can be simply installed by helm v3.5+, which is a simple command-line tool, and you can get it 
from [here](https://github.com/helm/helm/releases).

![image](/img/hadoop-k8s.svg)

### Install Koordinator
Please make sure Koordinator components are correctly installed in your cluster. For more information about install and
upgrade, please refer to [Installation](/docs/installation).
```shell script
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Install the latest version.
$ helm install koordinator koordinator-sh/koordinator
```

### Install Hadoop YARN
Haddop YARN is consist of ResourceManger and NodeManager, and currently we recommend users deploy the ResourceManger
independently on hosts, while the NodeManager as pod.

Koordinator community provides a demo chart `hadoop-yarn` with Hadoop YARN ResourceManager and NodeManager, also
including HDFS components as optional for running example jobs easily. You can use the demo chart for quick start
of YARN co-location, otherwise you can refer to [Installation](https://hadoop.apache.org/docs/stable/hadoop-yarn/hadoop-yarn-site/YARN.html)
for official guides if you want to build your own YARN cluster.

```shell script
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update
# Install the latest version.
$ helm install hadoop-yarn koordinator-sh/hadoop-yarn

# check hadoop yarn pods running status
kubectl get pod -n hadoop-yarn
```

Some key information should be known before you install YARN:
- ResourceManager must be accessible in K8s pod, no matter it is deployed as host mode or pod mode.
- NodeManager must be deployed as pod mode with an annotation `yarn.hadoop.apache.org/node-id=${nm-hostname}:8041` to identify node ID in YARN.
- NodeManager must use CgroupsLCEResourcesHandler as linux container executor, and specifies cgroup hierarchy under k8s best-effort directory.
- NodeManager pods request resources as `koord-batch` priority, so Koordinator must be pre-installed with co-location enabled.  

These features have already been configured in Haddop YARN chart in koordinator repo, and if you are using self-maintained
YARN, please check the [Koordinator repo](https://github.com/koordinator-sh/charts/blob/main/charts/hadoop-yarn) for
reference during installation.

### Install Koordinator YARN Copilot
Koordinator YARN Copilot is consist of `yarn-opeartor` and `copilot-agent`(WIP),

```shell script
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Install the latest version.
$ helm install koordinator-yarn-copilot koordinator-sh/koordinator-yarn-copilot
```

## Configuration
1. configuration of koord-manager

After installing through the helm chart, the ConfigMap slo-controller-config will be created in the koordinator-system 
namespace. YARN tasks are managed under best-effort cgroup, which should be configured as host level application, and
here are the related [issue](https://github.com/koordinator-sh/koordinator/issues/1727) of YARN tasks management under
Koordinator.

Create a configmap.yaml file based on the following ConfigMap content:
```yaml
apiVersion: v1
data:
  colocation-config: |
    {
      "enable": true
    }
  resource-threshold-config: |
    {
      "clusterStrategy": {
        "enable": true
      }
    }
  resource-qos-config: |
    {
      "clusterStrategy": {
        "lsrClass": {
          "cpuQOS": {
            "enable": true
          }
        },
        "lsClass": {
          "cpuQOS": {
            "enable": true
          }
        },
        "beClass": {
          "cpuQOS": {
            "enable": true
          }
        }
      }
    }
  host-application-config: |
    {
      "applications": [
        {
          "name": "yarn-task",
          "priority": "koord-batch",
          "qos": "BE",
          "cgroupPath": {
            "base": "KubepodsBesteffort",
            "relativePath": "hadoop-yarn/"
          }
        }
      ]
    }
kind: ConfigMap
metadata:
  name: slo-controller-config
  namespace: koordinator-system
``` 

To avoid changing other settings in the ConfigMap, we commend that you run the kubectl patch command to update the ConfigMap.

```bash
$ kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"
```

2. configuration of koord-yarn-copilot
`koord-yarn-copilot` communicates with YARN ResourceManager during resource syncing, and the ConfigMap defines YARN 
related configurations.
```yaml
apiVersion: v1
data:
  core-site.xml: |
    <configuration>
    </configuration>
  yarn-site.xml: |
    <configuration>
        <property>
            <name>yarn.resourcemanager.admin.address</name>
            <value>resource-manager.hadoop-yarn:8033</value>
        </property>
        <property>
            <name>yarn.resourcemanager.address</name>
            <value>resource-manager.hadoop-yarn:8032</value>
        </property>
    </configuration>
kind: ConfigMap
metadata:
  name: yarn-config
  namespace: koordinator-system
``` 
You can change the default address and port at `yarnConfiguration.resourceManager` in chart values. 

### (Optional) Advanced Settings
You can check the helm chart [hadoop-yarm](https://github.com/koordinator-sh/charts/blob/main/charts/hadoop-yarn), and
[koordinator-yarn-copilot](https://github.com/koordinator-sh/charts/blob/main/charts/koordinator-yarn-copilot) for more
advanced settings.

## Check YARN Available Resources
1. Check node allocatable batch resources of Koordinator on node.
```bash
$ kubectl get node -o yaml | grep batch-cpu
      kubernetes.io/batch-cpu: "60646"
      kubernetes.io/batch-cpu: "60486"

$ kubectl get node -o yaml | grep batch-memory
      kubernetes.io/batch-memory: "245976973438"
      kubernetes.io/batch-memory: "243254790644"
```

2. Check node allocatable resources in YARN
Visit YARN ResourceManager web UI address `${hadoop-yarn-rm-addr}:8088/cluster/nodes` in browser to get YARN NM status and allocatable
resources.

If you are using the hadoop-yarn demo chart in Koordinator repo, please execute the following command to make RM accessible locally.
```shell script
$ kubectl port-forward -n hadoop-yarn service/resource-manager 8088:8088
``` 
Then open the ui in your browser: `http://localhost:8088/cluster/nodes`

The `VCores Avail` and `Mem Avail` will be exactly same with batch resources of K8s nodes.

## Submit YARN Jobs
Spark, Flink and other computing engines support submitting jobs to YARN since they were published, check the 
official manual like [Spark](https://spark.apache.org/docs/latest/running-on-yarn.html) and 
[Flink](https://nightlies.apache.org/flink/flink-docs-master/docs/deployment/resource-providers/yarn/) before you start
the work. 

It is worth noting the hadoop-yarn demo chart in Koordinator repo has already integrated with Spark client, you can execute the following
command to submit an example job, and get the running status through web UI of ResourceManager.
```shell script
$ kubectl exec -n hadoop-yarn -it ${yarn-rm-pod-name} yarn-rm -- /opt/spark/bin/spark-submit --master yarn --deploy-mode cluster --class org.apache.spark.examples.SparkPi /opt/spark/examples/jars/spark-examples_2.12-3.3.3.jar 1000
```

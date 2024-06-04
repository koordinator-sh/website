---
sidebar_position: 4
---

# 使用 Koordinator 将 Hadoop YARN与K8s混部

## 背景介绍
Koordinator已经支持了K8s生态内的在离线混部，通过Batch超卖资源以及BE QoS，离线任务可以使用到集群内的空闲资源，提升资源使用效率。然而，
在K8s生态外，仍有相当数量的用户会选择将大数据任务运行其他资源管理系统，例如[Apache Hadoop YARN](https://hadoop.apache.org/docs/current/hadoop-yarn/hadoop-yarn-site/YARN.html)。
作为大数据生态下的资源管理系统，YARN承载了包括MapReduce、Spark、Flink以及Presto等在内的多种计算引擎。

为了进一步丰富Koordinator支持的在离线混部场景，Koordinator社区提供了面向大数据生态下的混部套件`Koordinator YARN Copilot`，
支持将超卖的Batch资源提供给Hadoop YARN使用，进一步提升集群资源的使用效率。`Koordinator YARN Copilot`具备以下特点：

- 面向开源生态：基于Hadoop YARN开源版本，不涉及对YARN的侵入式改造。
- 统一资源优先级和QoS策略：YARN任务同样使用Koordinator的Batch优先级资源，同时会受koordlet一系列QoS策略的管理。
- 节点级别的资源共享：Koordinator提供的混部资源，既可被K8s Pod使用，也可被YARN task使用，不同类型的离线应用可在同一节点内共存。
- 适配多种环境：对运行环境没有严格要求，可以在公有云或者IDC内使用。

## 使用限制
| 组件 | 版本要求 |
| --- | ------- |
| Kubernetes | ≥v1.18 |
| Koordinator | ≥v1.4 |
| Koordinator YARN Copilot | ≥v0.1 |
| Hadoop YARN | ≥v3.2.1 |

## 组件安装
Koordinator相关对组件都可以通过 helm v3.5+ 安装，Helm 是一个简单的命令行工具，您可以从 [这里](https://github.com/helm/helm/releases) 获取它。

![image](/img/hadoop-k8s.svg)

### 安装Koordinator
请确保Koordinator已正确安装在你的集群中。您可请参考[安装文档](https://koordinator.sh/docs/installation)获取有关安装和升级的详细信息。
```shell script
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Install the latest version.
$ helm install koordinator koordinator-sh/koordinator
```

### 安装Hadoop YARN
Hadoop YARN包括ResourceManager和NodeManager两部分组件，若您目前已经有可用的YARN集群，Koordinator社区建议的方式是保持ResourceManager
以宿主机进程的方式直接部署不变，将NodeManager以K8s Pod的形式部署，后续随Koordinator YARN Copilot的迭代演进再将ResourceManager进行容器化改造。

Koordinator社区在Helm仓库中提供了`hadoop-yarn`样例组件，其中包括ResourceManager和NodeManager，以及可供选择性安装的HDFS相关组件，
以便轻松运行示例作业。您可以直接安装样例组件以便快速尝试YARN与K8s混部，或者参考官方[安装指南](https://hadoop.apache.org/docs/stable/hadoop-yarn/hadoop-yarn-site/YARN.html)
搭建自己的 YARN 集群。

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

在搭建YARN集群之前，您应该了解以下关键信息：

- ResourceManager必须能够在K8s pod中访问，无论部署方式为host模式还是pod模式。
- NodeManager必须部署为pod模式部署，并带有annotation注释`yarn.hadoop.apache.org/node-id=${nm-hostname}:8041`，用来标识对应YARN节点的ID。
- NodeManager必须使用CgroupsLCEResourcesHandler作为YARN的容器执行器，并将cgroup层次结构指定在k8s best-effort目录下。
- NodeManager Pod使用koord-batch优先级资源，因此必须预先安装Koordinator并启用混部配置。

Koordinator提供的Helm样例中，以上相关功能已经在默认配置中开启，如果您使用的是自行维护的YARN，您可以参考Koordinator Helm库中的
[样例配置](https://github.com/koordinator-sh/charts/blob/main/charts/hadoop-yarn)进行修改。

### 安装Koordinator YARN Copilot
Koordinator YARN Copilot由`yarn-opeartor`和`copilot-agent`(建设中)两部分组成。

```shell script
# Firstly add koordinator charts repository if you haven't do this.
$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/

# [Optional]
$ helm repo update

# Install the latest version.
$ helm install koordinator-yarn-copilot koordinator-sh/koordinator-yarn-copilot
```

## 配置
1. koord-manager相关配置

在通过helm chart安装Koordinator时，ConfigMap slo-controller-config将默认被创建在koordinator-system命名空间下。YARN任务的cgroup将
在K8s的best-effort目录下管理，这部分将以Host应用的形式在slo-controller-config中配置，有关Koordinator对YARN任务的资源管理，可参考
相关[issue](https://github.com/koordinator-sh/koordinator/issues/1727)获取更多细节。

使用以下ConfigMap，创建configmap.yaml文件
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

查看安装的命名空间下是否存在ConfigMap，以命名空间`koordinator-system`和ConfigMap名字`slo-controller-config`为例，具体以实际安装配置为准。

- 若存在ConfigMap `slo-controller-config`，请使用PATCH方式进行更新，避免干扰ConfigMap中其他配置项。

 ```bash
 kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"
 ```

- 若不存在ConfigMap `slo-controller-config`，请执行以下命令进行创建ConfigMap。

```bash
$ kubectl apply -f configmap.yaml
```

2. koord-yarn-copilot相关配置
`koord-yarn-copilot`在进行资源同步时会与YARN ResourceManager进行通信，相关配置在独立的ConfigMap中进行管理。

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

您可以在Helm Chart的value配置`yarnConfiguration.resourceManager`中修改地址和端口信息。

### （可选）进阶配置
您可以参考[hadoop-yarn](https://github.com/koordinator-sh/charts/blob/main/charts/hadoop-yarn)
和[koordinator-yarn-copilot](https://github.com/koordinator-sh/charts/blob/main/charts/koordinator-yarn-copilot)
的Helm仓库，获取更多进阶配置的详细说明。

## 查看YARN集群中节点的资源信息
1. 查看K8s Node中的Batch资源总量信息。
```bash
$ kubectl get node -o yaml | grep batch-cpu
      kubernetes.io/batch-cpu: "60646"
      kubernetes.io/batch-cpu: "60486"

$ kubectl get node -o yaml | grep batch-memory
      kubernetes.io/batch-memory: "245976973438"
      kubernetes.io/batch-memory: "243254790644"
```

2。 查看YARN Node中的节点资源总量信息。
在浏览器中访问YARN ResourceManager的Web UI地址`${hadoop-yarn-rm-addr}:8088/cluster/nodes`，查看NodeManager状态和资源总量信息。

如果您使用了Koordinator Helm仓库中提供的YARN样例组件，可在本地执行以下命令，使得RM可以通过本机地址直接访问：
```shell script
$ kubectl port-forward -n hadoop-yarn service/resource-manager 8088:8088
``` 

打开浏览器，访问地址`http://localhost:8088/cluster/nodes`

查看各节点的资源总量信息`VCores Avail`和`Mem Avail`，可以看到其与K88s节点的Batch资源相同。

## 向YARN集群提交作业
Spark、Flink等计算引擎自诞生之初就支持向YARN提交作业运行，在使用时可参考[Spark](https://spark.apache.org/docs/latest/running-on-yarn.html)
和[Flink](https://nightlies.apache.org/flink/flink-docs-master/docs/deployment/resource-providers/yarn/)官方文档获取详细步骤。

在Koordinator Helm仓库提供的YARN样例组件中我们已经集成了Spark，您可以直接执行以下命令向YARN提交作业执行，并在Resource Manager的Web界面中，查看作业的执行情况。
```shell script
$ kubectl exec -n hadoop-yarn -it ${yarn-rm-pod-name} yarn-rm -- /opt/spark/bin/spark-submit --master yarn --deploy-mode cluster --class org.apache.spark.examples.SparkPi /opt/spark/examples/jars/spark-examples_2.12-3.3.3.jar 1000
```
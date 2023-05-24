---
sidebar_position: 1
---

<!-- # Colocation of Spark Jobs -->
<!--Apache Spark is an analysis engine for large-scale data processing, which is widely used in Big Data, SQL Analysis and Machine Learning scenarios. This tutorial provides a quick practice guide about running Spark jobs in colocation mode with other latency sensitive applications by Koordinator, which is helpful for improving cluster resource utilization. For more details about how to use, compose, and work with Koordinator colocation, please refer to the [Introduction](../)
-->
# Spark任务混部

`Apache Spark`是在大数据，SQL分析，机器学习领域广泛使用的大数据处理分析引擎。此文提供了使用Koordinator将Spark任务和其他延迟敏感应用混合部署的快速指南，以此来提升集群的资源利用率。了解更多关于如何使用、组合和扩展Koordinator混部的信息，请参考[简介](../)

<!-- ## Requirements -->
## 必要条件

<!--
### Koordinator Components

Before submitting Spark jobs as colocate mode, you need to ensure all Koordinator components have already been successfully installed. Please follow the step in [Installation](../installation) guide.
-->

### Koordinator组件

提交混部spark任务之前，需要确认所有`Koordinator`组件已经成功安装。请参考[安装](../installation)指南。

<!--
### Install Kubernetes Operator for Apache Spark

To simplify running of Spark jobs in Cluster, we import the Kubernetes Operator for Apache Spark in this practice, which uses Kubernetes custom resource for managing Spark applications.

With the help of Helm [chart](https://github.com/koordinator-sh/koordinator/tree/main/examples/spark-operator-chart), Kubernetes Operator for Apache Spark can be easily installed using the command below.
-->
### 为Apache Spark安装Kubernetes Operator

为了方便在集群中提交Spark任务，本文引入Kubernetes Operator，使用用户自定义资源(CRD)管理Spark应用。

根据[Helm chart](https://github.com/koordinator-sh/koordinator/tree/main/examples/spark-operator-chart)的帮助文档，可以很方便地使用下面的命令安装Spark Operator。

```sh
$ helm install koord-spark-operator ./spark-operator-chart/ --namespace spark-operator
```
<!--
Installing the chart will create a namespace `spark-operator` and if doesn't exist, besides, helm will create a spark-operator Deployment and set up RBAC role for it. After the installation, you should see the operator in running successfully by checking the status of helm release.
-->
安装这个`chart`将创建名为`spark-operator`的命名空间(如果不存在的情况下)，除此之外，`helm`也会创建一个名为`spark-operator`的应用并为它设置相应的RBAC权限。安装完成后，你可以通过检查`helm`的发布状态看到`operator`已经成功运行。

```sh
$ helm status --namespace spark-operator koord-spark-operator
```
<!--
## Run Spark Applications with Koordinator
Due to the mechanism that Spark driver pod needs a Kubernetes service account to manage executor pods, the service account must be authorized with appropriate permissions. Run the following command to create namespace `spark-demo` and service account `spark` before submitting jobs.
-->
## 使用Koordinator运行Spark任务

由于Spark的特殊机制，需要k8s的`service account`来管理Spark的`executor`驱动副本，因此`service account`必须经过经过合适的授权。请在提交任务前，执行下面的命令来创建`spark-demo`命名空间以及名为`spark`的`service account`。

```sh
$ kubectl apply -f examples/spark-jobs/service-account.yaml
```
<!--
Next, run the following command to create Colocation Profile so that all pods submitted following in namespace `spark-demo` will run in colocation mode. See this [tutorial](../user-manuals/colocation-profile) to learn more about Colocation Profile.
-->
然后，执行下面的命令创建混部的配置文件，这样提交到`spark-demo`命名空间的任务才会以混部模式运行。请参考[教程](../user-manuals/colocation-profile)获取更多有关混部配置的信息。

```sh
$ kubectl apply -f examples/spark-jobs/cluster-colocation-profile.yaml
```

<!--Submit a Spark TC example job to namespace `spark-demo` with the command:-->
使用如下命令往`spark-demo`命名空间提交一个`Spark TC`示例任务：

```sh
$ kubectl apply -f examples/spark-jobs/spark-tc-complex.yaml
```

<!-- Then, check the status of Spark application by running the following command. -->
然后，使用如下命令检查Spark应用的状态。

```sh
$ kubectl get sparkapplication -n spark-demo spark-tc-complex
```

<!-- This will show similar content as following: -->
将显示类似如下内容：

```text
NAME                      STATUS      ATTEMPTS   START                    FINISH                 AGE
spark-tc-complex          RUNNING     1          2022-03-30T09:11:22Z     <no value>             14s
```

<!-- Now, all pods submitted to namespace `spark-demo` will be switched to colocation mode, check spark-driver pod as below for example. We can see the protocols like`koordinator.sh/qosClass: BE` and `kubernetes.io/batch-cpu` are successfully injected to pod by Colocation Profile. -->
现在，提交到`spark-demo`命名空间的所有pods都将切换到混部状态。比如，检查名为`spark-driver`的pod的yaml，我们将看到标签`koordinator.sh/qosClass: BE`以及`kubernetes.io/batch-cpu`被`Colocation Profile`成功注入。

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
  	koordinator.sh/qosClass: BE
	spark-role: driver
  ...
spec:
  containers:
  -  args:
	  - driver
	  - --properties-file
	  - /opt/spark/conf/spark.properties
	  - --class
	  - org.apache.spark.examples.SparkTC
	  - local:///opt/spark/examples/jars/spark-examples_2.12-3.2.1-tc1.2.jar
   	  resources:
		limits:
		  kubernetes.io/batch-cpu: "1000"
		  kubernetes.io/batch-memory: 3456Mi
		requests:
		  kubernetes.io/batch-cpu: "1000"
		  kubernetes.io/batch-memory: 3456Mi
  ...
```

<!-- ## Evaluation

With the help of Koordinator, when pods resource usage is idle, resources already requested can be reallocated to other colocation pods by the overcommitment model, which can significantly improve the resource utilization of cluster.

In our experiment environment, before the Spark job submitted, we can see the cluster allocatable resources run out while the actual resource usage is in low level. -->
## 总结

在`Koordinator`的帮助下，当pod的资源使用比较空闲的时候，被申请的资源可以重新分配给其他通过超卖机制混部的pods，这将很大程度提高集群的资源利用率。

在我们的实验环境，在提交`Spark`任务前，我们可以看到集群的可分配资源已全分配出去而实际资源使用率仍处于很低的水平。

```sh
$ kubectl describe node
    Allocated resources:
    Resource                 Requests
    cpu                      7620m (95.25%)
  
$ kubectl top node
    NAME                      		CPU(cores)         		CPU%
    cn-hangzhou.your-node-1   		1190m         			14.8%
    cn-hangzhou.your-node-2   		1620m         			20.25%
```

<!-- After submit the Spark job in colocation mode, those unused resources will be reallocated through `batch priority` to Spark pods, so that we can make the cluster a higher utilization level. -->

当提交混部的`Spark`任务后，这些没被使用的资源通过`batch priority`优先级将重新分配给`Spark`任务的pods。因此，集群的资源利用率提升了一个等级。

```sh
$ kubectl top node
NAME                      		CPU(cores)   		    CPU%
cn-hangzhou.your-node-1   		4077m         			52%
cn-hangzhou.your-node-2   		3830m         			49%
```

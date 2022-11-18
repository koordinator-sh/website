---
sidebar_position: 1
---

# Spark任务混部
Apache Spark是一个被广泛应用在大数据、SQL分析和机器学习场景下的大规模数据处理的分析引擎。本教程提供了在Koordinator的混部模式下Spark任务和延迟敏感性的应用服务快速的实践操作说明，帮助提高集群资源的利用率。更多使用、编写和Koordinator混部方面的细节，请参阅[简介](../)。
## 需求
### Koordinator 组件
在混部的模块下提交Spark任务，需要确保所有的Koordinator 组件都已经成功的安装完成。请跟随安装指引[Installation](../installation)的步骤操作。
### 为Apache Spark安装Kubernetes Operator
为了简化在集群中运行Spark任务，我们在本次实践中采用基于Kubernetes上自定义资源的Operator来管理Spark的应用程序。
通过Helm [chart](https://github.com/koordinator-sh/koordinator/tree/main/examples/spark-operator-chart)的帮助，Apache Spark在Kubernetes上的Operator可以采用如下命令很简单的完成安装。
```
$ helm install koord-spark-operator ./spark-operator-chart/ --namespace spark-operator
```

安装过程中chart会在集群中创建一个namespace为`spark-operator`的命名空间（如果集群中不存在该命名空间），此外helm还将会为其创建一个spark-operator的Deployment资源以及设置配套的RBAC role。在安装完成之后，你应该可以通过helm的状态命令检查到该operator发布成功运行的信息。
```
$ helm status --namespace spark-operator koord-spark-operator
```

## 在Koordinator中运行Spark应用程序
由于机制要求，Spark operator需要拥有Kubernetes的相应权限的service account来进行pod的生命周期操作。在提交任务之前，运行如下的命令创建名为`spark-demo`的namespace和service account为`spark`的资源。
```
$ kubectl apply -f examples/spark-jobs/service-account.yaml
```

接下来，运行如下的命令来创建混部的配置文件资源，所有提交在`spark-demo`的namespace空间的pod都会运行在混部的模式下。如果想更多了解混部配置，可以参考本教程中有关该部分的介绍。
```
$ kubectl apply -f examples/spark-jobs/cluster-colocation-profile.yaml
```

提交一个Spark TC实例的job到命名空间为spark-demo的命令如下：
```
$ kubectl apply -f examples/spark-jobs/spark-tc-complex.yaml
```

随后，检查Spark TC实例应用程序的运行状态的命令如下：
```
$ kubectl get sparkapplication -n spark-demo spark-tc-complex
```

之后将会展示类似的内容如下：
```
NAME                      STATUS      ATTEMPTS   START                    FINISH                 AGE
spark-tc-complex          RUNNING     1          2022-03-30T09:11:22Z     <no value>             14s
```
现在，所有被提交到命名空间`spark-demo`的pod将会被切换到混部的模式，采用如下方式检查spark-driver实例的pod。我们可以看到`koordinator.sh/qosClass: BE` 和`kubernetes.io/batch-cpu` 的内容是从混部的配置文件中成功的注入到pod内的值。
```
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

## 评估效果
在Koordinator的帮助下，当pod资源使用空闲，在overcommitment模式下已经被请求分配的资源会被重新分配，这种方式可以显著的提升集群的资源利用率。

在我们的集群环境中，可以看到在Spark任务被提交之前集群可分配的资源耗尽了，但是实际资源使用率处于较低的水平。
```
$ kubectl describe node
    Allocated resources:
    Resource                 Requests
    cpu                      7620m (95.25%)
  
$ kubectl top node
    NAME                      		CPU(cores)         		CPU%
    cn-hangzhou.your-node-1   		1190m         			14.8%
    cn-hangzhou.your-node-2   		1620m         			20.25%
```

在混部模式下提交Spark任务，这些未被使用的资源将会通过`batch priority`批处理任务优先级被重新分配给Spark的任务，如此我们可以使集群达到更高的资源利用率水平。
```
$ kubectl top node
NAME                      		CPU(cores)   		    CPU%
cn-hangzhou.your-node-1   		4077m         			52%
cn-hangzhou.your-node-2   		3830m         			49%
```
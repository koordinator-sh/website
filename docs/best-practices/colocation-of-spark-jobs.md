---
sidebar_position: 1
---

# Colocation of Spark Jobs
Apache Spark is an analysis engine for large-scale data processing, which is widely used in Big Data, SQL Analysis and Machine Learning scenarios. This tutorial provides a quick practice guide about running Spark jobs in colocation mode with other latency sensitive applications by Koordinator, which is helpful for improving cluster resource utilization. For more details about how to use, compose, and work with Koordinator colocation, please refer to the [Introduction](../)

## Requirements
### Koordinator Components
Before submitting Spark jobs as colocate mode, you need to ensure all Koordinator components have already been successfully installed. Please follow the step in [Installation](../installation) guide.

### Install Kubernetes Operator for Apache Spark 
To simplify running of Spark jobs in Cluster, we import the Kubernetes Operator for Apache Spark in this practice, which uses Kubernetes custom resource for managing Spark applications.

With the help of Helm [chart](https://github.com/koordinator-sh/koordinator/tree/main/examples/spark-operator-chart), Kubernetes Operator for Apache Spark can be easily installed using the command below.
```
$ helm install koord-spark-operator ./spark-operator-chart/ --namespace spark-operator
```

Installing the chart will create a namespace `spark-operator` and if doesn't exist, besides, helm will create a spark-operator Deployment and set up RBAC role for it. After the installation, you should see the operator in running successfully by checking the status of helm release.
```
$ helm status --namespace spark-operator koord-spark-operator
```

## Run Spark Applications with Koordinator
Due to the mechanism that Spark driver pod needs a Kubernetes service account to manage executor pods, the service account must be authorized with appropriate permissions. Run the following command to create namespace `spark-demo` and service account `spark` before submitting jobs.
```
$ kubectl apply -f examples/spark-jobs/service-account.yaml
```

Next, run the following command to create Colocation Profile so that all pods submitted following in namespace `spark-demo` will run in colocation mode. See this [tutorial](../user-manuals/colocation-profile) to learn more about Colocation Profile.
```
$ kubectl apply -f examples/spark-jobs/cluster-colocation-profile.yaml
```

Submit a Spark TC example job to namespace `spark-demo` with the command:
```
$ kubectl apply -f examples/spark-jobs/spark-tc-complex.yaml
```

Then, check the status of Spark application by running the following command.
```
$ kubectl get sparkapplication -n spark-demo spark-tc-complex
```

This will show similar content as following:
```
NAME                      STATUS      ATTEMPTS   START                    FINISH                 AGE
spark-tc-complex          RUNNING     1          2022-03-30T09:11:22Z     <no value>             14s
```
Now, all pods submitted to namespace `spark-demo` will be switched to colocation mode, check spark-driver pod as below for example. We can see the protocols like`koordinator.sh/qosClass: BE` and `koordinator.sh/batch-cpu` are successfully injected to pod by Colocation Profile.
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
		  koordinator.sh/batch-cpu: "1000"
		  koordinator.sh/batch-memory: 3456Mi
		requests:
		  koordinator.sh/batch-cpu: "1000"
		  koordinator.sh/batch-memory: 3456Mi
  ...
```

## Evaluation
With the help of Koordinator, when pods resource usage is idle, resources already requested can be reallocated to other colocation pods by the overcommitment model, which can significantly improve the resource utilization of cluster.

In our experiment environment, before the Spark job submitted, we can see the cluster allocatable resources run out while the actual resource usage is in low level.
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

After submit the Spark job in colocation mode, those unused resources will be reallocated through `batch priority` to Spark pods, so that we can make the cluster a higher utilization level.
```
$ kubectl top node
NAME                      		CPU(cores)   		    CPU%
cn-hangzhou.your-node-1   		4077m         			52%
cn-hangzhou.your-node-2   		3830m         			49%
```
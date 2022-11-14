# 优先级

Koordinator 在 Kubernetes 优先级类型的基础上定义了一套规范，并扩展了优先级的一个维度以对混部场景的细粒度支持。

## 定义

优先级用数字表示，目前定义了四个类:

PriorityClass|优先级范围|描述
----- | ----------- | --------
koord-prod | [9000, 9999] | 需要提前规划资源配额，并且保证在配额内成功。
koord-mid  | [7000, 7099]  | 需要提前规划资源配额，并且保证在配额内成功。
koord-batch | [5000, 5999] | 需要提前规划资源配额，一般允许借用配额。
koord-free | [3000, 3999] | 不保证资源配额，可分配的资源总量取决于集群的总闲置资源。

PriorityClass 目前留有一些暂未使用的区间，以支持未来可能的扩展。

## 约束

Koordinator 将不同类型的工作负载匹配到不同的优先级:

- koord-prod，运行典型的延迟敏感型服务，一般是指需要 "实时 "响应的服务类型，比如通过点击移动APP中的按钮调用的典型服务。
- koord-mid，对应于长周期的可用资源，一般用于运行一些实时计算、人工智能训练任务/作业，如 tensorflow/pytorch 等。
- koord-batch，对应于的短周期可用资源，运行典型的离线批处理作业，一般指离线分析类作业，如日级大数据报告、非交互式 SQL 查询。
- koord-free，运行低优先级的离线批处理作业，一般指不做资源预算，利用闲置资源尽量完成，如开发人员为测试目提交的作业。

## Koordinator 优先级与 Kubernetes优先级的对比

Koordinator 在 Kubernetes 集群中部署时会初始化这四个 PriorityClass。

```
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: koord-prod
value: 9000
description: "This priority class should be used for prod service pods only."
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: koord-mid
value: 7000
description: "This priority class should be used for mid service pods only."
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: koord-batch
value: 5000
description: "This priority class should be used for batch service pods only."
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: koord-free
value: 3000
description: "This priority class should be used for free service pods only."
```

在每个 PriorityClass 内，Koordinator 允许用户为精细化资源调度设置混部 Pod 的优先级。

## 示例

下面的 YAML 是一个 Pod 配置的例子，它使用了前面例子中创建的 PriorityClass 和优先级。

```
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    env: test
    koordinator.sh/priority: "5300"
spec:
  containers:
  - name: nginx
    image: nginx
    imagePullPolicy: IfNotPresent
  priorityClassName: koord-batch
```

## 下一步是什么

以下是推荐下一步阅读的内容:

- 学习 Koordinator 的[资源模型](./resource-model)。
- 学习 Koordinator 的[QoS](./qos)。

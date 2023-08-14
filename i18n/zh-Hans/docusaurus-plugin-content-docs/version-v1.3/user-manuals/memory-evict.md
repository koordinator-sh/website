# 基于内存用量的驱逐策略

## 简介

Koordinator支持了将节点空闲资源动态超卖给低优先级Pod，在混部场景下，节点实际的内存资源用量时刻在变化，对于内存这类不可压缩类型的资源，
当节点资源用量较高时，可能会引发整机内存OOM，导致高优先级Pod的进程被kill。为防止这一情况发生，Koordiantor提供了基于单机内存用量的驱逐策略。
单机组件Koordlet会以秒级粒度持续探测整机内存的用量情况（Total-Available），当整机资源内存用量较高时，会将低优先级的BE类型Pod驱逐，
保障高优先级Pod的服务质量。在驱逐过程中会首先选择优先级(Pod.Spec.Priority)更低的Pod进行驱逐，若优先级相同，
则优先驱逐内存资源用量更多的Pod，直至整机内存用量降低到配置的安全水位（evictThreshold）以下。

![image](/img/memory-evict.svg)

## 使用限制
请确保Koordinator已正确安装在你的集群中。若未安装，请参考[安装文档](https://koordinator.sh/docs/installation)，所需的版本要求情况如下：

| 组件 | 版本要求 |
| --- | ------- |
| Kubernetes | ≥v1.18 |
| koordinator | ≥v0.3.0 |

该功能由单机组件Koordlet提供，对应的feature-gate默认关闭，使用前请确保koordlet的启动参数`-feature-gates`中已经添加了`BEMemoryEvict=true`,
详见[参考示例](https://github.com/koordinator-sh/charts/blob/main/versions/v1.2.0/templates/koordlet.yaml#L36)。

## 操作步骤

1. 使用以下ConfigMap，创建configmap.yaml文件
   ```yaml
   #ConfigMap slo-controller-config 样例。
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: slo-controller-config # 以koord-manager实际配置的名字为准，例如ack-slo-config
     namespace: koordinator-system # 命名空间以环境中实际安装的情况为准，例如kube-system
   data:
     # 开启基于内存用量的驱逐功能。
     resource-threshold-config: |
       {
         "clusterStrategy": {
           "enable": true,
           "memoryEvictThresholdPercent": 70
         }
       }
   ```
   
   | 参数            | 类型    | 取值范围  | 说明                                                         |
   | :-------------- | :------ | :-------- | :----------------------------------------------------------- |
   | `enable`        | Boolean | true; false | true：集群全局开启单机内存驱逐策略。false（默认值）：集群全局关闭单机内存驱逐策略。 |
   | `memoryEvictThresholdPercent` | Int     | 0~100      | 整机内存资源用量百分比水位，表示触发驱逐的内存阈值，默认值为70。 |

2. 查看安装的命名空间下是否存在ConfigMap，以命名空间`koordinator-system`和ConfigMap名字`slo-controller-config`为例，具体以实际安装配置为准。

   - 若存在ConfigMap `slo-controller-config`，请使用PATCH方式进行更新，避免干扰ConfigMap中其他配置项。

     ```bash
     kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"
     ```

   - 若不存在ConfigMap `slo-controller-config`，请执行以下命令进行创建Configmap。

     ```bash
     kubectl apply -f configmap.yaml
     ```

3. 使用以下YAML内容，创建be-pod-demo.yaml文件。

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: be-pod-demo
     labels:
       koordinator.sh/qosClass: 'BE' #指定Pod的QoS级别为BE。
   spec:
     containers:
       - args:
           - '-c'
           - '1'
           - '--vm'
           - '1'
         command:
           - stress
         image: polinux/stress
         imagePullPolicy: Always
         name: stress
     restartPolicy: Always
     schedulerName: default-scheduler
   ```

4. 执行以下命令，将be-pod-demo部署到集群。

   ```bash
   $ kubectl apply -f be-pod-demo.yaml
   ```
   
5. 执行以下命令，查看be-pod-demo状态，等待Pod启动完成。

   ```bash
   $ kubectl get pod be-pod-demo
   NAME          READY   STATUS    RESTARTS   AGE
   be-pod-demo   1/1     Running   0          7s
   ```
   
6. 在节点执行以下命令，使用[stress工具](https://linux.die.net/man/1/stress)启动进程，
确保整机内存资源用量被提升到驱逐水位以上，其中`--vm-bytes`参数表示stress进程占用的内存量10GB，测试时可根据实际机型情况进行调整。

   ```bash
   $ stress --cpu 1 --vm 1 --vm-bytes 10G --vm-keep
   ```
   
7. 观察be-pod-demo运行情况，可以发现be-pod-demo已经不存在，驱逐信息可以通过event查看到。

   ```bash
   $ kubectl get pod be-pod-demo
   Error from server (NotFound): pods "be-pod-demo" not found
   
   $ kubectl get event
   LAST SEEN   TYPE      REASON            OBJECT              MESSAGE
   46s         Normal    Killing           pod/be-pod-demo     Stopping container stress
   48s         Warning   evictPodSuccess   $you-pod-object     evict Pod:be-pod-demo, reason: EvictPodByNodeMemoryUsage, message: killAndEvictBEPods for node(${your-node-id}), need to release memory: 8077889699
   ```
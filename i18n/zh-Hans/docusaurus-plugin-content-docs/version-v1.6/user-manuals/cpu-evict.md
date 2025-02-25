# 基于CPU资源满足度的驱逐策略

## 简介

Koordinator提供了CPU的[动态压制能力](/docs/user-manuals/cpu-suppress)，在混部场景下可以根据高优先级Pod（LS）的资源用量情况，
动态调整低优先级Pod（BE）可以使用的CPU资源上限，当LS Pod的资源用量上升时，koordlet将缩减BE Pod可使用的CPU核心。然而，当LS Pod负载突增时，
可能会导致大量BE Pod被压制在少量CPU上，使得这部分Pod的资源满足度较低，应用运行及其缓慢，甚至额外引入一些内核资源的竞争。

事实上，大部分BE Pod的离线任务都有较好的重试能力，可以接受一定程度的驱逐而换取更高的资源质量。Koordlet提供了基于CPU资源满足度的驱逐策略，
计算被压制部分的CPU利用率和资源满足度，当利用率和资源满足度同时超过配置的阈值时，会依次按更低优先级、更高的Pod CPU利用率对BE Pod进行驱逐，
直至CPU资源满足度恢复到阈值以上。

![image](/img/cpu-evict.svg)

## 使用限制
请确保Koordinator已正确安装在你的集群中。若未安装，请参考[安装文档](https://koordinator.sh/docs/installation)。
该功能需开启Batch资源动态超卖，并和CPU动态压制能力配合使用，请参考[使用文档](/docs/user-manuals/cpu-suppress)。所需的版本要求情况如下：

| 组件 | 版本要求 |
| --- | ------- |
| Kubernetes | ≥v1.18 |
| koordinator | ≥v0.4.0 |

该功能由单机组件Koordlet提供，对应的feature-gate默认关闭，使用前请确保koordlet的启动参数`-feature-gates`中已经添加了`BECPUEvict=true`,
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
     # 开启基于CPU资源满足度的驱逐功能。
     resource-threshold-config: |
       {
         "clusterStrategy": {
           "enable": true,
           "cpuEvictBESatisfactionLowerPercent": 60,
           "cpuEvictBESatisfactionUpperPercent": 80,
           "cpuEvictBEUsageThresholdPercent": 90,
           "CPUEvictTimeWindowSeconds": 60
         }
       }
   ```

   | 参数            | 类型    | 取值范围  | 说明                                                         |
   | :-------------- | :------ | :-------- | :----------------------------------------------------------- |
   | `enable`        | Boolean | true; false | true：集群全局开启CPU资源满足度的驱逐策略。false（默认值）：集群全局关闭策略。 |
   | `cpuEvictBESatisfactionLowerPercent` | Int     | 0~60      | BE CPU资源满足度的驱逐阈值，低于该值时将触发对BE Pod的驱逐。 |
   | `cpuEvictBESatisfactionUpperPercent` | Int     | cpuEvictBESatisfactionLowerPercent~100      | BE CPU资源满足度的安全阈值，高于该值时将停止对BE Pod的驱逐。 |
   | `cpuEvictBEUsageThresholdPercent` | Int     | 0~100      | BE CPU利用率阈值，当BE Pod在CPU被压制范围内的利用率高于该值时，才会触发驱逐，默认值为90。 |
   | `cpuEvictTimeWindowSeconds` | Int     | >=2      | CPU资源满足度和BE CPU利用率计算的时间窗口，单位为秒 |

2. 查看安装的命名空间下是否存在ConfigMap，以命名空间`koordinator-system`和ConfigMap名字`slo-controller-config`为例，具体以实际安装配置为准。

   - 若存在ConfigMap `slo-controller-config`，请使用PATCH方式进行更新，避免干扰ConfigMap中其他配置项。

     ```bash
     kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"
     ```

   - 若不存在ConfigMap `slo-controller-config`，请执行以下命令进行创建ConfigMap。

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
           - '4'
           - '--vm'
           - '1'
         command:
           - stress
         image: polinux/stress
         imagePullPolicy: Always
         name: stress
         resources:
           limits:
             kubernetes.io/batch-cpu: 4k
             kubernetes.io/batch-memory: 4Gi
           requests:
             kubernetes.io/batch-cpu: 4k
             kubernetes.io/batch-memory: 4Gi
     restartPolicy: Always
     schedulerName: default-scheduler
     # 当ColocationProfile功能开启时（默认启用），priorityClassName是必填的
     priorityClassName: koord-batch
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
确保整机内存资源用量被提升到驱逐水位以上，其中`--cpu`参数表示stress进程占用的CPU资源量10核，测试时可根据实际机型情况进行调整。

   ```bash
   $ stress --cpu 10 --vm 1
   ```
7. 观察be-pod-demo运行情况，可以发现be-pod-demo已经不存在，驱逐信息可以通过event查看到。

   ```bash
   $ kubectl get pod be-pod-demo
   Error from server (NotFound): pods "be-pod-demo" not found
   
   $ kubectl get event
   LAST SEEN   TYPE      REASON            OBJECT              MESSAGE
   44s         Normal    Killing           pod/be-pod-demo                     Stopping container stress
   44s         Warning   evictPodSuccess   ${your-pod-object}   evict Pod:be-pod-demo, reason: EvictPodByBECPUSatisfaction, message: killAndEvictBEPodsRelease for node(${your-node-id}), need realase CPU : 1200
   ```

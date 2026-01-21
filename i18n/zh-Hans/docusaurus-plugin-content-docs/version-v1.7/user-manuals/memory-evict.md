# 内存资源驱逐策略

## 简介
### 基于用量的策略
Koordinator 支持了将节点空闲资源动态超卖给低优先级 Pod ，在混部场景下，节点实际的内存资源用量时刻在变化，对于内存这类不可压缩类型的资源，
当节点资源用量较高时，可能会引发整机内存 OOM，导致高优先级 Pod 的进程被 kill。为防止这一情况发生，Koordinator 提供了基于单机内存用量的驱逐策略(BEMemoryEvict/MemoryEvict)。
单机组件 Koordlet 会以秒级粒度持续探测整机内存的用量情况(Total-Available)，当整机资源内存用量较高时，开启 BEMemoryEvict 时会将低优先级的 BE 类型 Pod 驱逐，
而开启 MemoryEvict 时会根据 slo-config 优先级配置选择 Pod 进行驱逐， 以保障高优先级 Pod 的服务质量。 在驱逐过程中会首先选择优先级(Pod.Spec.Priority)更低的 Pod 
进行驱逐，若优先级相同， 则优先驱逐内存资源用量更多的 Pod，直至整机内存用量降低到配置的安全水位(evictThreshold)以下。

![image](/img/memory-evict.svg)

### 基于已分配的策略
Koordinator 支持了通过静态指定节点逻辑资源(mid)以及节点空闲资源动态超卖给低优先级 Pod，在混部场景下，节点实际的内存资源用量时刻在变化，当 slo-config 配置发生变化
或者节点资源用量突高，会导致 slo-manager 计算出的 mid/batch 的账本量大幅减少，而基于满足度和用量的驱逐如果不够及时，可能会造成宕机。为了防止这一情况发生，Koordinator 提供了基于单机账本已分配用量的驱逐策略(MemoryAllocatableEvict)。
单机组件 Koordlet 会计算整机 mid-memory/batch-memory 账本的用量情况，当请求用量达到设置的阈值时，会根据优先级对 Pod 进行驱逐，以保障高优先级 Pod 的服务质量。在驱逐过程中会首先选择优先级(Pod.Spec.Priority)更低的 Pod 进行驱逐，
若优先级相同，则优先驱逐内存请求用量更多的 Pod，直至整机内存用量降低到配置的安全水位(evictThreshold)以下。

## 使用限制
### 组件
请确保Koordinator已正确安装在你的集群中。若未安装，请参考[安装文档](https://koordinator.sh/docs/installation)，所需的版本要求情况如下：

| 组件          | 版本要求     |
|-------------|----------|
| Kubernetes  | ≥v1.18   |
| koordinator | ≥v1.18.0 |

该功能由单机组件 Koordlet 提供，对应的 feature-gate 默认关闭，使用前请确保koordlet的启动参数`-feature-gates`中已经添加了`BEMemoryEvict/MemoryEvict/MemoryAllocatableEvict=true`，
详见[参考示例](https://github.com/koordinator-sh/charts/blob/main/versions/v1.8.0/templates/koordlet.yaml#L36)。

综上所述：
- **BEMemoryEvict / MemoryEvict** 基于整机内存实际使用率触发
- **MemoryAllocatableEvict** 基于逻辑资源账本(如 mid-memory / batch-memory)的已分配量触发

**推荐配置：**
- 混部生产环境必须开启 **MemoryEvict** 作为防止节点 OOM 的最后一道防线，保障高优先级(LS)Pod 不被内核 kill。
- 若业务中 BE Pod 类型明确且无需驱逐其他低优 Pod，可选用 **BEMemoryEvict** 作为轻量替代。
- 若使用了 mid-memory / batch-memory 等逻辑资源划分（即启用了 SLO 资源模型），推荐启用 **MemoryAllocatableEvict** 防止账本超分。
- 在同时开启多个 feature 时，针对不同的 Pod 集（没有重复的驱逐对象），但针对整体资源释放效应是累积的，在调度和容量规划过程中会一并考虑。
### Pod
由于 MemoryEvict/MemoryAllocatableEvict 作用的 pod 受优先级(Pod.Spec.Priority)限制，为了能够避免驱逐某些低优的但重要的 pod，只有设置了 label `koordinator.sh/eviction-enabled: "true"` 
的 pod 才允许被驱逐。此外，当其他条件及优先级相同时，可进一步依据 label `koordinator.sh/priority` 由低到高进行驱逐 pod。当开启多个 feature 时，可通过配置
pod 的 annotation `koordinator.sh/eviction-policy: '["BEMemoryEvict","MemoryEvict"]'` 来限制可作用的 feature，没有配置时不作任何限制。

## 操作步骤
### 用量
1. 使用以下 ConfigMap，创建configmap.yaml文件
   ```yaml
   # ConfigMap slo-controller-config 样例。
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: slo-controller-config # 以 koord-manager 实际配置的名字为准，例如 slo-controller-config
     namespace: koordinator-system # 命名空间以环境中实际安装的情况为准，例如 kube-system
   data:
     # 开启基于内存用量的驱逐功能
     resource-threshold-config: |
       {
         "clusterStrategy": {
           "enable": true,
           "memoryEvictThresholdPercent": 70
         }
       }
   ```
   
   | 参数                            | 类型      | 取值范围        | 说明                                                                    |
   |:------------------------------|:--------|:------------|:----------------------------------------------------------------------|
   | `enable`                      | Boolean | true; false | true：集群全局开启单机内存驱逐策略。false（默认值）：集群全局关闭单机内存驱逐策略。                        |
   | `memoryEvictThresholdPercent` | Int     | 0~100       | 整机内存资源用量百分比水位，表示触发驱逐的内存阈值。此字段开启 BEMemoryEvict/MemoryEvict 时必填，默认值 70。 |

2. 查看安装的命名空间下是否存在ConfigMap，以命名空间`koordinator-system`和ConfigMap名字`slo-controller-config`为例，具体以实际安装配置为准。

   - 若存在ConfigMap `slo-controller-config`，请使用PATCH方式进行更新，避免干扰ConfigMap中其他配置项。

     ```bash
     kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"
     ```

   - 若不存在ConfigMap `slo-controller-config`，请执行以下命令创建ConfigMap。

     ```bash
     kubectl apply -f configmap.yaml
     ```

3. 使用以下YAML内容，创建 be-pod-demo.yaml 文件。

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
     # 当ColocationProfile功能开启时（默认启用），priorityClassName是必填的
     priorityClassName: koord-batch
   ```

4. 执行以下命令，将 be-pod-demo 部署到集群。

   ```bash
   $ kubectl apply -f be-pod-demo.yaml
   ```
   
5. 执行以下命令，查看 be-pod-demo 状态，等待Pod启动完成。

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
   
7. 观察 be-pod-demo 运行情况，可以发现 be-pod-demo 已经不存在，驱逐信息可以通过event查看到。

   ```bash
   $ kubectl get pod be-pod-demo
   Error from server (NotFound): pods "be-pod-demo" not found
   
   $ kubectl get event
   LAST SEEN   TYPE      REASON            OBJECT              MESSAGE
   46s         Normal    Killing           pod/be-pod-demo     Stopping container stress
   48s         Warning   evictPodSuccess   ${your-pod-object}  evict Pod:koordinator-system/be-pod-demo, reason: evicted, message: trigger by koordlet feature BEMemoryEvict, kill pod: be-pod-demo
   ```

### 已分配

1. 使用以下 ConfigMap，创建 configmap.yaml 文件
   ```yaml
   #ConfigMap slo-controller-config 样例。
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: slo-controller-config # 以 koord-manager 实际配置的名字为准，例如 slo-controller-config
     namespace: koordinator-system # 命名空间以环境中实际安装的情况为准，例如 kube-system
   data:
     # 提供 batch 账本
     colocation-config: |
      {
         "enable": true,
         "batchCPUThresholdPercent": 100,
         "batchMemoryThresholdPercent": 100
       }
     # 开启基于内存已分配的驱逐功能
     resource-threshold-config: |
       {
         "clusterStrategy": {
           "enable": true,
           "memoryAllocatableEvictThresholdPercent": 110,
           "memoryAllocatableEvictLowerPercent": 100,
           "allocatableEvictPriorityThreshold": 5999
         }
       }
   ```

   | 参数                                       | 类型      | 取值范围                                   | 说明                                                                 |
   |:-----------------------------------------|:--------|:---------------------------------------|:-------------------------------------------------------------------|
   | `enable`                                 | Boolean | true; false                            | true：集群全局开启策略。false（默认值）：集群全局关闭策略。                                 |
   | `memoryAllocatableEvictThresholdPercent` | Int     | memoryAllocatableEvictLowerPercent~100 | 内存资源已分配的驱逐阈值，高于该值时将触发对相关 Pod 的驱逐。此字段开启 MemoryAllocatableEvict 时必填。 |
   | `memoryAllocatableEvictLowerPercent`     | Int     | 0~100                                  | 内存资源已分配的安全阈值，低于等于该值时将停止对 Pod 的驱逐。此字段开启 MemoryAllocatableEvict 时必填。 |
   | `allocatableEvictPriorityThreshold`      | Int     | /                                      | 可被驱逐的 pod 优先级上限。此字段开启 MemoryAllocatableEvict 时必填。                  |

2. 下发 ConfigMap slo-controller-config，同上。
3. 创建若干 BE pods 部署到集群，等待 pods 启动完成。
4. 变更 slo-controller-config 插件，将 batch 账本置零。
   ```yaml
   #ConfigMap slo-controller-config 样例。
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: slo-controller-config # 以 koord-manager 实际配置的名字为准，例如 slo-controller-config
     namespace: koordinator-system # 命名空间以环境中实际安装的情况为准，例如 kube-system
   data:
     # 提供 batch 账本
     colocation-config: |
      {
         "enable": true,
         "batchCPUThresholdPercent": 100,
         "batchMemoryThresholdPercent": 0
       }
     # resource-threshold-config keep the same
   ```
5. 观察 pods 运行情况，可以发现过了一会儿 pods 已经被驱逐，驱逐信息可以通过event查看到。

   ```bash
   $ kubectl get pod be-pod-demo
   Error from server (NotFound): pods "be-pod-demo" not found
   
   $ kubectl get event
   LAST SEEN   TYPE      REASON            OBJECT              MESSAGE
   44s         Normal    Killing           pod/be-pod-demo                     Stopping container stress
   44s         Warning   evictPodSuccess   ${your-pod-object}   evict Pod:koordinator-system/be-pod-demo, reason: evicted, message: trigger by koordlet feature MemoryAllocatableEvict, kill pod: be-pod-demo
   ```
# CPU 资源驱逐策略

## 简介
### 基于满足度的策略
Koordinator 提供了 CPU 的[动态压制能力](/docs/user-manuals/cpu-suppress)，在混部场景下可以根据高优先级 Pod(LS)的资源用量情况，
动态调整低优先级 Pod(BE)可以使用的CPU资源上限，当 LS Pod 的资源用量上升时，koordlet 将缩减BE Pod可使用的 CPU 核心。然而，当 LS Pod 负载突增时，
可能会导致大量 BE Pod 被压制在少量CPU上，使得这部分Pod的资源满足度较低，应用运行极其缓慢，甚至额外引入一些内核资源的竞争。

事实上，大部分 BE Pod 的离线任务都有较好的重试能力，可以接受一定程度的驱逐而换取更高的资源质量。Koordlet 提供了基于 CPU 资源满足度的驱逐策略(BECPUEvict)，
计算被压制部分的 CPU 利用率和资源满足度，当利用率和资源满足度同时超过配置的阈值时，会依次按更低优先级、更高的 Pod CPU 利用率对 BE Pod 进行驱逐，
直至 CPU 资源满足度恢复到阈值以上。

![image](/img/cpu-evict.svg)

### 基于用量的策略
Koordinator 支持了将节点空闲资源动态超卖给低优先级 Pod，在混部场景下，节点实际的 CPU 资源用量时刻在变化，当节点资源用量较高时，可能会引发宕机，
导致高优先级 Pod 的进程被 kill。为防止这一情况发生，Koordinator 提供了基于单机 CPU 用量的驱逐策略(CPUEvict)。
单机组件 Koordlet 会以秒级粒度持续探测整机CPU的用量情况(Total-Available)，当整机资源 CPU 用量较高时，会根据 slo-config 优先级配置选择 Pod 进行驱逐，
以保障高优先级Pod的服务质量。在驱逐过程中会首先选择优先级(Pod.Spec.Priority)更低的Pod进行驱逐，若优先级相同，
则优先驱逐 CPU 资源用量更多的 Pod，直至整机 CPU 用量降低到配置的安全水位(evictThreshold)以下。

### 基于已分配的策略
Koordinator 支持了通过静态指定节点逻辑资源(mid)以及节点空闲资源动态超卖给低优先级 Pod，在混部场景下，节点实际的 CPU 资源用量时刻在变化，当 slo-config 配置发生变化
或者节点资源用量突高，会导致slo-manager计算出的 mid/batch 的账本量大幅减少，而基于满足度和用量的驱逐如果不够及时，可能会造成宕机。为了防止这一情况发生，Koordinator 提供了基于单机账本已分配用量的驱逐策略(CPUAllocatableEvict)。
单机组件 Koordlet 会计算整机 mid-cpu/batch-cpu 账本的用量情况，当请求用量达到设置的阈值时，会根据优先级对 Pod 进行驱逐，以保障高优先级 Pod 的服务质量。在驱逐过程中会首先选择优先级(Pod.Spec.Priority)更低的 Pod 进行驱逐，
若优先级相同， 则优先驱逐 CPU 请求用量更多的 Pod，直至整机 CPU 用量降低到配置的安全水位(evictThreshold)以下。

## 使用限制
### 组件
请确保 Koordinator 已正确安装在你的集群中。若未安装，请参考[安装文档](https://koordinator.sh/docs/installation)。所需的版本要求情况如下：

| 组件          | 版本要求     |
|-------------|----------|
| Kubernetes  | ≥v1.18   |
| koordinator | ≥v1.18.0 |

该功能由单机组件 Koordlet 提供，对应的 feature-gate 默认关闭，使用前请确保 koordlet 的启动参数`-feature-gates`中已经添加了对应的`BECPUEvict/CPUEvict/CPUAllocatableEvict=true`，
详见[参考示例](https://github.com/koordinator-sh/charts/blob/main/versions/v1.7.0/templates/koordlet.yaml#L36)。

**注意：** BECPUEvict 功能需开启 Batch 资源动态超卖，并和 CPU 动态压制能力配合使用，请参考[使用文档](/docs/user-manuals/cpu-suppress)。

综上所述：
- **BECPUEvict** 关注的是低优先级(BE)Pod 的"资源满足度"
- **CPUEvict** 关注的是整机实际 CPU 使用率
- **CPUAllocatableEvict** 关注的是逻辑资源账本的分配总量

**推荐配置：**
- 所有混部生产环境应开启 **CPUEvict** 保障节点安全。
- 若 BE 任务可容忍驱逐，强烈建议开启 **BECPUEvict** 提升资源效率。
- 若使用了 mid/batch-cpu 等扩展资源且 pod 允许被驱逐，推荐启用 **CPUAllocatableEvict** 防止账本超分。
- 在同时开启多个 feature 时，针对不同的 Pod 集（没有重复的驱逐对象），但针对整体资源释放效应是累积的，在调度和容量规划过程中会一并考虑。

### Pod
由于 CPUEvict/CPUAllocatableEvict 作用的 pod 受优先级(Pod.Spec.Priority)限制，为了能够避免驱逐某些低优的但重要的 pod，只有设置了 label `koordinator.sh/eviction-enabled: "true"`
的 pod 才允许被驱逐。此外，当其他条件及优先级相同时，可进一步依据 label `koordinator.sh/priority` 由低到高进行驱逐 pod。 当开启多个 feature 时，可通过配置
pod 的 annotation  `koordinator.sh/eviction-policy: '["BECPUEvict","CPUEvict"]'`来限制可作用的 feature，没有配置时不作任何限制。

## 操作步骤

### 满足度
1. 使用以下 ConfigMap，创建configmap.yaml文件
   ```yaml
   # ConfigMap slo-controller-config 样例
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
     # 开启基于CPU资源满足度的驱逐功能
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

   | 参数                                   | 类型      | 取值范围                                   | 说明                                                                         |
   |:-------------------------------------|:--------|:---------------------------------------|:---------------------------------------------------------------------------|
   | `enable`                             | Boolean | true; false                            | true：集群全局开启策略。false（默认值）：集群全局关闭策略。                                         |
   | `cpuEvictBESatisfactionLowerPercent` | Int     | 0~60                                   | BE CPU资源满足度的驱逐阈值，低于该值时将触发对BE Pod的驱逐。此字段开启 BECPUEvict 时必填。                  |
   | `cpuEvictBESatisfactionUpperPercent` | Int     | cpuEvictBESatisfactionLowerPercent~100 | BE CPU资源满足度的安全阈值，高于该值时将停止对BE Pod的驱逐。此字段开启 BECPUEvict 时必填。                  |
   | `cpuEvictBEUsageThresholdPercent`    | Int     | 0~100                                  | BE CPU利用率阈值，当BE Pod在CPU被压制范围内的利用率高于该值时，才会触发驱逐。此字段开启 BECPUEvict 时选填，默认值 90。 |
   | `cpuEvictTimeWindowSeconds`          | Int     | >=2                                    | CPU资源满足度和BE CPU利用率计算的时间窗口，单位为秒。此字段开启 BECPUEvict 时选填，默认值 1s。                |

2. 查看安装的命名空间下是否存在ConfigMap，以命名空间`koordinator-system`和ConfigMap名字`slo-controller-config`为例，具体以实际安装配置为准。

   - 若存在ConfigMap `slo-controller-config`，请使用PATCH方式进行更新，避免干扰ConfigMap中其他配置项。

     ```bash
     kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"
     ```

   - 若不存在ConfigMap `slo-controller-config`，请执行以下命令创建ConfigMap。

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
       koordinator.sh/qosClass: 'BE' #指定Pod的QoS级别为BE
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
     # 当 ColocationProfile 功能开启时（默认启用），priorityClassName 是必填的
     priorityClassName: koord-batch
   ```

4. 执行以下命令，将 be-pod-demo 部署到集群。

   ```bash
   $ kubectl apply -f be-pod-demo.yaml
   ```
   
5. 执行以下命令，查看 be-pod-demo 状态，等待 Pod 启动完成。

   ```bash
   $ kubectl get pod be-pod-demo
   NAME          READY   STATUS    RESTARTS   AGE
   be-pod-demo   1/1     Running   0          7s
   ```
   
6. 在节点执行以下命令，使用[stress工具](https://linux.die.net/man/1/stress)启动进程，
确保整机CPU资源用量被提升到驱逐水位以上，其中`--cpu`参数表示stress进程占用的CPU资源量10核，测试时可根据实际机型情况进行调整。

   ```bash
   $ stress --cpu 10 --vm 1
   ```
7. 观察 be-pod-demo 运行情况，可以发现 be-pod-demo 已经被驱逐，驱逐信息可以通过event查看到。

   ```bash
   $ kubectl get pod be-pod-demo
   Error from server (NotFound): pods "be-pod-demo" not found
   
   $ kubectl get event
   LAST SEEN   TYPE      REASON            OBJECT               MESSAGE
   44s         Normal    Killing           pod/be-pod-demo      Stopping container stress
   44s         Warning   evictPodSuccess   ${your-pod-object}   evict Pod:koordinator-system/be-pod-demo, reason: evicted, message: trigger by koordlet feature BECPUEvict, kill pod: be-pod-demo
   ```
### 用量

1. 使用以下ConfigMap，创建configmap.yaml文件
   ```yaml
   # ConfigMap slo-controller-config 样例。
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
     # 开启基于CPU用量的驱逐功能
     resource-threshold-config: |
       {
         "clusterStrategy": {
           "enable": true,
           "cpuEvictThresholdPercent": 60,
           "cpuEvictLowerPercent": 40,
           "evictEnabledPriorityThreshold": 5999  
         }
       }
   ```

   | 参数                              | 类型      | 取值范围                                   | 说明                                                                                     |
   |:--------------------------------|:--------|:---------------------------------------|:---------------------------------------------------------------------------------------|
   | `enable`                        | Boolean | true; false                            | true：集群全局开启策略。false（默认值）：集群全局关闭策略。                                                     |
   | `cpuEvictThresholdPercent`      | Int     | cpuEvictBESatisfactionLowerPercent~100 | CPU 资源用量的驱逐阈值，高于该值时将触发对相关 Pod 的驱逐。此字段开启 CPUEvict 时必填。                                  |
   | `cpuEvictLowerPercent`          | Int     | 0~100                                  | CPU 资源用量的安全阈值，低于等于该值时将停止对 Pod 的驱逐。此字段开启 CPUEvict 时选填，默认值 cpuEvictThresholdPercent - 2。 |
   | `evictEnabledPriorityThreshold` | Int     | /                                      | 可被驱逐的 pod 优先级上限。此字段开启 CPUEvict 时必填。                                                    |

2. 下发 ConfigMap slo-controller-config，同上。
3. 创建若干 BE pods 部署到集群，试图将节点水位达到 60% 以上，等待 pods 启动完成。
4. 观察 pods 运行情况，可以发现一些 pods 已经被驱逐，如果还存在 pods，说明物理水位已经达到了 40% 及以下，否则驱逐信息可以通过event查看到。

   ```bash
   $ kubectl get pod be-pod-demo
   Error from server (NotFound): pods "be-pod-demo" not found
   
   $ kubectl get event
   LAST SEEN   TYPE      REASON            OBJECT              MESSAGE
   44s         Normal    Killing           pod/be-pod-demo                     Stopping container stress
   44s         Warning   evictPodSuccess   ${your-pod-object}   evict Pod:koordinator-system/be-pod-demo, reason: evicted, message: trigger by koordlet feature CPUEvict, kill pod: be-pod-demo
   ```

### 已分配

1. 使用以下 ConfigMap，创建 configmap.yaml 文件
   ```yaml
   # ConfigMap slo-controller-config 样例。
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
     # 开启基于CPU已分配的驱逐功能
     resource-threshold-config: |
       {
         "clusterStrategy": {
           "enable": true,
           "cpuAllocatableEvictThresholdPercent": 110,
           "cpuAllocatableEvictLowerPercent": 100,
           "allocatableEvictPriorityThreshold": 5999
         }
       }
   ```

   | 参数                                    | 类型      | 取值范围                                | 说明                                                                |
   |:--------------------------------------|:--------|:------------------------------------|:------------------------------------------------------------------|
   | `enable`                              | Boolean | true; false                         | true：集群全局开启策略。false（默认值）：集群全局关闭策略。                                |
   | `cpuAllocatableEvictThresholdPercent` | Int     | cpuAllocatableEvictLowerPercent~100 | CPU 资源已分配的驱逐阈值，高于该值时将触发对相关 Pod 的驱逐。此字段开启 CPUAllocatableEvict 时必填。 |
   | `cpuAllocatableEvictLowerPercent`     | Int     | 0~100                               | CPU 资源已分配的安全阈值，低于等于该值时将停止对 Pod 的驱逐。此字段开启 CPUAllocatableEvict 时必填。 |
   | `allocatableEvictPriorityThreshold`   | Int     | /                                   | 可被驱逐的 pod 优先级上限。此字段开启 CPUAllocatableEvict 时必填。                    |

2. 下发 ConfigMap slo-controller-config，同上。
3. 创建若干 BE pods 部署到集群，等待 pods 启动完成。
4. 变更 slo-controller-config 插件，将 batch 账本置零。
   ```yaml
   # ConfigMap slo-controller-config 样例。
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
         "batchCPUThresholdPercent": 0,
         "batchMemoryThresholdPercent": 100
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
   44s         Warning   evictPodSuccess   ${your-pod-object}   evict Pod:koordinator-system/be-pod-demo, reason: evicted, message: trigger by koordlet feature CPUAllocatableEvict, kill pod: be-pod-demo
   ```
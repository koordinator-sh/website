# 在 Koordinator 中运行 PyTorchJob

本指南介绍如何在 Koordinator 中运行 PyTorchJob 工作负载，并集成队列管理和资源调度能力。

## 概述

Koordinator 通过 Koord-Queue 集成提供对 PyTorchJob 的原生支持。这使得：

- **作业级排队**：将整个 PyTorchJob 工作负载作为单元管理，而非单个 Pod
- **深度 ElasticQuota 集成**：利用 Koordinator 的资源配额系统实现公平共享和弹性分配
- **预调度**：在作业创建 Pod 之前进行排队，减少调度器压力
- **多租户隔离**：支持多个团队/项目的资源隔离
- **基于优先级的调度**：配置作业优先级以实现公平的资源分配

## 前置条件

在 Koordinator 中运行 PyTorchJob 之前，请确保您具备：

- Kubernetes 集群 >= 1.22
- 已安装 Koordinator >= 1.5
- 已安装并配置 Koord-Queue
- 已安装 PyTorchJob CRD（通常通过 [Training Operator](https://github.com/kubeflow/training-operator) 安装）

## 安装

### 1. 安装 Koord-Queue

如果尚未安装，使用 Helm 部署 Koord-Queue：

```bash
helm repo add koordinator-sh https://koordinator-sh.github.io/charts/
helm install koord-queue koordinator-sh/koord-queue --version 1.8.0 \
  --namespace koord-queue \
  --create-namespace
```

在 Helm values 中启用 PyTorchJob 扩展：

```yaml
# values.yaml
extension:
  pytorch:
    enable: true
```

使用自定义 values 安装：

```bash
helm install koord-queue koordinator-sh/koord-queue --version 1.8.0 \
  --namespace koord-queue \
  --create-namespace \
  -f values.yaml
```

### 2. 验证安装

```bash
# 检查 Deployments
kubectl get deployment -n koord-queue

# 验证 CRDs
kubectl get crd | grep -E "(queue|pytorchjob)"
```

## 配置

### 1. 创建 ElasticQuota

创建 ElasticQuota 来为 PyTorchJob 队列定义资源边界：

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: pytorch-team-a
  labels:
    koord-queue/queue-policy: Priority  # Priority、Block 或 Intelligent
spec:
  max:
    cpu: "100"
    memory: 200Gi
    nvidia.com/gpu: "8"
  min:
    cpu: "20"
    memory: 40Gi
    nvidia.com/gpu: "2"
```

应用配置：

```bash
kubectl apply -f elastic-quota.yaml
```

### 2. 创建队列（可选）

对于高级队列配置，创建 Queue CR：

```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: Queue
metadata:
  name: pytorch-training-queue
  namespace: koord-queue
spec:
  queuePolicy: Priority
  priority: 100
  # admissionChecks: []  # 可选：如需添加入准检查
```

应用队列：

```bash
kubectl apply -f queue.yaml
```

## 运行 PyTorchJob

### 基本 PyTorchJob 示例

创建一个简单的分布式 PyTorchJob：

```yaml
apiVersion: kubeflow.org/v1
kind: PyTorchJob
metadata:
  name: pytorch-training-job
  namespace: default
  annotations:
    # 可选：指定使用哪个队列（默认匹配 ElasticQuota 名称的队列）
    scheduling.x-k8s.io/queue: pytorch-team-a
    # 可选：设置队列中作业的优先级
    scheduling.x-k8s.io/priority: "10"
spec:
  pytorchReplicaSpecs:
    Master:
      replicas: 1
      restartPolicy: OnFailure
      template:
        spec:
          containers:
            - name: pytorch
              image: pytorch/pytorch:1.12.1-cuda11.3-cudnn8-runtime
              command:
                - "python"
                - "-m"
                - "torch.distributed.launch"
                - "--nproc_per_node=1"
                - "--nnodes=2"
                - "--node_rank=$(RANK)"
                - "--master_addr=$(MASTER_ADDR)"
                - "--master_port=$(MASTER_PORT)"
                - "train.py"
              resources:
                requests:
                  cpu: "4"
                  memory: 8Gi
                  nvidia.com/gpu: "1"
                limits:
                  cpu: "4"
                  memory: 8Gi
                  nvidia.com/gpu: "1"
              env:
                - name: RANK
                  valueFrom:
                    fieldRef:
                      fieldPath: metadata.annotations['kubeflow.org/rank']
                - name: MASTER_ADDR
                  valueFrom:
                    fieldRef:
                      fieldPath: metadata.annotations['kubeflow.org/master-address']
                - name: MASTER_PORT
                  value: "29500"
    Worker:
      replicas: 1
      restartPolicy: OnFailure
      template:
        spec:
          containers:
            - name: pytorch
              image: pytorch/pytorch:1.12.1-cuda11.3-cudnn8-runtime
              command:
                - "python"
                - "-m"
                - "torch.distributed.launch"
                - "--nproc_per_node=1"
                - "--nnodes=2"
                - "--node_rank=$(RANK)"
                - "--master_addr=$(MASTER_ADDR)"
                - "--master_port=$(MASTER_PORT)"
                - "train.py"
              resources:
                requests:
                  cpu: "4"
                  memory: 8Gi
                  nvidia.com/gpu: "1"
                limits:
                  cpu: "4"
                  memory: 8Gi
                  nvidia.com/gpu: "1"
              env:
                - name: RANK
                  valueFrom:
                    fieldRef:
                      fieldPath: metadata.annotations['kubeflow.org/rank']
                - name: MASTER_ADDR
                  valueFrom:
                    fieldRef:
                      fieldPath: metadata.annotations['kubeflow.org/master-address']
                - name: MASTER_PORT
                  value: "29500"
```

应用 PyTorchJob：

```bash
kubectl apply -f pytorchjob.yaml
```

### 工作原理

当您创建 PyTorchJob 时：

1. **自动创建 QueueUnit**：Koord-Queue Controllers 自动检测到新的 PyTorchJob 并创建对应的 `QueueUnit` 资源
2. **作业暂停**：PyTorchJob 使用 `scheduling.x-k8s.io/suspend: "true"` 注解自动暂停
3. **队列处理**：Queue Scheduler 根据队列策略、优先级和可用资源评估作业
4. **资源分配**：如果根据 ElasticQuota 资源可用，QueueUnit 转换为 `Dequeued` 状态
5. **作业执行**：Extension Server 移除暂停注解，允许 PyTorchJob 创建 Pod 并开始训练

## 高级配置

### 基于优先级的调度

通过在 PyTorchJob Pod 模板中设置优先级来配置作业优先级：

```yaml
apiVersion: kubeflow.org/v1
kind: PyTorchJob
metadata:
  name: high-priority-training
  namespace: default
spec:
  pytorchReplicaSpecs:
    Master:
      replicas: 1
      template:
        spec:
          priorityClassName: high-priority  # 使用 PriorityClass
          containers:
            - name: pytorch
              image: pytorch/pytorch:1.12.1-cuda11.3-cudnn8-runtime
              resources:
                requests:
                  cpu: "8"
                  memory: 16Gi
                  nvidia.com/gpu: "2"
```

### 资源配额集成

PyTorchJob 将自动遵守 ElasticQuota 限制。监控配额使用情况：

```bash
# 检查 ElasticQuota 状态
kubectl describe elasticquota pytorch-team-a

# 检查 QueueUnit 状态
kubectl get queueunit -n default
kubectl describe queueunit <queueunit-name>
```

### 队列策略

Koord-Queue 支持三种队列策略：

- **Priority**：优先级值更高的作业优先出队（默认）
- **Block**：严格资源阻塞 - 作业等待直到资源有保证
- **Intelligent**：双队列机制，具有可配置的优先级阈值

通过 ElasticQuota 标签配置：

```yaml
metadata:
  labels:
    koord-queue/queue-policy: Block  # 或 Priority、Intelligent
```

## 监控和故障排查

### 检查作业状态

```bash
# 检查 PyTorchJob 状态
kubectl get pytorchjob
kubectl describe pytorchjob <job-name>

# 检查 QueueUnit 状态
kubectl get queueunit
kubectl describe queueunit <queueunit-name>

# 检查 Pod 状态
kubectl get pods -l training.kubeflow.org/job-name=<job-name>
```

### 常见问题

1. **作业卡在暂停状态**：
   - 验证 ElasticQuota 是否有足够资源
   - 检查 QueueUnit 状态是否有准入检查失败
   - 检查队列策略设置

2. **资源分配失败**：
   - 检查 ElasticQuota min/max 限制是否正确配置
   - 验证集群是否有足够的 GPU 资源
   - 检查节点容量和污点

3. **队列未处理作业**：
   - 验证 koord-queue controllers 是否正在运行
   - 检查日志：`kubectl logs -n koord-queue deployment/koord-queue-controllers`

## 最佳实践

1. **使用优先级类**：为不同类型的训练工作负载定义 PriorityClass
2. **设置实际的资源请求**：准确估算 CPU、内存和 GPU 需求
3. **监控配额使用**：定期检查 ElasticQuota 使用情况以避免资源竞争
4. **使用 Gang 调度**：对于分布式训练，确保所有副本一起调度
5. **实施资源限制**：同时设置 requests 和 limits 以防止资源超卖

## 与其他 Koordinator 功能集成

Koordinator 中的 PyTorchJob 可以利用其他功能：

- **GPU 共享**：在多个作业间共享 GPU 资源
- **网络拓扑感知**：优化分布式训练的 Pod 放置
- **负载感知调度**：在训练工作负载期间平衡集群负载
- **抢占**：高优先级作业可以抢占低优先级作业

## 下一步

- 了解 [Koord-Queue](./queue-management.md) 进行高级队列管理
- 探索 [ElasticQuota](../architecture/resource-model.md) 进行资源管理
- 阅读 [Gang 调度](../designs/gang-scheduling.md) 了解分布式训练
- 查看 [Koordinator 架构](../architecture/overview.md) 获得全面理解

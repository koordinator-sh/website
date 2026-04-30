# Run PyTorchJob in Koordinator

This guide explains how to run PyTorchJob workloads in Koordinator with integrated queue management and resource scheduling capabilities.

## Overview

Koordinator provides native support for PyTorchJob through its Koord-Queue integration. This enables:

- **Job-level queuing**: Manage entire PyTorchJob workloads as units rather than individual pods
- **Deep ElasticQuota integration**: Leverage Koordinator's resource quota system for fair sharing and elastic allocation
- **Pre-scheduling**: Queue jobs before they create pods to reduce scheduler pressure
- **Multi-tenant isolation**: Support for multiple teams/projects with resource isolation
- **Priority-based scheduling**: Configure job priorities for fair resource allocation

## Prerequisites

Before running PyTorchJob in Koordinator, ensure you have:

- Kubernetes cluster >= 1.22
- Koordinator >= 1.5 installed
- Koord-Queue installed and configured
- PyTorchJob V1 CRDs installed (typically via [Training Operator V1](https://www.kubeflow.org/docs/components/trainer/legacy-v1/installation/))

## Installation

### 1. Install Koord-Queue

If not already installed, deploy Koord-Queue using Helm:

```bash
helm repo add koordinator-sh https://koordinator-sh.github.io/charts/
helm install koord-queue koordinator-sh/koord-queue --version 1.8.0 \
  --namespace koord-queue \
  --create-namespace
```

Enable PyTorchJob extension in the Helm values:

```yaml
# values.yaml
extension:
  pytorch:
    enable: true
```

Install with custom values:

```bash
helm install koord-queue koordinator-sh/koord-queue --version 1.8.0 \
  --namespace koord-queue \
  --create-namespace \
  -f values.yaml
```

### 2. Verify Installation

```bash
# Check deployments
kubectl get deployment -n koord-queue

# Verify CRDs
kubectl get crd | grep -E "(queue|pytorchjob)"
```

## Configuration

### 1. Create an ElasticQuota

Create an ElasticQuota to define resource boundaries for your PyTorchJob queue:

```yaml
apiVersion: scheduling.sigs.k8s.io/v1alpha1
kind: ElasticQuota
metadata:
  name: pytorch-team-a
  labels:
    koord-queue/queue-policy: Priority  # Priority, Block, or Intelligent
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

Apply the configuration:

```bash
kubectl apply -f elastic-quota.yaml
```

### 2. Create a Queue (Optional)

For advanced queue configuration, create a Queue CR:

```yaml
apiVersion: scheduling.x-k8s.io/v1alpha1
kind: Queue
metadata:
  name: pytorch-training-queue
  namespace: koord-queue
spec:
  queuePolicy: Priority
  priority: 100
  # admissionChecks: []  # Optional: add admission checks if needed
```

Apply the queue:

```bash
kubectl apply -f queue.yaml
```

## Running PyTorchJob

### Basic PyTorchJob Example

Create a simple distributed PyTorchJob:

```yaml
apiVersion: kubeflow.org/v1
kind: PyTorchJob
metadata:
  name: pytorch-training-job
  namespace: default
  annotations:
    # Optional: specify which queue to use (defaults to queue matching ElasticQuota name)
    scheduling.x-k8s.io/queue: pytorch-team-a
    # Optional: set job priority within the queue
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

Apply the PyTorchJob:

```bash
kubectl apply -f pytorchjob.yaml
```

### How It Works

When you create a PyTorchJob:

1. **Automatic QueueUnit Creation**: Koord-Queue Controllers automatically detect the new PyTorchJob and create a corresponding `QueueUnit` resource
2. **Job Suspension**: The PyTorchJob is automatically suspended using the `scheduling.x-k8s.io/suspend: "true"` annotation
3. **Queue Processing**: The Queue Scheduler evaluates the job based on queue policy, priority, and available resources
4. **Resource Allocation**: If resources are available according to the ElasticQuota, the QueueUnit transitions to `Dequeued` state
5. **Job Execution**: The Extension Server removes the suspend annotation, allowing the PyTorchJob to create pods and start training

## Advanced Configuration

### Priority-Based Scheduling

Configure job priority by setting the priority in the PyTorchJob pod template:

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
          priorityClassName: high-priority  # Use a PriorityClass
          containers:
            - name: pytorch
              image: pytorch/pytorch:1.12.1-cuda11.3-cudnn8-runtime
              resources:
                requests:
                  cpu: "8"
                  memory: 16Gi
                  nvidia.com/gpu: "2"
```

### Resource Quota Integration

The PyTorchJob will automatically respect the ElasticQuota limits. Monitor quota usage:

```bash
# Check ElasticQuota status
kubectl describe elasticquota pytorch-team-a

# Check QueueUnit status
kubectl get queueunit -n default
kubectl describe queueunit <queueunit-name>
```

### Queue Policies

Koord-Queue supports three queue policies:

- **Priority**: Jobs with higher priority values are dequeued first (default)
- **Block**: Strict resource blocking - jobs wait until resources are guaranteed
- **Intelligent**: Dual-queue mechanism with configurable priority threshold

Configure via ElasticQuota labels:

```yaml
metadata:
  labels:
    koord-queue/queue-policy: Block  # or Priority, Intelligent
```

## Monitoring and Troubleshooting

### Check Job Status

```bash
# Check PyTorchJob status
kubectl get pytorchjob
kubectl describe pytorchjob <job-name>

# Check QueueUnit status
kubectl get queueunit
kubectl describe queueunit <queueunit-name>

# Check pod status
kubectl get pods -l training.kubeflow.org/job-name=<job-name>
```

### Common Issues

1. **Job stuck in suspended state**: 
   - Verify ElasticQuota has sufficient resources
   - Check QueueUnit status for admission check failures
   - Review queue policy settings

2. **Resource allocation failures**:
   - Check if ElasticQuota min/max limits are properly configured
   - Verify cluster has sufficient GPU resources
   - Review node capacity and taints

3. **Queue not processing jobs**:
   - Verify koord-queue controllers are running
   - Check logs: `kubectl logs -n koord-queue deployment/koord-queue-controllers`

## Best Practices

1. **Use Priority Classes**: Define PriorityClasses for different training workload types
2. **Set Realistic Resource Requests**: Accurately estimate CPU, memory, and GPU requirements
3. **Monitor Quota Usage**: Regularly check ElasticQuota usage to avoid resource contention
4. **Use Gang Scheduling**: For distributed training, ensure all replicas are scheduled together
5. **Implement Resource Limits**: Set both requests and limits to prevent resource overcommitment

## Integration with Other Koordinator Features

PyTorchJob in Koordinator can leverage additional features:

- **GPU Share**: Share GPU resources across multiple jobs
- **Network Topology Awareness**: Optimize pod placement for distributed training
- **Load-Aware Scheduling**: Balance cluster load during training workloads
- **Preemption**: Higher priority jobs can preempt lower priority ones

## Next Steps

- Learn about [Koord-Queue](./queue-management.md) for advanced queue management
- Explore [ElasticQuota](../architecture/resource-model.md) for resource management
- Read about [Gang Scheduling](../designs/gang-scheduling.md) for distributed training
- Check [Koordinator Architecture](../architecture/overview.md) for comprehensive understanding
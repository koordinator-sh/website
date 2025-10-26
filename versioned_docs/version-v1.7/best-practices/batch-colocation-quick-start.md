---
sidebar_position: 7
---

# Batch Workload Colocation Quick Start Guide

This guide helps community newcomers quickly understand and deploy Koordinator for batch workload colocation. We'll cover core concepts, deployment process, and important considerations in an easy-to-understand way.

## What is Batch Colocation?

Batch colocation is a technique that allows running batch processing workloads (like data analysis, machine learning training, offline jobs) alongside latency-sensitive applications (like web services, microservices) on the same Kubernetes cluster. By utilizing idle resources from online services, you can significantly improve cluster resource utilization while maintaining service quality.

### Why Batch Colocation?

In a typical Kubernetes cluster:
- **Online services** request resources (CPU, memory) based on peak traffic, but actual usage is often much lower
- **Idle resources** are allocated but unused most of the time
- **Cluster utilization** is typically low (20-40%)

Koordinator enables you to:
- **Reclaim** idle resources from online services
- **Run batch jobs** using these reclaimed resources
- **Improve utilization** to 50-80% while maintaining service quality

## Core Concepts

### 1. QoS Classes

Koordinator defines five QoS (Quality of Service) classes for different workload types:

| QoS Class | Use Case | Resource Guarantee | Typical Workload |
|-----------|----------|-------------------|------------------|
| **SYSTEM** | System services | Limited but guaranteed | DaemonSets, system processes |
| **LSE** | Exclusive latency-sensitive | Reserved, isolated | Middleware (rarely used) |
| **LSR** | Reserved latency-sensitive | CPU cores reserved | Critical online services |
| **LS** | Shared latency-sensitive | Shared with burst capability | Typical microservices |
| **BE** | Best Effort | No guarantee, can be throttled/evicted | **Batch jobs** ⭐ |

For batch workloads, you'll primarily use **BE (Best Effort)** QoS class.

### 2. Priority Classes

Koordinator extends Kubernetes PriorityClass with four levels:

| PriorityClass | Priority Range | Description | Use for Batch? |
|---------------|----------------|-------------|----------------|
| `koord-prod` | [9000, 9999] | Production, guaranteed quota | ❌ No |
| `koord-mid` | [7000, 7999] | Medium priority, guaranteed quota | ❌ No |
| `koord-batch` | [5000, 5999] | Batch workloads, allows borrowing | ✅ **Yes** |
| `koord-free` | [3000, 3999] | Free resources, no guarantee | ✅ Optional |

For most batch workloads, use **`koord-batch`** priority class.

### 3. Resource Model

Koordinator's colocation model works as follows:

![Resource Model](/img/resource-model.png)

- **Limit**: Resources requested by high-priority pods (LS/LSR)
- **Usage**: Actual resources used (varies over time)
- **Reclaimable**: Resources between usage and limit - available for BE pods
- **BE Pods**: Run using reclaimable resources

**Key Point**: Batch jobs (BE) use idle resources that would otherwise be wasted, without affecting online service performance.

### 4. Resource Types

Koordinator introduces special resource types for batch workloads:

| Resource Type | Description | Use in Pod Spec |
|---------------|-------------|-----------------|
| `kubernetes.io/batch-cpu` | CPU for batch workloads | ✅ Required |
| `kubernetes.io/batch-memory` | Memory for batch workloads | ✅ Required |

These resources are allocated from the cluster's reclaimable pool.

## Prerequisites

Before getting started, ensure you have:

1. **Kubernetes cluster** (version >= 1.18)
2. **kubectl** configured to access your cluster
3. **Helm** (version >= 3.5) - [Install Helm](https://helm.sh/docs/intro/install/)
4. (Recommended) **Linux kernel** version >= 4.19 for best performance

## Installation

### Step 1: Install Koordinator

Add the Koordinator Helm repository:

```bash
helm repo add koordinator-sh https://koordinator-sh.github.io/charts/
helm repo update
```

Install Koordinator (latest stable version):

```bash
helm install koordinator koordinator-sh/koordinator --version 1.6.0
```

Verify the installation:

```bash
kubectl get pod -n koordinator-system
```

Expected output (all pods should be Running):

```
NAME                                  READY   STATUS    RESTARTS   AGE
koord-descheduler-xxx                 1/1     Running   0          2m
koord-manager-xxx                     1/1     Running   0          2m
koord-manager-xxx                     1/1     Running   0          2m
koord-scheduler-xxx                   1/1     Running   0          2m
koord-scheduler-xxx                   1/1     Running   0          2m
koordlet-xxx                          1/1     Running   0          2m
koordlet-xxx                          1/1     Running   0          2m
```

### Step 2: Verify Priority Classes

Check that Koordinator PriorityClasses are created:

```bash
kubectl get priorityclass | grep koord
```

Expected output:

```
koord-batch         5000        false        10m
koord-free          3000        false        10m
koord-mid           7000        false        10m
koord-prod          9000        false        10m
```

## Running Your First Batch Workload

### Method 1: Using ClusterColocationProfile (Recommended)

ClusterColocationProfile automatically injects colocation configurations into pods based on labels. This is the easiest way for batch workloads.

#### Step 1: Create a Namespace

```bash
kubectl create namespace batch-demo
kubectl label namespace batch-demo koordinator.sh/enable-colocation=true
```

#### Step 2: Create ClusterColocationProfile

Create `batch-colocation-profile.yaml`:

```yaml
apiVersion: config.koordinator.sh/v1alpha1
kind: ClusterColocationProfile
metadata:
  name: batch-workload-profile
spec:
  # Match namespace with label
  namespaceSelector:
    matchLabels:
      koordinator.sh/enable-colocation: "true"
  # Match pods with label
  selector:
    matchLabels:
      app-type: batch
  # Set QoS to BE for batch workloads
  qosClass: BE
  # Set priority class
  priorityClassName: koord-batch
  # Use Koordinator scheduler
  schedulerName: koord-scheduler
  # Add labels for tracking
  labels:
    koordinator.sh/mutated: "true"
```

Apply the profile:

```bash
kubectl apply -f batch-colocation-profile.yaml
```

#### Step 3: Create a Batch Job

Create `batch-job.yaml`:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: data-processing-job
  namespace: batch-demo
spec:
  completions: 1
  template:
    metadata:
      labels:
        app-type: batch  # This label triggers the profile
    spec:
      containers:
      - name: worker
        image: python:3.9
        command: 
          - python
          - -c
          - |
            import time
            import random
            print("Starting data processing...")
            for i in range(60):
              # Simulate data processing
              time.sleep(1)
              print(f"Processing batch {i+1}/60...")
            print("Job completed!")
        resources:
          requests:
            cpu: "2"           # Will be converted to batch-cpu
            memory: "4Gi"      # Will be converted to batch-memory
          limits:
            cpu: "2"
            memory: "4Gi"
      restartPolicy: Never
```

Apply the job:

```bash
kubectl apply -f batch-job.yaml
```

#### Step 4: Verify the Configuration

Check that the pod has been configured correctly:

```bash
kubectl get pod -n batch-demo -l app-type=batch -o yaml
```

You should see the colocation configurations automatically injected:

```yaml
metadata:
  labels:
    koordinator.sh/qosClass: BE         # ✅ QoS injected
    koordinator.sh/mutated: "true"      # ✅ Profile applied
spec:
  priorityClassName: koord-batch        # ✅ Priority set
  schedulerName: koord-scheduler        # ✅ Using Koordinator scheduler
  containers:
  - name: worker
    resources:
      limits:
        kubernetes.io/batch-cpu: "2000"      # ✅ Converted to batch resources
        kubernetes.io/batch-memory: "4Gi"
      requests:
        kubernetes.io/batch-cpu: "2000"
        kubernetes.io/batch-memory: "4Gi"
```

### Method 2: Manual Configuration

If you prefer explicit configuration without ClusterColocationProfile:

Create `manual-batch-job.yaml`:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: manual-batch-job
  namespace: batch-demo
spec:
  completions: 1
  template:
    metadata:
      labels:
        koordinator.sh/qosClass: BE  # Explicitly set QoS
    spec:
      priorityClassName: koord-batch  # Explicitly set priority
      schedulerName: koord-scheduler  # Use Koordinator scheduler
      containers:
      - name: worker
        image: python:3.9
        command: ["python", "-c", "print('Hello from batch job'); import time; time.sleep(30)"]
        resources:
          requests:
            kubernetes.io/batch-cpu: "1000"     # Use batch resources
            kubernetes.io/batch-memory: "2Gi"
          limits:
            kubernetes.io/batch-cpu: "1000"
            kubernetes.io/batch-memory: "2Gi"
      restartPolicy: Never
```

Apply the job:

```bash
kubectl apply -f manual-batch-job.yaml
```

## Monitoring and Verification

### Check Node Resources

View node resource allocation:

```bash
kubectl get node -o yaml | grep -A 10 "allocatable:"
```

You should see batch resources available:

```yaml
allocatable:
  cpu: "8"
  memory: "16Gi"
  kubernetes.io/batch-cpu: "15000"      # Batch CPU available
  kubernetes.io/batch-memory: "20Gi"    # Batch memory available
```

### Monitor Resource Usage

Check actual resource usage:

```bash
kubectl top nodes
kubectl top pods -n batch-demo
```

### Check Node Metrics

Koordinator creates NodeMetric resources with detailed metrics:

```bash
kubectl get nodemetric -o yaml
```

This shows real-time resource usage, helping Koordinator make scheduling decisions.

## Important Considerations

### 1. Resource Limits

**DO:**
- ✅ Always set both `requests` and `limits` for batch workloads
- ✅ Use realistic resource estimates
- ✅ Set `requests == limits` for predictable behavior

**DON'T:**
- ❌ Don't over-request resources you don't need
- ❌ Don't omit resource specifications

### 2. QoS Guarantees

Understand the BE QoS behavior:

- **CPU**: BE pods get remaining CPU cycles; may be throttled when LS pods need resources
- **Memory**: BE pods can be evicted if memory pressure occurs
- **Priority**: BE pods are scheduled after higher-priority pods

### 3. Workload Suitability

**Good for Batch Colocation:**
- ✅ Data processing jobs
- ✅ Machine learning training
- ✅ Batch analytics
- ✅ Video transcoding
- ✅ Log processing
- ✅ ETL jobs

**Not Suitable:**
- ❌ Latency-sensitive services
- ❌ Real-time processing
- ❌ Jobs requiring guaranteed completion time
- ❌ Stateful services with strict SLA

### 4. Failure Handling

Batch jobs may be:
- **Throttled**: When high-priority pods need CPU
- **Evicted**: During memory pressure

Design your batch workloads to handle:
- Checkpointing: Save progress periodically
- Retry logic: Use Job `backoffLimit` and `restartPolicy`
- Idempotency: Ensure jobs can safely restart

Example with retry:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: resilient-batch-job
  namespace: batch-demo
spec:
  backoffLimit: 3          # Retry up to 3 times
  completions: 1
  template:
    metadata:
      labels:
        app-type: batch
    spec:
      restartPolicy: OnFailure  # Retry on failure
      containers:
      - name: worker
        image: your-batch-image
        # ... rest of configuration
```

### 5. Scheduler Configuration

For batch workloads, ensure you're using the Koordinator scheduler:

```yaml
spec:
  schedulerName: koord-scheduler  # Required for batch resource scheduling
```

Without this, the pod will use the default Kubernetes scheduler and won't benefit from colocation features.

### 6. Namespace Isolation (Optional)

For better organization, dedicate namespaces to batch workloads:

```bash
# Create batch namespace
kubectl create namespace batch-workloads

# Label for colocation
kubectl label namespace batch-workloads koordinator.sh/enable-colocation=true

# Create profile for this namespace
kubectl apply -f batch-colocation-profile.yaml
```

## Common Patterns

### Pattern 1: Data Processing Pipeline

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: data-pipeline
  namespace: batch-demo
spec:
  completions: 5          # Process 5 batches
  parallelism: 2          # Run 2 at a time
  template:
    metadata:
      labels:
        app-type: batch
    spec:
      containers:
      - name: processor
        image: data-processor:latest
        resources:
          requests:
            cpu: "4"
            memory: "8Gi"
          limits:
            cpu: "4"
            memory: "8Gi"
      restartPolicy: OnFailure
```

### Pattern 2: CronJob for Scheduled Batch

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-report
  namespace: batch-demo
spec:
  schedule: "0 2 * * *"   # Run at 2 AM daily
  jobTemplate:
    spec:
      template:
        metadata:
          labels:
            app-type: batch
        spec:
          containers:
          - name: report-generator
            image: report-gen:latest
            resources:
              requests:
                cpu: "2"
                memory: "4Gi"
              limits:
                cpu: "2"
                memory: "4Gi"
          restartPolicy: OnFailure
```

## Troubleshooting

### Issue 1: Pod Stuck in Pending

**Symptom**: Batch pod remains in Pending state

**Check**:
```bash
kubectl describe pod <pod-name> -n batch-demo
```

**Common causes**:
- Insufficient batch resources available
- Node selector constraints
- Resource requests too high

**Solution**: Check node allocatable resources and reduce requests if needed.

### Issue 2: Pod Evicted Frequently

**Symptom**: Batch pods are evicted often

**Check**:
```bash
kubectl get events -n batch-demo --sort-by='.lastTimestamp'
```

**Common causes**:
- Memory pressure on nodes
- High-priority pods need resources
- Resource overcommitment too aggressive

**Solution**: 
- Reduce memory requests
- Use checkpointing to handle evictions
- Tune Koordinator resource reservation settings (advanced)

### Issue 3: Batch Resources Not Available

**Symptom**: No `kubernetes.io/batch-cpu` resources on nodes

**Check**:
```bash
kubectl get nodemetric -o yaml
kubectl get pod -n koordinator-system
```

**Solution**:
- Ensure Koordlet is running on all nodes
- Check Koordlet logs: `kubectl logs -n koordinator-system koordlet-xxx`
- Verify nodes have allocatable resources

## Next Steps

After successfully running batch workloads, you can explore:

1. **Advanced Scheduling**:
   - [Load-aware Scheduling](../user-manuals/load-aware-scheduling) - Schedule based on real-time load
   - [Gang Scheduling](../user-manuals/gang-scheduling) - All-or-nothing scheduling for distributed jobs

2. **Resource Management**:
   - [CPU QoS](../user-manuals/cpu-qos) - Fine-tune CPU guarantees
   - [Memory QoS](../user-manuals/memory-qos) - Control memory behavior
   - [Resource Reservation](../user-manuals/resource-reservation) - Reserve resources for specific workloads

3. **Monitoring**:
   - [SLO Config](../user-manuals/slo-config) - Configure SLO parameters
   - [Performance Collector](../user-manuals/performance-collector) - Collect performance metrics

4. **Other Batch Frameworks**:
   - [Colocation of Spark Jobs](./colocation-of-spark-jobs)
   - [Colocation of Hadoop YARN](./colocation-of-hadoop-yarn)

## Summary

In this guide, you learned:

- ✅ Core concepts: QoS classes, Priority, Resource Model
- ✅ How to install Koordinator
- ✅ Two methods to run batch workloads (ClusterColocationProfile and manual)
- ✅ Important considerations for production use
- ✅ Common patterns and troubleshooting

**Key Takeaways**:
- Use **BE QoS** and **koord-batch priority** for batch workloads
- Leverage **ClusterColocationProfile** for easy configuration
- Design for **eviction and throttling** with retries and checkpointing
- Monitor resource usage and adjust as needed

Start small with simple batch jobs and gradually increase complexity as you become familiar with Koordinator's behavior!

## References

- [Architecture: Resource Model](../architecture/resource-model)
- [Architecture: QoS](../architecture/qos)
- [Architecture: Priority](../architecture/priority)
- [User Manual: Colocation Profile](../user-manuals/colocation-profile)
- [Installation Guide](../installation)

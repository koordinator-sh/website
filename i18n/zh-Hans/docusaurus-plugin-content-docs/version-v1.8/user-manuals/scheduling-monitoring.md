# 调度监控

## 简介

Koordinator 提供了用于监控 koord-scheduler 调度性能的 Grafana 仪表盘。该仪表盘帮助您观察关键调度指标，如队列状态、调度延迟、调度结果、抢占、Gang 调度等。

仪表盘 JSON 文件维护在 Koordinator 仓库的 [`dashboards/scheduling.json`](https://github.com/koordinator-sh/koordinator/blob/main/dashboards/scheduling.json)。

## 前置条件

- Koordinator >= 1.8
- 已部署 [Prometheus](https://prometheus.io/) 并配置为采集 koord-scheduler 指标
- 已部署 [Grafana](https://grafana.com/) >= 9.0.0 并连接到 Prometheus 数据源

## 启用指标采集

要启用 Prometheus 采集 koord-scheduler 指标，需要为 koord-scheduler 启用 PodMonitor。可以在安装或升级 Koordinator Helm chart 时设置 `scheduler.monitorEnabled=true`：

```bash
# 安装时启用 PodMonitor
$ helm install koordinator koordinator-sh/koordinator --version 1.8.0 \
  --set scheduler.monitorEnabled=true

# 或升级现有安装
$ helm upgrade koordinator koordinator-sh/koordinator --version 1.8.0 \
  --set scheduler.monitorEnabled=true
```

这会创建一个 [PodMonitor](https://prometheus-operator.dev/docs/api-reference/api/#monitoring.coreos.com/v1.PodMonitor) 资源，告诉 Prometheus Operator 采集 koord-scheduler Pod 上端口 `10251`（默认）的 `/metrics` 端点。

> **注意**：PodMonitor 需要集群中安装了 [Prometheus Operator](https://prometheus-operator.dev/)。如果使用的是不带 Operator 的独立 Prometheus，则需要手动配置 Prometheus 来采集 koord-scheduler 的指标端点。

## 导入仪表盘

### 步骤 1：下载仪表盘 JSON 文件

从 Koordinator 仓库下载调度仪表盘 JSON 文件：

```bash
wget https://raw.githubusercontent.com/koordinator-sh/koordinator/main/dashboards/scheduling.json
```

### 步骤 2：导入到 Grafana

1. 在浏览器中打开 Grafana。
2. 导航到 **Dashboards** → **Import**（或点击左侧栏的 **+** 图标并选择 **Import**）。
3. 点击 **Upload JSON file** 并选择下载的 `scheduling.json` 文件。
4. 选择采集 koord-scheduler 指标的 Prometheus 数据源。
5. 点击 **Import**。

### 步骤 3：配置变量

导入后，仪表盘提供以下模板变量：

| 变量 | 描述 | 默认值 |
|----------|-------------|---------|
| `datasource` | 要查询的 Prometheus 数据源 | 自动检测 |
| `job` | koord-scheduler 的 Prometheus job 标签 | `koord-scheduler` |

在仪表盘顶部调整这些变量以匹配您的环境。

## 仪表盘面板

调度仪表盘包含以下部分：

### Basic Summary（基础概览）

调度器健康状况和吞吐量概览：

- **Queue Growth Rate**：调度队列增长速率（入队速率减去出队速率）。
- **Active Queue Pending Pods**：当前在活跃队列中等待的 Pod 数量。
- **Avg Scheduled Latency**：成功调度的 Pod 的平均端到端调度延迟。
- **Slow Scheduling (Timeout)**：调度超时的次数。
- **Enqueue QPS / Dequeue QPS**：队列吞吐量指标。
- **Process CPU / Memory Usage**：调度器进程的资源消耗。

![Basic Summary](/img/scheduler-basic-summary.jpg)

### Scheduler Summary（调度器概览）

详细的调度管道指标：

- **Scheduling Queue Pending Pods**：在活跃、退避和不可调度队列中等待的 Pod。
- **Unschedulable Pods by Plugin**：哪些调度器插件导致 Pod 不可调度。
- **Active Queue Incoming Pods Rate**：Pod 进入活跃队列的速率，按事件类型细分。
- **Backoff Queue Signal Rate**：退避队列中的重试信号速率。
- **Scheduling Result Rate**：调度尝试的成功与失败比率。
- **Scheduling Attempts by Result**：按结果分类的调度尝试次数。

![Scheduler Summary 1](/img/scheduler-summary-1.jpg)

![Scheduler Summary 2](/img/scheduler-summary-2.jpg)

### Algorithm Summary（算法概览）

调度算法性能：

- **Filter / Score / Preemption Latency**：关键调度阶段的延迟分布。
- **Plugin Execution Time**：各调度器插件的执行时间。

![Algorithm Summary](/img/algorithm-summary.jpg)

### ElasticQuota Summary（弹性配额概览）

弹性配额调度指标：

- **ElasticQuota Usage**：弹性配额组中的资源使用量与配额限制。

![ElasticQuota Summary](/img/scheduler_elasticquota.jpg)

### Transformer & Extension Summary（转换器和扩展概览）

调度器扩展和转换器指标：

- **Transformer Extension**：与调度器转换器扩展相关的指标。
- **Client-Go Summary**：调度器的 client-go 工作队列和请求指标。

![Transformer Extension Summary](/img/transformer-extension_summary.jpg)

![Client-Go Summary](/img/scheduler_clientgo_summary.jpg)

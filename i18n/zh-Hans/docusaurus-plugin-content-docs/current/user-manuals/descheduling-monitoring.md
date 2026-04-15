# 重调度监控

## 简介

Koordinator 提供了用于监控 koord-descheduler 重调度（驱逐）活动的 Grafana 仪表盘。该仪表盘帮助您观察关键重调度指标，如驱逐计数、成功/失败率、驱逐策略以及按节点/命名空间的细分。

仪表盘 JSON 文件维护在 Koordinator 仓库的 [`dashboards/descheduling.json`](https://github.com/koordinator-sh/koordinator/blob/main/dashboards/descheduling.json)。

## 前置条件

- Koordinator >= 1.8
- 已部署 [Prometheus](https://prometheus.io/) 并配置为采集 koord-descheduler 指标
- 已部署 [Grafana](https://grafana.com/) >= 9.0.0 并连接到 Prometheus 数据源

## 启用指标采集

要启用 Prometheus 采集 koord-descheduler 指标，需要为 koord-descheduler 启用 PodMonitor。可以在安装或升级 Koordinator Helm chart 时设置 `descheduler.monitorEnabled=true`：

```bash
# 安装时启用 PodMonitor
$ helm install koordinator koordinator-sh/koordinator --version 1.8.0 \
  --set descheduler.monitorEnabled=true

# 或升级现有安装
$ helm upgrade koordinator koordinator-sh/koordinator --version 1.8.0 \
  --set descheduler.monitorEnabled=true
```

这会创建一个 [PodMonitor](https://prometheus-operator.dev/docs/api-reference/api/#monitoring.coreos.com/v1.PodMonitor) 资源，告诉 Prometheus Operator 采集 koord-descheduler Pod 上端口 `10251`（默认）的 `/metrics` 端点。

> **注意**：PodMonitor 需要集群中安装了 [Prometheus Operator](https://prometheus-operator.dev/)。如果使用的是不带 Operator 的独立 Prometheus，则需要手动配置 Prometheus 来采集 koord-descheduler 的指标端点。

## 导入仪表盘

### 步骤 1：下载仪表盘 JSON 文件

从 Koordinator 仓库下载重调度仪表盘 JSON 文件：

```bash
wget https://raw.githubusercontent.com/koordinator-sh/koordinator/main/dashboards/descheduling.json
```

### 步骤 2：导入到 Grafana

1. 在浏览器中打开 Grafana。
2. 导航到 **Dashboards** → **Import**（或点击左侧栏的 **+** 图标并选择 **Import**）。
3. 点击 **Upload JSON file** 并选择下载的 `descheduling.json` 文件。
4. 选择采集 koord-descheduler 指标的 Prometheus 数据源。
5. 点击 **Import**。

### 步骤 3：配置变量

导入后，仪表盘提供以下模板变量：

| 变量 | 描述 | 默认值 |
|----------|-------------|---------|
| `datasource` | 要查询的 Prometheus 数据源 | 自动检测 |
| `job` | koord-descheduler 的 Prometheus job 标签 | `koord-descheduler` |

在仪表盘顶部调整这些变量以匹配您的环境。

## 仪表盘面板

重调度仪表盘包含以下部分：

### Eviction Overview（驱逐概览）

高级驱逐统计信息：

- **Total Evictions (All Time)**：累计驱逐尝试次数。
- **Successful Evictions (All Time)**：成功驱逐总数。
- **Failed Evictions (All Time)**：失败驱逐总数。
- **Current Eviction Rate**：当前每秒驱逐速率。

![Eviction Overview](/img/descheduler_eviction_overview.jpg)

### Eviction Rate（驱逐速率）

驱逐速率随时间的趋势：

- **Eviction Rate by Result**：按成功/错误细分的驱逐速率。
- **Eviction Rate by Strategy**：按重调度策略分类的驱逐速率（如 LowNodeLoad、MigrationController）。
- **Eviction Rate by Node (Top 10)**：驱逐速率最高的前 10 个节点。
- **Eviction Rate by Namespace (Top 10)**：驱逐速率最高的前 10 个命名空间。

![Eviction Rate](/img/descheduler_eviction_rate.jpg)

### Eviction Breakdown（驱逐细分）

详细的驱逐分布：

- **Evictions by Strategy (Pie Chart)**：按重调度策略的驱逐比例分布。
- **Evictions by Reason (Pie Chart)**：按原因的驱逐比例分布。
- **Eviction Table**：显示驱逐详情的表格，包含策略、命名空间、节点、结果和原因。

![Eviction Breakdown](/img/descheduler_eviction_break_down.jpg)

### Eviction Detail（驱逐详情）

用于故障排查的详细驱逐信息：

- **Recent Evictions**：近期驱逐事件的时序视图。
- **Eviction Latency**：驱逐处理时间分布。

![Eviction Detail](/img/descheduler_eviction_detail.jpg)

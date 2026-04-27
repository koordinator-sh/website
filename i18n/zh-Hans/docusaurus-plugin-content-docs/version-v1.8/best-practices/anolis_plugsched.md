---
sidebar_position: 2
---

# Anolis Plugsched

为了提升CentOS 7.9操作系统内核在CPU资源维度的混部效果，龙蜥社区提供了一种插件化的解决方案，即利用 plugsched 调度器热升级技术提供一种 CPU 混部技术的调度器插件包。该插件可直接安装到 CentOS 7.9，不需要停机和业务迁移等工作。了解更多信息，请参阅[Blog](https://koordinator.sh/blog/anolis-CPU-Co-location)

## Prerequisites

- Kernel: 必须使用官方CentOS 7.9的内核。
- version == 3.10.0
- release >= 1160.81.1

## 使用 Plugsched

### 安装插件

  ```
  # rpm -ivh https://github.com/koordinator-sh/koordinator/releases/download/v1.1.1/scheduler-bvt-noise-clean-$(uname -r).rpm
  ```

如果你更新内核版本，你可以使用如下命令安装新的插件。

  ```
  # rpm -ivh https://github.com/koordinator-sh/koordinator/releases/download/v1.1.1/scheduler-bvt-noise-clean-$(uname -r).rpm --oldpackage
  ```

安装完成后，你可以在cpu cgroup目录下看到 `cpu.bvt_warp_ns` ，其使用方法与Group Identity特性兼容。

### 移除插件

移除插件可以使用 `rpm -e` 命令，然后 `cpu.bvt_warp_ns` 将也不再存在。请确保卸载插件前没有任何任务还在使用 `cpu.bvt_warp_ns` 。

## 使用Koordinator的CPU QoS功能

请参阅对应的[用户文档](../user-manuals/cpu-qos.md)。
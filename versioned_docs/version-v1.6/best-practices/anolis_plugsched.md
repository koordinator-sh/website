---
sidebar_position: 2
---

# Anolis Plugsched

In order to improve the colocation effect on CentOS 7.9 operating system kernel in the CPU resource dimension, Anolis community provides a plug-in solution, which is to use the plugsched to provide a scheduler plug-in package for CPU colocation technology. This plug-in can be directly installed on CentOS 7.9 without downtime and business migration. For more details about plugsched, please refer to the [Blog](https://koordinator.sh/blog/anolis-CPU-Co-location).

## Prerequisites

- Kernel: The kernel must be the official CentOS 7.9 kernel.
- version == 3.10.0
- release >= 1160.81.1

## Use Plugsched

### Install the plug-in

  ```
  # rpm -ivh https://github.com/koordinator-sh/koordinator/releases/download/v1.1.1/scheduler-bvt-noise-clean-$(uname -r).rpm
  ```

If you update the kernel version, you can use the following command to install the new plug-in.
  ```
  # rpm -ivh https://github.com/koordinator-sh/koordinator/releases/download/v1.1.1/scheduler-bvt-noise-clean-$(uname -r).rpm --oldpackage
  ```

After installation, you can see the `cpu.bvt_warp_ns` in cpu cgroup directory and the usage of it is compatible with Group Identity.

### Removing plug-in

Removing the plug-in can use the `rpm -e` command and the `cpu.bvt_warp_ns` doesn't exist either. Please make sure that no tasks are still using `cpu.bvt_warp_ns` before uninstalling.

## Use Koordinator CPU QoS feature

Please refer to [User Manual](../user-manuals/cpu-qos.md).
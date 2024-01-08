# 安装 koord-runtime-proxy

koord-runtime-proxy 充当 Kubelet 和 Containerd 之间的代理（Dockershim 场景下的 Dockerd），旨在拦截 CRI 请求, 并应用一些资源管理策略，比如在混合工作负载编排场景下通过 Pod 优先级设置不同的 CGroup 参数，为最新的 Linux 内核应用新的隔离策略, CPU 架构等等。

当前已知以下的的功能依赖该组件:

- [GPU Share env](fine-grained-device-scheduling)
- 在容器启动前设置 cpuset
- 在容器启动前设置 rdt 相关参数

未来，这些功能将使用 NRI 方案替代，** 如果你不是非常确信自己在做什么，请不要安装该组件 **。

## 1、下载二进制文件

从 Github 下载：
```bash
$ # select the version
$ wget https://github.com/koordinator-sh/koordinator/releases/download/v1.3.0/koord-runtime-proxy_1.3.0.linux_x86_64 -O koord-runtime-proxy
$ chmod +x koord-runtime-proxy
```

或者，你可以从源代码开始构建：
```bash
$ git clone https://github.com/koordinator-sh/koordinator.git
$ cd koordinator
$ make build-koord-runtime-proxy
```

## 2、设置 koord-runtime-proxy

首先，请确保你的运行时后端是 Containerd 或 Dockerd。

在 Containerd 场景下，如果 Containerd 在默认的 `/var/run/containerd/containerd.sock` 监听 CRI 请求，koord-runtime-proxy 可以这样设置(无需任何参数)：

```
koord-runtime-proxy
```

或者使用以下命令设置：

```
koord-runtime-proxy \
   --remote-runtime-service-endpoint=<runtime socketFile path> \
   --remote-image-service-endpoint=<image socketFile path>
```

在 Docker 的场景下，koord-runtime-proxy 应该使用附加参数设置 `--backend-runtime-mode Docker`，无需 `remote-image-service-endpoint`:

```
koord-runtime-proxy \
   --backend-runtime-mode=Docker \
   --remote-runtime-service-endpoint=<runtime socketFile path>
```

koord-runtime-proxy 将监听 `/var/run/koord-runtimeproxy/runtimeproxy.sock`。

## 3、设置 Kubelet

要使 koord-runtime-proxy 成为 Kubelet 和 Containerd 之间的代理，应修改 Kubelet 参数，如下所示：

```
# 如果 kubelet 版本小于 1.24:
kubelet <other options> \
   --container-runtime=remote \
   --container-runtime-endpoint=unix:///var/run/koord-runtimeproxy/runtimeproxy.sock

# 如果 kubelet 版本大于等于 1.24:
kubelet <other options> \
   --container-runtime-endpoint=unix:///vagir/run/koord-runtimeproxy/runtimeproxy.sock
```

在 Docker 的场景下, 应修改 Kubelet 参数如下：

```
kubelet <other options> --docker-endpoint=unix:///var/run/koord-runtimeproxy/runtimeproxy.sock
```

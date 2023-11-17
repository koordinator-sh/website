# Installation Runtime Proxy

koord-runtime-proxy acts as a proxy between kubelet and containerd(dockerd under dockershim scenario), which is designed to intercept CRI request, and apply some resource management policies, such as setting different cgroup parameters by pod priorities under hybrid workload orchestration scenario, applying new isolation policies for latest Linux kernel, CPU architecture, and etc.
For pods that do not want hook servers processing (such as addon pods), you can skip them by adding `runtimeproxy.koordinator.sh/skip-hookserver=true` to the pod label.

Currently known features that require RuntimeProxy include:

- [GPU Share env](fine-grained-device-scheduling)
- set cpuset before container starting
- set rdt before container starting

These features will be based on NRI alternatives in the future, ** if you don't know what you are doing, please do not install this component **.

## 1、Get binary

Download from github releases:
```bash
$ # select the version
$ wget https://github.com/koordinator-sh/koordinator/releases/download/v1.3.0/koord-runtime-proxy_1.3.0_linux_x86_64 -O koord-runtime-proxy
$ chmod +x koord-runtime-proxy
```

Or you can build from source:
```bash
$ git clone https://github.com/koordinator-sh/koordinator.git
$ cd koordinator
$ make build-koord-runtime-proxy
```

## 2、Setup koord-runtime-proxy

Firstly, please make sure your runtime backend is containerd or dockerd.

Under containerd scenario, if your containerd listening CRI request on default `/var/run/containerd/containerd.sock`, koord-runtime-proxy can be setup by(no need to set any parameters):

```
koord-runtime-proxy
```

Or koord-runtime-proxy can be setup with command:

```
koord-runtime-proxy \
   --remote-runtime-service-endpoint=<runtime socketFile path> \
   --remote-image-service-endpoint=<image socketFile path>
```

Under docker scenario, koord-runtime-proxy should be setup with the additional parameter `--backend-runtime-mode Docker`, and without `remote-image-service-endpoint`:

```
koord-runtime-proxy \
   --backend-runtime-mode=Docker \
   --remote-runtime-service-endpoint=<runtime socketFile path>
```

koord-runtime-proxy will listen on `/var/run/koord-runtimeproxy/runtimeproxy.sock`.

## 3、Setup Kubelet

To make koord-runtime-proxy a proxy between kubelet and containerd, kubelet parameters should be altered as shown below:

```
kubelet <other options> \
   --container-runtime=remote \
   --container-runtime-endpoint=unix:///var/run/koord-runtimeproxy/runtimeproxy.sock
```

Under docker scenario, to make koord-runtime-proxy a proxy between kubelet and dockerd, kubelet parameters should be altered as shown below:

```
kubelet <other options> --docker-endpoint=unix:///var/run/koord-runtimeproxy/runtimeproxy.sock
```


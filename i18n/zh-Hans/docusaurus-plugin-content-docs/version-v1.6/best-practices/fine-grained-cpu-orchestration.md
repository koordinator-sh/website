# Coordinated sharing of CPU resources in Colocation Scenarios - Fine-grained CPU Orchestration

## Introduction

In a cloud-native environment, users often deploy different types of workloads in the same cluster, leveraging different peak effects of different services to achieve time-sharing multiplexing of resources and avoid resource waste. However, colocation of different types of workloads often leads to resource competition and mutual interference. The most typical scenario is the colocation  of online and offline workloads. When more computing resources are occupied by offline workloads, the response time of online loads will be affected; when more computing resources are occupied by online workloads for a long time, the task completion time of offline workloads cannot be guaranteed. This phenomenon belongs to the Noisy Neighbor problem. 

Depending on the degree of colocation and resource types, there are many different ways to solve this problem. Quota management can limit the resource usage of loads from the entire cluster dimension, and Koordinator provides multi-level elastic quota management functions in this regard. From the single-node level, CPU, memory, disk IO, and network resources may be shared by different loads. Koordinator has provided some resource isolation and guarantee capabilities on CPU and memory, and related capabilities on disk IO and network resources are under construction. 

This article mainly introduces how Koordinator helps loads (online and online, online and offline) share CPU resources collaboratively when different types of workloads are colocated on the same node.

## Problem Description

The essence of CPU resource Noisy Neighbor is that different workloads share CPU resources without coordination.
1. The default resource model of Kubernetes uses cgroup (cfs quota) to limit the access of different loads to CPU resources in terms of CPU time usage. In this case, some workloads may be switched to CPU cores by the operating system scheduler. Since different CPU cores have different memory access time to different physical locations, switching cpu cores will result in longer memory access time, thus affecting load performance, thereby affecting load performance.
2. In NUMA architecture, SMT threads (logical cores) share execution units and L2 cache of physical cores.
When there are multiple workloads on the same physical core, resource contention will happen between different workloads, resulting in load performance degradation.

Kubernetes provides topology manager and CPU manager on node level to solve the above problems. However, this feature will only attempt to take effect after the Pod has been scheduled on the machine. This may lead to the situation where Pods are scheduled to nodes with sufficient CPU resources but topology requirements are not met.

## Solutions

### Application-Oriented CPU Orchestration QoS Semantics

In response to the above problems and deficiencies, Koordinator designed an application-oriented QoS semantics and CPU orchestration protocol, as shown in the figure below.

![img](/img/qos-cpu-orchestration.png)

LS (Latency Sensitive) is applied to typical microservice loads, and Koordinator isolates it from other latency-sensitive loads to ensure its performance. LSR (Latency Sensitive Reserved) is similar to Kubernetes' Guaranteed. On the basis of LS, it adds the semantics that applications require reserved binding cores. LSE (Latency Sensitive Exclusive) is common in applications that are particularly sensitive to CPU, such as middleware. In addition to satisfying its semantics similar to LSR's requirement to bind cores, Koordinator also ensures that the allocated CPU is not shared with any other load.

Also, to improve resource utilization, BE workloads can share CPU with LSR and LS. To ensure that latency-sensitive applications shared with BE are not disturbed by it, Koordinator provides strategies such as interference detection and BE suppression. The focus of this article is not here, readers can pay attention to follow-up articles.

### Rich CPU scheduling strategies

For LSE applications, when the machine is a hyper-threaded architecture, only logical cores can be guaranteed to be exclusive to the load. In this way, when there are other loads on the same physical core, application performance will still be disturbed.
To this end, Koordinator supports users to configure rich CPU scheduling policies on pod annotation to improve performance.

CPU orchestration policies are divided into CPU-binding policies and CPU-exclusive policies. The CPU binding strategy determines the distribution of logical cores assigned to the application among physical cores, which can be spread or stacked among physical cores. Stacking (FullPCPU) refers to allocating complete physical cores to applications, which can effectively alleviate the Noisy Neighbor problem. SpreadByPCPU is mainly used in some delay-sensitive applications with different peak and valley characteristics, allowing the application to fully use the CPU at a specific time. The CPU exclusive policy determines the exclusive level of logical cores assigned to the application, and it can try to avoid physical cores or NUMANodes that have been applied for with the exclusive policy.

### Enhanced CPU Scheduling Capabilities

Koordinator supports the configuration of NUMA allocation strategies to determine how to select satisfactory NUMA nodes during scheduling. MostAllocated indicates allocation from the NUMA node with the least available resources, which can reduce fragmentation as much as possible and leave more allocation space for subsequent loads. However, this approach may cause the performance of parallel code that relies on Barriers to suffer. DistributeEvenly means that evenly distributing CPUs on NUMA nodes can improve the performance of the above parallel code. LeastAllocated indicates allocation from the NUMA node with the most available resources.

In addition, Koordinator's CPU allocation logic is completed in the central scheduler. In this way, there will be a global perspective, avoiding the dilemma of single-node solution, where CPU resources may be sufficient but topology requirements are not met.

## Best Practices
As can be seen from the above, Koordinator's fine-grained CPU orchestration capability can significantly improve the performance of CPU-sensitive workloads in multi-application colocation scenarios. In order to allow readers to use Koordinator’s fine-grained CPU scheduling capabilities more clearly and intuitively, this article deploys online applications to clusters in different ways, and observes the latency of services in stress testing to judge the effect of CPU scheduling capabilities.

In this article, multiple online applications will be deployed on the same machine and pressure tested for 10 minutes to fully simulate the CPU core switching scenarios that may occur in production practice. For the colocation of online and offline applications, Koordinator provides strategies such as interference detection and BE suppression. The focus of this article is not here, and readers can pay attention to the practice in subsequent articles.

|Group Number|Deployment Mode|Description|Scenarios|
|-|-|-|-|
|A|10 online applications are deployed on the nodes, and each node applies for 4 CPUs, all using kubernetes guaranteed QoS|Koordinator does not provide fine-grained CPU orchestration capabilities for applications|Due to CPU core switching, applications share logical cores, application performance will be affected, and it is not recommended to use|
|B|Deploy 10 online applications on the nodes, each application node has 4 CPUs, all adopt LSE QoS, CPU binding strategy adopts physical core binpacking(FullPCPUs)|Koordinator provides CPU core binding capability for LSE Pod and online applications will not share physical cores|Particularly sensitive online scenarios, application cannot accept CPU sharing at the physical core level|
|C|Deploy 10 online applications on the node, each application node has 4 CPUs, all adopt LSR QoS, CPU binding strategy adopts physical core split (SpreadByPCPUs), use CPU exclusively by physical cpu level|Koordinator provides CPU binding core capability for LSR Pod and online application logical core can use more physical core capacity|It is often used to share physical cores with offline Pods and implement time-sharing multiplexing at the physical core level. This article does not focus on the mixed deployment of online and offline applications, so it only tests the overuse of online applications|

This experiment uses the following performance indicators to evaluate the performance of Nginx applications under different deployment methods:

- RT (Response Time) quantile value: RT is a performance indicator that online applications usually focus on. The lower the RT, the better the online service performance. The RT indicator is obtained by collecting the information printed after the wrk pressure tests. In the experiment, it reflects the time it takes for the Nginx application to respond to the wrk request. For example, RT-p50 indicates the maximum time (median) it takes for Nginx to respond to the first 50% of wrk requests, and RT-p90 indicates the maximum time it takes for Nginx to respond to the first 90% of wrk requests.
- RPS (Request Per Second): RPS is the number of requests served by an online application per second. The more RPS a service bears, the better the performance of the online service.
  

The experimental results are as follows:

|Performance Indicators/Deployment Mode|	A（colocation of two online applications, Guaranteed）|B（colocation of two online applications, LSE、FullPCPU）|C（colocation of two online applications, LSR、SpreadByPCPU、PCPULevel|
|-|-|-|-|
|RPS|	114778.29|114648.19|115268.50|
|RT-avg (ms)|3.46 ms|3.33 ms|3.25 ms|
|RT-p90 (ms)|5.27 ms|5.11 ms|5.06 ms|
|RT-p99 (ms)|15.22 ms|12.61 ms|12.14 ms|

- Comparing B and A, it can be found that after adopting LSE QoS to bind the core, the service response time P99 is significantly reduced, and the long tail phenomenon is well alleviated
- Comparing C and B, it can be found that after using LSR QoS to bind cores and allowing logical cores to occupy more physical core resources, more requests can be tolerated with better service response time

In summary, in the scenario where online services are deployed on the same machine, using Koordinator to refine the CPU arrangement can effectively suppress the Noisy Neighbor problem and reduce the performance degradation caused by CPU core switching.

### Environemnt

First, prepare a Kubernetes cluster and install Koordinator. This article chooses two nodes of a Kubernetes cluster to do the experiment, one of the nodes is used as a test machine, which will run the Nginx online server; the other node is used as a pressure test machine, which will run the client's wrk, request the Nginx online server, and make pressure test requests .

### Online application deployment

1. Inject fine-grained CPU orchestration protocols into applications using ColocationProfile

   Group B fine-grained CPU orchestration protocol

   ```yaml
   apiVersion: config.koordinator.sh/v1alpha1
   kind: ClusterColocationProfile
   metadata:
     name: colocation-profile-example
   spec:
     selector:
       matchLabels:
         app: nginx
     # 采用 LSE QoS
     qosClass: LSE
     annotations:
     # 采用物理核间堆叠
       scheduling.koordinator.sh/resource-spec: '{"preferredCPUBindPolicy":"FullPCPUs"}'
     priorityClassName: koord-prod
   ```

   Group C fine-grained CPU orchestration protocol

   ```yaml
   apiVersion: config.koordinator.sh/v1alpha1
   kind: ClusterColocationProfile
   metadata:
     name: colocation-profile-example
   spec:
     selector:
       matchLabels:
         app: nginx
     # 采用 LSR QoS
     qosClass: LSR
     annotations:
     # 采用物理核间打散且独占物理核
       scheduling.koordinator.sh/resource-spec: '{"preferredCPUBindPolicy":"SpreadByPCPUs", "preferredCPUExclusivePolicy":"PCPULevel"}'
     priorityClassName: koord-prod
   ```

2. This article uses Nginx server as Online Service , Pod YAML is as follows:

   ```yaml
   ---
   # nginx应用配置
   apiVersion: v1
   data:
     config: |-
       user  nginx;
       worker_processes  4; # Nginx的Worker个数，影响Nginx Server的并发。
   
       events {
           worker_connections  1024;  # 默认值为1024。
       }
   
       http {
           server {
               listen  8000;
   
               gzip off;
               gzip_min_length 32;
               gzip_http_version 1.0;
               gzip_comp_level 3;
               gzip_types *;
           }
       }
   
       #daemon off;
   kind: ConfigMap
   metadata:
     name: nginx-conf-0
   ---
   # Nginx实例，作为在线类型服务应用。
   apiVersion: v1
   kind: Pod
   metadata:
     labels:
       app: nginx
     name: nginx-0
     namespace: default
   spec:
     affinity:
       nodeAffinity:
         requiredDuringSchedulingIgnoredDuringExecution:
           nodeSelectorTerms:
           - matchExpressions:
             - key: kubernetes.io/hostname
               operator: In
               values:
               - "${node_name}"    
     schedulerName: koord-scheduler
     priorityClassName: koord-prod
     containers:
       - image: 'koordinatorsh/nginx:v1.18-koord-exmaple'
         imagePullPolicy: IfNotPresent
         name: nginx
         ports:
           - containerPort: 8000
             hostPort: 8000 # 压测请求访问的端口。
             protocol: TCP
         resources:
           limits:
             cpu: '4'
             memory: 8Gi
           requests:
             cpu: '4'
             memory: 8Gi
         volumeMounts:
           - mountPath: /apps/nginx/conf
             name: config
     hostNetwork: true
     restartPolicy: Never
     volumes:
       - configMap:
           items:
             - key: config
               path: nginx.conf
           name: nginx-conf-0
         name: config
   ```

3. Execute the following command to deploy the Nginx application.

   ```bash
   kubectl apply -f nginx.yaml
   ```

4. Execute the following command to view the Pod status of the Nginx application.

   ```bash
   kubectl get pod -l app=nginx -o wide
   ```

   You can see output similar to the following, indicating that the Nginx application has been running normally on the test machine.

   ```
   NAME      READY   STATUS    RESTARTS   AGE     IP           NODE                    NOMINATED NODE   READINESS GATES
   nginx-0   1/1     Running   0          2m46s   10.0.0.246   test-machine-name   		<none>        	
   <none>
   ```

### Load Test

1. On the testing machine, execute the following command to deploy the stress testing tool wrk.

   ```bash
   wget -O wrk-4.2.0.tar.gz https://github.com/wg/wrk/archive/refs/tags/4.2.0.tar.gz && tar -xvf wrk-4.2.0.tar.gz
   cd wrk-4.2.0 && make && chmod +x ./wrk
   ```

2. On the testing machine, execute the following command to deploy the load testing tool wrk

   ```bash
   # node_ip填写测试机的IP地址，用于wrk向测试机发起压测；8000是Nginx暴露到测试机的端口。
   taskset -c 32-45 ./wrk -t120 -c400 -d600s --latency http://${node_ip}:8000/
   ```

3. After waiting for wrk to finish running, obtain the pressure test results of wrk. The output format of wrk is as follows. Repeat the test several times to obtain relatively stable results.

   ```
   Running 10m test @ http://192.168.0.186:8000/
     120 threads and 400 connections
     Thread Stats   Avg      Stdev     Max   +/- Stdev
       Latency     3.29ms    2.49ms 352.52ms   91.07%
       Req/Sec     0.96k   321.04     3.28k    62.00%
     Latency Distribution
        50%    2.60ms
        75%    3.94ms
        90%    5.55ms
        99%   12.40ms
     68800242 requests in 10.00m, 54.46GB read
   Requests/sec: 114648.19
   Transfer/sec:     92.93MB
   ```

## Conclusion

In a Kubernetes cluster, there may be competition for resources such as CPU and memory among different business loads, which affects the performance and stability of the business. In the face of the Noisy Neighbor phenomenon, users can use Koordinator to configure more refined CPU scheduling policies for applications, so that different applications can share CPU resources collaboratively. We have shown through experiments that Koordinator's fine-grained CPU scheduling capability can effectively suppress the competition for CPU resources and improve application performance.
# Koordinator YARN Copilot

## Introduction
Koordinator has supported hybrid orchestration workloads on Kubernetes, so that batch jobs can use the requested but 
unused resource as koord-batch priority and BE QoS class to improve the cluster utilization. However, there still lots 
of applications running beyond K8s such as [Apache Hadoop YARN](https://hadoop.apache.org/docs/current/hadoop-yarn/hadoop-yarn-site/YARN.html).
As a resource management platform in BigData ecosystem, YARN has supported numbers of computing engines including 
MapReduce, Spark, Flink, Presto, etc. Although some computing engines has provided K8s operators that can submit jobs
into the K8s, the Hadoop YARN ecosystem is still active, which can be shown from that most cloud providers are still
selling commercial products like [E-MapReduce](https://www.aliyun.com/product/bigdata/emapreduce).

In order to extend the co-location scenario of, the Koordinator community, together with developers from Alibaba Cloud,
Xiaohongshu, and Ant Financial, set up the project for running Hadoop YARN jobs by koord-batch resources with other K8s 
pods, which can improve the cluster resource utilization by providing `batch` resource to Haddop YARN. This project has
been widely used in Xiaohongshu product environment.
  
## Technical Details

### Principles
- Keep YARN as the portal of job submission.
- Based on the open source version of Hadoop YARN, no intrusive modifications into YARN.
- The co-location resources provided by Koordinator can be used by both K8s Pod and YARN tasks, which means different types of applications can run in the same node.
- QoS policies of Koordlet should be compatible for YARN tasks.

![image](/img/hadoop-k8s.svg)

### Resource Allocation
In Koordinator, batch resources of nodes are dynamically calculated by koord-manager based on the node resource load and
updated as K8s extended-resource on Node. The `koord-yarn-operator` component will synchronize the batch resource to 
YARN RM, so that YARN tasks can request these batch resources. Since the K8s scheduler and the YARN scheduler share the
amount of batch allocatable resource, the allocated information of schedulers should be known by others.

1. `koord-manager` calculates the original batch total `origin_batch_totaland`, and records it as node annotation of K8s.
2. `koord-yarn-operator` collects the amount of resources that YARN nodes have allocated from YARN RM `yarn_requested`, and records it as node annotation of K8s.
3. Before `koord-manager` updates the total batch resources of K8s, the resources that have been allocated by YARN must be excluded: `k8s_batch_total = origin_batch_total – yarn_requested`.
4. Before `koord-yarn-operator` updates resources to YARN RM, also, the amount of resources that K8s has allocated must be excluded: `yarn_batch_total = origin_batch_total – k8s_batch_requested`.

![image](/img/koord-yarn-operator.svg)

Since there are multiple schedulers working in cluster, `batch` priority resources may be overcommited due to the 
sequence of resource synchronization. `koordlet` will perform arbitration for the allocated resource on node side.
However, unlike the arbitration of `kubelet`, `koordlet` use the QoS policy as arbitration methods with 
the goals of "avoiding interference" and "ensuring the resource quality of batch priority", rejecting or evicting pods
according to the realtime status of resource usage.

### Node Runtime
Node Manager works on node side in YARN cluster, which is responsible for the life cycle management of tasks. 
Under the K8s co-location scenario, NM will be deployed as DaemonSet. The resource management of NM and YARN tasks will
be separated into different cgroups for the purpose of fine-grained control, so that NM only needs to request resources
according to its own consumption.

![image](/img/node-manager-runtime.svg)

Koordinator requires YARN NM to enable LinuxContainerExecutor and specify the cgroup path under best-effort hierarchy,
because `kubelet` and `koordlet` use cgroups for QoS managenet, so that all YARN tasks can also be managed like other K8s Pods.

### QoS Strategies
Currently, `koodlet` supports a series of QoS policies,  which also need to be adapted for YARN tasks. For resource 
isolation parameters, such as Group Identity, Memory QoS, L3 Cache isolation, etc., `koordlet` will be adapted 
according to the cgroup hierarchy. For dynamic strategies such as eviction and suppression, `koordlet` will add a new 
module `yarn-copilot-agent`, which is used for adaption for YARN tasks operation, including meta-information collection, 
metrics collection, task eviction operations, etc. of YARN tasks. 

All QoS policies are still managed in `koordlet`, and relevant modules in `koordlet` communicate with 
`yarn-copilot-agent`. Also, the API design of `yarn-copilot-agent` will keep scalability and can be used for connecting
other resource frameworks in the future.

![image](/img/yarn-copilot-agent.svg)

`koordlet` will support all QoS policies for YARN scenarios in subsequent versions.

## Join US
Koordinator has release some features on K8s and YARN co-location in latest versions of each component, the community is
still working on the iteration of other features in following milestions. If you have and questions or want to participate
in co-construction, you are welcome to submit an [issue](https://github.com/koordinator-sh/yarn-copilot/issues) or 
comment in the [discussion](https://github.com/koordinator-sh/koordinator/discussions/1297).

"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[4889],{8642:function(e){e.exports=JSON.parse('{"pluginId":"default","version":"v0.5","label":"v0.5","banner":"unmaintained","badge":true,"className":"docs-version-v0.5","isLast":false,"docsSidebars":{"docs":[{"type":"category","label":"Getting Started","collapsed":false,"items":[{"type":"link","label":"Introduction","href":"/docs/v0.5/","docId":"introduction"},{"type":"link","label":"Installation","href":"/docs/v0.5/installation","docId":"installation"}],"collapsible":true},{"type":"category","label":"Architecture","collapsed":false,"items":[{"type":"link","label":"Overview","href":"/docs/v0.5/architecture/overview","docId":"architecture/overview"},{"type":"link","label":"Resource Model","href":"/docs/v0.5/architecture/resource-model","docId":"architecture/resource-model"},{"type":"link","label":"Priority","href":"/docs/v0.5/architecture/priority","docId":"architecture/priority"},{"type":"link","label":"QoS","href":"/docs/v0.5/architecture/qos","docId":"architecture/qos"}],"collapsible":true},{"type":"category","label":"User Manuals","collapsed":false,"items":[{"type":"link","label":"Colocation Profile","href":"/docs/v0.5/user-manuals/colocation-profile","docId":"user-manuals/colocation-profile"},{"type":"link","label":"Load Aware Scheduling","href":"/docs/v0.5/user-manuals/load-aware-scheduling","docId":"user-manuals/load-aware-scheduling"},{"type":"link","label":"Fine-grained CPU Orchestration","href":"/docs/v0.5/user-manuals/fine-grained-cpu-orchestration","docId":"user-manuals/fine-grained-cpu-orchestration"}],"collapsible":true},{"type":"category","label":"Design Details","collapsed":true,"items":[{"type":"link","label":"Koordlet","href":"/docs/v0.5/designs/koordlet-overview","docId":"designs/koordlet-overview"},{"type":"link","label":"RuntimeProxy","href":"/docs/v0.5/designs/runtime-proxy","docId":"designs/runtime-proxy"},{"type":"link","label":"Load-aware Scheduling","href":"/docs/v0.5/designs/load-aware-scheduling","docId":"designs/load-aware-scheduling"},{"type":"link","label":"Fine-grained CPU orchestration","href":"/docs/v0.5/designs/fine-grained-cpu-orchestration","docId":"designs/fine-grained-cpu-orchestration"}],"collapsible":true},{"type":"category","label":"Best Practices","collapsed":false,"items":[{"type":"link","label":"Colocation of Spark Jobs","href":"/docs/v0.5/best-practices/colocation-of-spark-jobs","docId":"best-practices/colocation-of-spark-jobs"}],"collapsible":true}]},"docs":{"architecture/overview":{"id":"architecture/overview","title":"Overview","description":"This topic describes the architecture, components, and core concepts associated with Koordinator deployments to Kubernetes. Koordinator consists of two control planes (Koordinator Scheduler/Koordinator Manager) and one DaemonSet component (Koordlet).","sidebar":"docs"},"architecture/priority":{"id":"architecture/priority","title":"Priority","description":"Koordinator defines a set of specifications on top of kubernetes priority class, and extends a dimension of priority to support fine-grained colocation.","sidebar":"docs"},"architecture/qos":{"id":"architecture/qos","title":"QoS","description":"QoS is used to express the running quality of the Pod on the node, such as the way to obtain resources, the proportion of resources obtained, and the QoS guarantee policy.","sidebar":"docs"},"architecture/resource-model":{"id":"architecture/resource-model","title":"Resource Model","description":"Colocation is a set of resource scheduling solutions for the fine grained orchestration of latency sensitive workloads with the big data computing workloads. It needs to solve two major problems:","sidebar":"docs"},"best-practices/colocation-of-spark-jobs":{"id":"best-practices/colocation-of-spark-jobs","title":"Colocation of Spark Jobs","description":"Apache Spark is an analysis engine for large-scale data processing, which is widely used in Big Data, SQL Analysis and Machine Learning scenarios. This tutorial provides a quick practice guide about running Spark jobs in colocation mode with other latency sensitive applications by Koordinator, which is helpful for improving cluster resource utilization. For more details about how to use, compose, and work with Koordinator colocation, please refer to the Introduction","sidebar":"docs"},"designs/fine-grained-cpu-orchestration":{"id":"designs/fine-grained-cpu-orchestration","title":"Fine-grained CPU orchestration","description":"Summary","sidebar":"docs"},"designs/koordlet-overview":{"id":"designs/koordlet-overview","title":"Koordlet","description":"Summary","sidebar":"docs"},"designs/load-aware-scheduling":{"id":"designs/load-aware-scheduling","title":"Load-aware Scheduling","description":"Summary","sidebar":"docs"},"designs/runtime-proxy":{"id":"designs/runtime-proxy","title":"RuntimeProxy","description":"Summary","sidebar":"docs"},"installation":{"id":"installation","title":"Installation","description":"Since v0.1.0 (alpha/beta), Koordinator requires Kubernetes version >= 1.18.","sidebar":"docs"},"introduction":{"id":"introduction","title":"Introduction","description":"Welcome to Koordinator!","sidebar":"docs"},"user-manuals/colocation-profile":{"id":"user-manuals/colocation-profile","title":"Colocation Profile","description":"Motivation","sidebar":"docs"},"user-manuals/fine-grained-cpu-orchestration":{"id":"user-manuals/fine-grained-cpu-orchestration","title":"Fine-grained CPU Orchestration","description":"Fine-grained CPU Orchestration is an ability of koord-scheduler for improving the performance of CPU-sensitive workloads.","sidebar":"docs"},"user-manuals/load-aware-scheduling":{"id":"user-manuals/load-aware-scheduling","title":"Load Aware Scheduling","description":"Load Aware Scheduling is an ability of koord-scheduler for balancing pods scheduling based on the real-time load of each node.","sidebar":"docs"}}}')}}]);
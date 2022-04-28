"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[53],{1109:function(e){e.exports=JSON.parse('{"pluginId":"default","version":"current","label":"latest","banner":null,"badge":true,"className":"docs-version-current","isLast":true,"docsSidebars":{"docs":[{"type":"category","label":"Getting Started","collapsed":false,"items":[{"type":"link","label":"Introduction","href":"/docs/","docId":"introduction"},{"type":"link","label":"Installation","href":"/docs/installation","docId":"installation"}],"collapsible":true},{"type":"category","label":"Key Designs","collapsed":false,"items":[{"type":"link","label":"Overview","href":"/docs/key-designs/overview","docId":"key-designs/overview"},{"type":"link","label":"Resource Model","href":"/docs/key-designs/resource-model","docId":"key-designs/resource-model"},{"type":"link","label":"Priority","href":"/docs/key-designs/priority","docId":"key-designs/priority"},{"type":"link","label":"QoS","href":"/docs/key-designs/qos","docId":"key-designs/qos"},{"type":"link","label":"Koordlet Overview","href":"/docs/key-designs/koordlet-overview","docId":"key-designs/koordlet-overview"}],"collapsible":true},{"type":"category","label":"User Manuals","collapsed":false,"items":[{"type":"link","label":"Colocation Profile","href":"/docs/user-manuals/colocation-profile","docId":"user-manuals/colocation-profile"}],"collapsible":true},{"type":"category","label":"Best Practices","collapsed":false,"items":[{"type":"link","label":"Colocation of Spark Jobs","href":"/docs/best-practices/colocation-of-spark-jobs","docId":"best-practices/colocation-of-spark-jobs"}],"collapsible":true}]},"docs":{"best-practices/colocation-of-spark-jobs":{"id":"best-practices/colocation-of-spark-jobs","title":"Colocation of Spark Jobs","description":"Apache Spark is an analysis engine for large-scale data processing, which is widely used in Big Data, SQL Analysis and Machine Learning scenarios. This tutorial provides a quick practice guide about running Spark jobs in colocation mode with other latency sensitive applications by Koordinator, which is helpful for improving cluster resource utilization. For more details about how to use, compose, and work with Koordinator colocation, please refer to the Introduction","sidebar":"docs"},"installation":{"id":"installation","title":"Installation","description":"Since v0.1.0 (alpha/beta), Koordinator requires Kubernetes version >= 1.18.","sidebar":"docs"},"introduction":{"id":"introduction","title":"Introduction","description":"Welcome to Koordinator!","sidebar":"docs"},"key-designs/koordlet-overview":{"id":"key-designs/koordlet-overview","title":"Koordlet Overview","description":"Summary","sidebar":"docs"},"key-designs/overview":{"id":"key-designs/overview","title":"Overview","description":"This topic describes the architecture, components, and core concepts associated with Koordinator deployments to Kubernetes. Koordinator consists of two control planes (Koordinator Scheduler/Koordinator Manager) and one DaemonSet component (Koordlet).","sidebar":"docs"},"key-designs/priority":{"id":"key-designs/priority","title":"Priority","description":"Koordinator defines a set of specifications on top of kubernetes priority class, and extends a dimension of priority to support fine-grained colocation.","sidebar":"docs"},"key-designs/qos":{"id":"key-designs/qos","title":"QoS","description":"QoS is used to express the running quality of the Pod on the node, such as the way to obtain resources, the proportion of resources obtained, and the QoS guarantee policy.","sidebar":"docs"},"key-designs/resource-model":{"id":"key-designs/resource-model","title":"Resource Model","description":"Colocation is a set of resource scheduling solutions for the fine grained orchestration of latency sensitive workloads with the big data computing workloads. It needs to solve two major problems:","sidebar":"docs"},"user-manuals/colocation-profile":{"id":"user-manuals/colocation-profile","title":"Colocation Profile","description":"koord-manager has a variety of parameters that can be specified when creating a Custom Resource (CR). In this section, we will walk through all parameters in ClusterColocationProfile.","sidebar":"docs"}}}')}}]);
"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[2014],{3905:function(e,t,o){o.d(t,{Zo:function(){return u},kt:function(){return h}});var n=o(7294);function r(e,t,o){return t in e?Object.defineProperty(e,t,{value:o,enumerable:!0,configurable:!0,writable:!0}):e[t]=o,e}function i(e,t){var o=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),o.push.apply(o,n)}return o}function a(e){for(var t=1;t<arguments.length;t++){var o=null!=arguments[t]?arguments[t]:{};t%2?i(Object(o),!0).forEach((function(t){r(e,t,o[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(o)):i(Object(o)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(o,t))}))}return e}function l(e,t){if(null==e)return{};var o,n,r=function(e,t){if(null==e)return{};var o,n,r={},i=Object.keys(e);for(n=0;n<i.length;n++)o=i[n],t.indexOf(o)>=0||(r[o]=e[o]);return r}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(n=0;n<i.length;n++)o=i[n],t.indexOf(o)>=0||Object.prototype.propertyIsEnumerable.call(e,o)&&(r[o]=e[o])}return r}var s=n.createContext({}),d=function(e){var t=n.useContext(s),o=t;return e&&(o="function"==typeof e?e(t):a(a({},t),e)),o},u=function(e){var t=d(e.components);return n.createElement(s.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},c=n.forwardRef((function(e,t){var o=e.components,r=e.mdxType,i=e.originalType,s=e.parentName,u=l(e,["components","mdxType","originalType","parentName"]),c=d(o),h=r,m=c["".concat(s,".").concat(h)]||c[h]||p[h]||i;return o?n.createElement(m,a(a({ref:t},u),{},{components:o})):n.createElement(m,a({ref:t},u))}));function h(e,t){var o=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var i=o.length,a=new Array(i);a[0]=c;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l.mdxType="string"==typeof e?e:r,a[1]=l;for(var d=2;d<i;d++)a[d]=o[d];return n.createElement.apply(null,a)}return n.createElement.apply(null,o)}c.displayName="MDXCreateElement"},3752:function(e,t,o){o.r(t),o.d(t,{assets:function(){return u},contentTitle:function(){return s},default:function(){return h},frontMatter:function(){return l},metadata:function(){return d},toc:function(){return p}});var n=o(7462),r=o(3366),i=(o(7294),o(3905)),a=["components"],l={slug:"release-v0.4.0",title:"What's New in Koordinator v0.4.0?",authors:["joseph"],tags:["release"]},s=void 0,d={permalink:"/blog/release-v0.4.0",editUrl:"https://github.com/koordinator-sh/koordinator.sh/edit/main/blog/2022-05-31-release/index.md",source:"@site/blog/2022-05-31-release/index.md",title:"What's New in Koordinator v0.4.0?",description:"We are happy to announce the release of Koordinator v0.4.0. Koordinator v0.4.0 brings in some notable changes that are most wanted by the community while continuing to expand on experimental features. And in this version, we started to gradually enhance the capabilities of the scheduler.",date:"2022-05-31T00:00:00.000Z",formattedDate:"May 31, 2022",tags:[{label:"release",permalink:"/blog/tags/release"}],readingTime:7.525,truncated:!1,authors:[{name:"Joseph",title:"Koordinator maintainer",url:"https://github.com/eahydra",imageURL:"https://github.com/eahydra.png",key:"joseph"}],frontMatter:{slug:"release-v0.4.0",title:"What's New in Koordinator v0.4.0?",authors:["joseph"],tags:["release"]},prevItem:{title:"Koordinator v0.5: Now With Node Resource Topology And More",permalink:"/blog/release-v0.5.0"},nextItem:{title:"What's New in Koordinator v0.3.0?",permalink:"/blog/release-v0.3.0"}},u={authorsImageUrls:[void 0]},p=[{value:"Install or Upgrade to Koordinator v0.4.0",id:"install-or-upgrade-to-koordinator-v040",level:2},{value:"Install with helms",id:"install-with-helms",level:3},{value:"Upgrade with helm",id:"upgrade-with-helm",level:3},{value:"Enhanced node-side scheduling capabilities",id:"enhanced-node-side-scheduling-capabilities",level:2},{value:"Custom memory evict threshold",id:"custom-memory-evict-threshold",level:3},{value:"BE Pods eviction based on satisfaction",id:"be-pods-eviction-based-on-satisfaction",level:3},{value:"Group identity",id:"group-identity",level:3},{value:"koord-runtime-proxy (experimental)",id:"koord-runtime-proxy-experimental",level:2},{value:"koord-runtime-proxy",id:"koord-runtime-proxy",level:3},{value:"RuntimePlugins",id:"runtimeplugins",level:3},{value:"Installation",id:"installation",level:3},{value:"Load-Aware Scheduling",id:"load-aware-scheduling",level:2},{value:"What Comes Next",id:"what-comes-next",level:2}],c={toc:p};function h(e){var t=e.components,l=(0,r.Z)(e,a);return(0,i.kt)("wrapper",(0,n.Z)({},c,l,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,"We are happy to announce the release of Koordinator v0.4.0. Koordinator v0.4.0 brings in some notable changes that are most wanted by the community while continuing to expand on experimental features. And in this version, we started to gradually enhance the capabilities of the scheduler."),(0,i.kt)("h2",{id:"install-or-upgrade-to-koordinator-v040"},"Install or Upgrade to Koordinator v0.4.0"),(0,i.kt)("h3",{id:"install-with-helms"},"Install with helms"),(0,i.kt)("p",null,"Koordinator can be simply installed by helm v3.5+, which is a simple command-line tool, and you can get it\nfrom ",(0,i.kt)("a",{parentName:"p",href:"https://github.com/helm/helm/releases"},"here"),"."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-shell"},"# Firstly add koordinator charts repository if you haven't do this.\n$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/\n\n# [Optional]\n$ helm repo update\n\n# Install the latest version.\n$ helm install koordinator koordinator-sh/koordinator --version 0.4.0\n")),(0,i.kt)("h3",{id:"upgrade-with-helm"},"Upgrade with helm"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-shell"},"# Firstly add koordinator charts repository if you haven't do this.\n$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/\n\n# [Optional]\n$ helm repo update\n\n# Upgrade the latest version.\n$ helm upgrade koordinator koordinator-sh/koordinator --version 0.4.0 [--force]\n")),(0,i.kt)("p",null,"For more details, please refer to the ",(0,i.kt)("a",{parentName:"p",href:"/docs/installation"},"installation manual"),"."),(0,i.kt)("h2",{id:"enhanced-node-side-scheduling-capabilities"},"Enhanced node-side scheduling capabilities"),(0,i.kt)("h3",{id:"custom-memory-evict-threshold"},"Custom memory evict threshold"),(0,i.kt)("p",null,"In the Koordinator v0.2.0, an ability to improve the stability of the node side in the co-location scenario was introduced: ",(0,i.kt)("a",{parentName:"p",href:"/blog/release-v0.2.0#active-eviction-mechanism-based-on-memory-safety-thresholds"},"Active eviction mechanism based on memory safety thresholds"),". The current memory utilization safety threshold default value is 70%, now in the v0.4.0 version, you can modify the ",(0,i.kt)("inlineCode",{parentName:"p"},"memoryEvictThresholdPercent")," with 60% in ConfigMap ",(0,i.kt)("inlineCode",{parentName:"p"},"slo-controller-config")," according to the actual situation:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-yaml"},'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: slo-controller-config\n  namespace: koordinator-system\ndata:\n  colocation-config: |\n    {\n      "enable": true\n    }\n  resource-threshold-config: |\n    {\n      "clusterStrategy": {\n        "enable": true,\n        "memoryEvictThresholdPercent": 60\n      }\n    }\n')),(0,i.kt)("h3",{id:"be-pods-eviction-based-on-satisfaction"},"BE Pods eviction based on satisfaction"),(0,i.kt)("p",null,"In order to ensure the runtime quality of different workloads in co-location scenarios, Koordinator uses the CPU Suppress mechanism provided by koordlet on the node side to suppress workloads of the best effort type when the load increases. Or increase the resource quota for best effort type workloads when the load decreases. "),(0,i.kt)("p",null,"However, it is not suitable if there are many best effort Pods on the node and they are frequently suppressed. Therefore, in version v0.4.0, Koordinator provides an eviction mechanism based on satisfaction of the requests for the best effort Pods. If the best effort Pods are frequently suppressed, the requests of the best effort Pods cannot be satisfied, and the satisfaction is generally less than 1; if the best effort Pods are not suppressed and more CPU resources are obtained when the node resources are idle, then the requests of the best effort Pods can be satisfied, and the satisfaction is greater than or equal to 1. If the satisfaction is less than the specified threshold, and the CPU utilization of the best effort Pods is close to 100%, ",(0,i.kt)("inlineCode",{parentName:"p"},"koordlet")," will evict some best effort Pods to improve the runtime quality of the node. The priority with lower priority or with higher CPU utilization of the same priority is evicted."),(0,i.kt)("p",null,"You can modify the ConfigMap ",(0,i.kt)("inlineCode",{parentName:"p"},"slo-controller-config")," according to the actual situation:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-yaml"},'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: slo-controller-config\n  namespace: koordinator-system\ndata:\n  colocation-config: |\n    {\n      "enable": true\n    }\n  resource-threshold-config: |\n    {\n      "clusterStrategy": {\n        "enable": true,\n        "cpuEvictBESatisfactionUpperPercent": 80,\n        "cpuEvictBESatisfactionLowerPercent": 60\n      }\n    }\n')),(0,i.kt)("h3",{id:"group-identity"},"Group identity"),(0,i.kt)("p",null,"When latency-sensitive applications and best effort workloads are deployed on the same node, the Linux kernel scheduler must provide more scheduling opportunities to high-priority applications to minimize scheduling latency and the impacts of low-priority workloads on kernel scheduling. For this scenario, Koordinator integrated with the group identity allowing users to configure scheduling priorities to CPU cgroups. "),(0,i.kt)("p",null,"Alibaba Cloud Linux 2 with a kernel of the kernel-4.19.91-24.al7 version or later supports the group identity feature. The group identity feature relies on a dual red-black tree architecture. A low-priority red-black tree is added based on the red-black tree of the Completely Fair Scheduler (CFS) scheduling queue to store low-priority workloads. When the kernel schedules the workloads that have identities, the kernel processes the workloads based on their priorities. For more details, please refer to the ",(0,i.kt)("a",{parentName:"p",href:"https://www.alibabacloud.com/help/en/elastic-compute-service/latest/group-identity-feature"},"doc"),"."),(0,i.kt)("p",null,"Koordinator defines group identity default values for Pods of different QoS types:"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:null},"QoS"),(0,i.kt)("th",{parentName:"tr",align:null},"Default Value"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:null},"LSR"),(0,i.kt)("td",{parentName:"tr",align:null},"2")),(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:null},"LS"),(0,i.kt)("td",{parentName:"tr",align:null},"2")),(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:null},"BE"),(0,i.kt)("td",{parentName:"tr",align:null},"-1")))),(0,i.kt)("p",null,"You can modify the ConfigMap ",(0,i.kt)("inlineCode",{parentName:"p"},"slo-controller-config")," to set group identity values according to the actual situation:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-yaml"},'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: slo-controller-config\n  namespace: koordinator-system\ndata:\n  colocation-config: |\n    {\n      "enable": true\n    }\n  resource-qos-config: |\n    {\n      "clusterStrategy": {\n        "lsr": {\n            "cpuQoS": {\n                "enable": "true",\n                "groupIdentity": 2\n            }\n        },\n        "ls": {\n            "cpuQoS": {\n                "enable": "true",\n                "groupIdentity": 2\n            }\n        },\n        "be": {\n            "cpuQoS": {\n                "enable": "true",\n                "groupIdentity": -1\n            }\n        },\n        "system": {\n            "cpuQoS": {\n                "enable": "true",\n                "groupIdentity": 2\n            }\n        }\n      }\n    }\n')),(0,i.kt)("p",null,"To enable this feature, you need to update the kernel and configuration file, then install the new component ",(0,i.kt)("inlineCode",{parentName:"p"},"koord-runtime-proxy")," of koordinator."),(0,i.kt)("h2",{id:"koord-runtime-proxy-experimental"},"koord-runtime-proxy (experimental)"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"koord-runtime-proxy")," acts as a proxy between kubelet and containerd(dockerd under dockershim scenario), which is designed to intercept CRI request, and apply some resource management policies, such as setting different cgroup parameters by pod priorities under hybrid workload orchestration scenario, applying new isolation policies for latest Linux kernel, CPU architecture, and etc."),(0,i.kt)("p",null,"There are two components involved, koord-runtime-proxy and RuntimePlugins."),(0,i.kt)("p",null,(0,i.kt)("img",{loading:"lazy",alt:"image",src:o(4186).Z,width:"431",height:"303"})),(0,i.kt)("h3",{id:"koord-runtime-proxy"},"koord-runtime-proxy"),(0,i.kt)("p",null,"koord-runtime-proxy is in charge of intercepting request during pod's lifecycle, such as RunPodSandbox, CreateContainer etc., and then calling RuntimePlugins to do resource isolation policies before transferring request to backend containerd(dockerd) and after transferring response to kubelet. koord-runtime-proxy provides an isolation-policy-execution framework which allows customized plugins registered to do specified isolation policies, these plugins are called RuntimePlugins. koord-runtime-proxy itself does NOT do any isolation policies."),(0,i.kt)("h3",{id:"runtimeplugins"},"RuntimePlugins"),(0,i.kt)("p",null,"RuntimePlugins register events(RunPodSandbox etc.) to koord-runtime-proxy and would receive notifications when events happen. RuntimePlugins should complete resource isolation policies basing on the notification message, and then response koord-runtime-proxy, koord-runtime-proxy would decide to transfer request to backend containerd or discard request according to plugins' response."),(0,i.kt)("p",null,"If no RuntimePlugins registered, koord-runtime-proxy would become a transparent proxy between kubelet and containerd."),(0,i.kt)("p",null,"For more details, please refer to the ",(0,i.kt)("a",{parentName:"p",href:"https://github.com/koordinator-sh/koordinator/blob/main/docs/design-archive/runtime-manager-design-doc.md"},"design doc"),"."),(0,i.kt)("h3",{id:"installation"},"Installation"),(0,i.kt)("p",null,"When installing koord-runtime-proxy, you need to change the startup parameters of the kubelet, set the CRI parameters to point to the koord-runtime-proxy, and configure the CRI parameters of the corresponding container runtime when installing the koord-runtime-proxy. "),(0,i.kt)("p",null,"koord-runtime-proxy is in the Alpha experimental version stage. Currently, it provides a minimum set of extension points. At the same time, there may be some bugs. You are welcome to try it and give feedback."),(0,i.kt)("p",null,"For detailed installation process, please refer to the ",(0,i.kt)("a",{parentName:"p",href:"/docs/installation#install-koord-runtime-proxy-experimental"},"manual"),"."),(0,i.kt)("h2",{id:"load-aware-scheduling"},"Load-Aware Scheduling"),(0,i.kt)("p",null,"Although Koordinator provides the co-location mechanism to improve the resource utilization of the cluster and reduce costs, it does not yet have the ability to control the utilization level of the cluster dimension, Best Effort workloads may also interfere with latency-sensitive applications. Load-aware scheduling plugin helps Koordinator to achieve this capability."),(0,i.kt)("p",null,"The scheduling plugin filters abnormal nodes and scores them according to resource usage. This scheduling plugin extends the Filter/Score/Reserve/Unreserve extension points defined in the Kubernetes scheduling framework."),(0,i.kt)("p",null,"By default, abnormal nodes are filtered, and users can decide whether to enable or not by configuring as needed."),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"Filter nodes where koordlet fails to update NodeMetric. "),(0,i.kt)("li",{parentName:"ul"},"Filter nodes by utilization thresholds. If the configuration enables, the plugin will exclude nodes with ",(0,i.kt)("em",{parentName:"li"},"latestUsageUtilization >= utilizationThreshold"),".")),(0,i.kt)("p",null,"This plugin is dependent on NodeMetric's reporting period. Different reporting periods need to be set according to different scenarios and workloads. Therefore, NodeMetricSpec has been extended to support user-defined reporting period and aggregation period. Users can modify ",(0,i.kt)("inlineCode",{parentName:"p"},"slo-controller-config")," to complete the corresponding configuration, and the controller in ",(0,i.kt)("inlineCode",{parentName:"p"},"koord-manager")," will be responsible for updating the reporting period and aggregation period fields of NodeMetrics of related nodes."),(0,i.kt)("p",null,"Currently, the resource utilization thresholds of nodes are configured based on experience to ensure the runtime quality of nodes. But there are also ways to evaluate the workload running on the node to arrive at a more appropriate threshold for resource utilization. For example, in a time-sharing scenario, a higher threshold can be set to allow scheduling to run more best effort workloads during the valley of latency-sensitive applications. When the peak of latency-sensitive applications comes up, lower the threshold and evict some best effort workloads. In addition, 3-sigma can be used to analyze the utilization level in the cluster to obtain a more appropriate threshold."),(0,i.kt)("p",null,"The core logic of the scoring algorithm is to select the node with the smallest resource usage. However, considering the delay of resource usage reporting and the delay of Pod startup time, the resource requests of the Pods that have been scheduled and the Pods currently being scheduled within the time window will also be estimated, and the estimated values will be involved in the calculation."),(0,i.kt)("p",null,"At present, Koordinator does not have the ability to profile workloads. Different types of workloads have different ways of building profiles. For example, long-running pods need to be scheduled with long-period profiling, while short-period pods should be scheduled with short-period profiling."),(0,i.kt)("p",null,"For more details, please refer to the ",(0,i.kt)("a",{parentName:"p",href:"https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20220510-load-aware-scheduling.md"},"proposal"),"."),(0,i.kt)("h2",{id:"what-comes-next"},"What Comes Next"),(0,i.kt)("p",null,"For more details, please refer to our ",(0,i.kt)("a",{parentName:"p",href:"https://github.com/koordinator-sh/koordinator/milestones"},"milestone"),". Hope it\nhelps!"))}h.isMDXComponent=!0},4186:function(e,t,o){t.Z=o.p+"assets/images/koord-runtime-proxy-architecture-89594d54b7712128b218cd4d611b457f.svg"}}]);
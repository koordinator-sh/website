"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[4355],{3905:(e,t,o)=>{o.d(t,{Zo:()=>d,kt:()=>m});var n=o(7294);function r(e,t,o){return t in e?Object.defineProperty(e,t,{value:o,enumerable:!0,configurable:!0,writable:!0}):e[t]=o,e}function a(e,t){var o=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),o.push.apply(o,n)}return o}function i(e){for(var t=1;t<arguments.length;t++){var o=null!=arguments[t]?arguments[t]:{};t%2?a(Object(o),!0).forEach((function(t){r(e,t,o[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(o)):a(Object(o)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(o,t))}))}return e}function s(e,t){if(null==e)return{};var o,n,r=function(e,t){if(null==e)return{};var o,n,r={},a=Object.keys(e);for(n=0;n<a.length;n++)o=a[n],t.indexOf(o)>=0||(r[o]=e[o]);return r}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)o=a[n],t.indexOf(o)>=0||Object.prototype.propertyIsEnumerable.call(e,o)&&(r[o]=e[o])}return r}var l=n.createContext({}),c=function(e){var t=n.useContext(l),o=t;return e&&(o="function"==typeof e?e(t):i(i({},t),e)),o},d=function(e){var t=c(e.components);return n.createElement(l.Provider,{value:t},e.children)},p="mdxType",u={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},h=n.forwardRef((function(e,t){var o=e.components,r=e.mdxType,a=e.originalType,l=e.parentName,d=s(e,["components","mdxType","originalType","parentName"]),p=c(o),h=r,m=p["".concat(l,".").concat(h)]||p[h]||u[h]||a;return o?n.createElement(m,i(i({ref:t},d),{},{components:o})):n.createElement(m,i({ref:t},d))}));function m(e,t){var o=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var a=o.length,i=new Array(a);i[0]=h;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s[p]="string"==typeof e?e:r,i[1]=s;for(var c=2;c<a;c++)i[c]=o[c];return n.createElement.apply(null,i)}return n.createElement.apply(null,o)}h.displayName="MDXCreateElement"},996:(e,t,o)=>{o.r(t),o.d(t,{assets:()=>l,contentTitle:()=>i,default:()=>u,frontMatter:()=>a,metadata:()=>s,toc:()=>c});var n=o(7462),r=(o(7294),o(3905));const a={},i="Koordinator YARN Copilot",s={unversionedId:"designs/koordinator-yarn",id:"version-v1.4/designs/koordinator-yarn",title:"Koordinator YARN Copilot",description:"Introduction",source:"@site/versioned_docs/version-v1.4/designs/koordinator-yarn.md",sourceDirName:"designs",slug:"/designs/koordinator-yarn",permalink:"/docs/designs/koordinator-yarn",draft:!1,editUrl:"https://github.com/koordinator-sh/koordinator.sh/edit/main/docs/designs/koordinator-yarn.md",tags:[],version:"v1.4",lastUpdatedBy:"wangjianyu",lastUpdatedAt:1705567859,formattedLastUpdatedAt:"Jan 18, 2024",frontMatter:{}},l={},c=[{value:"Introduction",id:"introduction",level:2},{value:"Technical Details",id:"technical-details",level:2},{value:"Principles",id:"principles",level:3},{value:"Resource Allocation",id:"resource-allocation",level:3},{value:"Node Runtime",id:"node-runtime",level:3},{value:"QoS Strategies",id:"qos-strategies",level:3},{value:"Join US",id:"join-us",level:2}],d={toc:c},p="wrapper";function u(e){let{components:t,...a}=e;return(0,r.kt)(p,(0,n.Z)({},d,a,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"koordinator-yarn-copilot"},"Koordinator YARN Copilot"),(0,r.kt)("h2",{id:"introduction"},"Introduction"),(0,r.kt)("p",null,"Koordinator has supported hybrid orchestration workloads on Kubernetes, so that batch jobs can use the requested but\nunused resource as koord-batch priority and BE QoS class to improve the cluster utilization. However, there still lots\nof applications running beyond K8s such as ",(0,r.kt)("a",{parentName:"p",href:"https://hadoop.apache.org/docs/current/hadoop-yarn/hadoop-yarn-site/YARN.html"},"Apache Hadoop YARN"),".\nAs a resource management platform in BigData ecosystem, YARN has supported numbers of computing engines including\nMapReduce, Spark, Flink, Presto, etc. Although some computing engines has provided K8s operators that can submit jobs\ninto the K8s, the Hadoop YARN ecosystem is still active, which can be shown from that most cloud providers are still\nselling commercial products like ",(0,r.kt)("a",{parentName:"p",href:"https://www.aliyun.com/product/bigdata/emapreduce"},"E-MapReduce"),"."),(0,r.kt)("p",null,"In order to extend the co-location scenario of, the Koordinator community, together with developers from Alibaba Cloud,\nXiaohongshu, and Ant Financial, set up the project for running Hadoop YARN jobs by koord-batch resources with other K8s\npods, which can improve the cluster resource utilization by providing ",(0,r.kt)("inlineCode",{parentName:"p"},"batch")," resource to Haddop YARN. This project has\nbeen widely used in Xiaohongshu product environment."),(0,r.kt)("h2",{id:"technical-details"},"Technical Details"),(0,r.kt)("h3",{id:"principles"},"Principles"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"Keep YARN as the portal of job submission."),(0,r.kt)("li",{parentName:"ul"},"Based on the open source version of Hadoop YARN, no intrusive modifications into YARN."),(0,r.kt)("li",{parentName:"ul"},"The co-location resources provided by Koordinator can be used by both K8s Pod and YARN tasks, which means different types of applications can run in the same node."),(0,r.kt)("li",{parentName:"ul"},"QoS policies of Koordlet should be compatible for YARN tasks.")),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"image",src:o(1749).Z,width:"396",height:"451"})),(0,r.kt)("h3",{id:"resource-allocation"},"Resource Allocation"),(0,r.kt)("p",null,"In Koordinator, batch resources of nodes are dynamically calculated by koord-manager based on the node resource load and\nupdated as K8s extended-resource on Node. The ",(0,r.kt)("inlineCode",{parentName:"p"},"koord-yarn-operator")," component will synchronize the batch resource to\nYARN RM, so that YARN tasks can request these batch resources. Since the K8s scheduler and the YARN scheduler share the\namount of batch allocatable resource, the allocated information of schedulers should be known by others."),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("inlineCode",{parentName:"li"},"koord-manager")," calculates the original batch total ",(0,r.kt)("inlineCode",{parentName:"li"},"origin_batch_totaland"),", and records it as node annotation of K8s."),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("inlineCode",{parentName:"li"},"koord-yarn-operator")," collects the amount of resources that YARN nodes have allocated from YARN RM ",(0,r.kt)("inlineCode",{parentName:"li"},"yarn_requested"),", and records it as node annotation of K8s."),(0,r.kt)("li",{parentName:"ol"},"Before ",(0,r.kt)("inlineCode",{parentName:"li"},"koord-manager")," updates the total batch resources of K8s, the resources that have been allocated by YARN must be excluded: ",(0,r.kt)("inlineCode",{parentName:"li"},"k8s_batch_total = origin_batch_total \u2013 yarn_requested"),"."),(0,r.kt)("li",{parentName:"ol"},"Before ",(0,r.kt)("inlineCode",{parentName:"li"},"koord-yarn-operator")," updates resources to YARN RM, also, the amount of resources that K8s has allocated must be excluded: ",(0,r.kt)("inlineCode",{parentName:"li"},"yarn_batch_total = origin_batch_total \u2013 k8s_batch_requested"),".")),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"image",src:o(198).Z,width:"369",height:"248"})),(0,r.kt)("p",null,"Since there are multiple schedulers working in cluster, ",(0,r.kt)("inlineCode",{parentName:"p"},"batch")," priority resources may be overcommited due to the\nsequence of resource synchronization. ",(0,r.kt)("inlineCode",{parentName:"p"},"koordlet")," will perform arbitration for the allocated resource on node side.\nHowever, unlike the arbitration of ",(0,r.kt)("inlineCode",{parentName:"p"},"kubelet"),", ",(0,r.kt)("inlineCode",{parentName:"p"},"koordlet"),' use the QoS policy as arbitration methods with\nthe goals of "avoiding interference" and "ensuring the resource quality of batch priority", rejecting or evicting pods\naccording to the realtime status of resource usage.'),(0,r.kt)("h3",{id:"node-runtime"},"Node Runtime"),(0,r.kt)("p",null,"Node Manager works on node side in YARN cluster, which is responsible for the life cycle management of tasks.\nUnder the K8s co-location scenario, NM will be deployed as DaemonSet. The resource management of NM and YARN tasks will\nbe separated into different cgroups for the purpose of fine-grained control, so that NM only needs to request resources\naccording to its own consumption."),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"image",src:o(2681).Z,width:"488",height:"191"})),(0,r.kt)("p",null,"Koordinator requires YARN NM to enable LinuxContainerExecutor and specify the cgroup path under best-effort hierarchy,\nbecause ",(0,r.kt)("inlineCode",{parentName:"p"},"kubelet")," and ",(0,r.kt)("inlineCode",{parentName:"p"},"koordlet")," use cgroups for QoS managenet, so that all YARN tasks can also be managed like other K8s Pods."),(0,r.kt)("h3",{id:"qos-strategies"},"QoS Strategies"),(0,r.kt)("p",null,"Currently, ",(0,r.kt)("inlineCode",{parentName:"p"},"koodlet")," supports a series of QoS policies,  which also need to be adapted for YARN tasks. For resource\nisolation parameters, such as Group Identity, Memory QoS, L3 Cache isolation, etc., ",(0,r.kt)("inlineCode",{parentName:"p"},"koordlet")," will be adapted\naccording to the cgroup hierarchy. For dynamic strategies such as eviction and suppression, ",(0,r.kt)("inlineCode",{parentName:"p"},"koordlet")," will add a new\nmodule ",(0,r.kt)("inlineCode",{parentName:"p"},"yarn-copilot-agent"),", which is used for adaption for YARN tasks operation, including meta-information collection,\nmetrics collection, task eviction operations, etc. of YARN tasks. "),(0,r.kt)("p",null,"All QoS policies are still managed in ",(0,r.kt)("inlineCode",{parentName:"p"},"koordlet"),", and relevant modules in ",(0,r.kt)("inlineCode",{parentName:"p"},"koordlet")," communicate with\n",(0,r.kt)("inlineCode",{parentName:"p"},"yarn-copilot-agent"),". Also, the API design of ",(0,r.kt)("inlineCode",{parentName:"p"},"yarn-copilot-agent")," will keep scalability and can be used for connecting\nother resource frameworks in the future."),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"image",src:o(4247).Z,width:"411",height:"321"})),(0,r.kt)("p",null,(0,r.kt)("inlineCode",{parentName:"p"},"koordlet")," will support all QoS policies for YARN scenarios in subsequent versions."),(0,r.kt)("h2",{id:"join-us"},"Join US"),(0,r.kt)("p",null,"Koordinator has release some features on K8s and YARN co-location in latest versions of each component, the community is\nstill working on the iteration of other features in following milestions. If you have and questions or want to participate\nin co-construction, you are welcome to submit an ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/koordinator-sh/yarn-copilot/issues"},"issue")," or\ncomment in the ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/koordinator-sh/koordinator/discussions/1297"},"discussion"),"."))}u.isMDXComponent=!0},1749:(e,t,o)=>{o.d(t,{Z:()=>n});const n=o.p+"assets/images/hadoop-k8s-a092bf3c9bc72245fec2b31b173a8792.svg"},198:(e,t,o)=>{o.d(t,{Z:()=>n});const n=o.p+"assets/images/koord-yarn-operator-0c11a5905f6b5f72c53d3006c0933978.svg"},2681:(e,t,o)=>{o.d(t,{Z:()=>n});const n=o.p+"assets/images/node-manager-runtime-46fc007b5c0fe2de0ab9c0e4d3023bbb.svg"},4247:(e,t,o)=>{o.d(t,{Z:()=>n});const n=o.p+"assets/images/yarn-copilot-agent-aeceac2cd5cef61317e89d55e8bf78b8.svg"}}]);
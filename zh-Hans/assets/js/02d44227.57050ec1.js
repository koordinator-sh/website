"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[9193],{3905:(e,t,n)=>{n.d(t,{Zo:()=>d,kt:()=>m});var o=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,o)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,o,r=function(e,t){if(null==e)return{};var n,o,r={},a=Object.keys(e);for(o=0;o<a.length;o++)n=a[o],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(o=0;o<a.length;o++)n=a[o],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var l=o.createContext({}),c=function(e){var t=o.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},d=function(e){var t=c(e.components);return o.createElement(l.Provider,{value:t},e.children)},p="mdxType",u={inlineCode:"code",wrapper:function(e){var t=e.children;return o.createElement(o.Fragment,{},t)}},h=o.forwardRef((function(e,t){var n=e.components,r=e.mdxType,a=e.originalType,l=e.parentName,d=s(e,["components","mdxType","originalType","parentName"]),p=c(n),h=r,m=p["".concat(l,".").concat(h)]||p[h]||u[h]||a;return n?o.createElement(m,i(i({ref:t},d),{},{components:n})):o.createElement(m,i({ref:t},d))}));function m(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var a=n.length,i=new Array(a);i[0]=h;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s[p]="string"==typeof e?e:r,i[1]=s;for(var c=2;c<a;c++)i[c]=n[c];return o.createElement.apply(null,i)}return o.createElement.apply(null,n)}h.displayName="MDXCreateElement"},6940:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>i,default:()=>u,frontMatter:()=>a,metadata:()=>s,toc:()=>c});var o=n(7462),r=(n(7294),n(3905));const a={slug:"release-v0.5.0",title:"Koordinator v0.5: Now With Node Resource Topology And More",authors:["jason"],tags:["release"]},i=void 0,s={permalink:"/zh-Hans/blog/release-v0.5.0",editUrl:"https://github.com/koordinator-sh/koordinator.sh/edit/main/blog/2022-06-30-release/index.md",source:"@site/i18n/zh-Hans/docusaurus-plugin-content-blog/2022-06-30-release/index.md",title:"Koordinator v0.5: Now With Node Resource Topology And More",description:"In addition to the usual updates to supporting utilities, Koordinator v0.5 adds a couple of new useful features we think",date:"2022-06-30T00:00:00.000Z",formattedDate:"2022\u5e746\u670830\u65e5",tags:[{label:"release",permalink:"/zh-Hans/blog/tags/release"}],readingTime:7.265,hasTruncateMarker:!1,authors:[{name:"Jason",title:"Koordinator maintainer",url:"https://github.com/jasonliu747",imageURL:"https://github.com/jasonliu747.png",key:"jason"}],frontMatter:{slug:"release-v0.5.0",title:"Koordinator v0.5: Now With Node Resource Topology And More",authors:["jason"],tags:["release"]},prevItem:{title:"Koordinator v0.6: Complete fine-grained CPU orchestration, Resource Reservation and Descheduling",permalink:"/zh-Hans/blog/release-v0.6.0"},nextItem:{title:"What's New in Koordinator v0.4.0?",permalink:"/zh-Hans/blog/release-v0.4.0"}},l={authorsImageUrls:[void 0]},c=[{value:"Install or Upgrade to Koordinator v0.5.0",id:"install-or-upgrade-to-koordinator-v050",level:2},{value:"Install with helms",id:"install-with-helms",level:3},{value:"Upgrade with helm",id:"upgrade-with-helm",level:3},{value:"Fine-grained CPU Orchestration",id:"fine-grained-cpu-orchestration",level:2},{value:"Resource Reservation",id:"resource-reservation",level:2},{value:"QoS Manager",id:"qos-manager",level:2},{value:"Multiple Running Hook Modes",id:"multiple-running-hook-modes",level:2},{value:"Some minor works",id:"some-minor-works",level:2},{value:"What\u2019s coming next in Koordinator",id:"whats-coming-next-in-koordinator",level:2}],d={toc:c},p="wrapper";function u(e){let{components:t,...n}=e;return(0,r.kt)(p,(0,o.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("p",null,"In addition to the usual updates to supporting utilities, Koordinator v0.5 adds a couple of new useful features we think\nyou'll like."),(0,r.kt)("h2",{id:"install-or-upgrade-to-koordinator-v050"},"Install or Upgrade to Koordinator v0.5.0"),(0,r.kt)("h3",{id:"install-with-helms"},"Install with helms"),(0,r.kt)("p",null,"Koordinator can be simply installed by helm v3.5+, which is a simple command-line tool, and you can get it\nfrom ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/helm/helm/releases"},"here"),"."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-shell"},"# Firstly add koordinator charts repository if you haven't do this.\n$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/\n\n# [Optional]\n$ helm repo update\n\n# Install the latest version.\n$ helm install koordinator koordinator-sh/koordinator --version 0.5.0\n")),(0,r.kt)("h3",{id:"upgrade-with-helm"},"Upgrade with helm"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-shell"},"# Firstly add koordinator charts repository if you haven't do this.\n$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/\n\n# [Optional]\n$ helm repo update\n\n# Upgrade the latest version.\n$ helm upgrade koordinator koordinator-sh/koordinator --version 0.5.0 [--force]\n")),(0,r.kt)("p",null,"For more details, please refer to the ",(0,r.kt)("a",{parentName:"p",href:"/docs/installation"},"installation manual"),"."),(0,r.kt)("h2",{id:"fine-grained-cpu-orchestration"},"Fine-grained CPU Orchestration"),(0,r.kt)("p",null,"In this version, we introduced a fine-grained CPU orchestration. Pods in the Kubernetes cluster may interfere with\nothers' running when they share the same physical resources and both demand many resources. The sharing of CPU resources\nis almost inevitable. e.g. SMT threads (i.e. logical processors) share execution units of the same core, and cores in\nthe same chip share one last-level cache. The resource contention can slow down the running of these CPU-sensitive\nworkloads, resulting in high response latency (RT)."),(0,r.kt)("p",null,"To improve the performance of CPU-sensitive workloads, koord-scheduler provides a mechanism of fine-grained CPU\norchestration. It enhances the CPU management of Kubernetes and supports detailed NUMA-locality and CPU exclusions."),(0,r.kt)("p",null,"Please check out our ",(0,r.kt)("a",{parentName:"p",href:"/docs/user-manuals/fine-grained-cpu-orchestration"},"user manual")," for a detailed introduction and\ntutorial."),(0,r.kt)("h2",{id:"resource-reservation"},"Resource Reservation"),(0,r.kt)("p",null,"Pods are fundamental units for allocating node resources in Kubernetes, which bind resource requirements with business\nlogic. The scheduler is not able to reserve node resources for specific pods or workloads. We may try using a fake pod\nto prepare resources by the preemption mechanism. However, fake pods can be preempted by any scheduled pods with higher\npriorities, which make resources get scrambled unexpectedly."),(0,r.kt)("p",null,"In Koordinator, a resource reservation mechanism is proposed to enhance scheduling and especially benefits scenarios\nbelow:"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},'Preemption: Existing preemption does not guarantee that only preempting pods can allocate preempted resources. With a\nreservation, the scheduler should be able to "lock" resources preventing from allocation of other pods with the same\nor\nhigher priority.'),(0,r.kt)("li",{parentName:"ol"},"De-scheduling: For the descheduler, it is better to ensure sufficient resources with the reservation before pods get\nrescheduled. Otherwise, rescheduled pods may not be runnable anymore and make the belonging application disrupted."),(0,r.kt)("li",{parentName:"ol"},"Horizontal scaling: Using reservation to achieve more deterministic horizontal scaling. e.g. Submit a reservation and\nmake sure it is available before scaling up replicas."),(0,r.kt)("li",{parentName:"ol"},"Resource Pre-allocation: Sometimes we want to pre-allocate node resources for future resource demands even if the\nresources are not currently allocatable. Reservation can help with this and it should make no physical cost.")),(0,r.kt)("p",null,"This feature is still under development. We've finalized the API, feel free to check it out."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},'type Reservation struct {\n    metav1.TypeMeta `json:",inline"`\n    // A Reservation object is non-namespaced.\n    // It can reserve resources for pods of any namespace. Any affinity/anti-affinity of reservation scheduling can be\n    // specified in the pod template.\n    metav1.ObjectMeta `json:"metadata,omitempty"`\n    Spec              ReservationSpec   `json:"spec,omitempty"`\n    Status            ReservationStatus `json:"status,omitempty"`\n}\n\ntype ReservationSpec struct {\n    // Template defines the scheduling requirements (resources, affinities, images, ...) processed by the scheduler just\n    // like a normal pod.\n    // If the `template.spec.nodeName` is specified, the scheduler will not choose another node but reserve resources on\n    // the specified node.\n    Template *corev1.PodTemplateSpec `json:"template,omitempty"`\n    // Specify the owners who can allocate the reserved resources.\n    // Multiple owner selectors and ANDed.\n    Owners []ReservationOwner `json:"owners,omitempty"`\n    // By default, the resources requirements of reservation (specified in `template.spec`) is filtered by whether the\n    // node has sufficient free resources (i.e. ReservationRequest <  NodeFree).\n    // When `preAllocation` is set, the scheduler will skip this validation and allow overcommitment. The scheduled\n    // reservation would be waiting to be available until free resources are sufficient.\n    PreAllocation bool `json:"preAllocation,omitempty"`\n    // Time-to-Live period for the reservation.\n    // `expires` and `ttl` are mutually exclusive. If both `ttl` and `expires` are not specified, a very\n    // long TTL will be picked as default.\n    TTL *metav1.Duration `json:"ttl,omitempty"`\n    // Expired timestamp when the reservation expires.\n    // `expires` and `ttl` are mutually exclusive. Defaults to being set dynamically at runtime based on the `ttl`.\n    Expires *metav1.Time `json:"expires,omitempty"`\n}\n\ntype ReservationStatus struct {\n    // The `phase` indicates whether is reservation is waiting for process (`Pending`), available to allocate\n    // (`Available`) or expired to get cleanup (Expired).\n    Phase ReservationPhase `json:"phase,omitempty"`\n    // The `conditions` indicate the messages of reason why the reservation is still pending.\n    Conditions []ReservationCondition `json:"conditions,omitempty"`\n    // Current resource owners which allocated the reservation resources.\n    CurrentOwners []corev1.ObjectReference `json:"currentOwners,omitempty"`\n}\n\ntype ReservationOwner struct {\n    // Multiple field selectors are ORed.\n    Object        *corev1.ObjectReference         `json:"object,omitempty"`\n    Controller    *ReservationControllerReference `json:"controller,omitempty"`\n    LabelSelector *metav1.LabelSelector           `json:"labelSelector,omitempty"`\n}\n\ntype ReservationControllerReference struct {\n    // Extend with a `namespace` field for reference different namespaces.\n    metav1.OwnerReference `json:",inline"`\n    Namespace             string `json:"namespace,omitempty"`\n}\n\ntype ReservationPhase string\n\nconst (\n    // ReservationPending indicates the Reservation has not been processed by the scheduler or is unschedulable for\n    // some reasons (e.g. the resource requirements cannot get satisfied).\n    ReservationPending ReservationPhase = "Pending"\n    // ReservationAvailable indicates the Reservation is both scheduled and available for allocation.\n    ReservationAvailable ReservationPhase = "Available"\n    // ReservationWaiting indicates the Reservation is scheduled, but the resources to reserve are not ready for\n    // allocation (e.g. in pre-allocation for running pods).\n    ReservationWaiting ReservationPhase = "Waiting"\n    // ReservationExpired indicates the Reservation is expired, which the object is not available to allocate and will\n    // get cleaned in the future.\n    ReservationExpired ReservationPhase = "Expired"\n)\n\ntype ReservationCondition struct {\n    LastProbeTime      metav1.Time `json:"lastProbeTime"`\n    LastTransitionTime metav1.Time `json:"lastTransitionTime"`\n    Reason             string      `json:"reason"`\n    Message            string      `json:"message"`\n}\n')),(0,r.kt)("h2",{id:"qos-manager"},"QoS Manager"),(0,r.kt)("p",null,"Currently, plugins from resmanager in Koordlet are mixed together, they should be classified into two\ncategories: ",(0,r.kt)("inlineCode",{parentName:"p"},"static")," and ",(0,r.kt)("inlineCode",{parentName:"p"},"dynamic"),". Static plugins will be called and run only once when a container created, updated,\nstarted or stopped. However, for dynamic plugins, they may be called and run at any time according the real-time runtime\nstates of node, such as CPU suppress, CPU burst, etc. This proposal only focuses on refactoring dynamic plugins. Take a\nlook at current plugin implementation, there are many function calls to resmanager's methods directly, such as\ncollecting node/pod/container metrics, fetching metadata of node/pod/container, fetching configurations(NodeSLO, etc.).\nIn the feature, we may need a flexible and powerful framework with scalability for special external plugins."),(0,r.kt)("p",null,"The below is directory tree of qos-manager inside koordlet, all existing dynamic plugins(as built-in plugins) will be\nmoved into sub-directory ",(0,r.kt)("inlineCode",{parentName:"p"},"plugins"),"."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"pkg/koordlet/qosmanager/\n                       - manager.go\n                       - context.go   // plugin context\n                       - /plugins/    // built-in plugins\n                                 - /cpubrust/\n                                 - /cpusuppress/\n                                 - /cpuevict/\n                                 - /memoryevict/\n")),(0,r.kt)("p",null,"We only have the proposal in this version. Stay tuned, further implementation is coming soon!"),(0,r.kt)("h2",{id:"multiple-running-hook-modes"},"Multiple Running Hook Modes"),(0,r.kt)("p",null,(0,r.kt)("inlineCode",{parentName:"p"},"Runtime Hooks")," includes a set of plugins which are responsible for the injections of resource isolation parameters\nby pod attribute. When ",(0,r.kt)("inlineCode",{parentName:"p"},"Koord Runtime Proxy")," running as a CRI Proxy, ",(0,r.kt)("inlineCode",{parentName:"p"},"Runtime Hooks")," acts as the backend server. The\nmechanism of CRI Proxy can ensure the consistency of resource parameters during pod lifecycle. However,\n",(0,r.kt)("inlineCode",{parentName:"p"},"Koord Runtime Proxy")," can only hijack CRI requests from kubelet for pods, the consistency of resource parameters in\nQoS class directory cannot be guaranteed. Besides, modification of pod parameters from third-party(e.g. manually) will\nalso break the correctness of hook plugins."),(0,r.kt)("p",null,"Therefore, a standalone running mode with reconciler for ",(0,r.kt)("inlineCode",{parentName:"p"},"Runtime Hooks")," is necessary. Under ",(0,r.kt)("inlineCode",{parentName:"p"},"Standalone")," running\nmode, resource isolation parameters will be injected asynchronously, keeping eventual consistency of the injected\nparameters for pod and QoS class even without ",(0,r.kt)("inlineCode",{parentName:"p"},"Runtime Hook Manager"),"."),(0,r.kt)("h2",{id:"some-minor-works"},"Some minor works"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},"We fix the backward compatibility issues reported by our users\nin ",(0,r.kt)("a",{parentName:"li",href:"https://github.com/koordinator-sh/koordinator/issues/310"},"here"),". If you've ever encountered similar problem,\nplease upgrade to the latest version."),(0,r.kt)("li",{parentName:"ol"},"Two more interfaces were added into runtime-proxy. One is ",(0,r.kt)("inlineCode",{parentName:"li"},"PreCreateContainerHook"),", which could set container\nresources setting before creating, and the other is ",(0,r.kt)("inlineCode",{parentName:"li"},"PostStopSandboxHook"),", which could do the resource setting\ngarbage collecting before pods deleted."),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("inlineCode",{parentName:"li"},"cpuacct.usage")," is more precise than ",(0,r.kt)("inlineCode",{parentName:"li"},"cpuacct.stat"),", and ",(0,r.kt)("inlineCode",{parentName:"li"},"cpuacct.stat")," is in USER_HZ unit, while ",(0,r.kt)("inlineCode",{parentName:"li"},"cpuacct.usage")," is\nnanoseconds. After thorough discussion, we were on the same page that we replace ",(0,r.kt)("inlineCode",{parentName:"li"},"cpuacct.stat")," with ",(0,r.kt)("inlineCode",{parentName:"li"},"cpuacct.usage"),"\nin koordlet."),(0,r.kt)("li",{parentName:"ol"},"Koordlet needs to keep fetching data from kubelet. Before this version, we only support accessing kubelet via\nread-only port over HTTP. Due to security concern, we've enabled HTTPS access in this version. For more details,\nplease refer to this ",(0,r.kt)("a",{parentName:"li",href:"https://github.com/koordinator-sh/koordinator/pull/320"},"PR"),".")),(0,r.kt)("h2",{id:"whats-coming-next-in-koordinator"},"What\u2019s coming next in Koordinator"),(0,r.kt)("p",null,"Don't forget that Koordinator is developed in the open. You can check out our Github milestone to know more about what\nis happening and what we have planned. For more details, please refer to\nour ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/koordinator-sh/koordinator/milestones"},"milestone"),". Hope it helps!"))}u.isMDXComponent=!0}}]);
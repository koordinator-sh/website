"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[5159],{3905:(e,t,n)=>{n.d(t,{Zo:()=>u,kt:()=>h});var o=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,o)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,o,r=function(e,t){if(null==e)return{};var n,o,r={},a=Object.keys(e);for(o=0;o<a.length;o++)n=a[o],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(o=0;o<a.length;o++)n=a[o],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var s=o.createContext({}),d=function(e){var t=o.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},u=function(e){var t=d(e.components);return o.createElement(s.Provider,{value:t},e.children)},c="mdxType",p={inlineCode:"code",wrapper:function(e){var t=e.children;return o.createElement(o.Fragment,{},t)}},m=o.forwardRef((function(e,t){var n=e.components,r=e.mdxType,a=e.originalType,s=e.parentName,u=l(e,["components","mdxType","originalType","parentName"]),c=d(n),m=r,h=c["".concat(s,".").concat(m)]||c[m]||p[m]||a;return n?o.createElement(h,i(i({ref:t},u),{},{components:n})):o.createElement(h,i({ref:t},u))}));function h(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var a=n.length,i=new Array(a);i[0]=m;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l[c]="string"==typeof e?e:r,i[1]=l;for(var d=2;d<a;d++)i[d]=n[d];return o.createElement.apply(null,i)}return o.createElement.apply(null,n)}m.displayName="MDXCreateElement"},2895:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>i,default:()=>p,frontMatter:()=>a,metadata:()=>l,toc:()=>d});var o=n(7462),r=(n(7294),n(3905));const a={},i="Developing Custom Plugins in koord-descheduler",l={unversionedId:"best-practices/develop-custom-deschedule-plugins",id:"best-practices/develop-custom-deschedule-plugins",title:"Developing Custom Plugins in koord-descheduler",description:"Background",source:"@site/docs/best-practices/develop-custom-deschedule-plugins.md",sourceDirName:"best-practices",slug:"/best-practices/develop-custom-deschedule-plugins",permalink:"/docs/next/best-practices/develop-custom-deschedule-plugins",draft:!1,editUrl:"https://github.com/koordinator-sh/koordinator.sh/edit/main/docs/best-practices/develop-custom-deschedule-plugins.md",tags:[],version:"current",lastUpdatedBy:"Tao Song",lastUpdatedAt:1739859750,formattedLastUpdatedAt:"Feb 18, 2025",frontMatter:{},sidebar:"docs",previous:{title:"Network Bandwidth Limitation Using Terway QoS",permalink:"/docs/next/best-practices/network-qos-with-terwayqos"},next:{title:"GPU & RDMA Joint Allocation",permalink:"/docs/next/best-practices/gpu-and-rdma-joint-allocation"}},s={},d=[{value:"Background",id:"background",level:2},{value:"Development Environment",id:"development-environment",level:2},{value:"Framework Overview",id:"framework-overview",level:2},{value:"Development Process",id:"development-process",level:2},{value:"Integration and Deployment Testing",id:"integration-and-deployment-testing",level:2},{value:"Additional Information",id:"additional-information",level:2},{value:"References",id:"references",level:2}],u={toc:d},c="wrapper";function p(e){let{components:t,...n}=e;return(0,r.kt)(c,(0,o.Z)({},u,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"developing-custom-plugins-in-koord-descheduler"},"Developing Custom Plugins in koord-descheduler"),(0,r.kt)("h2",{id:"background"},"Background"),(0,r.kt)("p",null,"Koordinator Descheduler (koord-descheduler) helps manage cluster resource utilization by descheduling Pods to address resource contention, load imbalance, and compliance issues. Built on the ",(0,r.kt)("a",{parentName:"p",href:"https://koordinator.sh"},"Koordinator Descheduler Framework"),", it abstracts descheduling strategies as plugins, providing users with an easy way to develop custom descheduling strategies. Users only need to implement a few simple interfaces to add custom descheduling strategies as needed."),(0,r.kt)("h2",{id:"development-environment"},"Development Environment"),(0,r.kt)("p",null,"This document is based on the following software versions:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"Koordinator v1.5.0",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"branch: main"),(0,r.kt)("li",{parentName:"ul"},"commit: b5b8abfe5ff59343f47c6379546247b8c5fa0abe"))),(0,r.kt)("li",{parentName:"ul"},"Kubernetes v1.28.7"),(0,r.kt)("li",{parentName:"ul"},"Go 1.20")),(0,r.kt)("h2",{id:"framework-overview"},"Framework Overview"),(0,r.kt)("p",null,"The Koordinator Descheduler Framework abstracts descheduling plugins as Plugin interfaces, which only need to implement the ",(0,r.kt)("inlineCode",{parentName:"p"},"Name()")," method to uniquely identify the plugin using a string. This manages whether the plugin is enabled and matches the plugin's configuration parameters."),(0,r.kt)("p",null,"Descheduling plugins are divided into ",(0,r.kt)("inlineCode",{parentName:"p"},"DeschedulePlugin"),"and ",(0,r.kt)("inlineCode",{parentName:"p"},"BalancePlugin")," types. Each plugin can implement specific descheduling logic through the ",(0,r.kt)("inlineCode",{parentName:"p"},"Deschedule()")," or ",(0,r.kt)("inlineCode",{parentName:"p"},"Balance()")," methods. Each descheduling plugin selects Pods to be evicted according to its eviction rules, filters, pre-eviction checks, and sorts them, and finally requests the Pod Evictor to evict the target Pods. The plugin interfaces are defined in the ",(0,r.kt)("inlineCode",{parentName:"p"},"pkg/descheduler/framework/types.go")," file."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-go"},"// Plugin is the parent type for all the descheduling framework plugins.\ntype Plugin interface {\n    Name() string\n}\n\ntype DeschedulePlugin interface {\n    Plugin\n    Deschedule(ctx context.Context, nodes []*corev1.Node) *Status\n}\n\ntype BalancePlugin interface {\n    Plugin\n    Balance(ctx context.Context, nodes []*corev1.Node) *Status\n}\n")),(0,r.kt)("p",null,"Each descheduling plugin is managed by the ",(0,r.kt)("inlineCode",{parentName:"p"},"Registry")," in the Descheduler Framework. The Descheduler Framework reads the user configuration and determines whether to instantiate the plugin based on the enabled plugin names.\nThe Descheduler Framework arranges the execution order of all plugins. It ensures that all enabled plugins' ",(0,r.kt)("inlineCode",{parentName:"p"},"Deschedule()")," methods are executed first in each cycle, followed by the ",(0,r.kt)("inlineCode",{parentName:"p"},"Balance()")," methods. Although it is possible for a plugin to implement both methods, it is not recommended."),(0,r.kt)("h2",{id:"development-process"},"Development Process"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("strong",{parentName:"li"},"Determine Plugin Type"),"\nTo prevent the uniformity achieved by ",(0,r.kt)("inlineCode",{parentName:"li"},"Balance")," plugins from being disrupted by subsequent ",(0,r.kt)("inlineCode",{parentName:"li"},"Deschedule")," plugins, the Descheduler Framework always executes all ",(0,r.kt)("inlineCode",{parentName:"li"},"Deschedule()")," methods first. Based on this execution order, please confirm which plugin type fits your custom logic to ensure it executes as expected.",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("strong",{parentName:"li"},"Deschedule Plugins"),": Checks each Pod against current scheduling constraints and evicts them one by one if they no longer meet the constraints (e.g., evicting Pods that no longer satisfy node affinity or anti-affinity rules)."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("strong",{parentName:"li"},"Balance Plugins"),": Optimizes the distribution of all or a group of Pods across the cluster and decides which Pods to evict (e.g., evicting Pods from load hotspots based on actual node utilization)."))),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("strong",{parentName:"li"},"Write Plugin Code"),"\nAdd your plugin directory under ",(0,r.kt)("inlineCode",{parentName:"li"},"/pkg/descheduler/framework/plugins"),". It's recommended to name the directory after the plugin or use a phrase that describes its function (e.g., ",(0,r.kt)("inlineCode",{parentName:"li"},"loadaware"),"). In the plugin directory, write your plugin code. For example, here is the code for the ",(0,r.kt)("inlineCode",{parentName:"li"},"LowNodeLoad")," plugin in ",(0,r.kt)("inlineCode",{parentName:"li"},"/pkg/descheduler/framework/plugins/loadaware/low_node_load.go"),":")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-go"},'const (\n    LowNodeLoadName = "LowNodeLoad"\n)\n\nvar _ framework.BalancePlugin = &LowNodeLoad{}\n\ntype LowNodeLoad struct {\n    handle               framework.Handle\n    podFilter            framework.FilterFunc\n    nodeMetricLister     koordslolisters.NodeMetricLister\n    args                 *deschedulerconfig.LowNodeLoadArgs\n    nodeAnomalyDetectors *gocache.Cache\n}\n\nfunc NewLowNodeLoad(args runtime.Object, handle framework.Handle) (framework.Plugin, error) {\n    return &LowNodeLoad{\n        handle:               handle,\n        nodeMetricLister:     nodeMetricInformer.Lister(),\n        args:                 loadLoadUtilizationArgs,\n        podFilter:            podFilter,\n        nodeAnomalyDetectors: nodeAnomalyDetectors,\n    }, nil\n}\n\nfunc (pl *LowNodeLoad) Name() string {\n    return LowNodeLoadName\n}\n\nfunc (pl *LowNodeLoad) Balance(ctx context.Context, nodes []*corev1.Node) *framework.Status {\n    return nil\n}\n')),(0,r.kt)("p",null,"This plugin becomes a ",(0,r.kt)("inlineCode",{parentName:"p"},"BalancePlugin")," type within the Descheduler Framework by implementing the ",(0,r.kt)("inlineCode",{parentName:"p"},"Name()")," and ",(0,r.kt)("inlineCode",{parentName:"p"},"Balance()")," methods."),(0,r.kt)("ol",{start:3},(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("strong",{parentName:"li"},"Register Plugin with Framework"),"\nThe Descheduler Framework manages all plugins through the ",(0,r.kt)("inlineCode",{parentName:"li"},"Registry"),", a map where keys are plugin name strings and values are factory methods for instantiating the plugins. The registry code is defined in ",(0,r.kt)("inlineCode",{parentName:"li"},"/pkg/descheduler/framework/runtime/registry.go"),":")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-go"},"type Registry map[string]PluginFactory\n\ntype PluginFactory func(args runtime.Object, handle framework.Handle) (framework.Plugin, error)\n")),(0,r.kt)("p",null,"The ",(0,r.kt)("inlineCode",{parentName:"p"},"args")," parameter typically represents the configurable variables that your plugin offers to users. After the Descheduler Framework reads the user configuration from the ConfigMap, it parses the configuration for each plugin and converts it into a ",(0,r.kt)("inlineCode",{parentName:"p"},"runtime.Object")," type. The ",(0,r.kt)("inlineCode",{parentName:"p"},"handle")," parameter is a service handle provided by the Descheduler Framework to assist plugins in their functionality. Common services include a globally unique Evictor, etc.\nYou need to write an initialization method of the ",(0,r.kt)("inlineCode",{parentName:"p"},"PluginFactory")," type for your custom plugin to register it with the Descheduler Framework. For example, the ",(0,r.kt)("inlineCode",{parentName:"p"},"LowNodeLoad")," plugin implements the ",(0,r.kt)("inlineCode",{parentName:"p"},"NewLowNodeLoad")," method to accept user-defined parameters for plugin instantiation:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-go"},"// NewLowNodeLoad builds plugin from its arguments while passing a handle\nfunc NewLowNodeLoad(args runtime.Object, handle framework.Handle) (framework.Plugin, error) {\n    // convert args to internal type\n    loadLoadUtilizationArgs, ok := args.(*deschedulerconfig.LowNodeLoadArgs)\n    \n    return &LowNodeLoad{\n        handle:               handle,\n        ...\n        args:                 loadLoadUtilizationArgs,\n        ...\n    }, nil\n}\n")),(0,r.kt)("p",null,"To register your custom plugin with the Descheduler Framework, add it to the ",(0,r.kt)("inlineCode",{parentName:"p"},"InTreeRegistry"),". For example, the ",(0,r.kt)("inlineCode",{parentName:"p"},"LowNodeLoad")," plugin is registered as follows in the ",(0,r.kt)("inlineCode",{parentName:"p"},"/pkg/descheduler/framework/plugins/registry.go")," file:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-go"},"func NewInTreeRegistry() runtime.Registry {\n    registry := runtime.Registry{\n        loadaware.LowNodeLoadName: loadaware.NewLowNodeLoad,\n    }\n    kubernetes.SetupK8sDeschedulerPlugins(registry)\n    return registry\n}\n")),(0,r.kt)("ol",{start:4},(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("strong",{parentName:"li"},"Provide Configurable Parameters for Plugin (Optional)"),"\nWe recommend providing configurable parameters for your plugin to customize its functionality. These parameters allow users to configure the plugin in the ",(0,r.kt)("a",{parentName:"li",href:"https://koordinator.sh/configuration"},"DeschedulerConfiguration API"),". Add parameter code in the ",(0,r.kt)("inlineCode",{parentName:"li"},"/pkg/descheduler/apis/config")," directory. Define internal types in this directory and external types in the ",(0,r.kt)("inlineCode",{parentName:"li"},"v1alpha2")," directory, using JSON tags to provide ConfigMap parsing for users.")),(0,r.kt)("p",null,"Example internal type in ",(0,r.kt)("inlineCode",{parentName:"p"},"types_loadaware.go"),":"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-go"},"type LowNodeLoadArgs struct {\n    ...\n    \n    // HighThresholds defines the target usage threshold of node resources\n    HighThresholds ResourceThresholds\n\n    // LowThresholds defines the low usage threshold of node resources\n    LowThresholds ResourceThresholds\n    \n    ...\n}\n")),(0,r.kt)("p",null,"Example external type in ",(0,r.kt)("inlineCode",{parentName:"p"},"v1alpha2/types_loadaware.go"),":"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-go"},'type LowNodeLoadArgs struct {\n    ...\n    \n    // HighThresholds defines the target usage threshold of node resources\n    HighThresholds ResourceThresholds `json:"highThresholds,omitempty"`\n\n    // LowThresholds defines the low usage threshold of node resources\n    LowThresholds ResourceThresholds `json:"lowThresholds,omitempty"`\n\n    ...\n}\n')),(0,r.kt)("h2",{id:"integration-and-deployment-testing"},"Integration and Deployment Testing"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},"We recommend writing unit tests for your code to improve overall quality."),(0,r.kt)("li",{parentName:"ol"},"Once your custom plugin is complete, you can compile ",(0,r.kt)("inlineCode",{parentName:"li"},"koord-descheduler")," using the following command from the Koordinator project root directory:")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"make build-koord-descheduler\n")),(0,r.kt)("p",null,"You can also create a Docker image for ",(0,r.kt)("inlineCode",{parentName:"p"},"koord-descheduler")," and deploy it directly to your K8S cluster:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"make docker-build-koord-descheduler\n")),(0,r.kt)("p",null,"Check the Makefile for supported shortcut commands. The Dockerfile for ",(0,r.kt)("inlineCode",{parentName:"p"},"koord-descheduler")," is located in the ",(0,r.kt)("inlineCode",{parentName:"p"},"/docker")," directory."),(0,r.kt)("h2",{id:"additional-information"},"Additional Information"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("strong",{parentName:"li"},"Custom Evictor Plugins"),"\nThe Descheduler Framework also supports custom Evictor plugins. The development process is similar, and the Evictor interface is defined as follows:")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-go"},"type Evictor interface {\n    Plugin\n    Filter(pod *corev1.Pod) bool\n    Evict(ctx context.Context, pod *corev1.Pod, evictOptions EvictOptions) bool\n}\n")),(0,r.kt)("ol",{start:2},(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("strong",{parentName:"li"},"Contributing to the Community"),"\nWe welcome contributions of your custom plugins to the Koordinator community, helping your work benefit more users. Please review the ",(0,r.kt)("a",{parentName:"li",href:"https://koordinator.sh/code-of-conduct"},"Koordinator's Code of Conduct")," and ",(0,r.kt)("a",{parentName:"li",href:"https://koordinator.sh/contributing"},"Contributing to Koordinator"),"to ensure your code has a good style and sufficient unit tests.")),(0,r.kt)("h2",{id:"references"},"References"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://koordinator.sh"},"Koordinator Descheduler Framework")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://koordinator.sh/configuration"},"Koordinator Configuration")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://koordinator.sh/code-of-conduct"},"Koordinator's Code of Conduct")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://koordinator.sh/contributing"},"Contributing to Koordinator"))))}p.isMDXComponent=!0}}]);
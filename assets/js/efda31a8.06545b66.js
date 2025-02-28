"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[5018],{3905:(e,t,n)=>{n.d(t,{Zo:()=>d,kt:()=>k});var r=n(7294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},i=Object.keys(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var s=r.createContext({}),u=function(e){var t=r.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},d=function(e){var t=u(e.components);return r.createElement(s.Provider,{value:t},e.children)},p="mdxType",c={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},m=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,i=e.originalType,s=e.parentName,d=l(e,["components","mdxType","originalType","parentName"]),p=u(n),m=o,k=p["".concat(s,".").concat(m)]||p[m]||c[m]||i;return n?r.createElement(k,a(a({ref:t},d),{},{components:n})):r.createElement(k,a({ref:t},d))}));function k(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var i=n.length,a=new Array(i);a[0]=m;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l[p]="string"==typeof e?e:o,a[1]=l;for(var u=2;u<i;u++)a[u]=n[u];return r.createElement.apply(null,a)}return r.createElement.apply(null,n)}m.displayName="MDXCreateElement"},2805:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>a,default:()=>c,frontMatter:()=>i,metadata:()=>l,toc:()=>u});var r=n(7462),o=(n(7294),n(3905));const i={},a="RuntimeProxy",l={unversionedId:"designs/runtime-proxy",id:"version-v1.6/designs/runtime-proxy",title:"RuntimeProxy",description:"Summary",source:"@site/versioned_docs/version-v1.6/designs/runtime-proxy.md",sourceDirName:"designs",slug:"/designs/runtime-proxy",permalink:"/docs/designs/runtime-proxy",draft:!1,editUrl:"https://github.com/koordinator-sh/koordinator.sh/edit/main/docs/designs/runtime-proxy.md",tags:[],version:"v1.6",lastUpdatedBy:"wangjianyu",lastUpdatedAt:1740707377,formattedLastUpdatedAt:"Feb 28, 2025",frontMatter:{},sidebar:"docs",previous:{title:"Koordlet",permalink:"/docs/designs/koordlet-overview"},next:{title:"NRI Mode Resource Management",permalink:"/docs/designs/nri-mode-resource-management"}},s={},u=[{value:"Summary",id:"summary",level:2},{value:"Goals",id:"goals",level:2},{value:"Components",id:"components",level:2},{value:"KoordRuntimeProxy",id:"koordruntimeproxy",level:3},{value:"RuntimePlugins",id:"runtimeplugins",level:3},{value:"Architecture",id:"architecture",level:2},{value:"CRI Server",id:"cri-server",level:3},{value:"Plugins Manager",id:"plugins-manager",level:3},{value:"Runtime Dispatcher",id:"runtime-dispatcher",level:3},{value:"Store",id:"store",level:3},{value:"Runtime Plugins",id:"runtime-plugins",level:2},{value:"How to Register Plugins",id:"how-to-register-plugins",level:3},{value:"Protocols between KoordRuntimeProxy and Plugins",id:"protocols-between-koordruntimeproxy-and-plugins",level:3},{value:"Examples for Runtime Plugins",id:"examples-for-runtime-plugins",level:3},{value:"Installation",id:"installation",level:2},{value:"Installing from sources",id:"installing-from-sources",level:3},{value:"Installing from packages",id:"installing-from-packages",level:3},{value:"Setup Kubelet",id:"setup-kubelet",level:3},{value:"Setup KoordRuntimeProxy",id:"setup-koordruntimeproxy",level:3}],d={toc:u},p="wrapper";function c(e){let{components:t,...i}=e;return(0,o.kt)(p,(0,r.Z)({},d,i,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"runtimeproxy"},"RuntimeProxy"),(0,o.kt)("h2",{id:"summary"},"Summary"),(0,o.kt)("p",null,"KoordRuntimeProxy acts as a proxy between kubelet and containerd(dockerd under dockershim scenario), which is designed to\nintercept CRI request, and apply some resource management policies, such as setting different cgroup parameters by pod\npriorities under hybrid workload orchestration scenario, applying new isolation policies for latest Linux kernel,\nCPU architecture, and etc."),(0,o.kt)("p",null,"There are two components involved, KoordRuntimeProxy and RuntimePlugins."),(0,o.kt)("p",null,(0,o.kt)("img",{alt:"image",src:n(4186).Z,width:"431",height:"303"})),(0,o.kt)("h2",{id:"goals"},"Goals"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},"Enhance resource management for QoS based Scheduling."),(0,o.kt)("li",{parentName:"ul"},"Provide interface for new isolation features which are not supported by CRI.")),(0,o.kt)("h2",{id:"components"},"Components"),(0,o.kt)("h3",{id:"koordruntimeproxy"},"KoordRuntimeProxy"),(0,o.kt)("p",null,"KoordRuntimeProxy is in charge of intercepting request during pod's lifecycle, such as RunPodSandbox, CreateContainer etc.,\nand then calling RuntimePlugins to do resource isolation policies before transferring request to backend containerd(dockerd)\nand after transferring response to kubelet. KoordRuntimeProxy provides an isolation-policy-execution framework which allows\ncustomized plugins registered to do specified isolation policies, these plugins are called RuntimePlugins.\nKoordRuntimeProxy itself does NOT do any isolation policies."),(0,o.kt)("h3",{id:"runtimeplugins"},"RuntimePlugins"),(0,o.kt)("p",null,"RuntimePlugins register events(RunPodSandbox etc.) to KoordRuntimeProxy and would receive notifications when events happen.\nRuntimePlugins should complete resource isolation policies basing on the notification message, and then response\nKoordRuntimeProxy, KoordRuntimeProxy would decide to transfer request to backend containerd or discard request according to\nplugins' response."),(0,o.kt)("p",null,"If no RuntimePlugins registered, KoordRuntimeProxy would become a transparent proxy between kubelet and containerd."),(0,o.kt)("h2",{id:"architecture"},"Architecture"),(0,o.kt)("p",null,(0,o.kt)("img",{alt:"image",src:n(8115).Z,width:"551",height:"262"})),(0,o.kt)("p",null,"There are 4 main components for KoordRuntimeProxy."),(0,o.kt)("h3",{id:"cri-server"},"CRI Server"),(0,o.kt)("p",null,"As a proxy between kubelet and containerd, KoordRuntimeProxy acts as a CRI server for kubelet(http server under dockershim\nscenario). It should intercept all request from kubelet, and generate protocols for talking with plugins before and\nafter talking with backend containerd(dockerd)"),(0,o.kt)("h3",{id:"plugins-manager"},"Plugins Manager"),(0,o.kt)("p",null,"PluginsManager is in charge of parsing registered plugin info from ",(0,o.kt)("inlineCode",{parentName:"p"},"/etc/runtime/hookserver.d")," dynamically."),(0,o.kt)("h3",{id:"runtime-dispatcher"},"Runtime Dispatcher"),(0,o.kt)("p",null,"RuntimeDispatcher is designed to manage communications with plugins."),(0,o.kt)("h3",{id:"store"},"Store"),(0,o.kt)("p",null,"As a proxy, KoordRuntimeProxy had better be designed as stateless, but sometimes it does NOT work. Take StartContainer hook\nfor example, there exists only containerID in CRI StartContainerRequest, which is not enough for plugins to adapt policies\nsince plugins may not store pod/container info(such as meta, priority) locally. So KoordRuntimeProxy should store pod/container\ninfo during RunPodSandbox/CreateContainer Stage. When StartContainer request comes, KoordRuntimeProxy can get pod/container info\nby containerID, and then call plugins with pod/container info."),(0,o.kt)("p",null,"With store, there would be pod/container info everytime KoordRuntimeProxy calls plugins, so there is no need for plugins to\nstore pod/container info exceptionally, plugins can be designed as stateless."),(0,o.kt)("p",null,"Considering performance, store locates in memory and does not generate external io to disk."),(0,o.kt)("h2",{id:"runtime-plugins"},"Runtime Plugins"),(0,o.kt)("h3",{id:"how-to-register-plugins"},"How to Register Plugins"),(0,o.kt)("p",null,"All the plugin config files should be put to ",(0,o.kt)("inlineCode",{parentName:"p"},"/etc/runtime/hookserver.d")," with ",(0,o.kt)("inlineCode",{parentName:"p"},".json")," suffix. You can register the plugin implemented by koordlet with RuntimeProxy:"),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},"touch /etc/runtime/hookserver.d/koordlet.json"),(0,o.kt)("li",{parentName:"ol"},"Copy the following content into /etc/runtime/hookserver.d/koordlet.json")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},'{\n    "remote-endpoint": "/var/run/koordlet/koordlet.sock",\n    "failure-policy": "Ignore",\n    "runtime-hooks": [\n        "PreRunPodSandbox",\n        "PreCreateContainer",\n        "PreStartContainer"\n    ]\n}\n')),(0,o.kt)("p",null,"There are 3 fields involved:"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},"remote-endpoint: endpoint KoordRuntimeProxy talking with plugin, generated by plugin."),(0,o.kt)("li",{parentName:"ul"},"failure-policy: policy when calling plugin fail, Fail or Ignore, default to Ignore."),(0,o.kt)("li",{parentName:"ul"},"runtime-hooks: currently 7 hook points: ",(0,o.kt)("ol",{parentName:"li"},(0,o.kt)("li",{parentName:"ol"},"PreRunPodSandbox"),(0,o.kt)("li",{parentName:"ol"},"PreCreateContainer"),(0,o.kt)("li",{parentName:"ol"},"PreStartContainer"),(0,o.kt)("li",{parentName:"ol"},"PostStartContainer"),(0,o.kt)("li",{parentName:"ol"},"PreUpdateContainerResources"),(0,o.kt)("li",{parentName:"ol"},"PostStopContainer"),(0,o.kt)("li",{parentName:"ol"},"PostStopPodSandbox")))),(0,o.kt)("p",null,"hook points with prefix 'Pre' means calling plugins before transferring request to contianerd(dockerd).\nhook points with prefix 'Post' means calling plugins after receiving response from containerd(dockerd).\nplugin provider can set any hook combinations to \"runtime-hooks\"."),(0,o.kt)("h3",{id:"protocols-between-koordruntimeproxy-and-plugins"},"Protocols between KoordRuntimeProxy and Plugins"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/koordinator-sh/koordinator/blob/main/apis/runtime/v1alpha1/api.proto"},"Protocols")),(0,o.kt)("h3",{id:"examples-for-runtime-plugins"},"Examples for Runtime Plugins"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/koordinator-sh/koordinator/blob/main/docs/design-archive/koordlet-runtime-hooks.md"},"koordlet-runtime-plugin-design")),(0,o.kt)("h2",{id:"installation"},"Installation"),(0,o.kt)("h3",{id:"installing-from-sources"},"Installing from sources"),(0,o.kt)("p",null,"get sources: ",(0,o.kt)("inlineCode",{parentName:"p"},"git clone https://github.com/koordinator-sh/koordinator.git")),(0,o.kt)("p",null,"build: ",(0,o.kt)("inlineCode",{parentName:"p"},"cd koordinator; make build-koord-runtime-proxy")),(0,o.kt)("h3",{id:"installing-from-packages"},"Installing from packages"),(0,o.kt)("p",null,"Download latest released package from: ",(0,o.kt)("a",{parentName:"p",href:"https://github.com/koordinator-sh/koordinator/releases"},"https://github.com/koordinator-sh/koordinator/releases")),(0,o.kt)("h3",{id:"setup-kubelet"},"Setup Kubelet"),(0,o.kt)("p",null,"Under containerd scenario, to make koord-runtime-proxy a proxy between kubelet and containerd, kubelet parameters should be altered as shown\nbelow:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"kubelet <other options> --container-runtime=remote --container-runtime-endpoint=unix:///var/run/koord-runtimeproxy/runtimeproxy.sock\n")),(0,o.kt)("p",null,"Under docker scenario, to make koord-runtime-proxy a proxy between kubelet and dockerd, kubelet parameters should be altered as shown\nbelow:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"kubelet <other options> --docker-endpoint=unix:///var/run/koord-runtimeproxy/runtimeproxy.sock\n")),(0,o.kt)("h3",{id:"setup-koordruntimeproxy"},"Setup KoordRuntimeProxy"),(0,o.kt)("p",null,"Firstly, please make sure your runtime backend is containerd or dockerd."),(0,o.kt)("p",null,"Under containerd scenario, koord-runtime-proxy can be setup with command:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"koord-runtime-proxy --remote-runtime-service-endpoint=<runtime sockfile path>\n")),(0,o.kt)("p",null,"If containerd listening CRI request on default /var/run/containerd/containerd.sock, koord-runtime-proxy can be setup by:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"koord-runtime-proxy\n")),(0,o.kt)("p",null,"Under docker scenario, koord-runtime-proxy should be setup with the additional parameter ",(0,o.kt)("inlineCode",{parentName:"p"},"--backend-runtime-mode Docker"),",\nand without ",(0,o.kt)("inlineCode",{parentName:"p"},"remote-image-service-endpoint"),":"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"koord-runtime-proxy --backend-runtime-mode=Docker --remote-runtime-service-endpoint=<runtime sockfile path>\n")))}c.isMDXComponent=!0},4186:(e,t,n)=>{n.d(t,{Z:()=>r});const r=n.p+"assets/images/koord-runtime-proxy-architecture-89594d54b7712128b218cd4d611b457f.svg"},8115:(e,t,n)=>{n.d(t,{Z:()=>r});const r=n.p+"assets/images/koord-runtime-proxy-design-25f39892d7bb37cfbdb7138ad76b56ce.svg"}}]);
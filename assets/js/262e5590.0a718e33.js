"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[1652],{3905:(e,t,r)=>{r.d(t,{Zo:()=>s,kt:()=>k});var n=r(7294);function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?a(Object(r),!0).forEach((function(t){o(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):a(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function u(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},a=Object.keys(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}var l=n.createContext({}),p=function(e){var t=n.useContext(l),r=t;return e&&(r="function"==typeof e?e(t):i(i({},t),e)),r},s=function(e){var t=p(e.components);return n.createElement(l.Provider,{value:t},e.children)},d="mdxType",c={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},m=n.forwardRef((function(e,t){var r=e.components,o=e.mdxType,a=e.originalType,l=e.parentName,s=u(e,["components","mdxType","originalType","parentName"]),d=p(r),m=o,k=d["".concat(l,".").concat(m)]||d[m]||c[m]||a;return r?n.createElement(k,i(i({ref:t},s),{},{components:r})):n.createElement(k,i({ref:t},s))}));function k(e,t){var r=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=r.length,i=new Array(a);i[0]=m;var u={};for(var l in t)hasOwnProperty.call(t,l)&&(u[l]=t[l]);u.originalType=e,u[d]="string"==typeof e?e:o,i[1]=u;for(var p=2;p<a;p++)i[p]=r[p];return n.createElement.apply(null,i)}return n.createElement.apply(null,r)}m.displayName="MDXCreateElement"},5025:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>l,contentTitle:()=>i,default:()=>c,frontMatter:()=>a,metadata:()=>u,toc:()=>p});var n=r(7462),o=(r(7294),r(3905));const a={},i="Installation Runtime Proxy",u={unversionedId:"user-manuals/installation-runtime-proxy",id:"user-manuals/installation-runtime-proxy",title:"Installation Runtime Proxy",description:"koord-runtime-proxy acts as a proxy between kubelet and containerd(dockerd under dockershim scenario), which is designed to intercept CRI request, and apply some resource management policies, such as setting different cgroup parameters by pod priorities under hybrid workload orchestration scenario, applying new isolation policies for latest Linux kernel, CPU architecture, and etc.",source:"@site/docs/user-manuals/installation-runtime-proxy.md",sourceDirName:"user-manuals",slug:"/user-manuals/installation-runtime-proxy",permalink:"/docs/next/user-manuals/installation-runtime-proxy",draft:!1,editUrl:"https://github.com/koordinator-sh/koordinator.sh/edit/main/docs/user-manuals/installation-runtime-proxy.md",tags:[],version:"current",lastUpdatedBy:"Fansong Zeng",lastUpdatedAt:1700192566,formattedLastUpdatedAt:"Nov 17, 2023",frontMatter:{}},l={},p=[{value:"1\u3001Get binary",id:"1get-binary",level:2},{value:"2\u3001Setup koord-runtime-proxy",id:"2setup-koord-runtime-proxy",level:2},{value:"3\u3001Setup Kubelet",id:"3setup-kubelet",level:2}],s={toc:p},d="wrapper";function c(e){let{components:t,...r}=e;return(0,o.kt)(d,(0,n.Z)({},s,r,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"installation-runtime-proxy"},"Installation Runtime Proxy"),(0,o.kt)("p",null,"koord-runtime-proxy acts as a proxy between kubelet and containerd(dockerd under dockershim scenario), which is designed to intercept CRI request, and apply some resource management policies, such as setting different cgroup parameters by pod priorities under hybrid workload orchestration scenario, applying new isolation policies for latest Linux kernel, CPU architecture, and etc.\nFor pods that do not want hook servers processing (such as addon pods), you can skip them by adding ",(0,o.kt)("inlineCode",{parentName:"p"},"runtimeproxy.koordinator.sh/skip-hookserver=true")," to the pod label."),(0,o.kt)("p",null,"Currently known features that require RuntimeProxy include:"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"fine-grained-device-scheduling"},"GPU Share env")),(0,o.kt)("li",{parentName:"ul"},"set cpuset before container starting"),(0,o.kt)("li",{parentName:"ul"},"set rdt before container starting")),(0,o.kt)("p",null,"These features will be based on NRI alternatives in the future, ",(0,o.kt)("strong",{parentName:"p"}," if you don't know what you are doing, please do not install this component "),"."),(0,o.kt)("h2",{id:"1get-binary"},"1\u3001Get binary"),(0,o.kt)("p",null,"Download from github releases:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"$ # select the version\n$ wget https://github.com/koordinator-sh/koordinator/releases/download/v1.3.0/koord-runtime-proxy_1.3.0_linux_x86_64 -O koord-runtime-proxy\n$ chmod +x koord-runtime-proxy\n")),(0,o.kt)("p",null,"Or you can build from source:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"$ git clone https://github.com/koordinator-sh/koordinator.git\n$ cd koordinator\n$ make build-koord-runtime-proxy\n")),(0,o.kt)("h2",{id:"2setup-koord-runtime-proxy"},"2\u3001Setup koord-runtime-proxy"),(0,o.kt)("p",null,"Firstly, please make sure your runtime backend is containerd or dockerd."),(0,o.kt)("p",null,"Under containerd scenario, if your containerd listening CRI request on default ",(0,o.kt)("inlineCode",{parentName:"p"},"/var/run/containerd/containerd.sock"),", koord-runtime-proxy can be setup by(no need to set any parameters):"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"koord-runtime-proxy\n")),(0,o.kt)("p",null,"Or koord-runtime-proxy can be setup with command:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"koord-runtime-proxy \\\n   --remote-runtime-service-endpoint=<runtime socketFile path> \\\n   --remote-image-service-endpoint=<image socketFile path>\n")),(0,o.kt)("p",null,"Under docker scenario, koord-runtime-proxy should be setup with the additional parameter ",(0,o.kt)("inlineCode",{parentName:"p"},"--backend-runtime-mode Docker"),", and without ",(0,o.kt)("inlineCode",{parentName:"p"},"remote-image-service-endpoint"),":"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"koord-runtime-proxy \\\n   --backend-runtime-mode=Docker \\\n   --remote-runtime-service-endpoint=<runtime socketFile path>\n")),(0,o.kt)("p",null,"koord-runtime-proxy will listen on ",(0,o.kt)("inlineCode",{parentName:"p"},"/var/run/koord-runtimeproxy/runtimeproxy.sock"),"."),(0,o.kt)("h2",{id:"3setup-kubelet"},"3\u3001Setup Kubelet"),(0,o.kt)("p",null,"To make koord-runtime-proxy a proxy between kubelet and containerd, kubelet parameters should be altered as shown below:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"kubelet <other options> \\\n   --container-runtime=remote \\\n   --container-runtime-endpoint=unix:///var/run/koord-runtimeproxy/runtimeproxy.sock\n")),(0,o.kt)("p",null,"Under docker scenario, to make koord-runtime-proxy a proxy between kubelet and dockerd, kubelet parameters should be altered as shown below:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"kubelet <other options> --docker-endpoint=unix:///var/run/koord-runtimeproxy/runtimeproxy.sock\n")))}c.isMDXComponent=!0}}]);
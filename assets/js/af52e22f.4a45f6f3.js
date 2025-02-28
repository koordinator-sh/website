"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[7591],{3905:(e,r,t)=>{t.d(r,{Zo:()=>p,kt:()=>k});var n=t(7294);function o(e,r,t){return r in e?Object.defineProperty(e,r,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[r]=t,e}function a(e,r){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);r&&(n=n.filter((function(r){return Object.getOwnPropertyDescriptor(e,r).enumerable}))),t.push.apply(t,n)}return t}function i(e){for(var r=1;r<arguments.length;r++){var t=null!=arguments[r]?arguments[r]:{};r%2?a(Object(t),!0).forEach((function(r){o(e,r,t[r])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):a(Object(t)).forEach((function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(t,r))}))}return e}function u(e,r){if(null==e)return{};var t,n,o=function(e,r){if(null==e)return{};var t,n,o={},a=Object.keys(e);for(n=0;n<a.length;n++)t=a[n],r.indexOf(t)>=0||(o[t]=e[t]);return o}(e,r);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)t=a[n],r.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(o[t]=e[t])}return o}var l=n.createContext({}),s=function(e){var r=n.useContext(l),t=r;return e&&(t="function"==typeof e?e(r):i(i({},r),e)),t},p=function(e){var r=s(e.components);return n.createElement(l.Provider,{value:r},e.children)},d="mdxType",c={inlineCode:"code",wrapper:function(e){var r=e.children;return n.createElement(n.Fragment,{},r)}},m=n.forwardRef((function(e,r){var t=e.components,o=e.mdxType,a=e.originalType,l=e.parentName,p=u(e,["components","mdxType","originalType","parentName"]),d=s(t),m=o,k=d["".concat(l,".").concat(m)]||d[m]||c[m]||a;return t?n.createElement(k,i(i({ref:r},p),{},{components:t})):n.createElement(k,i({ref:r},p))}));function k(e,r){var t=arguments,o=r&&r.mdxType;if("string"==typeof e||o){var a=t.length,i=new Array(a);i[0]=m;var u={};for(var l in r)hasOwnProperty.call(r,l)&&(u[l]=r[l]);u.originalType=e,u[d]="string"==typeof e?e:o,i[1]=u;for(var s=2;s<a;s++)i[s]=t[s];return n.createElement.apply(null,i)}return n.createElement.apply(null,t)}m.displayName="MDXCreateElement"},3246:(e,r,t)=>{t.r(r),t.d(r,{assets:()=>l,contentTitle:()=>i,default:()=>c,frontMatter:()=>a,metadata:()=>u,toc:()=>s});var n=t(7462),o=(t(7294),t(3905));const a={},i="Installation Runtime Proxy",u={unversionedId:"user-manuals/installation-runtime-proxy",id:"version-v1.5/user-manuals/installation-runtime-proxy",title:"Installation Runtime Proxy",description:"koord-runtime-proxy acts as a proxy between kubelet and containerd(dockerd under dockershim scenario), which is designed to intercept CRI request, and apply some resource management policies, such as setting different cgroup parameters by pod priorities under hybrid workload orchestration scenario, applying new isolation policies for latest Linux kernel, CPU architecture, and etc.",source:"@site/versioned_docs/version-v1.5/user-manuals/installation-runtime-proxy.md",sourceDirName:"user-manuals",slug:"/user-manuals/installation-runtime-proxy",permalink:"/docs/v1.5/user-manuals/installation-runtime-proxy",draft:!1,editUrl:"https://github.com/koordinator-sh/koordinator.sh/edit/main/docs/user-manuals/installation-runtime-proxy.md",tags:[],version:"v1.5",lastUpdatedBy:"Frame",lastUpdatedAt:1718775971,formattedLastUpdatedAt:"Jun 19, 2024",frontMatter:{},sidebar:"docs",previous:{title:"Performance Collector",permalink:"/docs/v1.5/user-manuals/performance-collector"},next:{title:"Resource Reservation",permalink:"/docs/v1.5/user-manuals/resource-reservation"}},l={},s=[{value:"1\u3001Get binary",id:"1get-binary",level:2},{value:"2\u3001Setup koord-runtime-proxy",id:"2setup-koord-runtime-proxy",level:2},{value:"3\u3001Setup Kubelet",id:"3setup-kubelet",level:2}],p={toc:s},d="wrapper";function c(e){let{components:r,...t}=e;return(0,o.kt)(d,(0,n.Z)({},p,t,{components:r,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"installation-runtime-proxy"},"Installation Runtime Proxy"),(0,o.kt)("p",null,"koord-runtime-proxy acts as a proxy between kubelet and containerd(dockerd under dockershim scenario), which is designed to intercept CRI request, and apply some resource management policies, such as setting different cgroup parameters by pod priorities under hybrid workload orchestration scenario, applying new isolation policies for latest Linux kernel, CPU architecture, and etc.\nFor pods that do not want hook servers processing (such as addon pods), you can skip them by adding ",(0,o.kt)("inlineCode",{parentName:"p"},"runtimeproxy.koordinator.sh/skip-hookserver=true")," to the pod label."),(0,o.kt)("p",null,"Currently known features that require RuntimeProxy include:"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"fine-grained-device-scheduling"},"GPU Share env")),(0,o.kt)("li",{parentName:"ul"},"set cpuset before container starting"),(0,o.kt)("li",{parentName:"ul"},"set rdt before container starting")),(0,o.kt)("p",null,"These features will be based on NRI alternatives in the future, ",(0,o.kt)("strong",{parentName:"p"}," if you don't know what you are doing, please do not install this component "),"."),(0,o.kt)("h2",{id:"1get-binary"},"1\u3001Get binary"),(0,o.kt)("p",null,"Download from github releases:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"$ # select the version\n$ wget https://github.com/koordinator-sh/koordinator/releases/download/v1.3.0/koord-runtime-proxy_1.3.0_linux_x86_64 -O koord-runtime-proxy\n$ chmod +x koord-runtime-proxy\n")),(0,o.kt)("p",null,"Or you can build from source:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"$ git clone https://github.com/koordinator-sh/koordinator.git\n$ cd koordinator\n$ make build-koord-runtime-proxy\n")),(0,o.kt)("h2",{id:"2setup-koord-runtime-proxy"},"2\u3001Setup koord-runtime-proxy"),(0,o.kt)("p",null,"Firstly, please make sure your runtime backend is containerd or dockerd."),(0,o.kt)("p",null,"Under containerd scenario, if your containerd listening CRI request on default ",(0,o.kt)("inlineCode",{parentName:"p"},"/var/run/containerd/containerd.sock"),", koord-runtime-proxy can be setup by(no need to set any parameters):"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"koord-runtime-proxy\n")),(0,o.kt)("p",null,"Or koord-runtime-proxy can be setup with command:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"koord-runtime-proxy \\\n   --remote-runtime-service-endpoint=<runtime socketFile path> \\\n   --remote-image-service-endpoint=<image socketFile path>\n")),(0,o.kt)("p",null,"Under docker scenario, koord-runtime-proxy should be setup with the additional parameter ",(0,o.kt)("inlineCode",{parentName:"p"},"--backend-runtime-mode Docker"),", and without ",(0,o.kt)("inlineCode",{parentName:"p"},"remote-image-service-endpoint"),":"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"koord-runtime-proxy \\\n   --backend-runtime-mode=Docker \\\n   --remote-runtime-service-endpoint=<runtime socketFile path>\n")),(0,o.kt)("p",null,"koord-runtime-proxy will listen on ",(0,o.kt)("inlineCode",{parentName:"p"},"/var/run/koord-runtimeproxy/runtimeproxy.sock"),"."),(0,o.kt)("h2",{id:"3setup-kubelet"},"3\u3001Setup Kubelet"),(0,o.kt)("p",null,"To make koord-runtime-proxy a proxy between kubelet and containerd, kubelet parameters should be altered as shown below:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"# If the kubelet version is less than 1.24:\nkubelet <other options> \\\n   --container-runtime=remote \\\n   --container-runtime-endpoint=unix:///var/run/koord-runtimeproxy/runtimeproxy.sock\n\n# If the kubelet version is greater than or equal to 1.24:\nkubelet <other options> \\\n   --container-runtime-endpoint=unix:///var/run/koord-runtimeproxy/runtimeproxy.sock\n")),(0,o.kt)("p",null,"Under docker scenario, to make koord-runtime-proxy a proxy between kubelet and dockerd, kubelet parameters should be altered as shown below:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"kubelet <other options> --docker-endpoint=unix:///var/run/koord-runtimeproxy/runtimeproxy.sock\n")))}c.isMDXComponent=!0}}]);
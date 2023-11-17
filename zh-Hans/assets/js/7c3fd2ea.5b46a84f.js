"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[3976],{3905:(e,r,t)=>{t.d(r,{Zo:()=>d,kt:()=>k});var n=t(7294);function o(e,r,t){return r in e?Object.defineProperty(e,r,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[r]=t,e}function i(e,r){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);r&&(n=n.filter((function(r){return Object.getOwnPropertyDescriptor(e,r).enumerable}))),t.push.apply(t,n)}return t}function a(e){for(var r=1;r<arguments.length;r++){var t=null!=arguments[r]?arguments[r]:{};r%2?i(Object(t),!0).forEach((function(r){o(e,r,t[r])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):i(Object(t)).forEach((function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(t,r))}))}return e}function u(e,r){if(null==e)return{};var t,n,o=function(e,r){if(null==e)return{};var t,n,o={},i=Object.keys(e);for(n=0;n<i.length;n++)t=i[n],r.indexOf(t)>=0||(o[t]=e[t]);return o}(e,r);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(n=0;n<i.length;n++)t=i[n],r.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(o[t]=e[t])}return o}var l=n.createContext({}),p=function(e){var r=n.useContext(l),t=r;return e&&(t="function"==typeof e?e(r):a(a({},r),e)),t},d=function(e){var r=p(e.components);return n.createElement(l.Provider,{value:r},e.children)},c="mdxType",m={inlineCode:"code",wrapper:function(e){var r=e.children;return n.createElement(n.Fragment,{},r)}},s=n.forwardRef((function(e,r){var t=e.components,o=e.mdxType,i=e.originalType,l=e.parentName,d=u(e,["components","mdxType","originalType","parentName"]),c=p(t),s=o,k=c["".concat(l,".").concat(s)]||c[s]||m[s]||i;return t?n.createElement(k,a(a({ref:r},d),{},{components:t})):n.createElement(k,a({ref:r},d))}));function k(e,r){var t=arguments,o=r&&r.mdxType;if("string"==typeof e||o){var i=t.length,a=new Array(i);a[0]=s;var u={};for(var l in r)hasOwnProperty.call(r,l)&&(u[l]=r[l]);u.originalType=e,u[c]="string"==typeof e?e:o,a[1]=u;for(var p=2;p<i;p++)a[p]=t[p];return n.createElement.apply(null,a)}return n.createElement.apply(null,t)}s.displayName="MDXCreateElement"},1564:(e,r,t)=>{t.r(r),t.d(r,{assets:()=>l,contentTitle:()=>a,default:()=>m,frontMatter:()=>i,metadata:()=>u,toc:()=>p});var n=t(7462),o=(t(7294),t(3905));const i={},a="\u5b89\u88c5 koord-runtime-proxy",u={unversionedId:"user-manuals/installation-runtime-proxy",id:"user-manuals/installation-runtime-proxy",title:"\u5b89\u88c5 koord-runtime-proxy",description:"koord-runtime-proxy \u5145\u5f53 Kubelet \u548c Containerd \u4e4b\u95f4\u7684\u4ee3\u7406\uff08Dockershim \u573a\u666f\u4e0b\u7684 Dockerd\uff09\uff0c\u65e8\u5728\u62e6\u622a CRI \u8bf7\u6c42, \u5e76\u5e94\u7528\u4e00\u4e9b\u8d44\u6e90\u7ba1\u7406\u7b56\u7565\uff0c\u6bd4\u5982\u5728\u6df7\u5408\u5de5\u4f5c\u8d1f\u8f7d\u7f16\u6392\u573a\u666f\u4e0b\u901a\u8fc7 Pod \u4f18\u5148\u7ea7\u8bbe\u7f6e\u4e0d\u540c\u7684 CGroup \u53c2\u6570\uff0c\u4e3a\u6700\u65b0\u7684 Linux \u5185\u6838\u5e94\u7528\u65b0\u7684\u9694\u79bb\u7b56\u7565, CPU \u67b6\u6784\u7b49\u7b49\u3002",source:"@site/i18n/zh-Hans/docusaurus-plugin-content-docs/current/user-manuals/installation-runtime-proxy.md",sourceDirName:"user-manuals",slug:"/user-manuals/installation-runtime-proxy",permalink:"/zh-Hans/docs/next/user-manuals/installation-runtime-proxy",draft:!1,editUrl:"https://github.com/koordinator-sh/koordinator.sh/edit/main/docs/user-manuals/installation-runtime-proxy.md",tags:[],version:"current",lastUpdatedBy:"Fansong Zeng",lastUpdatedAt:1700192566,formattedLastUpdatedAt:"2023\u5e7411\u670817\u65e5",frontMatter:{}},l={},p=[{value:"1\u3001\u4e0b\u8f7d\u4e8c\u8fdb\u5236\u6587\u4ef6",id:"1\u4e0b\u8f7d\u4e8c\u8fdb\u5236\u6587\u4ef6",level:2},{value:"2\u3001\u8bbe\u7f6e koord-runtime-proxy",id:"2\u8bbe\u7f6e-koord-runtime-proxy",level:2},{value:"3\u3001\u8bbe\u7f6e Kubelet",id:"3\u8bbe\u7f6e-kubelet",level:2}],d={toc:p},c="wrapper";function m(e){let{components:r,...t}=e;return(0,o.kt)(c,(0,n.Z)({},d,t,{components:r,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"\u5b89\u88c5-koord-runtime-proxy"},"\u5b89\u88c5 koord-runtime-proxy"),(0,o.kt)("p",null,"koord-runtime-proxy \u5145\u5f53 Kubelet \u548c Containerd \u4e4b\u95f4\u7684\u4ee3\u7406\uff08Dockershim \u573a\u666f\u4e0b\u7684 Dockerd\uff09\uff0c\u65e8\u5728\u62e6\u622a CRI \u8bf7\u6c42, \u5e76\u5e94\u7528\u4e00\u4e9b\u8d44\u6e90\u7ba1\u7406\u7b56\u7565\uff0c\u6bd4\u5982\u5728\u6df7\u5408\u5de5\u4f5c\u8d1f\u8f7d\u7f16\u6392\u573a\u666f\u4e0b\u901a\u8fc7 Pod \u4f18\u5148\u7ea7\u8bbe\u7f6e\u4e0d\u540c\u7684 CGroup \u53c2\u6570\uff0c\u4e3a\u6700\u65b0\u7684 Linux \u5185\u6838\u5e94\u7528\u65b0\u7684\u9694\u79bb\u7b56\u7565, CPU \u67b6\u6784\u7b49\u7b49\u3002"),(0,o.kt)("p",null,"\u5f53\u524d\u5df2\u77e5\u4ee5\u4e0b\u7684\u7684\u529f\u80fd\u4f9d\u8d56\u8be5\u7ec4\u4ef6:"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"fine-grained-device-scheduling"},"GPU Share env")),(0,o.kt)("li",{parentName:"ul"},"\u5728\u5bb9\u5668\u542f\u52a8\u524d\u8bbe\u7f6e cpuset"),(0,o.kt)("li",{parentName:"ul"},"\u5728\u5bb9\u5668\u542f\u52a8\u524d\u8bbe\u7f6e rdt \u76f8\u5173\u53c2\u6570")),(0,o.kt)("p",null,"\u672a\u6765\uff0c\u8fd9\u4e9b\u529f\u80fd\u5c06\u4f7f\u7528 NRI \u65b9\u6848\u66ff\u4ee3\uff0c",(0,o.kt)("strong",{parentName:"p"}," \u5982\u679c\u4f60\u4e0d\u662f\u975e\u5e38\u786e\u4fe1\u81ea\u5df1\u5728\u505a\u4ec0\u4e48\uff0c\u8bf7\u4e0d\u8981\u5b89\u88c5\u8be5\u7ec4\u4ef6 "),"\u3002"),(0,o.kt)("h2",{id:"1\u4e0b\u8f7d\u4e8c\u8fdb\u5236\u6587\u4ef6"},"1\u3001\u4e0b\u8f7d\u4e8c\u8fdb\u5236\u6587\u4ef6"),(0,o.kt)("p",null,"\u4ece Github \u4e0b\u8f7d\uff1a"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"$ # select the version\n$ wget https://github.com/koordinator-sh/koordinator/releases/download/v1.3.0/koord-runtime-proxy_1.3.0.linux_x86_64 -O koord-runtime-proxy\n$ chmod +x koord-runtime-proxy\n")),(0,o.kt)("p",null,"\u6216\u8005\uff0c\u4f60\u53ef\u4ee5\u4ece\u6e90\u4ee3\u7801\u5f00\u59cb\u6784\u5efa\uff1a"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"$ git clone https://github.com/koordinator-sh/koordinator.git\n$ cd koordinator\n$ make build-koord-runtime-proxy\n")),(0,o.kt)("h2",{id:"2\u8bbe\u7f6e-koord-runtime-proxy"},"2\u3001\u8bbe\u7f6e koord-runtime-proxy"),(0,o.kt)("p",null,"\u9996\u5148\uff0c\u8bf7\u786e\u4fdd\u4f60\u7684\u8fd0\u884c\u65f6\u540e\u7aef\u662f Containerd \u6216 Dockerd\u3002"),(0,o.kt)("p",null,"\u5728 Containerd \u573a\u666f\u4e0b\uff0c\u5982\u679c Containerd \u5728\u9ed8\u8ba4\u7684 ",(0,o.kt)("inlineCode",{parentName:"p"},"/var/run/containerd/containerd.sock")," \u76d1\u542c CRI \u8bf7\u6c42\uff0ckoord-runtime-proxy \u53ef\u4ee5\u8fd9\u6837\u8bbe\u7f6e(\u65e0\u9700\u4efb\u4f55\u53c2\u6570)\uff1a"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"koord-runtime-proxy\n")),(0,o.kt)("p",null,"\u6216\u8005\u4f7f\u7528\u4ee5\u4e0b\u547d\u4ee4\u8bbe\u7f6e\uff1a"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"koord-runtime-proxy \\\n   --remote-runtime-service-endpoint=<runtime socketFile path> \\\n   --remote-image-service-endpoint=<image socketFile path>\n")),(0,o.kt)("p",null,"\u5728 Docker \u7684\u573a\u666f\u4e0b\uff0ckoord-runtime-proxy \u5e94\u8be5\u4f7f\u7528\u9644\u52a0\u53c2\u6570\u8bbe\u7f6e ",(0,o.kt)("inlineCode",{parentName:"p"},"--backend-runtime-mode Docker"),"\uff0c\u65e0\u9700 ",(0,o.kt)("inlineCode",{parentName:"p"},"remote-image-service-endpoint"),":"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"koord-runtime-proxy \\\n   --backend-runtime-mode=Docker \\\n   --remote-runtime-service-endpoint=<runtime socketFile path>\n")),(0,o.kt)("p",null,"koord-runtime-proxy \u5c06\u76d1\u542c ",(0,o.kt)("inlineCode",{parentName:"p"},"/var/run/koord-runtimeproxy/runtimeproxy.sock"),"\u3002"),(0,o.kt)("h2",{id:"3\u8bbe\u7f6e-kubelet"},"3\u3001\u8bbe\u7f6e Kubelet"),(0,o.kt)("p",null,"\u8981\u4f7f koord-runtime-proxy \u6210\u4e3a Kubelet \u548c Containerd \u4e4b\u95f4\u7684\u4ee3\u7406\uff0c\u5e94\u4fee\u6539 Kubelet \u53c2\u6570\uff0c\u5982\u4e0b\u6240\u793a\uff1a"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"kubelet <other options> \\\n   --container-runtime=remote \\\n   --container-runtime-endpoint=unix:///var/run/koord-runtimeproxy/runtimeproxy.sock\n")),(0,o.kt)("p",null,"\u5728 Docker \u7684\u573a\u666f\u4e0b, \u5e94\u4fee\u6539 Kubelet \u53c2\u6570\u5982\u4e0b\uff1a"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"kubelet <other options> --docker-endpoint=unix:///var/run/koord-runtimeproxy/runtimeproxy.sock\n")))}m.isMDXComponent=!0}}]);
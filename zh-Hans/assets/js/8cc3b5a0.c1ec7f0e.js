"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[5109],{3905:(e,t,a)=>{a.d(t,{Zo:()=>m,kt:()=>k});var n=a(7294);function r(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function o(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,n)}return a}function l(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?o(Object(a),!0).forEach((function(t){r(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):o(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function p(e,t){if(null==e)return{};var a,n,r=function(e,t){if(null==e)return{};var a,n,r={},o=Object.keys(e);for(n=0;n<o.length;n++)a=o[n],t.indexOf(a)>=0||(r[a]=e[a]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)a=o[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(r[a]=e[a])}return r}var i=n.createContext({}),s=function(e){var t=n.useContext(i),a=t;return e&&(a="function"==typeof e?e(t):l(l({},t),e)),a},m=function(e){var t=s(e.components);return n.createElement(i.Provider,{value:t},e.children)},u="mdxType",d={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},c=n.forwardRef((function(e,t){var a=e.components,r=e.mdxType,o=e.originalType,i=e.parentName,m=p(e,["components","mdxType","originalType","parentName"]),u=s(a),c=r,k=u["".concat(i,".").concat(c)]||u[c]||d[c]||o;return a?n.createElement(k,l(l({ref:t},m),{},{components:a})):n.createElement(k,l({ref:t},m))}));function k(e,t){var a=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=a.length,l=new Array(o);l[0]=c;var p={};for(var i in t)hasOwnProperty.call(t,i)&&(p[i]=t[i]);p.originalType=e,p[u]="string"==typeof e?e:r,l[1]=p;for(var s=2;s<o;s++)l[s]=a[s];return n.createElement.apply(null,l)}return n.createElement.apply(null,a)}c.displayName="MDXCreateElement"},5832:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>i,contentTitle:()=>l,default:()=>d,frontMatter:()=>o,metadata:()=>p,toc:()=>s});var n=a(7462),r=(a(7294),a(3905));const o={},l="CPU QoS",p={unversionedId:"user-manuals/cpu-qos",id:"version-v1.4/user-manuals/cpu-qos",title:"CPU QoS",description:"\u7b80\u4ecb",source:"@site/i18n/zh-Hans/docusaurus-plugin-content-docs/version-v1.4/user-manuals/cpu-qos.md",sourceDirName:"user-manuals",slug:"/user-manuals/cpu-qos",permalink:"/zh-Hans/docs/user-manuals/cpu-qos",draft:!1,editUrl:"https://github.com/koordinator-sh/koordinator.sh/edit/main/docs/user-manuals/cpu-qos.md",tags:[],version:"v1.4",lastUpdatedBy:"wangjianyu",lastUpdatedAt:1705567859,formattedLastUpdatedAt:"2024\u5e741\u670818\u65e5",frontMatter:{},sidebar:"docs",previous:{title:"CPU Burst",permalink:"/zh-Hans/docs/user-manuals/cpu-burst"},next:{title:"Memory QoS",permalink:"/zh-Hans/docs/user-manuals/memory-qos"}},i={},s=[{value:"\u7b80\u4ecb",id:"\u7b80\u4ecb",level:2},{value:"\u80cc\u666f",id:"\u80cc\u666f",level:2},{value:"\u8bbe\u7f6e",id:"\u8bbe\u7f6e",level:2},{value:"\u524d\u63d0\u6761\u4ef6",id:"\u524d\u63d0\u6761\u4ef6",level:3},{value:"\u5b89\u88c5",id:"\u5b89\u88c5",level:3},{value:"\u4f7f\u7528CPU QoS",id:"\u4f7f\u7528cpu-qos",level:2}],m={toc:s},u="wrapper";function d(e){let{components:t,...a}=e;return(0,r.kt)(u,(0,n.Z)({},m,a,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"cpu-qos"},"CPU QoS"),(0,r.kt)("h2",{id:"\u7b80\u4ecb"},"\u7b80\u4ecb"),(0,r.kt)("p",null,"Kubernetes\u652f\u6301\u5c06\u591a\u79cd\u7c7b\u578b\u7684\u5e94\u7528\u4ee5\u5bb9\u5668\u5316\u7684\u65b9\u5f0f\u90e8\u7f72\u5728\u540c\u4e00\u53f0\u5bbf\u4e3b\u673a\u4e0a\u8fd0\u884c\uff0c\u4e0d\u540c\u4f18\u5148\u7ea7\u7684\u5e94\u7528\u53ef\u80fd\u4f1a\u7ade\u4e89CPU\u8d44\u6e90\uff0c\u5bfc\u81f4\u5e94\u7528\u670d\u52a1\u53d7\u635f\u3002Koordinator\u652f\u6301\u57fa\u4e8e\u5bb9\u5668\u7684QoS\u7b49\u7ea7\uff0c\u4f18\u5148\u4fdd\u969c\u9ad8\u4f18\u5148\u7ea7\u5e94\u7528\u7684CPU\u6027\u80fd\u3002\u672c\u6587\u4ecb\u7ecd\u5982\u4f55\u4f7f\u7528\u5bb9\u5668CPU QoS\u529f\u80fd\u3002"),(0,r.kt)("h2",{id:"\u80cc\u666f"},"\u80cc\u666f"),(0,r.kt)("p",null,"\u4e3a\u4e86\u5145\u5206\u5229\u7528\u673a\u5668\u4e2d\u7684\u8d44\u6e90\uff0c\u901a\u5e38\u4f1a\u5c06\u9ad8\u4f18\u5148\u5ef6\u8fdf\u654f\u611f\u6027LS\uff08Latency-Sensitive\uff09\u548c\u4f4e\u4f18\u5148\u7ea7BE\uff08Best-Effort\uff09\u7684\u4efb\u52a1\u90e8\u7f72\u5728\u540c\u4e00\u53f0\u673a\u5668\u4e0a\uff0c\u5bfc\u81f4\u4e24\u79cd\u4e0d\u540c\u4f18\u5148\u7ea7\u4efb\u52a1\u4e4b\u95f4\u5b58\u5728\u8d44\u6e90\u7ade\u4e89\u95ee\u9898\u3002Kubernetes\u6839\u636e\u5e94\u7528\u7684CPU Request/Limit\uff0c\u4e3a\u5bb9\u5668\u8bbe\u7f6e\u7269\u7406\u8d44\u6e90\u9650\u5236\uff0c\u4f46\u4ecd\u5b58\u5728\u5bb9\u5668\u95f4\u5bf9CPU\u8d44\u6e90\u7684\u7ade\u4e89\u3002\u4f8b\u5982\uff0cBE\u5e94\u7528\u548cLS\u5e94\u7528\u5171\u4eab\u7269\u7406\u6838\u6216\u903b\u8f91\u6838\u65f6\uff0c\u5f53BE\u5e94\u7528\u8d1f\u8f7d\u8f83\u9ad8\u65f6\uff0c\u4f1a\u5e72\u6270LS\u5e94\u7528\u7684\u8fd0\u884c\uff0c\u5bfc\u81f4\u670d\u52a1\u54cd\u5e94\u5ef6\u8fdf\u53d8\u9ad8\u3002"),(0,r.kt)("p",null,"\u4e3a\u4e86\u63d0\u9ad8LS\u5e94\u7528\u4f7f\u7528CPU\u8d44\u6e90\u7684\u7a33\u5b9a\u6027\uff0c\u964d\u4f4eBE\u5e94\u7528\u7684\u5e72\u6270\uff0cKoordinator\u57fa\u4e8eAlibaba Cloud Linux 2\u548cAnolis OS\uff0c\u63d0\u4f9b\u4e86\u5bb9\u5668CPU QoS\u529f\u80fd\u3002Koordinator\u57fa\u4e8eGroup Identity\u63d0\u4f9b\u7684Linux\u8c03\u5ea6\u4f18\u5148\u7ea7\uff0c\u5dee\u5f02\u5316\u4fdd\u969c\u4e0d\u540c\u4f18\u5148\u7ea7\u5e94\u7528\u7684CPU\u8c03\u5ea6\uff0c\u5c06LS\u5e94\u7528\u6807\u8bc6\u4e3a\u9ad8\u4f18\uff0cBE\u5e94\u7528\u6807\u8bc6\u4e3a\u4f4e\u4f18\uff0c\u5728\u6df7\u5408\u90e8\u7f72\u573a\u666f\u4e2d\u6709\u6548\u6539\u5584LS\u5e94\u7528\u7684\u670d\u52a1\u8d28\u91cf\u3002\u66f4\u591a\u4fe1\u606f\uff0c\u8bf7\u53c2\u89c1",(0,r.kt)("a",{parentName:"p",href:"https://help.aliyun.com/document_detail/338407.htm#task-2129392"},"Group Identity\u529f\u80fd\u8bf4\u660e"),"\u3002"),(0,r.kt)("p",null,"\u901a\u8fc7\u542f\u7528CPU QoS\u529f\u80fd\uff0c\u60a8\u53ef\u4ee5\u83b7\u53d6\u4ee5\u4e0b\u529f\u80fd\u7279\u6027\uff1a"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"LS\u5e94\u7528\u7684\u4efb\u52a1\u5524\u9192\u5ef6\u8fdf\u6700\u5c0f\u5316\u3002"),(0,r.kt)("li",{parentName:"ul"},"BE\u5e94\u7528\u7684\u4efb\u52a1\u5524\u9192\u4e0d\u4f1a\u5bf9LS\u5bb9\u5668\u9020\u6210\u6027\u80fd\u5f71\u54cd\u3002"),(0,r.kt)("li",{parentName:"ul"},"BE\u5e94\u7528\u7684\u4efb\u52a1\u4e0d\u4f1a\u901a\u8fc7\u540c\u65f6\u591a\u7ebf\u7a0bSMT\uff08Simultaneous MultiThreading\uff09\u8c03\u5ea6\u5668\u5171\u4eab\u7269\u7406\u6838\u800c\u5bf9LS\u5e94\u7528\u9020\u6210\u6027\u80fd\u5f71\u54cd\u3002")),(0,r.kt)("h2",{id:"\u8bbe\u7f6e"},"\u8bbe\u7f6e"),(0,r.kt)("h3",{id:"\u524d\u63d0\u6761\u4ef6"},"\u524d\u63d0\u6761\u4ef6"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("p",{parentName:"li"},"Kubernetes >= 1.18")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("p",{parentName:"li"},"Koordinator >= 0.4")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("p",{parentName:"li"},"\u64cd\u4f5c\u7cfb\u7edf\uff1a"),(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("p",{parentName:"li"},"Alibaba Cloud Linux 2\uff08\u7248\u672c\u53f7\u8be6\u60c5\uff0c\u8bf7\u53c2\u89c1",(0,r.kt)("a",{parentName:"p",href:"https://help.aliyun.com/document_detail/338407.htm#task-2129392"},"Group Identity\u529f\u80fd\u8bf4\u660e"),"\uff09")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("p",{parentName:"li"},"Anolis OS >= 8.6")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("p",{parentName:"li"},"CentOS 7.9 (\u9700\u8981\u5b89\u88c5\u9f99\u8725\u793e\u533a\u7684 CPU \u6df7\u90e8\u8c03\u5ea6\u5668\u63d2\u4ef6\uff0c\u8bf7\u53c2\u9605",(0,r.kt)("a",{parentName:"p",href:"/zh-Hans/docs/best-practices/anolis_plugsched"},"\u6700\u4f73\u5b9e\u8df5"),")"))))),(0,r.kt)("h3",{id:"\u5b89\u88c5"},"\u5b89\u88c5"),(0,r.kt)("p",null,"\u8bf7\u786e\u4fddKoordinator\u7ec4\u4ef6\u5df2\u6b63\u786e\u5b89\u88c5\u5728\u4f60\u7684\u96c6\u7fa4\u4e2d\u3002\u5982\u679c\u6ca1\u6709\uff0c\u8bf7\u53c2\u8003",(0,r.kt)("a",{parentName:"p",href:"https://koordinator.sh/docs/installation"},"\u5b89\u88c5\u6587\u6863"),"\u3002"),(0,r.kt)("h2",{id:"\u4f7f\u7528cpu-qos"},"\u4f7f\u7528CPU QoS"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"\u4f7f\u7528\u4ee5\u4e0bConfigMap\uff0c\u521b\u5efaconfigmap.yaml\u6587\u4ef6\u3002"),(0,r.kt)("pre",{parentName:"li"},(0,r.kt)("code",{parentName:"pre",className:"language-yaml"},'#ConfigMap slo-controller-config \u6837\u4f8b\u3002\napiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: slo-controller-config\n  namespace: koordinator-system\ndata:\n  #\u5f00\u542f\u5bb9\u5668CPU QoS\u529f\u80fd\u3002\n  resource-qos-config: |\n    {\n      "clusterStrategy": {\n        "lsClass": {\n          "cpuQOS": {\n            "enable": true,\n            "groupIdentity": 2\n          }\n        },\n        "beClass": {\n          "cpuQOS": {\n            "enable": true,\n            "groupIdentity": -1\n          }\n        }\n      }\n    }\n')),(0,r.kt)("p",{parentName:"li"},(0,r.kt)("inlineCode",{parentName:"p"},"lsClass"),"\u3001",(0,r.kt)("inlineCode",{parentName:"p"},"beClass"),"\u5206\u522b\u7528\u4e8e\u914d\u7f6eQoS\u7b49\u7ea7\u4e3aLS\u3001BE\u7684Pod\uff0c",(0,r.kt)("inlineCode",{parentName:"p"},"cpuQOS"),"\u7528\u4e8e\u914d\u7f6e\u5bb9\u5668CPU QoS\u529f\u80fd\u3002\u5173\u952e\u53c2\u6570\u8bf4\u660e\u5982\u4e0b\uff1a"))),(0,r.kt)("table",null,(0,r.kt)("thead",{parentName:"table"},(0,r.kt)("tr",{parentName:"thead"},(0,r.kt)("th",{parentName:"tr",align:"left"},"\u53c2\u6570"),(0,r.kt)("th",{parentName:"tr",align:"left"},"\u7c7b\u578b"),(0,r.kt)("th",{parentName:"tr",align:"left"},"\u53d6\u503c\u8303\u56f4"),(0,r.kt)("th",{parentName:"tr",align:"left"},"\u8bf4\u660e"))),(0,r.kt)("tbody",{parentName:"table"},(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:"left"},(0,r.kt)("inlineCode",{parentName:"td"},"enable")),(0,r.kt)("td",{parentName:"tr",align:"left"},"Boolean"),(0,r.kt)("td",{parentName:"tr",align:"left"},"truefalse"),(0,r.kt)("td",{parentName:"tr",align:"left"},"true\uff1a\u96c6\u7fa4\u5168\u5c40\u5f00\u542f\u5bb9\u5668CPU QoS\u529f\u80fd\u3002false\uff1a\u96c6\u7fa4\u5168\u5c40\u5173\u95ed\u5bb9\u5668CPU QoS\u529f\u80fd\u3002")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:"left"},(0,r.kt)("inlineCode",{parentName:"td"},"groupIdentity")),(0,r.kt)("td",{parentName:"tr",align:"left"},"Int"),(0,r.kt)("td",{parentName:"tr",align:"left"},"-1~2"),(0,r.kt)("td",{parentName:"tr",align:"left"},"\u8868\u793aCPU Group Identity\u7684\u4f18\u5148\u7ea7\u3002\u9ed8\u8ba4\u503c\u4f9d\u636eQoS\uff0cLS\u5bf9\u5e942\uff0cBE\u5bf9\u5e94-1\u30020\u8868\u793a\u5173\u95ed\u3002",(0,r.kt)("inlineCode",{parentName:"td"},"groupIdentity"),"\u503c\u8d8a\u5927\uff0c\u8868\u793a\u5bb9\u5668\u5728\u5185\u6838\u8c03\u5ea6\u7684\u4f18\u5148\u7ea7\u8d8a\u9ad8\u3002\u4f8b\u5982\uff0c\u6309\u9ed8\u8ba4\u914d\u7f6e\uff0cQoS\u7b49\u7ea7\u4e3aLS\u7684\u5bb9\u5668Group Identity\u63a5\u53e3\u914d\u7f6e\u4e3a",(0,r.kt)("inlineCode",{parentName:"td"},"cpu.bvt_warp_ns=2"),"\uff0cBE\u5bb9\u5668\u914d\u7f6e\u4e3a",(0,r.kt)("inlineCode",{parentName:"td"},"cpu.bvt_warp_ns=-1"),"\u3002\u66f4\u591a\u4fe1\u606f\uff0c\u8bf7\u53c2\u89c1",(0,r.kt)("a",{parentName:"td",href:"https://help.aliyun.com/document_detail/338407.htm#task-2129392"},"Group Identity\u529f\u80fd\u8bf4\u660e"),"\u3002")))),(0,r.kt)("p",null,"   ",(0,r.kt)("strong",{parentName:"p"},"\u8bf4\u660e")," \u5bf9\u4e8e\u672a\u6307\u5b9a",(0,r.kt)("inlineCode",{parentName:"p"},"koordinator.sh/qosClass"),"\u7684Pod\uff0cKoordinator\u5c06\u53c2\u8003Pod\u539f\u751f\u7684QoSClass\u6765\u8bbe\u7f6e\u53c2\u6570\uff0c\u5176\u4e2dBesteffort\u4f7f\u7528ConfigMap\u4e2dBE\u7684\u914d\u7f6e\uff0c\u5176\u4ed6QoSClass\u4f7f\u7528ConfigMap\u4e2dLS\u7684\u914d\u7f6e\u3002"),(0,r.kt)("ol",{start:2},(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"\u67e5\u770b\u547d\u540d\u7a7a\u95f4",(0,r.kt)("inlineCode",{parentName:"p"},"koordinator-system"),"\u4e0b\u662f\u5426\u5b58\u5728ConfigMap ",(0,r.kt)("inlineCode",{parentName:"p"},"slo-controller-config"),"\u3002"),(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("p",{parentName:"li"},"\u82e5\u5b58\u5728ConfigMap ",(0,r.kt)("inlineCode",{parentName:"p"},"slo-controller-config"),"\uff0c\u8bf7\u4f7f\u7528PATCH\u65b9\u5f0f\u8fdb\u884c\u66f4\u65b0\uff0c\u907f\u514d\u5e72\u6270ConfigMap\u4e2d\u5176\u4ed6\u914d\u7f6e\u9879\u3002"),(0,r.kt)("pre",{parentName:"li"},(0,r.kt)("code",{parentName:"pre",className:"language-bash"},'kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"\n'))),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("p",{parentName:"li"},"\u82e5\u4e0d\u5b58\u5728ConfigMap  ",(0,r.kt)("inlineCode",{parentName:"p"},"slo-controller-config"),"\uff0c\u8bf7\u6267\u884c\u4ee5\u4e0b\u547d\u4ee4\u8fdb\u884c\u521b\u5efaConfigmap\u3002"),(0,r.kt)("pre",{parentName:"li"},(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"kubectl apply -f configmap.yaml\n"))))),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"\u4f7f\u7528\u4ee5\u4e0bYAML\u5185\u5bb9\uff0c\u521b\u5efals-pod-demo.yaml\u6587\u4ef6\u3002"),(0,r.kt)("pre",{parentName:"li"},(0,r.kt)("code",{parentName:"pre",className:"language-yaml"},'apiVersion: v1\nkind: Pod\nmetadata:\n  name: ls-pod-demo\n  labels:\n    koordinator.sh/qosClass: \'LS\' #\u6307\u5b9aPod\u7684QoS\u7ea7\u522b\u4e3aLS\u3002\nspec:  \n  containers:\n  - command:\n    - "nginx"\n    - "-g"\n    - "daemon off; worker_processes 4;"\n    image: docker.io/koordinatorsh/nginx:v1.18-koord-example\n    imagePullPolicy: Always\n    name: nginx\n    resources:\n      limits:\n        cpu: "4"\n        memory: 10Gi\n      requests:\n        cpu: "4"\n        memory: 10Gi\n  restartPolicy: Never\n  schedulerName: default-scheduler\n'))),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"\u6267\u884c\u4ee5\u4e0b\u547d\u4ee4\uff0c\u5c06ls-pod-demo\u90e8\u7f72\u5230\u96c6\u7fa4\u3002"),(0,r.kt)("pre",{parentName:"li"},(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"kubectl apply -f ls-pod-demo.yaml\n"))),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"\u6267\u884c\u4ee5\u4e0b\u547d\u4ee4\uff0c\u5728\u5355\u673a\u7aef\u7684Cgroup\u5206\u7ec4\u4e2d\u67e5\u770bLS Pod\u7684\u5185\u6838Group Identity\u751f\u6548\u60c5\u51b5\u3002"),(0,r.kt)("pre",{parentName:"li"},(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"cat /sys/fs/cgroup/cpu/kubepods.slice/kubepods-pod1c20f2ad****.slice/cpu.bvt_warp_ns\n")),(0,r.kt)("p",{parentName:"li"},"\u9884\u671f\u8f93\u51fa\uff1a"),(0,r.kt)("pre",{parentName:"li"},(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"#LS Pod\u7684Group Identity\u4f18\u5148\u7ea7\u4e3a2\uff08\u9ad8\u4f18\uff09\u3002\n2\n"))),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"\u4f7f\u7528\u4ee5\u4e0bYAML\u5185\u5bb9\uff0c\u521b\u5efabe-pod-demo.yaml\u6587\u4ef6\u3002"),(0,r.kt)("pre",{parentName:"li"},(0,r.kt)("code",{parentName:"pre",className:"language-yaml"},"apiVersion: v1\nkind: Pod\nmetadata:\n  name: be-pod-demo\n  labels:\n    koordinator.sh/qosClass: 'BE' #\u6307\u5b9aPod\u7684QoS\u7ea7\u522b\u4e3aBE\u3002\nspec:\n  containers:\n    - args:\n        - '-c'\n        - '1'\n        - '--vm'\n        - '1'\n      command:\n        - stress\n      image: polinux/stress\n      imagePullPolicy: Always\n      name: stress\n  restartPolicy: Always\n  schedulerName: default-scheduler\n  # \u5f53ColocationProfile\u529f\u80fd\u5f00\u542f\u65f6\uff08\u9ed8\u8ba4\u542f\u7528\uff09\uff0cpriorityClassName\u662f\u5fc5\u586b\u7684\n  priorityClassName: koord-batch\n"))),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"\u6267\u884c\u4ee5\u4e0b\u547d\u4ee4\uff0c\u5c06be-pod-demo\u90e8\u7f72\u5230\u96c6\u7fa4\u3002"),(0,r.kt)("pre",{parentName:"li"},(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"kubectl apply -f be-pod-demo.yaml\n"))),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"\u6267\u884c\u4ee5\u4e0b\u547d\u4ee4\uff0c\u5728\u5355\u673a\u7aef\u7684Cgroup\u5206\u7ec4\u4e2d\u67e5\u770bBE Pod\u7684\u5185\u6838Group Identity\u751f\u6548\u60c5\u51b5\u3002"),(0,r.kt)("pre",{parentName:"li"},(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"cat /sys/fs/cgroup/cpu/kubepods.slice/kubepods-besteffort.slice/kubepods-besteffort-pod4b6e96c8****.slice/cpu.bvt_warp_ns\n")),(0,r.kt)("p",{parentName:"li"},"\u9884\u671f\u8f93\u51fa\uff1a"),(0,r.kt)("pre",{parentName:"li"},(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"#BE Pod\u7684Group Identity\u4f18\u5148\u7ea7\u4e3a-1\uff08\u4f4e\u4f18\uff09\u3002\n-1\n")),(0,r.kt)("p",{parentName:"li"},"\u7531\u9884\u671f\u8f93\u51fa\u5f97\u5230\uff0cLS\u5bb9\u5668\u4e3aGroup Identity\u9ad8\u4f18\u5148\u7ea7\uff0cBE\u5bb9\u5668\u4e3aGroup Identity\u4f4e\u4f18\u5148\u7ea7\uff0c\u8868\u793aLS\u5bb9\u5668\u7684CPU\u670d\u52a1\u8d28\u91cf\u5c06\u88ab\u4f18\u5148\u4fdd\u969c\u3002"))))}d.isMDXComponent=!0}}]);
"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[782],{3905:(t,e,r)=>{r.d(e,{Zo:()=>d,kt:()=>k});var n=r(7294);function a(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function o(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function l(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?o(Object(r),!0).forEach((function(e){a(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}function i(t,e){if(null==t)return{};var r,n,a=function(t,e){if(null==t)return{};var r,n,a={},o=Object.keys(t);for(n=0;n<o.length;n++)r=o[n],e.indexOf(r)>=0||(a[r]=t[r]);return a}(t,e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(t);for(n=0;n<o.length;n++)r=o[n],e.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(t,r)&&(a[r]=t[r])}return a}var p=n.createContext({}),u=function(t){var e=n.useContext(p),r=e;return t&&(r="function"==typeof t?t(e):l(l({},e),t)),r},d=function(t){var e=u(t.components);return n.createElement(p.Provider,{value:e},t.children)},c="mdxType",s={inlineCode:"code",wrapper:function(t){var e=t.children;return n.createElement(n.Fragment,{},e)}},m=n.forwardRef((function(t,e){var r=t.components,a=t.mdxType,o=t.originalType,p=t.parentName,d=i(t,["components","mdxType","originalType","parentName"]),c=u(r),m=a,k=c["".concat(p,".").concat(m)]||c[m]||s[m]||o;return r?n.createElement(k,l(l({ref:e},d),{},{components:r})):n.createElement(k,l({ref:e},d))}));function k(t,e){var r=arguments,a=e&&e.mdxType;if("string"==typeof t||a){var o=r.length,l=new Array(o);l[0]=m;var i={};for(var p in e)hasOwnProperty.call(e,p)&&(i[p]=e[p]);i.originalType=t,i[c]="string"==typeof t?t:a,l[1]=i;for(var u=2;u<o;u++)l[u]=r[u];return n.createElement.apply(null,l)}return n.createElement.apply(null,r)}m.displayName="MDXCreateElement"},1409:(t,e,r)=>{r.r(e),r.d(e,{assets:()=>p,contentTitle:()=>l,default:()=>s,frontMatter:()=>o,metadata:()=>i,toc:()=>u});var n=r(7462),a=(r(7294),r(3905));const o={},l="QoS",i={unversionedId:"architecture/qos",id:"version-v1.3/architecture/qos",title:"QoS",description:"QoS \u7528\u4e8e\u8868\u8fbe\u8282\u70b9\u4e0a Pod \u7684\u8fd0\u884c\u8d28\u91cf\uff0c\u5982\u83b7\u53d6\u8d44\u6e90\u7684\u65b9\u5f0f\u3001\u83b7\u53d6\u8d44\u6e90\u7684\u6bd4\u4f8b\u3001QoS \u4fdd\u969c\u7b56\u7565\u7b49\u3002",source:"@site/i18n/zh-Hans/docusaurus-plugin-content-docs/version-v1.3/architecture/qos.md",sourceDirName:"architecture",slug:"/architecture/qos",permalink:"/zh-Hans/docs/v1.3/architecture/qos",draft:!1,editUrl:"https://github.com/koordinator-sh/koordinator.sh/edit/main/docs/architecture/qos.md",tags:[],version:"v1.3",lastUpdatedBy:"saintube",lastUpdatedAt:1692186595,formattedLastUpdatedAt:"2023\u5e748\u670816\u65e5",frontMatter:{},sidebar:"docs",previous:{title:"\u4f18\u5148\u7ea7",permalink:"/zh-Hans/docs/v1.3/architecture/priority"},next:{title:"Colocation Profile",permalink:"/zh-Hans/docs/v1.3/user-manuals/colocation-profile"}},p={},u=[{value:"\u5b9a\u4e49",id:"\u5b9a\u4e49",level:2},{value:"QoS CPU \u7f16\u6392\u9694\u79bb\u4e0e\u5171\u4eab",id:"qos-cpu-\u7f16\u6392\u9694\u79bb\u4e0e\u5171\u4eab",level:2},{value:"Koordinator QoS\u4e0e Kubernetes QoS \u7684\u5bf9\u6bd4",id:"koordinator-qos\u4e0e-kubernetes-qos-\u7684\u5bf9\u6bd4",level:2}],d={toc:u},c="wrapper";function s(t){let{components:e,...o}=t;return(0,a.kt)(c,(0,n.Z)({},d,o,{components:e,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"qos"},"QoS"),(0,a.kt)("p",null,"QoS \u7528\u4e8e\u8868\u8fbe\u8282\u70b9\u4e0a Pod \u7684\u8fd0\u884c\u8d28\u91cf\uff0c\u5982\u83b7\u53d6\u8d44\u6e90\u7684\u65b9\u5f0f\u3001\u83b7\u53d6\u8d44\u6e90\u7684\u6bd4\u4f8b\u3001QoS \u4fdd\u969c\u7b56\u7565\u7b49\u3002"),(0,a.kt)("h2",{id:"\u5b9a\u4e49"},"\u5b9a\u4e49"),(0,a.kt)("p",null,"Koordinator \u8c03\u5ea6\u7cfb\u7edf\u652f\u6301\u7684 QoS \u6709\u4e94\u79cd\u7c7b\u578b:"),(0,a.kt)("table",null,(0,a.kt)("thead",{parentName:"table"},(0,a.kt)("tr",{parentName:"thead"},(0,a.kt)("th",{parentName:"tr",align:null},"QoS"),(0,a.kt)("th",{parentName:"tr",align:null},"\u7279\u70b9"),(0,a.kt)("th",{parentName:"tr",align:null},"\u8bf4\u660e"))),(0,a.kt)("tbody",{parentName:"table"},(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"SYSTEM"),(0,a.kt)("td",{parentName:"tr",align:null},"\u7cfb\u7edf\u8fdb\u7a0b\uff0c\u8d44\u6e90\u53d7\u9650"),(0,a.kt)("td",{parentName:"tr",align:null},"\u5bf9\u4e8e DaemonSets \u7b49\u7cfb\u7edf\u670d\u52a1\uff0c\u867d\u7136\u9700\u8981\u4fdd\u8bc1\u7cfb\u7edf\u670d\u52a1\u7684\u5ef6\u8fdf\uff0c\u4f46\u4e5f\u9700\u8981\u9650\u5236\u8282\u70b9\u4e0a\u8fd9\u4e9b\u7cfb\u7edf\u670d\u52a1\u5bb9\u5668\u7684\u8d44\u6e90\u4f7f\u7528\uff0c\u4ee5\u786e\u4fdd\u5176\u4e0d\u5360\u7528\u8fc7\u591a\u7684\u8d44\u6e90")),(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"LSE(Latency Sensitive Exclusive)"),(0,a.kt)("td",{parentName:"tr",align:null},"\u4fdd\u7559\u8d44\u6e90\u5e76\u7ec4\u7ec7\u540c QoS \u7684 pod \u5171\u4eab\u8d44\u6e90"),(0,a.kt)("td",{parentName:"tr",align:null},"\u5f88\u5c11\u4f7f\u7528\uff0c\u5e38\u89c1\u4e8e\u4e2d\u95f4\u4ef6\u7c7b\u5e94\u7528\uff0c\u4e00\u822c\u5728\u72ec\u7acb\u7684\u8d44\u6e90\u6c60\u4e2d\u4f7f\u7528")),(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"LSR(Latency Sensitive Reserved)"),(0,a.kt)("td",{parentName:"tr",align:null},"\u9884\u7559\u8d44\u6e90\u4ee5\u83b7\u5f97\u66f4\u597d\u7684\u786e\u5b9a\u6027"),(0,a.kt)("td",{parentName:"tr",align:null},"\u7c7b\u4f3c\u4e8e\u793e\u533a\u7684 Guaranteed\uff0cCPU \u6838\u88ab\u7ed1\u5b9a")),(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"LS(Latency Sensitive)"),(0,a.kt)("td",{parentName:"tr",align:null},"\u5171\u4eab\u8d44\u6e90\uff0c\u5bf9\u7a81\u53d1\u6d41\u91cf\u6709\u66f4\u597d\u7684\u5f39\u6027"),(0,a.kt)("td",{parentName:"tr",align:null},"\u5fae\u670d\u52a1\u5de5\u4f5c\u8d1f\u8f7d\u7684\u5178\u578bQoS\u7ea7\u522b\uff0c\u5b9e\u73b0\u66f4\u597d\u7684\u8d44\u6e90\u5f39\u6027\u548c\u66f4\u7075\u6d3b\u7684\u8d44\u6e90\u8c03\u6574\u80fd\u529b")),(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"BE(Best Effort)"),(0,a.kt)("td",{parentName:"tr",align:null},"\u5171\u4eab\u4e0d\u5305\u62ec LSE \u7684\u8d44\u6e90\uff0c\u8d44\u6e90\u8fd0\u884c\u8d28\u91cf\u6709\u9650\uff0c\u751a\u81f3\u5728\u6781\u7aef\u60c5\u51b5\u4e0b\u88ab\u6740\u6b7b"),(0,a.kt)("td",{parentName:"tr",align:null},"\u6279\u91cf\u4f5c\u4e1a\u7684\u5178\u578b QoS \u6c34\u5e73\uff0c\u5728\u4e00\u5b9a\u65f6\u671f\u5185\u7a33\u5b9a\u7684\u8ba1\u7b97\u541e\u5410\u91cf\uff0c\u4f4e\u6210\u672c\u8d44\u6e90")))),(0,a.kt)("h2",{id:"qos-cpu-\u7f16\u6392\u9694\u79bb\u4e0e\u5171\u4eab"},"QoS CPU \u7f16\u6392\u9694\u79bb\u4e0e\u5171\u4eab"),(0,a.kt)("p",null,(0,a.kt)("img",{alt:"img",src:r(9845).Z,width:"1399",height:"445"})),(0,a.kt)("h2",{id:"koordinator-qos\u4e0e-kubernetes-qos-\u7684\u5bf9\u6bd4"},"Koordinator QoS\u4e0e Kubernetes QoS \u7684\u5bf9\u6bd4"),(0,a.kt)("p",null,"\u4ece",(0,a.kt)("a",{parentName:"p",href:"#%E5%AE%9A%E4%B9%89"},"\u5b9a\u4e49"),"\u90e8\u5206\u53ef\u4ee5\u770b\u51fa\uff0cKoordinator \u7684 QoS \u6bd4 Kubernetes \u7684 QoS \u66f4\u590d\u6742\uff0c\u56e0\u4e3a\u5728\u6df7\u90e8\u573a\u666f\u4e0b\uff0c\u6211\u4eec\u9700\u8981\u5bf9\u5ef6\u8fdf\u654f\u611f\u7684\u5de5\u4f5c\u8d1f\u8f7d\u7684 QoS \u8fdb\u884c\u5fae\u8c03\uff0c\u4ee5\u6ee1\u8db3\u6df7\u90e8\u65f6\u6027\u80fd\u7684\u9700\u6c42\u3002"),(0,a.kt)("p",null,"Koordinator \u548c Kubernetes QoS \u4e4b\u95f4\u662f\u6709\u5bf9\u5e94\u5173\u7cfb\u7684:"),(0,a.kt)("table",null,(0,a.kt)("thead",{parentName:"table"},(0,a.kt)("tr",{parentName:"thead"},(0,a.kt)("th",{parentName:"tr",align:null},"Koordinator QoS"),(0,a.kt)("th",{parentName:"tr",align:null},"Kubernetes QoS"))),(0,a.kt)("tbody",{parentName:"table"},(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"SYSTEM"),(0,a.kt)("td",{parentName:"tr",align:null},"---")),(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"LSE"),(0,a.kt)("td",{parentName:"tr",align:null},"Guaranteed")),(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"LSR"),(0,a.kt)("td",{parentName:"tr",align:null},"Guaranteed")),(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"LS"),(0,a.kt)("td",{parentName:"tr",align:null},"Guaranteed/Burstable")),(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"BE"),(0,a.kt)("td",{parentName:"tr",align:null},"BestEffort")))),(0,a.kt)("p",null,"Koordlet \u6839\u636e Pod \u7684\u4f18\u5148\u7ea7\u548c QoS \u5b9a\u4e49\uff0c\u89e6\u53d1\u76f8\u5e94\u7684\u8d44\u6e90\u9694\u79bb\u548c QoS \u4fdd\u969c\u3002"))}s.isMDXComponent=!0},9845:(t,e,r)=>{r.d(e,{Z:()=>n});const n=r.p+"assets/images/qos-cpu-orchestration-460f5568c67508e791d2f0b8798ac826.png"}}]);
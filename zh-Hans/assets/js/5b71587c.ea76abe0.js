"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[6044],{3905:(e,t,n)=>{n.d(t,{Zo:()=>p,kt:()=>c});var a=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function l(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?l(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},l=Object.keys(e);for(a=0;a<l.length;a++)n=l[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(a=0;a<l.length;a++)n=l[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var d=a.createContext({}),s=function(e){var t=a.useContext(d),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},p=function(e){var t=s(e.components);return a.createElement(d.Provider,{value:t},e.children)},g="mdxType",u={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},m=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,l=e.originalType,d=e.parentName,p=i(e,["components","mdxType","originalType","parentName"]),g=s(n),m=r,c=g["".concat(d,".").concat(m)]||g[m]||u[m]||l;return n?a.createElement(c,o(o({ref:t},p),{},{components:n})):a.createElement(c,o({ref:t},p))}));function c(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var l=n.length,o=new Array(l);o[0]=m;var i={};for(var d in t)hasOwnProperty.call(t,d)&&(i[d]=t[d]);i.originalType=e,i[g]="string"==typeof e?e:r,o[1]=i;for(var s=2;s<l;s++)o[s]=n[s];return a.createElement.apply(null,o)}return a.createElement.apply(null,n)}m.displayName="MDXCreateElement"},5830:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>d,contentTitle:()=>o,default:()=>u,frontMatter:()=>l,metadata:()=>i,toc:()=>s});var a=n(7462),r=(n(7294),n(3905));const l={},o="\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6",i={unversionedId:"user-manuals/load-aware-scheduling",id:"version-v1.4/user-manuals/load-aware-scheduling",title:"\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6",description:"\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6\uff08Load Aware Scheduling\uff09 \u662f koord-scheduler \u63d0\u4f9b\u7684\u4e00\u79cd\u8c03\u5ea6\u80fd\u529b\uff0c\u8c03\u5ea6 Pod \u65f6\u6839\u636e\u8282\u70b9\u7684\u8d1f\u8f7d\u60c5\u51b5\u9009\u62e9\u5408\u9002\u7684\u8282\u70b9\uff0c\u5747\u8861\u8282\u70b9\u95f4\u7684\u8d1f\u8f7d\u60c5\u51b5\u3002",source:"@site/i18n/zh-Hans/docusaurus-plugin-content-docs/version-v1.4/user-manuals/load-aware-scheduling.md",sourceDirName:"user-manuals",slug:"/user-manuals/load-aware-scheduling",permalink:"/zh-Hans/docs/user-manuals/load-aware-scheduling",draft:!1,editUrl:"https://github.com/koordinator-sh/koordinator.sh/edit/main/docs/user-manuals/load-aware-scheduling.md",tags:[],version:"v1.4",lastUpdatedBy:"wangjianyu",lastUpdatedAt:1705567859,formattedLastUpdatedAt:"2024\u5e741\u670818\u65e5",frontMatter:{},sidebar:"docs",previous:{title:"Device Scheduling",permalink:"/zh-Hans/docs/user-manuals/fine-grained-device-scheduling"},next:{title:"\u8d1f\u8f7d\u611f\u77e5\u91cd\u8c03\u5ea6",permalink:"/zh-Hans/docs/user-manuals/load-aware-descheduling"}},d={},s=[{value:"\u7b80\u4ecb",id:"\u7b80\u4ecb",level:2},{value:"\u8bbe\u7f6e",id:"\u8bbe\u7f6e",level:2},{value:"\u524d\u63d0\u6761\u4ef6",id:"\u524d\u63d0\u6761\u4ef6",level:3},{value:"\u5b89\u88c5",id:"\u5b89\u88c5",level:3},{value:"\u914d\u7f6e\u5168\u5c40\u7b56\u7565",id:"\u914d\u7f6e\u5168\u5c40\u7b56\u7565",level:3},{value:"\u6309\u7167\u8282\u70b9\u914d\u7f6e\u8fc7\u6ee4\u9608\u503c",id:"\u6309\u7167\u8282\u70b9\u914d\u7f6e\u8fc7\u6ee4\u9608\u503c",level:3},{value:"\u4f7f\u7528\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6",id:"\u4f7f\u7528\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6",level:2},{value:"\u611f\u77e5\u6574\u673a\u8d1f\u8f7d\u8fdb\u884c\u8c03\u5ea6",id:"\u611f\u77e5\u6574\u673a\u8d1f\u8f7d\u8fdb\u884c\u8c03\u5ea6",level:3},{value:"\u611f\u77e5 Prod Pods \u7684\u8d1f\u8f7d\u8fdb\u884c\u8c03\u5ea6",id:"\u611f\u77e5-prod-pods-\u7684\u8d1f\u8f7d\u8fdb\u884c\u8c03\u5ea6",level:3},{value:"\u611f\u77e5\u57fa\u4e8e\u767e\u5206\u4f4d\u6570\u7edf\u8ba1\u7684\u5229\u7528\u7387\u8fdb\u884c\u8c03\u5ea6",id:"\u611f\u77e5\u57fa\u4e8e\u767e\u5206\u4f4d\u6570\u7edf\u8ba1\u7684\u5229\u7528\u7387\u8fdb\u884c\u8c03\u5ea6",level:3}],p={toc:s},g="wrapper";function u(e){let{components:t,...l}=e;return(0,r.kt)(g,(0,a.Z)({},p,l,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6"},"\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6"),(0,r.kt)("p",null,"\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6\uff08Load Aware Scheduling\uff09 \u662f koord-scheduler \u63d0\u4f9b\u7684\u4e00\u79cd\u8c03\u5ea6\u80fd\u529b\uff0c\u8c03\u5ea6 Pod \u65f6\u6839\u636e\u8282\u70b9\u7684\u8d1f\u8f7d\u60c5\u51b5\u9009\u62e9\u5408\u9002\u7684\u8282\u70b9\uff0c\u5747\u8861\u8282\u70b9\u95f4\u7684\u8d1f\u8f7d\u60c5\u51b5\u3002"),(0,r.kt)("h2",{id:"\u7b80\u4ecb"},"\u7b80\u4ecb"),(0,r.kt)("p",null,"\u8d1f\u8f7d\u5747\u8861\u662f\u8d44\u6e90\u8c03\u5ea6\u4e2d\u7684\u5e38\u89c1\u95ee\u9898\u3002\u8d44\u6e90\u672a\u5145\u5206\u5229\u7528\u7684\u8282\u70b9\u4f1a\u5e26\u6765\u5f88\u5927\u7684\u8d44\u6e90\u6d6a\u8d39\uff0c\u800c\u8fc7\u5ea6\u4f7f\u7528\u7684\u8282\u70b9\u53ef\u80fd\u4f1a\u5bfc\u81f4\u6027\u80fd\u4e0b\u964d\u3002\u8fd9\u4e9b\u95ee\u9898\u90fd\u4e0d\u80fd\u9ad8\u6548\u7684\u7ba1\u7406\u548c\u4f7f\u7528\u8d44\u6e90\u3002\n\u539f\u751f Kubernetes Scheduler \u6839\u636e Requests \u548c\u8282\u70b9\u53ef\u5206\u914d\u603b\u91cf\u6765\u8c03\u5ea6 Pod\uff0c\u65e2\u4e0d\u8003\u8651\u5b9e\u65f6\u8d1f\u8f7d\uff0c\u4e5f\u4e0d\u4f30\u8ba1\u4f7f\u7528\u91cf\u3002 \u5f53\u6211\u4eec\u671f\u671b\u4f7f\u7528\u539f\u751f\u8c03\u5ea6\u5668\u5747\u5300\u7684\u6253\u6563 Pod \u5e76\u4fdd\u6301\u8282\u70b9\u95f4\u7684\u8d1f\u8f7d\u5747\u8861\uff0c\u6211\u4eec\u9700\u8981\u4e3a\u5e94\u7528\u7a0b\u5e8f\u8bbe\u7f6e\u7cbe\u786e\u7684\u8d44\u6e90\u89c4\u683c\u3002\u6b64\u5916\uff0c\u5f53 Koordinator \u901a\u8fc7\u8d85\u5356\u673a\u5236\u63d0\u5347\u8d44\u6e90\u4f7f\u7528\u6548\u7387\u65f6\uff0c\u6211\u4eec\u9700\u8981\u4e00\u79cd\u673a\u5236\u5c3d\u91cf\u907f\u514d\u6027\u80fd\u56de\u9000\uff0c\u5e76\u907f\u514d\u8d1f\u8f7d\u8fc7\u9ad8\u7684\u95ee\u9898\u3002"),(0,r.kt)("p",null,"koord-scheduler \u53c2\u8003 koordlet \u4e0a\u62a5\u7684\u8d44\u6e90\u5229\u7528\u7387\u6570\u636e\u5e73\u8861\u5728\u7ebf Pod(LSE/LSR/LS\uff09\u548c\u79bb\u7ebf Pod\uff08BE\uff09\u7684\u8c03\u5ea6\u3002"),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"\u56fe\u7247",src:n(2503).Z,width:"611",height:"466"})),(0,r.kt)("p",null,"\u60f3\u8981\u4e86\u89e3\u66f4\u591a\u4fe1\u606f\uff0c\u8bf7\u53c2\u9605 ",(0,r.kt)("a",{parentName:"p",href:"/docs/designs/load-aware-scheduling"},"\u8bbe\u8ba1\uff1a\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6"),"\u3002"),(0,r.kt)("h2",{id:"\u8bbe\u7f6e"},"\u8bbe\u7f6e"),(0,r.kt)("h3",{id:"\u524d\u63d0\u6761\u4ef6"},"\u524d\u63d0\u6761\u4ef6"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"Kubernetes >= 1.18"),(0,r.kt)("li",{parentName:"ul"},"Koordinator >= 0.4")),(0,r.kt)("h3",{id:"\u5b89\u88c5"},"\u5b89\u88c5"),(0,r.kt)("p",null,"\u8bf7\u786e\u4fdd Koordinator \u7ec4\u4ef6\u5df2\u6b63\u786e\u5b89\u88c5\u5728\u4f60\u7684\u96c6\u7fa4\u4e2d\u3002 \u5982\u679c\u6ca1\u6709\uff0c\u8bf7\u53c2\u8003",(0,r.kt)("a",{parentName:"p",href:"/docs/installation"},"\u5b89\u88c5\u6587\u6863"),"\u3002"),(0,r.kt)("h3",{id:"\u914d\u7f6e\u5168\u5c40\u7b56\u7565"},"\u914d\u7f6e\u5168\u5c40\u7b56\u7565"),(0,r.kt)("p",null,"\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6\u662f\u9ed8\u8ba4\u542f\u7528\u7684\uff0c\u4e0d\u9700\u8981\u4fee\u6539\u8c03\u5ea6\u5668\u7684\u914d\u7f6e\u5373\u53ef\u4f7f\u7528\u3002"),(0,r.kt)("p",null,"\u5bf9\u4e8e\u9700\u8981\u6df1\u5165\u5b9a\u5236\u7684\u7528\u6237\uff0c\u53ef\u4ee5\u901a\u8fc7\u4fee\u6539 Helm Chart \u4e2d\u7684 ConfigMap ",(0,r.kt)("inlineCode",{parentName:"p"},"koord-scheduler-config")," \u89c4\u5219\u6765\u914d\u7f6e\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6\u3002"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-yaml"},'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: koord-scheduler-config\n  ...\ndata:\n  koord-scheduler-config: |\n    apiVersion: kubescheduler.config.k8s.io/v1beta2\n    kind: KubeSchedulerConfiguration\n    profiles:\n      - schedulerName: koord-scheduler\n        plugins:\n          # enable the LoadAwareScheduling plugin\n          filter:\n            enabled:\n              - name: LoadAwareScheduling\n              ...\n          score:\n            enabled:\n              - name: LoadAwareScheduling\n                weight: 1\n              ...\n          reserve:\n            enabled:\n              - name: LoadAwareScheduling\n          ...\n        pluginConfig:\n        # configure the thresholds and weights for the plugin\n        - name: LoadAwareScheduling\n          args:\n            apiVersion: kubescheduler.config.k8s.io/v1beta2\n            kind: LoadAwareSchedulingArgs\n            # whether to filter nodes where koordlet fails to update NodeMetric\n            filterExpiredNodeMetrics: true\n            # the expiration threshold seconds when using NodeMetric\n            nodeMetricExpirationSeconds: 300\n            # weights of resources\n            resourceWeights:\n              cpu: 1\n              memory: 1\n            # thresholds (%) of resource utilization\n            usageThresholds:\n              cpu: 75\n              memory: 85\n            # thresholds (%) of resource utilization of Prod Pods\n            prodUsageThresholds:\n              cpu: 55\n              memory: 65\n            # enable score according Prod usage\n            scoreAccordingProdUsage: true\n            # the factor (%) for estimating resource usage\n            estimatedScalingFactors:\n              cpu: 80\n              memory: 70\n            # enable resource utilization filtering and scoring based on percentile statistics\n            aggregated:\n              usageThresholds:\n                cpu: 65\n                memory: 75\n              usageAggregationType: "p99"\n              scoreAggregationType: "p99"\n')),(0,r.kt)("p",null,"koord-descheduler \u662f\u901a\u8fc7 Configmap \u52a0\u8f7d",(0,r.kt)("a",{parentName:"p",href:"https://kubernetes.io/docs/reference/scheduling/config/"},"\u8c03\u5ea6\u5668\u914d\u7f6e"),"\u7684\u3002\u56e0\u6b64\u9700\u8981\u901a\u8fc7\u91cd\u542f\u8c03\u5ea6\u5668\u624d\u80fd\u4f7f\u7528\u6700\u65b0\u7684\u914d\u7f6e\u3002"),(0,r.kt)("table",null,(0,r.kt)("thead",{parentName:"table"},(0,r.kt)("tr",{parentName:"thead"},(0,r.kt)("th",{parentName:"tr",align:null},"\u5b57\u6bb5"),(0,r.kt)("th",{parentName:"tr",align:null},"\u8bf4\u660e"),(0,r.kt)("th",{parentName:"tr",align:null},"\u7248\u672c"))),(0,r.kt)("tbody",{parentName:"table"},(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"filterExpiredNodeMetrics"),(0,r.kt)("td",{parentName:"tr",align:null},"filterExpiredNodeMetrics \u8868\u793a\u662f\u5426\u8fc7\u6ee4koordlet\u66f4\u65b0NodeMetric\u5931\u8d25\u7684\u8282\u70b9\u3002 \u9ed8\u8ba4\u60c5\u51b5\u4e0b\u542f\u7528\uff0c\u4f46\u5728 Helm chart \u4e2d\uff0c\u5b83\u88ab\u7981\u7528\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v0.4.0")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"nodeMetricExpirationSeconds"),(0,r.kt)("td",{parentName:"tr",align:null},"nodeMetricExpirationSeconds \u6307\u793a NodeMetric \u8fc7\u671f\u65f6\u95f4\uff08\u4ee5\u79d2\u4e3a\u5355\u4f4d\uff09\u3002 \u5f53 NodeMetrics \u8fc7\u671f\u65f6\uff0c\u8282\u70b9\u88ab\u8ba4\u4e3a\u662f\u5f02\u5e38\u7684\u3002 \u9ed8\u8ba4\u4e3a 180 \u79d2\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v0.4.0")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"resourceWeights"),(0,r.kt)("td",{parentName:"tr",align:null},"resourceWeights \u8868\u793a\u8d44\u6e90\u7684\u6743\u91cd\u3002 CPU \u548c Memory \u7684\u6743\u91cd\u9ed8\u8ba4\u90fd\u662f 1\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v0.4.0")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"usageThresholds"),(0,r.kt)("td",{parentName:"tr",align:null},"usageThresholds \u8868\u793a\u6574\u673a\u7684\u8d44\u6e90\u5229\u7528\u7387\u9608\u503c\u3002 CPU \u7684\u9ed8\u8ba4\u503c\u4e3a 65%\uff0c\u5185\u5b58\u7684\u9ed8\u8ba4\u503c\u4e3a 95%\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v0.4.0")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"estimatedScalingFactors"),(0,r.kt)("td",{parentName:"tr",align:null},"estimatedScalingFactors \u8868\u793a\u4f30\u8ba1\u8d44\u6e90\u4f7f\u7528\u65f6\u7684\u56e0\u5b50\u3002 CPU \u9ed8\u8ba4\u503c\u4e3a 85%\uff0cMemory \u9ed8\u8ba4\u503c\u4e3a 70%\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v0.4.0")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"prodUsageThresholds"),(0,r.kt)("td",{parentName:"tr",align:null},"prodUsageThresholds \u8868\u793a Prod Pod \u76f8\u5bf9\u4e8e\u6574\u673a\u7684\u8d44\u6e90\u5229\u7528\u7387\u9608\u503c\u3002 \u9ed8\u8ba4\u60c5\u51b5\u4e0b\u4e0d\u542f\u7528\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v1.1.0")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"scoreAccordingProdUsage"),(0,r.kt)("td",{parentName:"tr",align:null},"scoreAccordingProdUsage \u63a7\u5236\u662f\u5426\u6839\u636e Prod Pod \u7684\u5229\u7528\u7387\u8fdb\u884c\u8bc4\u5206\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v1.1.0")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"aggregated"),(0,r.kt)("td",{parentName:"tr",align:null},"aggregated \u652f\u6301\u57fa\u4e8e\u767e\u5206\u4f4d\u6570\u7edf\u8ba1\u7684\u8d44\u6e90\u5229\u7528\u7387\u8fc7\u6ee4\u548c\u8bc4\u5206\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v1.1.0")))),(0,r.kt)("p",null,"Aggregated \u652f\u6301\u7684\u5b57\u6bb5:"),(0,r.kt)("table",null,(0,r.kt)("thead",{parentName:"table"},(0,r.kt)("tr",{parentName:"thead"},(0,r.kt)("th",{parentName:"tr",align:null},"\u5b57\u6bb5"),(0,r.kt)("th",{parentName:"tr",align:null},"\u8bf4\u660e"),(0,r.kt)("th",{parentName:"tr",align:null},"\u7248\u672c"))),(0,r.kt)("tbody",{parentName:"table"},(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"usageThresholds"),(0,r.kt)("td",{parentName:"tr",align:null},"usageThresholds \u8868\u793a\u673a\u5668\u57fa\u4e8e\u767e\u5206\u4f4d\u7edf\u8ba1\u7684\u8d44\u6e90\u5229\u7528\u7387\u9608\u503c\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v1.1.0")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"usageAggregationType"),(0,r.kt)("td",{parentName:"tr",align:null},"usageAggregationType \u8868\u793a\u8fc7\u6ee4\u65f6\u673a\u5668\u5229\u7528\u7387\u7684\u767e\u5206\u4f4d\u7c7b\u578b\u3002 \u76ee\u524d\u652f\u6301 ",(0,r.kt)("inlineCode",{parentName:"td"},"avg"),"\u3001",(0,r.kt)("inlineCode",{parentName:"td"},"p50"),"\u3001",(0,r.kt)("inlineCode",{parentName:"td"},"p90"),"\u3001",(0,r.kt)("inlineCode",{parentName:"td"},"p95")," \u548c ",(0,r.kt)("inlineCode",{parentName:"td"},"p99"),"\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v1.1.0")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"usageAggregatedDuration"),(0,r.kt)("td",{parentName:"tr",align:null},"usageAggregatedDuration \u8868\u793a\u8fc7\u6ee4\u65f6\u673a\u5668\u5229\u7528\u7387\u767e\u5206\u4f4d\u6570\u7684\u7edf\u8ba1\u5468\u671f\u3002\u4e0d\u8bbe\u7f6e\u8be5\u5b57\u6bb5\u65f6\uff0c\u8c03\u5ea6\u5668\u9ed8\u8ba4\u4f7f\u7528 NodeMetrics \u4e2d\u6700\u5927\u5468\u671f\u7684\u6570\u636e\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v1.1.0")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"scoreAggregationType"),(0,r.kt)("td",{parentName:"tr",align:null},"scoreAggregationType \u8868\u793a\u8bc4\u5206\u65f6\u673a\u5668\u5229\u7528\u7387\u7684\u767e\u5206\u4f4d\u7c7b\u578b\u3002 \u76ee\u524d\u652f\u6301 ",(0,r.kt)("inlineCode",{parentName:"td"},"avg"),"\u3001",(0,r.kt)("inlineCode",{parentName:"td"},"p50"),"\u3001",(0,r.kt)("inlineCode",{parentName:"td"},"p90"),"\u3001",(0,r.kt)("inlineCode",{parentName:"td"},"p95")," \u548c ",(0,r.kt)("inlineCode",{parentName:"td"},"p99"),"\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v1.1.0")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"scoreAggregatedDuration"),(0,r.kt)("td",{parentName:"tr",align:null},"scoreAggregatedDuration \u8868\u793a\u6253\u5206\u65f6 Prod Pod \u5229\u7528\u7387\u767e\u5206\u4f4d\u7684\u7edf\u8ba1\u5468\u671f\u3002 \u4e0d\u8bbe\u7f6e\u8be5\u5b57\u6bb5\u65f6\uff0c\u8c03\u5ea6\u5668\u9ed8\u8ba4\u4f7f\u7528 NodeMetrics \u4e2d\u6700\u5927\u5468\u671f\u7684\u6570\u636e\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v1.1.0")))),(0,r.kt)("h3",{id:"\u6309\u7167\u8282\u70b9\u914d\u7f6e\u8fc7\u6ee4\u9608\u503c"},"\u6309\u7167\u8282\u70b9\u914d\u7f6e\u8fc7\u6ee4\u9608\u503c"),(0,r.kt)("p",null,"\u901a\u8fc7\u63d2\u4ef6\u7684\u914d\u7f6e\u53ef\u4ee5\u4f5c\u4e3a\u96c6\u7fa4\u9ed8\u8ba4\u7684\u5168\u5c40\u914d\u7f6e\uff0c\u7528\u6237\u4e5f\u53ef\u4ee5\u901a\u8fc7\u5728\u8282\u70b9\u4e0a\u9644\u52a0 annotation \u6765\u8bbe\u7f6e\u8282\u70b9\u7ef4\u5ea6\u7684\u8d1f\u8f7d\u9608\u503c\u3002 \u5f53\u8282\u70b9\u4e0a\u5b58\u5728 annotation \u65f6\uff0c\u4f1a\u6839\u636e\u6ce8\u89e3\u6307\u5b9a\u7684\u53c2\u6570\u8fdb\u884c\u8fc7\u6ee4\u3002"),(0,r.kt)("p",null,"Annotation \u5b9a\u4e49\u5982\u4e0b\uff1a"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-go"},'const (\n  AnnotationCustomUsageThresholds = "scheduling.koordinator.sh/usage-thresholds"\n)\n\n// CustomUsageThresholds supports user-defined node resource utilization thresholds.\ntype CustomUsageThresholds struct {\n    // UsageThresholds indicates the resource utilization threshold of the whole machine.\n    UsageThresholds map[corev1.ResourceName]int64 `json:"usageThresholds,omitempty"`\n    // ProdUsageThresholds indicates the resource utilization threshold of Prod Pods compared to the whole machine\n    ProdUsageThresholds map[corev1.ResourceName]int64 `json:"prodUsageThresholds,omitempty"`\n    // AggregatedUsage supports resource utilization filtering and scoring based on percentile statistics\n    AggregatedUsage *CustomAggregatedUsage `json:"aggregatedUsage,omitempty"`\n}\n\ntype CustomAggregatedUsage struct {\n    // UsageThresholds indicates the resource utilization threshold of the machine based on percentile statistics\n    UsageThresholds map[corev1.ResourceName]int64 `json:"usageThresholds,omitempty"`\n    // UsageAggregationType indicates the percentile type of the machine\'s utilization when filtering\n    UsageAggregationType slov1alpha1.AggregationType `json:"usageAggregationType,omitempty"`\n    // UsageAggregatedDuration indicates the statistical period of the percentile of the machine\'s utilization when filtering\n    UsageAggregatedDuration *metav1.Duration `json:"usageAggregatedDuration,omitempty"`\n}\n')),(0,r.kt)("h2",{id:"\u4f7f\u7528\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6"},"\u4f7f\u7528\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6"),(0,r.kt)("h3",{id:"\u611f\u77e5\u6574\u673a\u8d1f\u8f7d\u8fdb\u884c\u8c03\u5ea6"},"\u611f\u77e5\u6574\u673a\u8d1f\u8f7d\u8fdb\u884c\u8c03\u5ea6"),(0,r.kt)("p",null,"\u672c\u6587\u793a\u4f8b\u7684\u96c6\u7fa4\u67093\u53f0 4\u683816GiB \u8282\u70b9\u3002"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},"\u4f7f\u7528\u4e0b\u9762\u7684 YAML \u521b\u5efa\u4e00\u4e2a ",(0,r.kt)("inlineCode",{parentName:"li"},"stress")," Pod")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-yaml"},"apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: stress-demo\n  namespace: default\n  labels:\n    app: stress-demo\nspec:\n  replicas: 1\n  selector:\n    matchLabels:\n      app: stress-demo\n  template:\n    metadata:\n      name: stress-demo\n      labels:\n        app: stress-demo\n    spec:\n      containers:\n        - args:\n            - '--vm'\n            - '2'\n            - '--vm-bytes'\n            - '1600M'\n            - '-c'\n            - '2'\n            - '--vm-hang'\n            - '2'\n          command:\n            - stress\n          image: polinux/stress\n          imagePullPolicy: Always\n          name: stress\n          resources:\n            limits:\n              cpu: '2'\n              memory: 4Gi\n            requests:\n              cpu: '2'\n              memory: 4Gi\n      restartPolicy: Always\n      schedulerName: koord-scheduler # use the koord-scheduler\n")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"$ kubectl create -f stress-demo.yaml\ndeployment.apps/stress-demo created\n")),(0,r.kt)("ol",{start:2},(0,r.kt)("li",{parentName:"ol"},"\u89c2\u5bdf Pod \u7684\u72b6\u6001\uff0c\u76f4\u5230\u5b83\u5f00\u59cb\u8fd0\u884c\u3002")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"$ kubectl get pod -o wide\nNAME                           READY   STATUS    RESTARTS   AGE   IP           NODE                    NOMINATED NODE   READINESS GATES\nstress-demo-7fdd89cc6b-gcnzn   1/1     Running   0          82s   10.0.3.114   cn-beijing.10.0.3.112   <none>           <none>\n")),(0,r.kt)("p",null,"Pod ",(0,r.kt)("inlineCode",{parentName:"p"},"stress-demo-7fdd89cc6b-gcnzn")," \u8c03\u5ea6\u5728 ",(0,r.kt)("inlineCode",{parentName:"p"},"cn-beijing.10.0.3.112"),"\u3002"),(0,r.kt)("ol",{start:3},(0,r.kt)("li",{parentName:"ol"},"\u68c0\u67e5\u6bcf\u4e2anode\u8282\u70b9\u7684\u8d1f\u8f7d\u3002")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"$ kubectl top node\nNAME                    CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%\ncn-beijing.10.0.3.110   92m          2%     1158Mi          9%\ncn-beijing.10.0.3.111   77m          1%     1162Mi          9%\ncn-beijing.10.0.3.112   2105m        53%    3594Mi          28%\n")),(0,r.kt)("p",null,"\u6309\u7167\u8f93\u51fa\u7ed3\u679c\u663e\u793a\uff0c\u8282\u70b9 ",(0,r.kt)("inlineCode",{parentName:"p"},"cn-beijing.10.0.3.111")," \u8d1f\u8f7d\u6700\u4f4e\uff0c\u8282\u70b9",(0,r.kt)("inlineCode",{parentName:"p"},"cn-beijing.10.0.3.112")," \u7684\u8d1f\u8f7d\u6700\u9ad8\u3002"),(0,r.kt)("ol",{start:4},(0,r.kt)("li",{parentName:"ol"},"\u4f7f\u7528\u4e0b\u9762\u7684 YAML \u6587\u4ef6\u90e8\u7f72 ",(0,r.kt)("inlineCode",{parentName:"li"},"nginx")," deployment\u3002")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-yaml"},"apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: nginx-with-loadaware\n  labels:\n    app: nginx\nspec:\n  replicas: 6\n  selector:\n    matchLabels:\n      app: nginx\n  template:\n    metadata:\n      name: nginx\n      labels:\n        app: nginx\n    spec:\n      schedulerName: koord-scheduler # use the koord-scheduler\n      containers:\n      - name: nginx\n        image: nginx\n        resources:\n          limits:\n            cpu: 500m\n          requests:\n            cpu: 500m\n")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"$ kubectl create -f nginx-with-loadaware.yaml\ndeployment/nginx-with-loadawre created\n")),(0,r.kt)("ol",{start:5},(0,r.kt)("li",{parentName:"ol"},"\u68c0\u67e5 ",(0,r.kt)("inlineCode",{parentName:"li"},"nginx")," Pods \u7684\u8c03\u5ea6\u7ed3\u679c\u3002")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"$ kubectl get pods | grep nginx\nnginx-with-loadaware-5646666d56-224jp   1/1     Running   0          18s   10.0.3.118   cn-beijing.10.0.3.110   <none>           <none>\nnginx-with-loadaware-5646666d56-7glt9   1/1     Running   0          18s   10.0.3.115   cn-beijing.10.0.3.110   <none>           <none>\nnginx-with-loadaware-5646666d56-kcdvr   1/1     Running   0          18s   10.0.3.119   cn-beijing.10.0.3.110   <none>           <none>\nnginx-with-loadaware-5646666d56-qzw4j   1/1     Running   0          18s   10.0.3.113   cn-beijing.10.0.3.111   <none>           <none>\nnginx-with-loadaware-5646666d56-sbgv9   1/1     Running   0          18s   10.0.3.120   cn-beijing.10.0.3.111   <none>           <none>\nnginx-with-loadaware-5646666d56-z79dn   1/1     Running   0          18s   10.0.3.116   cn-beijing.10.0.3.111   <none>           <none>\n")),(0,r.kt)("p",null,"\u73b0\u5728\u6211\u4eec\u53ef\u4ee5\u770b\u5230 ",(0,r.kt)("inlineCode",{parentName:"p"},"nginx")," pods \u88ab\u8c03\u5ea6\u5728 ",(0,r.kt)("inlineCode",{parentName:"p"},"cn-beijing.10.0.3.112"),"  (\u8d1f\u8f7d\u6700\u9ad8\u7684\u8282\u70b9) \u4ee5\u5916\u7684\u8282\u70b9\u4e0a\u3002"),(0,r.kt)("h3",{id:"\u611f\u77e5-prod-pods-\u7684\u8d1f\u8f7d\u8fdb\u884c\u8c03\u5ea6"},"\u611f\u77e5 Prod Pods \u7684\u8d1f\u8f7d\u8fdb\u884c\u8c03\u5ea6"),(0,r.kt)("p",null,"\u5982\u679c\u4e00\u4e2a Node \u4e2d\u8c03\u5ea6\u4e86\u5f88\u591a BestEffort Pod\uff0c\u53ef\u80fd\u4f1a\u56e0\u4e3a\u8282\u70b9\u7684\u8d1f\u8f7d\u5df2\u8fbe\u5230\u4f7f\u7528\u9650\u5236\u800c\u5bfc\u81f4\u5ef6\u8fdf\u654f\u611f\u7684 Pod \u65e0\u6cd5\u8c03\u5ea6\u3002 \u5728 Koordinator v1.1.0 \u4e2d\uff0c\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6\u9488\u5bf9\u8fd9\u79cd\u573a\u666f\u8fdb\u884c\u4e86\u4f18\u5316\u3002 \u5bf9\u4e8e\u5ef6\u8fdf\u654f\u611f\uff08LSE/LSR/LS\uff09\u7684 Pod\uff0c\u4f18\u5148\u8c03\u5ea6\u5230 Prod Pod \u603b\u5229\u7528\u7387\u8f83\u4f4e\u7684\u8282\u70b9\uff0c\u800c BestEffort(BE) Pod \u6839\u636e\u6574\u673a\u5229\u7528\u7387\u6c34\u5e73\u8fdb\u884c\u8c03\u5ea6\u3002"),(0,r.kt)("p",null,"\u901a\u8fc7\u8bbe\u7f6e\u4ee5\u4e0b\u53c2\u6570\u542f\u7528\u76f8\u5173\u4f18\u5316\uff1a"),(0,r.kt)("table",null,(0,r.kt)("thead",{parentName:"table"},(0,r.kt)("tr",{parentName:"thead"},(0,r.kt)("th",{parentName:"tr",align:null},"\u5b57\u6bb5"),(0,r.kt)("th",{parentName:"tr",align:null},"\u8bf4\u660e"),(0,r.kt)("th",{parentName:"tr",align:null},"\u7248\u672c"))),(0,r.kt)("tbody",{parentName:"table"},(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"prodUsageThresholds"),(0,r.kt)("td",{parentName:"tr",align:null},"prodUsageThresholds \u8868\u793a Prod Pod \u76f8\u5bf9\u4e8e\u6574\u673a\u7684\u8d44\u6e90\u5229\u7528\u7387\u9608\u503c\u3002 \u9ed8\u8ba4\u60c5\u51b5\u4e0b\u4e0d\u542f\u7528\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v1.1.0")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"scoreAccordingProdUsage"),(0,r.kt)("td",{parentName:"tr",align:null},"scoreAccordingProdUsage \u63a7\u5236\u662f\u5426\u6839\u636e Prod Pod \u7684\u5229\u7528\u7387\u8fdb\u884c\u8bc4\u5206\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v1.1.0")))),(0,r.kt)("h3",{id:"\u611f\u77e5\u57fa\u4e8e\u767e\u5206\u4f4d\u6570\u7edf\u8ba1\u7684\u5229\u7528\u7387\u8fdb\u884c\u8c03\u5ea6"},"\u611f\u77e5\u57fa\u4e8e\u767e\u5206\u4f4d\u6570\u7edf\u8ba1\u7684\u5229\u7528\u7387\u8fdb\u884c\u8c03\u5ea6"),(0,r.kt)("p",null,"Koordinator v1.0\u53ca\u4ee5\u524d\u7684\u7248\u672c\u90fd\u662f\u6309\u7167 koordlet \u4e0a\u62a5\u7684\u5e73\u5747\u5229\u7528\u7387\u6570\u636e\u8fdb\u884c\u8fc7\u6ee4\u548c\u6253\u5206\u3002\u4f46\u5e73\u5747\u503c\u9690\u85cf\u4e86\u6bd4\u8f83\u591a\u7684\u4fe1\u606f\uff0c\u56e0\u6b64\u5728 Koordinator v1.1 \u4e2d koordlet \u65b0\u589e\u4e86\u6839\u636e\u767e\u5206\u4f4d\u6570\u7edf\u8ba1\u7684\u5229\u7528\u7387\u805a\u5408\u6570\u636e\u3002\u8c03\u5ea6\u5668\u4fa7\u4e5f\u8ddf\u7740\u505a\u4e86\u76f8\u5e94\u7684\u9002\u914d\u3002"),(0,r.kt)("p",null,"\u901a\u8fc7\u8bbe\u7f6e\u4ee5\u4e0b\u53c2\u6570\u542f\u7528\u76f8\u5173\u4f18\u5316\uff1a"),(0,r.kt)("table",null,(0,r.kt)("thead",{parentName:"table"},(0,r.kt)("tr",{parentName:"thead"},(0,r.kt)("th",{parentName:"tr",align:null},"\u5b57\u6bb5"),(0,r.kt)("th",{parentName:"tr",align:null},"\u8bf4\u660e"),(0,r.kt)("th",{parentName:"tr",align:null},"\u7248\u672c"))),(0,r.kt)("tbody",{parentName:"table"},(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"aggregated"),(0,r.kt)("td",{parentName:"tr",align:null},"aggregated \u652f\u6301\u57fa\u4e8e\u767e\u5206\u4f4d\u6570\u7edf\u8ba1\u7684\u8d44\u6e90\u5229\u7528\u7387\u8fc7\u6ee4\u548c\u8bc4\u5206\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v1.1.0")))),(0,r.kt)("p",null,"Aggregated \u652f\u6301\u7684\u5b57\u6bb5:"),(0,r.kt)("table",null,(0,r.kt)("thead",{parentName:"table"},(0,r.kt)("tr",{parentName:"thead"},(0,r.kt)("th",{parentName:"tr",align:null},"\u5b57\u6bb5"),(0,r.kt)("th",{parentName:"tr",align:null},"\u8bf4\u660e"),(0,r.kt)("th",{parentName:"tr",align:null},"\u7248\u672c"))),(0,r.kt)("tbody",{parentName:"table"},(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"usageThresholds"),(0,r.kt)("td",{parentName:"tr",align:null},"usageThresholds \u8868\u793a\u673a\u5668\u57fa\u4e8e\u767e\u5206\u4f4d\u7edf\u8ba1\u7684\u8d44\u6e90\u5229\u7528\u7387\u9608\u503c\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v1.1.0")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"usageAggregationType"),(0,r.kt)("td",{parentName:"tr",align:null},"usageAggregationType \u8868\u793a\u8fc7\u6ee4\u65f6\u673a\u5668\u5229\u7528\u7387\u7684\u767e\u5206\u4f4d\u7c7b\u578b\u3002 \u76ee\u524d\u652f\u6301 ",(0,r.kt)("inlineCode",{parentName:"td"},"avg"),"\u3001",(0,r.kt)("inlineCode",{parentName:"td"},"p50"),"\u3001",(0,r.kt)("inlineCode",{parentName:"td"},"p90"),"\u3001",(0,r.kt)("inlineCode",{parentName:"td"},"p95")," \u548c ",(0,r.kt)("inlineCode",{parentName:"td"},"p99"),"\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v1.1.0")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"usageAggregatedDuration"),(0,r.kt)("td",{parentName:"tr",align:null},"usageAggregatedDuration \u8868\u793a\u8fc7\u6ee4\u65f6\u673a\u5668\u5229\u7528\u7387\u767e\u5206\u4f4d\u6570\u7684\u7edf\u8ba1\u5468\u671f\u3002\u4e0d\u8bbe\u7f6e\u8be5\u5b57\u6bb5\u65f6\uff0c\u8c03\u5ea6\u5668\u9ed8\u8ba4\u4f7f\u7528 NodeMetrics \u4e2d\u6700\u5927\u5468\u671f\u7684\u6570\u636e\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v1.1.0")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"scoreAggregationType"),(0,r.kt)("td",{parentName:"tr",align:null},"scoreAggregationType \u8868\u793a\u8bc4\u5206\u65f6\u673a\u5668\u5229\u7528\u7387\u7684\u767e\u5206\u4f4d\u7c7b\u578b\u3002 \u76ee\u524d\u652f\u6301 ",(0,r.kt)("inlineCode",{parentName:"td"},"avg"),"\u3001",(0,r.kt)("inlineCode",{parentName:"td"},"p50"),"\u3001",(0,r.kt)("inlineCode",{parentName:"td"},"p90"),"\u3001",(0,r.kt)("inlineCode",{parentName:"td"},"p95")," \u548c ",(0,r.kt)("inlineCode",{parentName:"td"},"p99"),"\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v1.1.0")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"scoreAggregatedDuration"),(0,r.kt)("td",{parentName:"tr",align:null},"scoreAggregatedDuration \u8868\u793a\u6253\u5206\u65f6 Prod Pod \u5229\u7528\u7387\u767e\u5206\u4f4d\u7684\u7edf\u8ba1\u5468\u671f\u3002 \u4e0d\u8bbe\u7f6e\u8be5\u5b57\u6bb5\u65f6\uff0c\u8c03\u5ea6\u5668\u9ed8\u8ba4\u4f7f\u7528 NodeMetrics \u4e2d\u6700\u5927\u5468\u671f\u7684\u6570\u636e\u3002"),(0,r.kt)("td",{parentName:"tr",align:null},">= v1.1.0")))),(0,r.kt)("p",null,(0,r.kt)("inlineCode",{parentName:"p"},"aggregated")," \u548c ",(0,r.kt)("inlineCode",{parentName:"p"},"usageThresholds")," \u53c2\u6570\u662f\u4e92\u65a5\u7684\u3002 \u5f53\u4e24\u8005\u90fd\u914d\u7f6e\u65f6\uff0c\u5c06\u4f7f\u7528 ",(0,r.kt)("inlineCode",{parentName:"p"},"aggregated"),"\u3002\u6b64\u5916\uff0c\u76ee\u524d\u4e0d\u652f\u6301 Pod \u7c7b\u578b\u611f\u77e5\u3002"))}u.isMDXComponent=!0},2503:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/load-aware-scheduling-arch-cfa9bc8e584faf58a3c7807fd699361a.svg"}}]);
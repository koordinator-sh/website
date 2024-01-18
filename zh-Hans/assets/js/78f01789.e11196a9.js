"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[9407],{3905:(e,t,o)=>{o.d(t,{Zo:()=>u,kt:()=>g});var r=o(7294);function n(e,t,o){return t in e?Object.defineProperty(e,t,{value:o,enumerable:!0,configurable:!0,writable:!0}):e[t]=o,e}function l(e,t){var o=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),o.push.apply(o,r)}return o}function a(e){for(var t=1;t<arguments.length;t++){var o=null!=arguments[t]?arguments[t]:{};t%2?l(Object(o),!0).forEach((function(t){n(e,t,o[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(o)):l(Object(o)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(o,t))}))}return e}function i(e,t){if(null==e)return{};var o,r,n=function(e,t){if(null==e)return{};var o,r,n={},l=Object.keys(e);for(r=0;r<l.length;r++)o=l[r],t.indexOf(o)>=0||(n[o]=e[o]);return n}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(r=0;r<l.length;r++)o=l[r],t.indexOf(o)>=0||Object.prototype.propertyIsEnumerable.call(e,o)&&(n[o]=e[o])}return n}var d=r.createContext({}),p=function(e){var t=r.useContext(d),o=t;return e&&(o="function"==typeof e?e(t):a(a({},t),e)),o},u=function(e){var t=p(e.components);return r.createElement(d.Provider,{value:t},e.children)},c="mdxType",s={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},k=r.forwardRef((function(e,t){var o=e.components,n=e.mdxType,l=e.originalType,d=e.parentName,u=i(e,["components","mdxType","originalType","parentName"]),c=p(o),k=n,g=c["".concat(d,".").concat(k)]||c[k]||s[k]||l;return o?r.createElement(g,a(a({ref:t},u),{},{components:o})):r.createElement(g,a({ref:t},u))}));function g(e,t){var o=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var l=o.length,a=new Array(l);a[0]=k;var i={};for(var d in t)hasOwnProperty.call(t,d)&&(i[d]=t[d]);i.originalType=e,i[c]="string"==typeof e?e:n,a[1]=i;for(var p=2;p<l;p++)a[p]=o[p];return r.createElement.apply(null,a)}return r.createElement.apply(null,o)}k.displayName="MDXCreateElement"},7001:(e,t,o)=>{o.r(t),o.d(t,{assets:()=>d,contentTitle:()=>a,default:()=>s,frontMatter:()=>l,metadata:()=>i,toc:()=>p});var r=o(7462),n=(o(7294),o(3905));const l={slug:"release-v1.1.0",title:"Koordinator v1.1: \u8ba9\u8c03\u5ea6\u611f\u77e5\u8d1f\u8f7d\u4e0e\u5e72\u6270\u68c0\u6d4b\u91c7\u96c6",authors:["FillZpp"],tags:["release"]},a=void 0,i={permalink:"/zh-Hans/blog/release-v1.1.0",editUrl:"https://github.com/koordinator-sh/koordinator.sh/edit/main/blog/2023-01-03-release/index.md",source:"@site/i18n/zh-Hans/docusaurus-plugin-content-blog/2023-01-03-release/index.md",title:"Koordinator v1.1: \u8ba9\u8c03\u5ea6\u611f\u77e5\u8d1f\u8f7d\u4e0e\u5e72\u6270\u68c0\u6d4b\u91c7\u96c6",description:"\u80cc\u666f",date:"2023-01-03T00:00:00.000Z",formattedDate:"2023\u5e741\u67083\u65e5",tags:[{label:"release",permalink:"/zh-Hans/blog/tags/release"}],readingTime:16.875,hasTruncateMarker:!1,authors:[{name:"Siyu Wang",title:"Koordinator maintainer",url:"https://github.com/FillZpp",imageURL:"https://github.com/FillZpp.png",key:"FillZpp"}],frontMatter:{slug:"release-v1.1.0",title:"Koordinator v1.1: \u8ba9\u8c03\u5ea6\u611f\u77e5\u8d1f\u8f7d\u4e0e\u5e72\u6270\u68c0\u6d4b\u91c7\u96c6",authors:["FillZpp"],tags:["release"]},prevItem:{title:"\u9f99\u8725 plugsched \u795e\u5668\u52a9\u529b Koordinator \u4e91\u539f\u751f\u5355\u673a\u6df7\u90e8\u2014\u2014 \u5185\u6838 CPU QoS \u63ed\u79d8",permalink:"/zh-Hans/blog/anolis-CPU-Co-location"},nextItem:{title:"Koordinator v1.0: \u6b63\u5f0f\u53d1\u5e03",permalink:"/zh-Hans/blog/release-v1.0.0"}},d={authorsImageUrls:[void 0]},p=[{value:"\u80cc\u666f",id:"\u80cc\u666f",level:2},{value:"\u7248\u672c\u7279\u6027\u6df1\u5165\u89e3\u8bfb",id:"\u7248\u672c\u7279\u6027\u6df1\u5165\u89e3\u8bfb",level:2},{value:"\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6",id:"\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6",level:3},{value:"\u652f\u6301\u6309\u5de5\u4f5c\u8d1f\u8f7d\u7c7b\u578b\u7edf\u8ba1\u548c\u5747\u8861\u8d1f\u8f7d\u6c34\u4f4d",id:"\u652f\u6301\u6309\u5de5\u4f5c\u8d1f\u8f7d\u7c7b\u578b\u7edf\u8ba1\u548c\u5747\u8861\u8d1f\u8f7d\u6c34\u4f4d",level:4},{value:"\u652f\u6301\u6309\u767e\u5206\u4f4d\u6570\u5229\u7528\u7387\u5747\u8861",id:"\u652f\u6301\u6309\u767e\u5206\u4f4d\u6570\u5229\u7528\u7387\u5747\u8861",level:4},{value:"\u8d1f\u8f7d\u611f\u77e5\u91cd\u8c03\u5ea6",id:"\u8d1f\u8f7d\u611f\u77e5\u91cd\u8c03\u5ea6",level:3},{value:"cgroup v2 \u652f\u6301",id:"cgroup-v2-\u652f\u6301",level:3},{value:"\u80cc\u666f",id:"\u80cc\u666f-1",level:4},{value:"\u4f7f\u7528 cgroups v2",id:"\u4f7f\u7528-cgroups-v2",level:4},{value:"\u5e72\u6270\u68c0\u6d4b\u6307\u6807\u91c7\u96c6",id:"\u5e72\u6270\u68c0\u6d4b\u6307\u6807\u91c7\u96c6",level:3},{value:"\u6307\u6807\u91c7\u96c6",id:"\u6307\u6807\u91c7\u96c6",level:4},{value:"ServiceMonitor",id:"servicemonitor",level:4},{value:"\u5176\u4ed6\u66f4\u65b0\u70b9",id:"\u5176\u4ed6\u66f4\u65b0\u70b9",level:3}],u={toc:p},c="wrapper";function s(e){let{components:t,...l}=e;return(0,n.kt)(c,(0,r.Z)({},u,l,{components:t,mdxType:"MDXLayout"}),(0,n.kt)("h2",{id:"\u80cc\u666f"},"\u80cc\u666f"),(0,n.kt)("p",null,"Koordinator \u65e8\u5728\u4e3a\u7528\u6237\u63d0\u4f9b\u5b8c\u6574\u7684\u6df7\u90e8\u5de5\u4f5c\u8d1f\u8f7d\u7f16\u6392\u3001\u6df7\u90e8\u8d44\u6e90\u8c03\u5ea6\u3001\u6df7\u90e8\u8d44\u6e90\u9694\u79bb\u53ca\u6027\u80fd\u8c03\u4f18\u89e3\u51b3\u65b9\u6848\uff0c\u5e2e\u52a9\u7528\u6237\u63d0\u9ad8\u5ef6\u8fdf\u654f\u611f\u670d\u52a1\u7684\u8fd0\u884c\u6027\u80fd\uff0c\u6316\u6398\u7a7a\u95f2\u8282\u70b9\u8d44\u6e90\u5e76\u5206\u914d\u7ed9\u771f\u6b63\u6709\u9700\u8981\u7684\u8ba1\u7b97\u4efb\u52a1\uff0c\u4ece\u800c\u63d0\u9ad8\u5168\u5c40\u7684\u8d44\u6e90\u5229\u7528\u6548\u7387\u3002"),(0,n.kt)("p",null,"\u4ece 2022 \u5e74 4 \u6708\u53d1\u5e03\u4ee5\u6765\uff0cKoordinator \u8fc4\u4eca\u4e00\u5171\u8fed\u4ee3\u53d1\u5e03\u4e86 9 \u4e2a\u7248\u672c\u3002\u9879\u76ee\u7ecf\u5386\u7684\u5927\u534a\u5e74\u53d1\u5c55\u8fc7\u7a0b\u4e2d\uff0c\u793e\u533a\u5438\u7eb3\u4e86\u5305\u62ec\u963f\u91cc\u5df4\u5df4\u3001\u5c0f\u7c73\u3001\u5c0f\u7ea2\u4e66\u3001\u7231\u5947\u827a\u3001360\u3001\u6709\u8d5e \u7b49\u5728\u5185\u7684\u5927\u91cf\u4f18\u79c0\u5de5\u7a0b\u5e08\uff0c\u8d21\u732e\u4e86\u4f17\u591a\u7684\u60f3\u6cd5\u3001\u4ee3\u7801\u548c\u573a\u666f\uff0c\u4e00\u8d77\u63a8\u52a8 Koordinator \u9879\u76ee\u7684\u6210\u719f\u3002"),(0,n.kt)("p",null,"\u4eca\u5929\uff0c\u5f88\u9ad8\u5174\u7684\u5ba3\u5e03 Koordinator v1.1 \u6b63\u5f0f\u53d1\u5e03\uff0c\u5b83\u5305\u542b\u4e86\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6/\u91cd\u8c03\u5ea6\u3001cgroup v2 \u652f\u6301\u3001\u5e72\u6270\u68c0\u6d4b\u6307\u6807\u91c7\u96c6\uff0c\u4ee5\u53ca\u5176\u4ed6\u4e00\u7cfb\u5217\u4f18\u5316\u70b9\u3002\u63a5\u4e0b\u6765\u6211\u4eec\u5c31\u9488\u5bf9\u8fd9\u4e9b\u65b0\u589e\u7279\u6027\u505a\u6df1\u5165\u89e3\u8bfb\u4e0e\u8bf4\u660e\u3002"),(0,n.kt)("h2",{id:"\u7248\u672c\u7279\u6027\u6df1\u5165\u89e3\u8bfb"},"\u7248\u672c\u7279\u6027\u6df1\u5165\u89e3\u8bfb"),(0,n.kt)("h3",{id:"\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6"},"\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6"),(0,n.kt)("h4",{id:"\u652f\u6301\u6309\u5de5\u4f5c\u8d1f\u8f7d\u7c7b\u578b\u7edf\u8ba1\u548c\u5747\u8861\u8d1f\u8f7d\u6c34\u4f4d"},"\u652f\u6301\u6309\u5de5\u4f5c\u8d1f\u8f7d\u7c7b\u578b\u7edf\u8ba1\u548c\u5747\u8861\u8d1f\u8f7d\u6c34\u4f4d"),(0,n.kt)("p",null,"Koordinator v1.0 \u53ca\u4e4b\u524d\u7684\u7248\u672c\uff0c\u63d0\u4f9b\u4e86\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6\u63d0\u4f9b\u57fa\u672c\u7684\u5229\u7528\u7387\u9608\u503c\u8fc7\u6ee4\u4fdd\u62a4\u9ad8\u8d1f\u8f7d\u6c34\u4f4d\u7684\u8282\u70b9\u7ee7\u7eed\u6076\u5316\u5f71\u54cd\u5de5\u4f5c\u8d1f\u8f7d\u7684\u8fd0\u884c\u65f6\u8d28\u91cf\uff0c\u4ee5\u53ca\u901a\u8fc7\u9884\u4f30\u673a\u5236\u89e3\u51b3\u89e3\u51b3\u51b7\u8282\u70b9\u8fc7\u8f7d\u7684\u60c5\u51b5\u3002\u5df2\u6709\u7684\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6\u80fd\u89e3\u51b3\u5f88\u591a\u5e38\u89c1\u573a\u666f\u7684\u95ee\u9898\u3002\u4f46\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6\u4f5c\u4e3a\u4e00\u79cd\u4f18\u5316\u624b\u6bb5\uff0c\u8fd8\u6709\u6bd4\u8f83\u591a\u7684\u573a\u666f\u662f\u9700\u8981\u5b8c\u5584\u7684\u3002"),(0,n.kt)("p",null,"\u76ee\u524d\u7684\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6\u4e3b\u8981\u89e3\u51b3\u4e86\u96c6\u7fa4\u5185\u6574\u673a\u7ef4\u5ea6\u7684\u8d1f\u8f7d\u5747\u8861\u6548\u679c\uff0c\u4f46\u6709\u53ef\u80fd\u51fa\u73b0\u4e00\u4e9b\u7279\u6b8a\u7684\u60c5\u51b5\uff1a\u8282\u70b9\u90e8\u7f72\u4e86\u4e0d\u5c11\u79bb\u7ebfPod\u8fd0\u884c\uff0c\u62c9\u9ad8\u4e86\u6574\u673a\u7684\u5229\u7528\u7387\uff0c\u4f46\u5728\u7ebf\u5e94\u7528\u5de5\u4f5c\u8d1f\u8f7d\u7684\u6574\u4f53\u5229\u7528\u7387\u504f\u4f4e\u3002\u8fd9\u4e2a\u65f6\u5019\u5982\u679c\u6709\u65b0\u7684\u5728\u7ebfPod\uff0c\u4e14\u6574\u4e2a\u96c6\u7fa4\u5185\u7684\u8d44\u6e90\u6bd4\u8f83\u7d27\u5f20\u65f6\uff0c\u4f1a\u6709\u5982\u4e0b\u7684\u95ee\u9898\uff1a"),(0,n.kt)("ol",null,(0,n.kt)("li",{parentName:"ol"},"\u6709\u53ef\u80fd\u56e0\u4e3a\u6574\u673a\u5229\u7528\u7387\u8d85\u8fc7\u6574\u673a\u5b89\u5168\u9608\u503c\u5bfc\u81f4\u65e0\u6cd5\u8c03\u5ea6\u5230\u8fd9\u4e2a\u8282\u70b9\u4e0a\u7684\uff1b"),(0,n.kt)("li",{parentName:"ol"},"\u8fd8\u53ef\u80fd\u51fa\u73b0\u4e00\u4e2a\u8282\u70b9\u7684\u5229\u7528\u7387\u867d\u7136\u76f8\u5bf9\u6bd4\u8f83\u4f4e\uff0c\u4f46\u4e0a\u9762\u8dd1\u7684\u5168\u662f\u5728\u7ebf\u5e94\u7528\u7387\uff0c\u4ece\u5728\u7ebf\u5e94\u7528\u89d2\u5ea6\u770b\uff0c\u5229\u7528\u7387\u5df2\u7ecf\u504f\u9ad8\u4e86\uff0c\u4f46\u6309\u7167\u5f53\u524d\u7684\u8c03\u5ea6\u7b56\u7565\uff0c\u8fd8\u4f1a\u7ee7\u7eed\u8c03\u5ea6\u8fd9\u4e2aPod\u4e0a\u6765\uff0c\u5bfc\u81f4\u8be5\u8282\u70b9\u5806\u79ef\u4e86\u5927\u91cf\u7684\u5728\u7ebf\u5e94\u7528\uff0c\u6574\u4f53\u7684\u8fd0\u884c\u6548\u679c\u5e76\u4e0d\u597d\u3002")),(0,n.kt)("p",null,"\u5728 Koordinator v1.1 \u4e2d\uff0ckoord-scheduler \u652f\u6301\u611f\u77e5\u5de5\u4f5c\u8d1f\u8f7d\u7c7b\u578b\uff0c\u533a\u5206\u4e0d\u540c\u7684\u6c34\u4f4d\u548c\u7b56\u7565\u8fdb\u884c\u8c03\u5ea6\u3002"),(0,n.kt)("p",null,"\u5728 Filter \u9636\u6bb5\uff0c\u65b0\u589e threshold \u914d\u7f6e ",(0,n.kt)("inlineCode",{parentName:"p"},"prodUsageThresholds"),"\uff0c\u8868\u793a\u5728\u7ebf\u5e94\u7528\u7684\u5b89\u5168\u9608\u503c\uff0c\u9ed8\u8ba4\u4e3a\u7a7a\u3002\u5982\u679c\u5f53\u524d\u8c03\u5ea6\u7684 Pod \u662f Prod \u7c7b\u578b\uff0ckoord-scheduler \u4f1a\u4ece\u5f53\u524d\u8282\u70b9\u7684 NodeMetric \u4e2d\u7edf\u8ba1\u6240\u6709\u5728\u7ebf\u5e94\u7528\u7684\u5229\u7528\u7387\u4e4b\u548c\uff0c\u5982\u679c\u8d85\u8fc7\u4e86 ",(0,n.kt)("inlineCode",{parentName:"p"},"prodUsageThresholds")," \u5c31\u8fc7\u6ee4\u6389\u8be5\u8282\u70b9\uff1b\u5982\u679c\u662f\u79bb\u7ebf Pod\uff0c\u6216\u8005\u6ca1\u6709\u914d\u7f6e ",(0,n.kt)("inlineCode",{parentName:"p"},"prodUsageThresholds"),"\uff0c\u4fdd\u6301\u539f\u6709\u7684\u903b\u8f91\uff0c\u6309\u6574\u673a\u5229\u7528\u7387\u5904\u7406\u3002"),(0,n.kt)("p",null,"\u5728 Score \u9636\u6bb5\uff0c\u65b0\u589e\u5f00\u5173 ",(0,n.kt)("inlineCode",{parentName:"p"},"scoreAccordingProdUsage")," \u8868\u793a\u662f\u5426\u6309 Prod \u7c7b\u578b\u7684\u5229\u7528\u7387\u6253\u5206\u5747\u8861\u3002\u9ed8\u8ba4\u4e0d\u542f\u7528\u3002\u5f53\u5f00\u542f\u540e\uff0c\u4e14\u5f53\u524d Pod \u662f Prod \u7c7b\u578b\u7684\u8bdd\uff0ckoord-scheduler \u5728\u9884\u4f30\u7b97\u6cd5\u4e2d\u53ea\u5904\u7406 Prod \u7c7b\u578b\u7684 Pod\uff0c\u5e76\u5bf9 NodeMetrics \u4e2d\u8bb0\u5f55\u7684\u5176\u4ed6\u7684\u672a\u4f7f\u7528\u9884\u4f30\u673a\u5236\u5904\u7406\u7684\u5728\u7ebf\u5e94\u7528\u7684 Pod \u7684\u5f53\u524d\u5229\u7528\u7387\u503c\u8fdb\u884c\u6c42\u548c\uff0c\u6c42\u548c\u540e\u7684\u503c\u53c2\u4e0e\u6700\u7ec8\u7684\u6253\u5206\u3002\u5982\u679c\u6ca1\u6709\u5f00\u542f ",(0,n.kt)("inlineCode",{parentName:"p"},"scoreAccordingProdUsage"),"\uff0c\u6216\u8005\u662f\u79bb\u7ebfPod\uff0c\u4fdd\u6301\u539f\u6709\u903b\u8f91\uff0c\u6309\u6574\u673a\u5229\u7528\u7387\u5904\u7406\u3002"),(0,n.kt)("h4",{id:"\u652f\u6301\u6309\u767e\u5206\u4f4d\u6570\u5229\u7528\u7387\u5747\u8861"},"\u652f\u6301\u6309\u767e\u5206\u4f4d\u6570\u5229\u7528\u7387\u5747\u8861"),(0,n.kt)("p",null,"Koordinator v1.0\u53ca\u4ee5\u524d\u7684\u7248\u672c\u90fd\u662f\u6309\u7167 koordlet \u4e0a\u62a5\u7684\u5e73\u5747\u5229\u7528\u7387\u6570\u636e\u8fdb\u884c\u8fc7\u6ee4\u548c\u6253\u5206\u3002\u4f46\u5e73\u5747\u503c\u9690\u85cf\u4e86\u6bd4\u8f83\u591a\u7684\u4fe1\u606f\uff0c\u56e0\u6b64\u5728 Koordinator v1.1 \u4e2d koordlet \u65b0\u589e\u4e86\u6839\u636e\u767e\u5206\u4f4d\u6570\u7edf\u8ba1\u7684\u5229\u7528\u7387\u805a\u5408\u6570\u636e\u3002\u8c03\u5ea6\u5668\u4fa7\u4e5f\u8ddf\u7740\u505a\u4e86\u76f8\u5e94\u7684\u9002\u914d\u3002"),(0,n.kt)("p",null,"\u66f4\u6539\u8c03\u5ea6\u5668\u7684 LoadAware \u63d2\u4ef6\u7684\u914d\u7f6e\uff0c",(0,n.kt)("inlineCode",{parentName:"p"},"aggregated")," \u8868\u793a\u6309\u7167\u767e\u5206\u4f4d\u6570\u805a\u5408\u6570\u636e\u8fdb\u884c\u6253\u5206\u548c\u8fc7\u6ee4\u3002",(0,n.kt)("inlineCode",{parentName:"p"},"aggregated.usageThresholds")," \u8868\u793a\u8fc7\u6ee4\u65f6\u7684\u6c34\u4f4d\u9608\u503c\uff1b",(0,n.kt)("inlineCode",{parentName:"p"},"aggregated.usageAggregationType")," \u8868\u793a\u8fc7\u6ee4\u9636\u6bb5\u8981\u4f7f\u7528\u7684\u767e\u5206\u4f4d\u6570\u7c7b\u578b\uff0c\u652f\u6301 ",(0,n.kt)("inlineCode",{parentName:"p"},"avg"),"\uff0c",(0,n.kt)("inlineCode",{parentName:"p"},"p99"),", ",(0,n.kt)("inlineCode",{parentName:"p"},"p95"),", ",(0,n.kt)("inlineCode",{parentName:"p"},"p90")," \u548c ",(0,n.kt)("inlineCode",{parentName:"p"},"p50"),"\uff1b",(0,n.kt)("inlineCode",{parentName:"p"},"aggregated.usageAggregatedDuration")," \u8868\u793a\u8fc7\u6ee4\u9636\u6bb5\u671f\u671b\u4f7f\u7528\u7684\u805a\u5408\u5468\u671f\uff0c\u5982\u679c\u4e0d\u914d\u7f6e\uff0c\u8c03\u5ea6\u5668\u5c06\u4f7f\u7528 NodeMetrics \u4e2d\u4e0a\u62a5\u7684\u6700\u5927\u5468\u671f\u7684\u6570\u636e\uff1b",(0,n.kt)("inlineCode",{parentName:"p"},"aggregated.scoreAggregationType")," \u8868\u793a\u5728\u6253\u5206\u9636\u6bb5\u671f\u671b\u4f7f\u7528\u7684\u767e\u5206\u4f4d\u6570\u7c7b\u578b\uff1b",(0,n.kt)("inlineCode",{parentName:"p"},"aggregated.scoreAggregatedDuration")," \u8868\u793a\u6253\u5206\u9636\u6bb5\u671f\u671b\u4f7f\u7528\u7684\u805a\u5408\u5468\u671f\uff0c\u5982\u679c\u4e0d\u914d\u7f6e\uff0c\u8c03\u5ea6\u5668\u5c06\u4f7f\u7528 NodeMetrics \u4e2d\u4e0a\u62a5\u7684\u6700\u5927\u5468\u671f\u7684\u6570\u636e\u3002"),(0,n.kt)("p",null,"\u5728 Filter \u9636\u6bb5\uff0c\u5982\u679c\u914d\u7f6e\u4e86 ",(0,n.kt)("inlineCode",{parentName:"p"},"aggregated.usageThresholds")," \u4ee5\u53ca\u5bf9\u5e94\u7684\u805a\u5408\u7c7b\u578b\uff0c\u8c03\u5ea6\u5668\u5c06\u6309\u8be5\u767e\u5206\u4f4d\u6570\u7edf\u8ba1\u503c\u8fdb\u884c\u8fc7\u6ee4\uff1b"),(0,n.kt)("p",null,"\u5728 Score \u9636\u6bb5\uff0c\u5982\u679c\u914d\u7f6e\u4e86 ",(0,n.kt)("inlineCode",{parentName:"p"},"aggregated.scoreAggregationType"),"\uff0c\u8c03\u5ea6\u5668\u5c06\u4f1a\u6309\u8be5\u767e\u5206\u4f4d\u6570\u7edf\u8ba1\u503c\u6253\u5206\uff1b\u76ee\u524d\u6682\u65f6\u4e0d\u652f\u6301 Prod Pod \u4f7f\u7528\u767e\u5206\u4f4d\u6570\u8fc7\u6ee4\u3002"),(0,n.kt)("h3",{id:"\u8d1f\u8f7d\u611f\u77e5\u91cd\u8c03\u5ea6"},"\u8d1f\u8f7d\u611f\u77e5\u91cd\u8c03\u5ea6"),(0,n.kt)("p",null,"Koordinator \u5728\u8fc7\u53bb\u7684\u51e0\u4e2a\u7248\u672c\u4e2d\uff0c\u6301\u7eed\u7684\u6f14\u8fdb\u91cd\u8c03\u5ea6\u5668\uff0c\u5148\u540e\u4e86\u5f00\u6e90\u5b8c\u6574\u7684\u6846\u67b6\uff0c\u52a0\u5f3a\u4e86\u5b89\u5168\u6027\uff0c\u907f\u514d\u56e0\u8fc7\u5ea6\u9a71\u9010 Pod \u5f71\u54cd\u5728\u7ebf\u5e94\u7528\u7684\u7a33\u5b9a\u6027\u3002\u8fd9\u4e5f\u5f71\u54cd\u4e86\u91cd\u8c03\u5ea6\u529f\u80fd\u7684\u8fdb\u5c55\uff0c\u8fc7\u53bb Koordinator \u6682\u65f6\u6ca1\u6709\u592a\u591a\u529b\u91cf\u5efa\u8bbe\u91cd\u8c03\u5ea6\u80fd\u529b\u3002\u8fd9\u4e00\u60c5\u51b5\u5c06\u4f1a\u5f97\u5230\u6539\u53d8\u3002"),(0,n.kt)("p",null,"Koordinator v1.1 \u4e2d\u6211\u4eec\u65b0\u589e\u4e86\u8d1f\u8f7d\u611f\u77e5\u91cd\u8c03\u5ea6\u529f\u80fd\u3002\u65b0\u7684\u63d2\u4ef6\u79f0\u4e3a ",(0,n.kt)("inlineCode",{parentName:"p"},"LowNodeLoad"),"\uff0c\u8be5\u63d2\u4ef6\u914d\u5408\u7740\u8c03\u5ea6\u5668\u7684\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6\u80fd\u529b\uff0c\u53ef\u4ee5\u5f62\u6210\u4e00\u4e2a\u95ed\u73af\uff0c\u8c03\u5ea6\u5668\u7684\u8d1f\u8f7d\u611f\u77e5\u8c03\u5ea6\u5728\u8c03\u5ea6\u65f6\u523b\u51b3\u7b56\u9009\u62e9\u6700\u4f18\u8282\u70b9\uff0c\u4f46\u968f\u7740\u65f6\u95f4\u548c\u96c6\u7fa4\u73af\u5883\u4ee5\u53ca\u5de5\u4f5c\u8d1f\u8f7d\u9762\u5bf9\u7684\u6d41\u91cf/\u8bf7\u6c42\u7684\u53d8\u5316\u65f6\uff0c\u8d1f\u8f7d\u611f\u77e5\u91cd\u8c03\u5ea6\u53ef\u4ee5\u4ecb\u5165\u8fdb\u6765\uff0c\u5e2e\u52a9\u4f18\u5316\u8d1f\u8f7d\u6c34\u4f4d\u8d85\u8fc7\u5b89\u5168\u9608\u503c\u7684\u8282\u70b9\u3002 ",(0,n.kt)("inlineCode",{parentName:"p"},"LowNodeLoad")," \u4e0e K8s descheduler \u7684\u63d2\u4ef6 LowNodeUtilization \u4e0d\u540c\u7684\u662f\uff0cLowNodeLoad\u662f\u6839\u636e\u8282\u70b9\u771f\u5b9e\u5229\u7528\u7387\u7684\u60c5\u51b5\u51b3\u7b56\u91cd\u8c03\u5ea6\uff0c\u800c LowNodeUtilization \u662f\u6839\u636e\u8d44\u6e90\u5206\u914d\u7387\u51b3\u7b56\u91cd\u8c03\u5ea6\u3002"),(0,n.kt)("p",null,(0,n.kt)("inlineCode",{parentName:"p"},"LowNodeLoad")," \u63d2\u4ef6\u6709\u4e24\u4e2a\u6700\u91cd\u8981\u7684\u53c2\u6570\uff0c\u5206\u522b\u662f ",(0,n.kt)("inlineCode",{parentName:"p"},"highThresholds")," \u548c ",(0,n.kt)("inlineCode",{parentName:"p"},"lowThresholds"),"\uff1a"),(0,n.kt)("ul",null,(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("inlineCode",{parentName:"li"},"highThresholds")," \u8868\u793a\u8d1f\u8f7d\u6c34\u4f4d\u7684\u8b66\u6212\u9608\u503c\uff0c\u8d85\u8fc7\u8be5\u9608\u503c\u7684\u8282\u70b9\u4e0a\u7684Pod\u5c06\u53c2\u4e0e\u91cd\u8c03\u5ea6\uff1b"),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("inlineCode",{parentName:"li"},"lowThresholds")," \u8868\u793a\u8d1f\u8f7d\u6c34\u4f4d\u7684\u5b89\u5168\u6c34\u4f4d\u3002\u4f4e\u4e8e\u8be5\u9608\u503c\u7684\u8282\u70b9\u4e0a\u7684Pod\u4e0d\u4f1a\u88ab\u91cd\u8c03\u5ea6\u3002")),(0,n.kt)("p",null,"\u4ee5\u4e0b\u56fe\u4e3a\u4f8b\uff0clowThresholds \u4e3a45%\uff0chighThresholds \u4e3a 70%\uff0c\u90a3\u4e48\u4f4e\u4e8e 45% \u7684\u8282\u70b9\u662f\u5b89\u5168\u7684\uff0c\u56e0\u4e3a\u6c34\u4f4d\u5df2\u7ecf\u5f88\u4f4e\u4e86\uff1b\u9ad8\u4e8e45%\uff0c\u4f46\u662f\u4f4e\u4e8e 70%\u7684\u662f\u533a\u95f4\u662f\u6211\u4eec\u671f\u671b\u7684\u8d1f\u8f7d\u6c34\u4f4d\u8303\u56f4\uff1b\u9ad8\u4e8e70%\u7684\u8282\u70b9\u5c31\u4e0d\u5b89\u5168\u4e86\uff0c\u5e94\u8be5\u628a\u8d85\u8fc770%\u7684\u8fd9\u90e8\u5206\uff08\u5047\u8bbe\u5f53\u524d\u8282\u70b9A\u7684\u8d1f\u8f7d\u6c34\u4f4d\u662f85%\uff09\uff0c\u90a3\u4e48 85% - 70% = 15% \u7684\u8d1f\u8f7d\u964d\u4f4e\uff0c\u7b5b\u9009 Pod \u540e\u6267\u884c\u8fc1\u79fb\u3002"),(0,n.kt)("p",null,(0,n.kt)("img",{alt:"LowNodeLoad \u793a\u4f8b",src:o(2469).Z,width:"2288",height:"760"})),(0,n.kt)("p",null,"\u8fc1\u79fb\u65f6\uff0c\u8fd8\u8981\u8003\u8651\u5230\u4f4e\u4e8e 45% \u7684\u8fd9\u90e8\u5206\u8282\u70b9\u662f\u6211\u4eec\u91cd\u8c03\u5ea6\u540e\u8981\u627f\u8f7d\u65b0Pod\u7684\u8282\u70b9\uff0c\u6211\u4eec\u9700\u8981\u786e\u4fdd\u8fc1\u79fb\u7684Pod\u7684\u8d1f\u8f7d\u603b\u91cf\u4e0d\u4f1a\u8d85\u8fc7\u8fd9\u4e9b\u4f4e\u8d1f\u8f7d\u8282\u70b9\u7684\u627f\u8f7d\u4e0a\u9650\u3002\u8fd9\u4e2a\u627f\u8f7d\u4e0a\u9650\u5373\u662f highThresholds - \u8282\u70b9\u5f53\u524d\u8d1f\u8f7d\uff0c\u5047\u8bbe\u8282\u70b9B\u7684\u8d1f\u8f7d\u6c34\u4f4d\u662f20%\uff0c\u90a3\u4e48 70%-20% = 50%\uff0c\u8fd950%\u5c31\u662f\u53ef\u4ee5\u627f\u8f7d\u7684\u5bb9\u91cf\u4e86\u3002\u56e0\u6b64\u8fc1\u79fb\u65f6\u6bcf\u9a71\u9010\u4e00\u4e2a Pod\uff0c\u8fd9\u4e2a\u627f\u8f7d\u5bb9\u91cf\u5c31\u5e94\u8be5\u6263\u6389\u5f53\u524d\u91cd\u8c03\u5ea6 Pod \u7684\u5f53\u524d\u8d1f\u8f7d\u6216\u8005\u9884\u4f30\u8d1f\u8f7d\u6216\u8005\u753b\u50cf\u503c\uff08\u8fd9\u90e8\u5206\u503c\u4e0e\u8d1f\u8f7d\u8c03\u5ea6\u91cc\u7684\u503c\u5bf9\u5e94\uff09\u3002\u8fd9\u6837\u5c31\u53ef\u4ee5\u786e\u4fdd\u4e0d\u4f1a\u591a\u8fc1\u79fb\u3002 "),(0,n.kt)("p",null,"\u5982\u679c\u4e00\u4e2a\u96c6\u7fa4\u603b\u662f\u53ef\u80fd\u4f1a\u51fa\u73b0\u67d0\u4e9b\u8282\u70b9\u7684\u8d1f\u8f7d\u5c31\u662f\u6bd4\u8f83\u9ad8\uff0c\u800c\u4e14\u6570\u91cf\u5e76\u4e0d\u591a\uff0c\u8fd9\u4e2a\u65f6\u5019\u5982\u679c\u9891\u7e41\u7684\u91cd\u8c03\u5ea6\u8fd9\u4e9b\u8282\u70b9\uff0c\u4e5f\u4f1a\u5e26\u6765\u5b89\u5168\u9690\u60a3\uff0c\u56e0\u6b64\u53ef\u4ee5\u8ba9\u7528\u6237\u6309\u9700\u8bbe\u7f6e ",(0,n.kt)("inlineCode",{parentName:"p"},"numberOfNodes"),"\u3002"),(0,n.kt)("p",null,"\u53e6\u5916\uff0c",(0,n.kt)("inlineCode",{parentName:"p"},"LowNodeLoad")," \u8bc6\u522b\u51fa\u8d85\u8fc7\u9608\u503c\u7684\u8282\u70b9\u540e\u4f1a\u7b5b\u9009 Pod\uff0c\u5f53\u7b5b\u9009 Pod \u65f6\uff0c\u53ef\u4ee5\u914d\u7f6e\u8981\u652f\u6301\u6216\u8005\u8fc7\u6ee4\u7684 namespace\uff0c\u6216\u8005\u914d\u7f6e pod selector \u7b5b\u9009\uff0c\u4e5f\u53ef\u4ee5\u914d\u7f6e ",(0,n.kt)("inlineCode",{parentName:"p"},"nodeFit")," \u68c0\u67e5\u6bcf\u4e2a\u5907\u9009 Pod \u5bf9\u5e94\u7684 Node Affinity/Node Selector/Toleration \u662f\u5426\u6709\u4e0e\u4e4b\u5339\u914d\u7684 Node\uff0c\u5982\u679c\u6ca1\u6709\u7684\u8bdd\uff0c\u8fd9\u79cd\u8282\u70b9\u4e5f\u4f1a\u88ab\u5ffd\u7565\u3002\u5f53\u7136\u53ef\u4ee5\u8003\u8651\u4e0d\u542f\u7528\u8fd9\u4e2a\u80fd\u529b\uff0c\u901a\u8fc7\u914d\u7f6e ",(0,n.kt)("inlineCode",{parentName:"p"},"nodeFit")," \u4e3a false \u540e\u5373\u53ef\u7981\u7528\uff0c\u6b64\u65f6\u5b8c\u5168\u7531\u5e95\u5c42\u7684 ",(0,n.kt)("inlineCode",{parentName:"p"},"MigrationController")," \u901a\u8fc7 Koordinator Reservation \u9884\u7559\u8d44\u6e90\uff1b"),(0,n.kt)("p",null,"\u5f53\u7b5b\u9009\u51fa Pod \u540e\uff0c\u4f1a\u5bf9\u8fd9\u4e9b Pod \u8fdb\u884c\u6392\u5e8f\u3002\u4f1a\u4f9d\u9760Koordinator QoSClass\u3001Kubernetes QoSClass\u3001Priority\u3001\u7528\u91cf\u548c\u521b\u5efa\u65f6\u95f4\u7b49\u591a\u4e2a\u7ef4\u5ea6\u6392\u5e8f\u3002"),(0,n.kt)("h3",{id:"cgroup-v2-\u652f\u6301"},"cgroup v2 \u652f\u6301"),(0,n.kt)("h4",{id:"\u80cc\u666f-1"},"\u80cc\u666f"),(0,n.kt)("p",null,"Koordinator \u4e2d\u4f17\u591a\u5355\u673a QoS \u80fd\u529b\u548c\u8d44\u6e90\u538b\u5236/\u5f39\u6027\u7b56\u7565\u6784\u5efa\u5728 Linux Control Group (cgroups) \u673a\u5236\u4e0a\uff0c\u6bd4\u5982 CPU QoS (cpu)\u3001Memory QoS (memory)\u3001CPU Burst (cpu)\u3001CPU Suppress (cpu, cpuset)\uff0ckoordlet \u7ec4\u4ef6\u53ef\u4ee5\u901a\u8fc7 cgroups (v1) \u9650\u5236\u5bb9\u5668\u53ef\u7528\u8d44\u6e90\u7684\u65f6\u95f4\u7247\u3001\u6743\u91cd\u3001\u4f18\u5148\u7ea7\u3001\u62d3\u6251\u7b49\u5c5e\u6027\u3002Linux \u9ad8\u7248\u672c\u5185\u6838\u4e5f\u5728\u6301\u7eed\u589e\u5f3a\u548c\u8fed\u4ee3\u4e86 cgroups \u673a\u5236\uff0c\u5e26\u6765\u4e86 cgroups v2 \u673a\u5236\uff0c\u7edf\u4e00 cgroups \u76ee\u5f55\u7ed3\u6784\uff0c\u6539\u5584 v1 \u4e2d\u4e0d\u540c subsystem/cgroup controller \u4e4b\u95f4\u7684\u534f\u4f5c\uff0c\u5e76\u8fdb\u4e00\u6b65\u589e\u5f3a\u4e86\u90e8\u5206\u5b50\u7cfb\u7edf\u7684\u8d44\u6e90\u7ba1\u7406\u548c\u76d1\u63a7\u80fd\u529b\u3002Kubernetes \u81ea 1.25 \u8d77\u5c06 cgroups v2 \u4f5c\u4e3a GA (general availability) \u7279\u6027\uff0c\u5728 Kubelet \u4e2d\u542f\u7528\u8be5\u7279\u6027\u8fdb\u884c\u5bb9\u5668\u7684\u8d44\u6e90\u7ba1\u7406\uff0c\u5728\u7edf\u4e00\u7684 cgroups \u5c42\u6b21\u4e0b\u8bbe\u7f6e\u5bb9\u5668\u7684\u8d44\u6e90\u9694\u79bb\u53c2\u6570\uff0c\u652f\u6301 MemoryQoS \u7684\u589e\u5f3a\u7279\u6027\u3002"),(0,n.kt)("p",null,(0,n.kt)("img",{alt:"cgroup v1/v2 \u7ed3\u6784",src:o(9229).Z,width:"691",height:"171"})),(0,n.kt)("p",null,"\u5728 Koordinator v1.1 \u4e2d\uff0c\u5355\u673a\u7ec4\u4ef6 koordlet \u65b0\u589e\u5bf9 cgroups v2 \u7684\u652f\u6301\uff0c\u5305\u62ec\u5982\u4e0b\u5de5\u4f5c\uff1a"),(0,n.kt)("ul",null,(0,n.kt)("li",{parentName:"ul"},"\u91cd\u6784\u4e86 Resource Executor \u6a21\u5757\uff0c\u4ee5\u7edf\u4e00\u76f8\u540c\u6216\u8fd1\u4f3c\u7684 cgroup \u63a5\u53e3\u5728 v1 \u548c v2 \u4e0d\u540c\u7248\u672c\u4e0a\u7684\u6587\u4ef6\u64cd\u4f5c\uff0c\u4fbf\u4e8e koordlet \u7279\u6027\u517c\u5bb9 cgroups v2 \u548c\u5408\u5e76\u8bfb\u5199\u51b2\u7a81\u3002"),(0,n.kt)("li",{parentName:"ul"},"\u5728\u5f53\u524d\u5df2\u5f00\u653e\u7684\u5355\u673a\u7279\u6027\u4e2d\u9002\u914d cgroups v2\uff0c\u91c7\u7528\u65b0\u7684 Resource Executor \u6a21\u5757\u66ff\u6362 cgroup \u64cd\u4f5c\uff0c\u4f18\u5316\u4e0d\u540c\u7cfb\u7edf\u73af\u5883\u4e0b\u7684\u62a5\u9519\u65e5\u5fd7\u3002")),(0,n.kt)("p",null,"Koordinator v1.1 \u4e2d\u5927\u90e8\u5206 koordlet \u7279\u6027\u5df2\u7ecf\u517c\u5bb9 cgroups v2\uff0c\u5305\u62ec\u4f46\u4e0d\u9650\u4e8e\uff1a"),(0,n.kt)("ul",null,(0,n.kt)("li",{parentName:"ul"},"\u8d44\u6e90\u5229\u7528\u7387\u91c7\u96c6"),(0,n.kt)("li",{parentName:"ul"},"\u52a8\u6001\u8d44\u6e90\u8d85\u5356"),(0,n.kt)("li",{parentName:"ul"},"Batch \u8d44\u6e90\u9694\u79bb\uff08BatchResource\uff0c\u5e9f\u5f03BECgroupReconcile\uff09"),(0,n.kt)("li",{parentName:"ul"},"CPU QoS\uff08GroupIdentity\uff09"),(0,n.kt)("li",{parentName:"ul"},"Memory QoS\uff08CgroupReconcile\uff09"),(0,n.kt)("li",{parentName:"ul"},"CPU \u52a8\u6001\u538b\u5236\uff08BECPUSuppress\uff09"),(0,n.kt)("li",{parentName:"ul"},"\u5185\u5b58\u9a71\u9010\uff08BEMemoryEvict\uff09"),(0,n.kt)("li",{parentName:"ul"},"CPU Burst\uff08CPUBurst\uff09"),(0,n.kt)("li",{parentName:"ul"},"L3 Cache \u53ca\u5185\u5b58\u5e26\u5bbd\u9694\u79bb\uff08RdtResctrl\uff09")),(0,n.kt)("p",null,"\u9057\u7559\u7684\u672a\u517c\u5bb9\u7279\u6027\u5982 PSICollector \u5c06\u5728\u63a5\u4e0b\u6765\u7684 v1.2 \u7248\u672c\u4e2d\u8fdb\u884c\u9002\u914d\uff0c\u53ef\u4ee5\u8ddf\u8fdb issue#407 \u83b7\u53d6\u6700\u65b0\u8fdb\u5c55\u3002\u63a5\u4e0b\u6765\u7684 Koordinator \u7248\u672c\u4e2d\u4e5f\u5c06\u9010\u6e10\u5f15\u5165\u66f4\u591a cgroups v2 \u7684\u589e\u5f3a\u529f\u80fd\uff0c\u656c\u8bf7\u671f\u5f85\u3002"),(0,n.kt)("h4",{id:"\u4f7f\u7528-cgroups-v2"},"\u4f7f\u7528 cgroups v2"),(0,n.kt)("p",null,"\u5728 Koordinator v1.1 \u4e2d\uff0ckoordlet \u5bf9 cgroups v2 \u7684\u9002\u914d\u5bf9\u4e0a\u5c42\u529f\u80fd\u914d\u7f6e\u900f\u660e\uff0c\u9664\u4e86\u88ab\u5e9f\u5f03\u7279\u6027\u7684 feature-gate \u4ee5\u5916\uff0c\u60a8\u65e0\u9700\u53d8\u52a8 ConfigMap ",(0,n.kt)("inlineCode",{parentName:"p"},"slo-controller-config")," \u548c\u5176\u4ed6 feature-gate \u914d\u7f6e\u3002\u5f53 koordlet \u8fd0\u884c\u5728\u542f\u7528 cgroups v2 \u7684\u8282\u70b9\u4e0a\u65f6\uff0c\u76f8\u5e94\u5355\u673a\u7279\u6027\u5c06\u81ea\u52a8\u5207\u6362\u5230 cgroups-v2 \u7cfb\u7edf\u63a5\u53e3\u8fdb\u884c\u64cd\u4f5c\u3002"),(0,n.kt)("p",null,"\u6b64\u5916\uff0ccgroups v2 \u662f Linux \u9ad8\u7248\u672c\u5185\u6838\uff08\u5efa\u8bae >=5.8\uff09\u7684\u7279\u6027\uff0c\u5bf9\u7cfb\u7edf\u5185\u6838\u7248\u672c\u548c Kubernetes \u7248\u672c\u6709\u4e00\u5b9a\u4f9d\u8d56\u3002\u5efa\u8bae\u91c7\u7528\u9ed8\u8ba4\u542f\u7528 cgroups v2 \u7684 Linux \u53d1\u884c\u7248\u4ee5\u53ca Kubernetes v1.24 \u4ee5\u4e0a\u7248\u672c\u3002"),(0,n.kt)("p",null,"\u66f4\u591a\u5173\u4e8e\u5982\u4f55\u542f\u7528 cgroups v2 \u7684\u8bf4\u660e\uff0c\u8bf7\u53c2\u7167 Kubernetes \u793e\u533a",(0,n.kt)("a",{parentName:"p",href:"https://kubernetes.io/docs/concepts/architecture/cgroups/#using-cgroupv2"},"\u6587\u6863"),"\u3002"),(0,n.kt)("h3",{id:"\u5e72\u6270\u68c0\u6d4b\u6307\u6807\u91c7\u96c6"},"\u5e72\u6270\u68c0\u6d4b\u6307\u6807\u91c7\u96c6"),(0,n.kt)("p",null,"\u5728\u771f\u5b9e\u7684\u751f\u4ea7\u73af\u5883\u4e0b\uff0c\u5355\u673a\u7684\u8fd0\u884c\u65f6\u72b6\u6001\u662f\u4e00\u4e2a\u201c\u6df7\u6c8c\u7cfb\u7edf\u201d\uff0c\u8d44\u6e90\u7ade\u4e89\u4ea7\u751f\u7684\u5e94\u7528\u5e72\u6270\u65e0\u6cd5\u7edd\u5bf9\u907f\u514d\u3002Koordinator \u6b63\u5728\u5efa\u7acb\u5e72\u6270\u68c0\u6d4b\u4e0e\u4f18\u5316\u7684\u80fd\u529b\uff0c\u901a\u8fc7\u63d0\u53d6\u5e94\u7528\u8fd0\u884c\u72b6\u6001\u7684\u6307\u6807\uff0c\u8fdb\u884c\u5b9e\u65f6\u7684\u5206\u6790\u548c\u68c0\u6d4b\uff0c\u5728\u53d1\u73b0\u5e72\u6270\u540e\u5bf9\u76ee\u6807\u5e94\u7528\u548c\u5e72\u6270\u6e90\u91c7\u53d6\u66f4\u5177\u9488\u5bf9\u6027\u7684\u7b56\u7565\u3002"),(0,n.kt)("p",null,"\u5f53\u524d Koordinator \u5df2\u7ecf\u5b9e\u73b0\u4e86\u4e00\u7cfb\u5217 ",(0,n.kt)("inlineCode",{parentName:"p"},"Performance Collector"),"\uff0c\u5728\u5355\u673a\u4fa7\u91c7\u96c6\u4e0e\u5e94\u7528\u8fd0\u884c\u72b6\u6001\u9ad8\u76f8\u5173\u6027\u7684\u5e95\u5c42\u6307\u6807\uff0c\u5e76\u901a\u8fc7 Prometheus \u66b4\u9732\u51fa\u6765\uff0c\u4e3a\u5e72\u6270\u68c0\u6d4b\u80fd\u529b\u548c\u96c6\u7fa4\u5e94\u7528\u8c03\u5ea6\u63d0\u4f9b\u652f\u6301\u3002"),(0,n.kt)("h4",{id:"\u6307\u6807\u91c7\u96c6"},"\u6307\u6807\u91c7\u96c6"),(0,n.kt)("p",null,"Performance Collector \u7531\u591a\u4e2a feature-gate \u8fdb\u884c\u63a7\u5236\uff0cKoordinator \u76ee\u524d\u63d0\u4f9b\u4ee5\u4e0b\u51e0\u4e2a\u6307\u6807\u91c7\u96c6\u5668\uff1a"),(0,n.kt)("ul",null,(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("inlineCode",{parentName:"li"},"CPICollector"),"\uff1a\u7528\u4e8e\u63a7\u5236 CPI \u6307\u6807\u91c7\u96c6\u5668\u3002CPI\uff1aCycles Per Instruction\u3002\u6307\u4ee4\u5728\u8ba1\u7b97\u673a\u4e2d\u6267\u884c\u6240\u9700\u8981\u7684\u5e73\u5747\u65f6\u949f\u5468\u671f\u6570\u3002CPI \u91c7\u96c6\u5668\u57fa\u4e8e Cycles \u548c Instructions \u8fd9\u4e24\u4e2a Kernel PMU\uff08Performance Monitoring Unit\uff09\u4e8b\u4ef6\u4ee5\u53ca perf_event_open(2) \u7cfb\u7edf\u8c03\u7528\u5b9e\u73b0\u3002"),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("inlineCode",{parentName:"li"},"PSICollector"),"\uff1a\u7528\u4e8e\u63a7\u5236 PSI \u6307\u6807\u91c7\u96c6\u5668\u3002PSI\uff1aPressure Stall Information\u3002\u8868\u793a\u5bb9\u5668\u5728\u91c7\u96c6\u65f6\u95f4\u95f4\u9694\u5185\uff0c\u56e0\u4e3a\u7b49\u5f85 cpu\u3001\u5185\u5b58\u3001IO \u8d44\u6e90\u5206\u914d\u800c\u963b\u585e\u7684\u4efb\u52a1\u6570\u3002\u4f7f\u7528 PSI \u91c7\u96c6\u5668\u524d\uff0c\u9700\u8981\u5728 Anolis OS \u4e2d\u5f00\u542f PSI \u529f\u80fd\uff0c\u60a8\u53ef\u4ee5\u53c2\u8003",(0,n.kt)("a",{parentName:"li",href:"https://help.aliyun.com/document_detail/155464.html"},"\u6587\u6863"),"\u83b7\u53d6\u5f00\u542f\u65b9\u6cd5\u3002")),(0,n.kt)("p",null,"Performance Collector \u76ee\u524d\u662f\u9ed8\u8ba4\u5173\u95ed\u7684\u3002\u60a8\u53ef\u4ee5\u901a\u8fc7\u4fee\u6539 Koordlet \u7684 feature-gates \u9879\u6765\u4f7f\u7528\u5b83\uff0c\u6b64\u9879\u4fee\u6539\u4e0d\u4f1a\u5f71\u54cd\u5176\u4ed6 feature-gate"),(0,n.kt)("pre",null,(0,n.kt)("code",{parentName:"pre"},"kubectl edit ds koordlet -n koordinator-system\n")),(0,n.kt)("pre",null,(0,n.kt)("code",{parentName:"pre",className:"language-yaml"},"...\nspec:\n  ...\n    spec:\n      containers:\n      - args:\n        ...\n        # modify here\n        # - -feature-gates=BECPUEvict=true,BEMemoryEvict=true,CgroupReconcile=true,Accelerators=true\n        - -feature-gates=BECPUEvict=true,BEMemoryEvict=true,CgroupReconcile=true,Accelerators=true,CPICollector=true,PSICollector=true\n")),(0,n.kt)("h4",{id:"servicemonitor"},"ServiceMonitor"),(0,n.kt)("p",null,"v1.1.0 \u7248\u672c\u7684 Koordinator \u4e3a Koordlet \u589e\u52a0\u4e86 ServiceMonitor \u7684\u80fd\u529b\uff0c\u5c06\u6240\u91c7\u96c6\u6307\u6807\u901a\u8fc7 Prometheus \u66b4\u9732\u51fa\u6765\uff0c\u7528\u6237\u53ef\u57fa\u4e8e\u6b64\u80fd\u529b\u91c7\u96c6\u76f8\u5e94\u6307\u6807\u8fdb\u884c\u5e94\u7528\u7cfb\u7edf\u7684\u5206\u6790\u4e0e\u7ba1\u7406\u3002"),(0,n.kt)("p",null,"ServiceMonitor \u7531 Prometheus \u5f15\u5165\uff0c\u6545\u5728 helm chart \u4e2d\u8bbe\u7f6e\u9ed8\u8ba4\u4e0d\u5f00\u542f\u5b89\u88c5\uff0c\u53ef\u4ee5\u901a\u8fc7\u4ee5\u4e0b\u547d\u4ee4\u5b89\u88c5ServiceMonitor\uff1a"),(0,n.kt)("pre",null,(0,n.kt)("code",{parentName:"pre"},"helm install koordinator https://... --set koordlet.enableServiceMonitor=true\n")),(0,n.kt)("p",null,"\u90e8\u7f72\u540e\u53ef\u5728 Prometheus UI \u627e\u5230\u8be5 Targets\u3002"),(0,n.kt)("pre",null,(0,n.kt)("code",{parentName:"pre"},'# HELP koordlet_container_cpi Container cpi collected by koordlet\n# TYPE koordlet_container_cpi gauge\nkoordlet_container_cpi{container_id="containerd://498de02ddd3ad7c901b3c80f96c57db5b3ed9a817dbfab9d16b18be7e7d2d047",container_name="koordlet",cpi_field="cycles",node="your-node-name",pod_name="koordlet-x8g2j",pod_namespace="koordinator-system",pod_uid="3440fb9c-423b-48e9-8850-06a6c50f633d"} 2.228107503e+09\nkoordlet_container_cpi{container_id="containerd://498de02ddd3ad7c901b3c80f96c57db5b3ed9a817dbfab9d16b18be7e7d2d047",container_name="koordlet",cpi_field="instructions",node="your-node-name",pod_name="koordlet-x8g2j",pod_namespace="koordinator-system",pod_uid="3440fb9c-423b-48e9-8850-06a6c50f633d"} 4.1456092e+09\n')),(0,n.kt)("p",null,"\u53ef\u4ee5\u671f\u5f85\u7684\u662f\uff0cKoordinator \u5e72\u6270\u68c0\u6d4b\u7684\u80fd\u529b\u5728\u66f4\u590d\u6742\u7684\u771f\u5b9e\u573a\u666f\u4e0b\u8fd8\u9700\u8981\u66f4\u591a\u68c0\u6d4b\u6307\u6807\u7684\u8865\u5145\uff0c\u540e\u7eed\u5c06\u5728\u5982\u5185\u5b58\u3001\u78c1\u76d8 IO \u7b49\u5176\u4ed6\u8bf8\u591a\u8d44\u6e90\u7684\u6307\u6807\u91c7\u96c6\u5efa\u8bbe\u65b9\u9762\u6301\u7eed\u53d1\u529b\u3002"),(0,n.kt)("h3",{id:"\u5176\u4ed6\u66f4\u65b0\u70b9"},"\u5176\u4ed6\u66f4\u65b0\u70b9"),(0,n.kt)("p",null,"\u901a\u8fc7 ",(0,n.kt)("a",{parentName:"p",href:"https://github.com/koordinator-sh/koordinator/releases/tag/v1.1.0"},"v1.1 release")," \u9875\u9762\uff0c\u53ef\u4ee5\u770b\u5230\u66f4\u591a\u7248\u672c\u6240\u5305\u542b\u7684\u65b0\u589e\u529f\u80fd\u3002"))}s.isMDXComponent=!0},9229:(e,t,o)=>{o.d(t,{Z:()=>r});const r=o.p+"assets/images/cgroup-v1-and-v2-94df02d090b7f7b4e7f3cc4c6accdaae.svg"},2469:(e,t,o)=>{o.d(t,{Z:()=>r});const r=o.p+"assets/images/lownodeload-sample-53d42010721f0acac9ece644dfff4252.png"}}]);
"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[9912],{3905:(e,t,o)=>{o.d(t,{Zo:()=>p,kt:()=>h});var r=o(7294);function n(e,t,o){return t in e?Object.defineProperty(e,t,{value:o,enumerable:!0,configurable:!0,writable:!0}):e[t]=o,e}function a(e,t){var o=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),o.push.apply(o,r)}return o}function i(e){for(var t=1;t<arguments.length;t++){var o=null!=arguments[t]?arguments[t]:{};t%2?a(Object(o),!0).forEach((function(t){n(e,t,o[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(o)):a(Object(o)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(o,t))}))}return e}function l(e,t){if(null==e)return{};var o,r,n=function(e,t){if(null==e)return{};var o,r,n={},a=Object.keys(e);for(r=0;r<a.length;r++)o=a[r],t.indexOf(o)>=0||(n[o]=e[o]);return n}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)o=a[r],t.indexOf(o)>=0||Object.prototype.propertyIsEnumerable.call(e,o)&&(n[o]=e[o])}return n}var s=r.createContext({}),d=function(e){var t=r.useContext(s),o=t;return e&&(o="function"==typeof e?e(t):i(i({},t),e)),o},p=function(e){var t=d(e.components);return r.createElement(s.Provider,{value:t},e.children)},c="mdxType",u={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},k=r.forwardRef((function(e,t){var o=e.components,n=e.mdxType,a=e.originalType,s=e.parentName,p=l(e,["components","mdxType","originalType","parentName"]),c=d(o),k=n,h=c["".concat(s,".").concat(k)]||c[k]||u[k]||a;return o?r.createElement(h,i(i({ref:t},p),{},{components:o})):r.createElement(h,i({ref:t},p))}));function h(e,t){var o=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var a=o.length,i=new Array(a);i[0]=k;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l[c]="string"==typeof e?e:n,i[1]=l;for(var d=2;d<a;d++)i[d]=o[d];return r.createElement.apply(null,i)}return r.createElement.apply(null,o)}k.displayName="MDXCreateElement"},6281:(e,t,o)=>{o.r(t),o.d(t,{assets:()=>s,contentTitle:()=>i,default:()=>u,frontMatter:()=>a,metadata:()=>l,toc:()=>d});var r=o(7462),n=(o(7294),o(3905));const a={},i="Koordinator YARN Copilot",l={unversionedId:"designs/koordinator-yarn",id:"version-v1.5/designs/koordinator-yarn",title:"Koordinator YARN Copilot",description:"\u80cc\u666f\u4ecb\u7ecd",source:"@site/i18n/zh-Hans/docusaurus-plugin-content-docs/version-v1.5/designs/koordinator-yarn.md",sourceDirName:"designs",slug:"/designs/koordinator-yarn",permalink:"/zh-Hans/docs/v1.5/designs/koordinator-yarn",draft:!1,editUrl:"https://github.com/koordinator-sh/koordinator.sh/edit/main/docs/designs/koordinator-yarn.md",tags:[],version:"v1.5",lastUpdatedBy:"Frame",lastUpdatedAt:1718775971,formattedLastUpdatedAt:"2024\u5e746\u670819\u65e5",frontMatter:{},sidebar:"docs",previous:{title:"Multi Hierarchy Elastic Quota Management",permalink:"/zh-Hans/docs/v1.5/designs/multi-hierarchy-elastic-quota-management"},next:{title:"Colocation of Spark Jobs",permalink:"/zh-Hans/docs/v1.5/best-practices/colocation-of-spark-jobs"}},s={},d=[{value:"\u80cc\u666f\u4ecb\u7ecd",id:"\u80cc\u666f\u4ecb\u7ecd",level:2},{value:"\u6280\u672f\u539f\u7406",id:"\u6280\u672f\u539f\u7406",level:2},{value:"\u8bbe\u8ba1\u539f\u5219",id:"\u8bbe\u8ba1\u539f\u5219",level:3},{value:"\u8d44\u6e90\u5206\u914d\u4e0e\u4ef2\u88c1",id:"\u8d44\u6e90\u5206\u914d\u4e0e\u4ef2\u88c1",level:3},{value:"\u8282\u70b9\u8fd0\u884c\u65f6\u7ba1\u7406",id:"\u8282\u70b9\u8fd0\u884c\u65f6\u7ba1\u7406",level:3},{value:"\u5355\u673aQoS\u7b56\u7565\u9002\u914d",id:"\u5355\u673aqos\u7b56\u7565\u9002\u914d",level:3},{value:"\u53c2\u4e0e\u5171\u5efa",id:"\u53c2\u4e0e\u5171\u5efa",level:2}],p={toc:d},c="wrapper";function u(e){let{components:t,...a}=e;return(0,n.kt)(c,(0,r.Z)({},p,a,{components:t,mdxType:"MDXLayout"}),(0,n.kt)("h1",{id:"koordinator-yarn-copilot"},"Koordinator YARN Copilot"),(0,n.kt)("h2",{id:"\u80cc\u666f\u4ecb\u7ecd"},"\u80cc\u666f\u4ecb\u7ecd"),(0,n.kt)("p",null,"Koordinator\u5df2\u7ecf\u652f\u6301\u4e86K8s\u751f\u6001\u5185\u7684\u5728\u79bb\u7ebf\u6df7\u90e8\uff0c\u901a\u8fc7Batch\u8d85\u5356\u8d44\u6e90\u4ee5\u53caBE QoS\uff0c\u79bb\u7ebf\u4efb\u52a1\u53ef\u4ee5\u4f7f\u7528\u5230\u96c6\u7fa4\u5185\u7684\u7a7a\u95f2\u8d44\u6e90\uff0c\u63d0\u5347\u8d44\u6e90\u4f7f\u7528\u6548\u7387\u3002\u7136\u800c\uff0c\n\u5728K8s\u751f\u6001\u5916\uff0c\u4ecd\u6709\u76f8\u5f53\u6570\u91cf\u7684\u7528\u6237\u4f1a\u9009\u62e9\u5c06\u5927\u6570\u636e\u4efb\u52a1\u8fd0\u884c\u5176\u4ed6\u8d44\u6e90\u7ba1\u7406\u7cfb\u7edf\uff0c\u4f8b\u5982",(0,n.kt)("a",{parentName:"p",href:"https://hadoop.apache.org/docs/current/hadoop-yarn/hadoop-yarn-site/YARN.html"},"Apache Hadoop YARN")," \u3002\n\u4f5c\u4e3a\u5927\u6570\u636e\u751f\u6001\u4e0b\u7684\u8d44\u6e90\u7ba1\u7406\u7cfb\u7edf\uff0cYARN\u627f\u8f7d\u4e86\u5305\u62ecMapReduce\u3001Spark\u3001Flink\u4ee5\u53caPresto\u7b49\u5728\u5185\u7684\u591a\u79cd\u8ba1\u7b97\u5f15\u64ce\u3002\u867d\u7136\u76ee\u524d\u4e00\u4e9b\u8ba1\u7b97\u5f15\u64ce\u63d0\u4f9b\u4e86K8s operator\u53ef\u4ee5\n\u5c06\u4efb\u52a1\u878d\u5165\u5230K8s\u751f\u6001\uff0c\u4f46\u4e0d\u53ef\u5426\u8ba4\u7684\u662f\uff0c\u76ee\u524dYARN\u751f\u6001\u4f9d\u7136\u4fdd\u6301\u4e00\u5b9a\u7684\u6d3b\u8dc3\u5ea6\uff0c\u5178\u578b\u7684\u4f8b\u5b50\u662f\u5305\u62ec\u963f\u91cc\u4e91\u5728\u5185\u7684\u4e00\u7cfb\u5217\u4e3b\u6d41\u4e91\u5382\u5546\u4ecd\u7136\u63d0\u4f9b\u7c7b\u4f3c",(0,n.kt)("a",{parentName:"p",href:"https://www.aliyun.com/product/bigdata/emapreduce"},"E-MapReduce"),"\n\u7684\u4ea7\u54c1\uff0c\u652f\u6301\u7528\u6237\u5c06\u5927\u6570\u636e\u4f5c\u4e1a\u63d0\u4ea4\u5230YARN\u4e0a\u8fd0\u884c\uff0c\u8fd9\u70b9\u4ece\u4ea7\u54c1\u7684\u53d7\u6b22\u8fce\u7a0b\u5ea6\u4e0a\u53ef\u89c1\u4e00\u6591\u3002"),(0,n.kt)("p",null,"\u56e0\u6b64\uff0c\u4e3a\u4e86\u8fdb\u4e00\u6b65\u4e30\u5bccKoordinator\u652f\u6301\u7684\u5728\u79bb\u7ebf\u6df7\u90e8\u573a\u666f\uff0cKoordinator\u793e\u533a\u4f1a\u540c\u6765\u81ea\u963f\u91cc\u4e91\u3001\u5c0f\u7ea2\u4e66\u3001\u8682\u8681\u91d1\u670d\u7684\u5f00\u53d1\u8005\u4eec\u5171\u540c\u542f\u52a8\u4e86Hadoop YARN\u4e0eK8s\u6df7\u90e8\n\u9879\u76ee\uff0c\u652f\u6301\u5c06\u8d85\u5356\u7684Batch\u8d44\u6e90\u63d0\u4f9b\u7ed9Hadoop YARN\u4f7f\u7528\uff0c\u8fdb\u4e00\u6b65\u63d0\u5347\u96c6\u7fa4\u8d44\u6e90\u7684\u4f7f\u7528\u6548\u7387\uff0c\u8be5\u9879\u76ee\u76ee\u524d\u5df2\u7ecf\u5728\u5c0f\u7ea2\u4e66\u751f\u4ea7\u73af\u5883\u6b63\u5f0f\u6295\u5165\u4f7f\u7528\u3002"),(0,n.kt)("h2",{id:"\u6280\u672f\u539f\u7406"},"\u6280\u672f\u539f\u7406"),(0,n.kt)("h3",{id:"\u8bbe\u8ba1\u539f\u5219"},"\u8bbe\u8ba1\u539f\u5219"),(0,n.kt)("ul",null,(0,n.kt)("li",{parentName:"ul"},"\u79bb\u7ebf\u4f5c\u4e1a\u7684\u63d0\u4ea4\u5165\u53e3\u4f9d\u7136\u4e3aYARN\u4fdd\u6301\u4e0d\u53d8\u3002"),(0,n.kt)("li",{parentName:"ul"},"\u57fa\u4e8eHadoop YARN\u5f00\u6e90\u7248\u672c\uff0c\u539f\u5219\u4e0a\u4e0d\u5bf9YARN\u505a\u4fb5\u5165\u5f0f\u6539\u9020\u3002"),(0,n.kt)("li",{parentName:"ul"},"Koordinator\u63d0\u4f9b\u7684\u6df7\u90e8\u8d44\u6e90\uff0c\u65e2\u53ef\u88abK8s Pod\u4f7f\u7528\uff0c\u4e5f\u53ef\u88abYARN task\u4f7f\u7528\uff0c\u4e0d\u540c\u7c7b\u578b\u7684\u79bb\u7ebf\u5e94\u7528\u53ef\u5728\u540c\u4e00\u8282\u70b9\u5185\u5171\u5b58\u3002"),(0,n.kt)("li",{parentName:"ul"},"\u5355\u673aQoS\u7b56\u7565\u7531Koordlet\u7edf\u4e00\u7ba1\u7406\uff0c\u5e76\u517c\u5bb9YARN Task\u7684\u8fd0\u884c\u65f6\u3002")),(0,n.kt)("p",null,(0,n.kt)("img",{alt:"image",src:o(1749).Z,width:"396",height:"451"})),(0,n.kt)("h3",{id:"\u8d44\u6e90\u5206\u914d\u4e0e\u4ef2\u88c1"},"\u8d44\u6e90\u5206\u914d\u4e0e\u4ef2\u88c1"),(0,n.kt)("p",null,"\u5728Koordinator\u4e2d\uff0c\u8282\u70b9\u8d85\u5356\u7684Batch\u8d44\u6e90\u91cf\u7531koord-manager\u6839\u636e\u8282\u70b9\u8d44\u6e90\u8d1f\u8f7d\u60c5\u51b5\u52a8\u6001\u8ba1\u7b97\u5f97\u51fa\uff0c\u5e76\u4ee5extended-resource\u5f62\u5f0f\u66f4\u65b0\u5728K8s\u7684Node\u5bf9\u8c61\u4e2d\u3002\n\u5bf9\u4e8eYARN\u573a\u666f\u7684\u9002\u914d\uff0c\u5c06\u7531koord-yarn-operator\u7ec4\u4ef6\u8d1f\u8d23\u5c06\u8282\u70b9\u7684Batch\u8d44\u6e90\u91cf\u540c\u6b65\u7ed9YARN RM\u3002\u6b64\u5916\uff0c\u7531\u4e8eK8s\u8c03\u5ea6\u5668\u548cYARN\u8c03\u5ea6\u5668\u5171\u4eabBatch\u8d26\u672c\uff0c\u56e0\u6b64\n\u5728\u8d44\u6e90\u540c\u6b65\u65f6\u9700\u8981\u5c06\u53e6\u4e00\u4e2a\u7cfb\u7edf\u4e2d\u5df2\u7ecf\u5206\u914d\u7684Batch\u8d44\u6e90\u6392\u9664\u3002\u5177\u4f53\u8fc7\u7a0b\u5982\u4e0b\uff1a"),(0,n.kt)("ol",null,(0,n.kt)("li",{parentName:"ol"},"koord-manager\u8ba1\u7b97\u539f\u59cbBatch\u603b\u91cf",(0,n.kt)("inlineCode",{parentName:"li"},"origin_batch_total"),"\uff0c\u5e76\u5c06\u5176\u8bb0\u5f55\u5728K8s\u7684node annotation\u4e2d\u3002"),(0,n.kt)("li",{parentName:"ol"},"koord-yarn-operator\u4eceYARN RM\u6536\u96c6YARN\u8282\u70b9\u5df2\u7ecf\u5206\u914d\u7684\u8d44\u6e90\u91cf",(0,n.kt)("inlineCode",{parentName:"li"},"yarn_requested"),"\uff0c\u5e76\u5c06\u5176\u8bb0\u5f55\u5728K8s\u7684node annotation\u4e2d\u3002"),(0,n.kt)("li",{parentName:"ol"},"\u5728koord-manager\u66f4\u65b0K8s\u7684Batch\u8d44\u6e90\u603b\u91cf\u65f6\uff0c\u6392\u9664YARN\u5df2\u7ecf\u5206\u914d\u7684\u8d44\u6e90\u91cf\uff1a",(0,n.kt)("inlineCode",{parentName:"li"},"k8s_batch_total = origin_batch_total \u2013 yarn_requested")),(0,n.kt)("li",{parentName:"ol"},"yarn-operator\u5411YARN RM\u66f4\u65b0\u8d44\u6e90\u65f6\uff0c\u6392\u9664K8s\u5df2\u7ecf\u5206\u914d\u7684\u8d44\u6e90\u91cf\uff1a",(0,n.kt)("inlineCode",{parentName:"li"},"yarn_batch_total = origin_batch_total \u2013 k8s_batch_requested"))),(0,n.kt)("p",null,(0,n.kt)("img",{alt:"image",src:o(198).Z,width:"369",height:"248"})),(0,n.kt)("p",null,'\u5728\u53cc\u8c03\u5ea6\u5668\u7684\u5de5\u4f5c\u6a21\u5f0f\u4e0b\uff0c\u7531\u4e8e\u8d44\u6e90\u7533\u8bf7\u91cf\u7684\u540c\u6b65\u5b58\u5728\u65f6\u5e8f\u5148\u540e\uff0c\u8282\u70b9\u7684Batch\u53ef\u80fd\u4f1a\u88ab\u8fc7\u91cf\u5206\u914d\uff0ckoordlet\u5c06\u5728\u5355\u673a\u4fa7\u5bf9\u8d44\u6e90\u8fdb\u884c\u4e8c\u6b21\u4ef2\u88c1\u3002\u4e0d\u8fc7\uff0c\u4e0ekubelet\u4ef2\u88c1\n\u673a\u5236\u4e0d\u540c\u7684\u662f\uff0ckoordlet\u5c06\u4ee5"\u907f\u514d\u5e72\u6270\u5728\u7ebf"\uff0c\u4ee5\u53ca"\u786e\u4fdd\u79bb\u7ebf\u8d44\u6e90\u8d28\u91cf"\u4e3a\u76ee\u6807\uff0c\u590d\u7528\u5f53\u524d\u7684QoS\u7b56\u7565\u4f5c\u4e3a\u4ef2\u88c1\u624b\u6bb5\uff0c\u65e2\u7ed3\u5408\u8282\u70b9\u5b9e\u9645\u7684\u8d44\u6e90\u4f7f\u7528\u60c5\u51b5\uff0c\u975e\u5fc5\u8981\u4e0d\u9a71\u9010\n\u79bb\u7ebf\u4efb\u52a1\u3002'),(0,n.kt)("h3",{id:"\u8282\u70b9\u8fd0\u884c\u65f6\u7ba1\u7406"},"\u8282\u70b9\u8fd0\u884c\u65f6\u7ba1\u7406"),(0,n.kt)("p",null,"Node Manager\u662fYARN\u7684\u8282\u70b9\u7ec4\u4ef6\uff0c\u4e3b\u8981\u8d1f\u8d23\u79bb\u7ebf\u4efb\u52a1\u7684\u751f\u547d\u5468\u671f\u7ba1\u7406\uff0c\u5728K8s\u6df7\u90e8\u573a\u666f\u4e0bNM\u5c06\u4ee5DaemonSet\u5f62\u5f0f\u90e8\u7f72\u3002\u4e3a\u4e86\u5bf9\u8d44\u6e90\u8fdb\u884c\u66f4\u7cbe\u7ec6\u7684\u7ba1\u7406\uff0c\nYARN Task\u5c06\u4e0eNM\u7684\u8d44\u6e90\u7ba1\u7406\u76f8\u4e92\u72ec\u7acb\uff0cNM\u5728\u90e8\u7f72\u65f6\u53ea\u9700\u6309\u81ea\u8eab\u5f00\u9500\u7533\u8bf7Batch\u6df7\u90e8\u8d44\u6e90\u3002"),(0,n.kt)("p",null,(0,n.kt)("img",{alt:"image",src:o(2681).Z,width:"488",height:"191"})),(0,n.kt)("p",null,"\u4e3a\u4e86\u80fd\u591f\u901a\u8fc7cgroup\u6765\u7ba1\u7406YARN\u4efb\u52a1\u7684\u8d44\u6e90\u4f7f\u7528\uff0cKoordinator\u8981\u6c42YARN NM\u5f00\u542f",(0,n.kt)("a",{parentName:"p",href:"https://apache.github.io/hadoop/hadoop-yarn/hadoop-yarn-site/NodeManagerCgroups.html"},"LinuxContainerExecutor"),"\n\u6a21\u5f0f\uff0c\u5e76\u6307\u5b9acgroup\u8def\u5f84\uff0c\u786e\u4fdd\u53ef\u4ee5\u548c\u5176\u4ed6K8s Pod\u4e00\u6837\uff0c\u7edf\u4e00\u5728besteffort\u5206\u7ec4\u4e0b\u7ba1\u7406\u3002"),(0,n.kt)("p",null,(0,n.kt)("img",{alt:"image",src:o(3778).Z,width:"672",height:"211"})),(0,n.kt)("h3",{id:"\u5355\u673aqos\u7b56\u7565\u9002\u914d"},"\u5355\u673aQoS\u7b56\u7565\u9002\u914d"),(0,n.kt)("p",null,"koodlet\u76ee\u524d\u5728\u5355\u673a\u652f\u6301\u4e86\u4e00\u7cfb\u5217\u7684QoS\u7b56\u7565\uff0c\u8fd9\u4e9b\u540c\u6837\u9700\u8981\u9488\u5bf9YARN\u573a\u666f\u8fdb\u884c\u9002\u914d\u3002\u5bf9\u4e8e\u8d44\u6e90\u9694\u79bb\u53c2\u6570\uff0c\u4f8b\u5982Group Identity\uff0cMemory QoS\uff0cL3 Cache\u9694\u79bb\u7b49\uff0c\nkoordlet\u5c06\u6839\u636e\u8bbe\u8ba1\u7684cgroup\u5c42\u7ea7\u8fdb\u884c\u9002\u914d\u3002\u800c\u5bf9\u4e8e\u9a71\u9010\u548c\u538b\u5236\u8fd9\u7c7b\u52a8\u6001\u7b56\u7565\uff0c\u5355\u673a\u4fa7\u5c06\u65b0\u589e\u4e00\u4e2ayarn-copilot-agent\u6a21\u5757\uff0c\u7528\u4e8e\u5bf9\u63a5YARN\u573a\u666f\u7684\u5404\u7c7b\u6570\u636e\u548c\u64cd\u4f5c\uff0c\n\u5305\u62ecYARN Task\u5143\u4fe1\u606f\u91c7\u96c6\u3001\u8d44\u6e90\u6307\u6807\u91c7\u96c6\u3001Task\u9a71\u9010\u64cd\u4f5c\u7b49\uff0c\u6240\u6709QoS\u7b56\u7565\u4ecd\u7136\u4fdd\u7559\u5728koordlet\u5185\uff0ckoordlet\u5185\u90e8\u76f8\u5173\u6a21\u5757\u5c06\u4ee5plugin\u5f62\u5f0f\u5bf9\u63a5yarn-copilot-agent\u63a5\u53e3\u3002\n\u540c\u65f6\uff0ckoord-yarn-copilot\u7684\u63a5\u53e3\u8bbe\u8ba1\u5c06\u4fdd\u7559\u4e00\u5b9a\u7684\u6269\u5c55\u6027\uff0c\u540e\u7eed\u53ef\u7528\u4e8e\u5bf9\u63a5\u5176\u4ed6\u8d44\u6e90\u6846\u67b6\u3002"),(0,n.kt)("p",null,(0,n.kt)("img",{alt:"image",src:o(4247).Z,width:"411",height:"321"})),(0,n.kt)("p",null,"koordlet\u5c06\u5728\u540e\u7eed\u7248\u672c\u4e2d\u9646\u7eed\u5b8c\u6210\u5404\u7c7bQoS\u7b56\u7565\u5bf9YARN\u573a\u666f\u7684\u9002\u914d\u3002"),(0,n.kt)("h2",{id:"\u53c2\u4e0e\u5171\u5efa"},"\u53c2\u4e0e\u5171\u5efa"),(0,n.kt)("p",null,"\u652f\u6301K8s\u4e0eYARN\u6df7\u90e8\u7684\u76f8\u5173\u529f\u80fd\u76ee\u524d\u5df2\u7ecf\u5728\u76f8\u5173\u6a21\u5757\u7684\u6700\u65b0\u7248\u672c\u4e2d\u53d1\u5e03\uff0c\u793e\u533a\u76ee\u524d\u4ecd\u5728\u79ef\u6781\u63a8\u8fdb\u540e\u7eed\u529f\u80fd\u7684\u8fed\u4ee3\uff0c\u5982\u679c\u60a8\u6709\u76f8\u5173\u9700\u6c42\u6216\u53c2\u4e0e\u5171\u5efa\u7684\u610f\u613f\uff0c\n\u6b22\u8fce\u60a8\u63d0\u4ea4",(0,n.kt)("a",{parentName:"p",href:"https://github.com/koordinator-sh/yarn-copilot/issues"},"issue"),"\uff0c\n\u6216\u5728",(0,n.kt)("a",{parentName:"p",href:"https://github.com/koordinator-sh/koordinator/discussions/1297"},"\u4e13\u9879\u8ba8\u8bba\u533a")," \u4e0b\u65b9\u7559\u8a00\uff0c\u4f8b\u5982\uff1a"),(0,n.kt)("pre",null,(0,n.kt)("code",{parentName:"pre"},'\u8054\u7cfb\u4eba(gihub-id)\uff1a, e.g. @koordinator-dev\n\n\u60a8\u4efb\u804c/\u5c31\u8bfb/\u53c2\u4e0e\u7684\u516c\u53f8/\u5b66\u6821/\u7ec4\u7ec7\u540d\u79f0\uff1ae.g. koordinator community\n\n\u793e\u533a\u53c2\u4e0e\u610f\u5411\uff1ae.g. \u5e0c\u671b\u80fd\u591f\u53c2\u4e0e\u7814\u53d1/\u5b66\u4e60\u5927\u6570\u636e&\u4e91\u539f\u751f\u6df7\u90e8/\u5c06K8s&YARN\u6df7\u90e8\u529f\u80fd\u5728\u751f\u4ea7\u73af\u5883\u843d\u5730/\u5176\u5b83\u3002\n\n\u60a8\u5bf9"K8s&YARN\u6df7\u90e8"\u7684\u671f\u5f85\uff1a\n')))}u.isMDXComponent=!0},1749:(e,t,o)=>{o.d(t,{Z:()=>r});const r=o.p+"assets/images/hadoop-k8s-a092bf3c9bc72245fec2b31b173a8792.svg"},198:(e,t,o)=>{o.d(t,{Z:()=>r});const r=o.p+"assets/images/koord-yarn-operator-0c11a5905f6b5f72c53d3006c0933978.svg"},3778:(e,t,o)=>{o.d(t,{Z:()=>r});const r=o.p+"assets/images/node-manager-cgroup-1c8454efe166df153e19d3d8a94d43fe.svg"},2681:(e,t,o)=>{o.d(t,{Z:()=>r});const r=o.p+"assets/images/node-manager-runtime-46fc007b5c0fe2de0ab9c0e4d3023bbb.svg"},4247:(e,t,o)=>{o.d(t,{Z:()=>r});const r=o.p+"assets/images/yarn-copilot-agent-aeceac2cd5cef61317e89d55e8bf78b8.svg"}}]);
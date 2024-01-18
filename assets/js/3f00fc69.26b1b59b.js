"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[6330],{3905:(e,t,n)=>{n.d(t,{Zo:()=>c,kt:()=>h});var a=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function s(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var i=a.createContext({}),u=function(e){var t=a.useContext(i),n=t;return e&&(n="function"==typeof e?e(t):s(s({},t),e)),n},c=function(e){var t=u(e.components);return a.createElement(i.Provider,{value:t},e.children)},p="mdxType",d={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},m=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,o=e.originalType,i=e.parentName,c=l(e,["components","mdxType","originalType","parentName"]),p=u(n),m=r,h=p["".concat(i,".").concat(m)]||p[m]||d[m]||o;return n?a.createElement(h,s(s({ref:t},c),{},{components:n})):a.createElement(h,s({ref:t},c))}));function h(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=n.length,s=new Array(o);s[0]=m;var l={};for(var i in t)hasOwnProperty.call(t,i)&&(l[i]=t[i]);l.originalType=e,l[p]="string"==typeof e?e:r,s[1]=l;for(var u=2;u<o;u++)s[u]=n[u];return a.createElement.apply(null,s)}return a.createElement.apply(null,n)}m.displayName="MDXCreateElement"},7053:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>i,contentTitle:()=>s,default:()=>d,frontMatter:()=>o,metadata:()=>l,toc:()=>u});var a=n(7462),r=(n(7294),n(3905));const o={},s="CPU Suppress",l={unversionedId:"user-manuals/cpu-suppress",id:"version-v1.3/user-manuals/cpu-suppress",title:"CPU Suppress",description:"Introduction",source:"@site/versioned_docs/version-v1.3/user-manuals/cpu-suppress.md",sourceDirName:"user-manuals",slug:"/user-manuals/cpu-suppress",permalink:"/docs/v1.3/user-manuals/cpu-suppress",draft:!1,editUrl:"https://github.com/koordinator-sh/koordinator.sh/edit/main/docs/user-manuals/cpu-suppress.md",tags:[],version:"v1.3",lastUpdatedBy:"saintube",lastUpdatedAt:1692186595,formattedLastUpdatedAt:"Aug 16, 2023",frontMatter:{},sidebar:"docs",previous:{title:"SLO Configuration",permalink:"/docs/v1.3/user-manuals/slo-config"},next:{title:"CPU Burst",permalink:"/docs/v1.3/user-manuals/cpu-burst"}},i={},u=[{value:"Introduction",id:"introduction",level:2},{value:"Setup",id:"setup",level:2},{value:"Prerequisite",id:"prerequisite",level:3},{value:"Installation",id:"installation",level:3},{value:"Configurations",id:"configurations",level:3},{value:"(Optional) Advanced Settings",id:"optional-advanced-settings",level:4},{value:"Use CPU Suppress",id:"use-cpu-suppress",level:2}],c={toc:u},p="wrapper";function d(e){let{components:t,...o}=e;return(0,r.kt)(p,(0,a.Z)({},c,o,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"cpu-suppress"},"CPU Suppress"),(0,r.kt)("h2",{id:"introduction"},"Introduction"),(0,r.kt)("p",null,"In order to ensure the runtime quality of different workloads in co-located scenarios, Koordinator uses the CPU Suppress\nmechanism provided by koordlet on the node side to suppress workloads of the Best Effort type when the load increases.\nOr increase the resource quota for Best Effort type workloads when the load decreases."),(0,r.kt)("p",null,"In the ",(0,r.kt)("a",{parentName:"p",href:"/docs/v1.3/architecture/resource-model"},"Dynamic resource overcommitment model")," that is provided by\nKoordinator, the total amount of reclaimed resources dynamically changes based on the actual amount of resources used\nby latency-sensitive (LS/LSR/LSE) pods. Reclaimed resources can be used by BE pods. You can use the dynamic resource\novercommitment feature to improve the resource utilization of a cluster by deploying both LS pods and BE pods in the\ncluster. To ensure sufficient CPU resources for the LS pods on a node, you can use koordinator to limit the CPU\nusage of the BE pods on the node. The elastic resource limit feature can maintain the resource utilization of a node\nbelow a specified threshold and limit the amount of CPU resources that can be used by BE pods. This ensures the\nstability of the containers on the node."),(0,r.kt)("p",null,"CPU Threshold indicates the CPU utilization threshold of a node. Pod (LS).Usage indicates the CPU usage of LS pods.\nCPU Restriction for BE indicates the CPU usage of BE pods. The amount of CPU resources that can be used by BE pods\nis adjusted based on the increase or decrease of the CPU usage of LS pods. We recommend that you use the same value\nfor CPU Threshold and the reserved CPU watermark in the dynamic resource overcommitment model.\nThis ensures a consistent level of CPU resource utilization."),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"CPU-Suppress",src:n(8545).Z,width:"731",height:"212"})),(0,r.kt)("h2",{id:"setup"},"Setup"),(0,r.kt)("h3",{id:"prerequisite"},"Prerequisite"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"Kubernetes >= 1.18"),(0,r.kt)("li",{parentName:"ul"},"Koordinator >= 0.6")),(0,r.kt)("h3",{id:"installation"},"Installation"),(0,r.kt)("p",null,"Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to\n",(0,r.kt)("a",{parentName:"p",href:"/docs/installation"},"Installation"),"."),(0,r.kt)("h3",{id:"configurations"},"Configurations"),(0,r.kt)("p",null,"When installing through the helm chart, the ConfigMap slo-controller-config will be created in the koordinator-system\nnamespace, and the CPU Suppress mechanism is enabled by default. If it needs to be closed, refer to the configuration\nbelow, and modify the configuration of the resource-threshold-config section to take effect."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-yaml"},'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: slo-controller-config\n  namespace: {{ .Values.installation.namespace }}\ndata:\n  ...\n  resource-threshold-config: |\n    {\n      "clusterStrategy": {\n        "enable": true,\n        "cpuSuppressThresholdPercent": 65\n      }\n    }\n')),(0,r.kt)("h4",{id:"optional-advanced-settings"},"(Optional) Advanced Settings"),(0,r.kt)("p",null,"Also, the ",(0,r.kt)("inlineCode",{parentName:"p"},"CPU Suppress")," feature allows you to configure the CPU utilization threshold in a fine-grained manner.\nThe following table describes the parameters."),(0,r.kt)("table",null,(0,r.kt)("thead",{parentName:"table"},(0,r.kt)("tr",{parentName:"thead"},(0,r.kt)("th",{parentName:"tr",align:null},"Parameter"),(0,r.kt)("th",{parentName:"tr",align:null},"Data type"),(0,r.kt)("th",{parentName:"tr",align:null},"Valid value"),(0,r.kt)("th",{parentName:"tr",align:null},"Description"))),(0,r.kt)("tbody",{parentName:"table"},(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"enable"),(0,r.kt)("td",{parentName:"tr",align:null},"Boolean"),(0,r.kt)("td",{parentName:"tr",align:null},"true; false"),(0,r.kt)("td",{parentName:"tr",align:null},"true: enables the elastic resource limit feature; false: disables the elastic resource limit feature.")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"cpuSuppressThresholdPercent"),(0,r.kt)("td",{parentName:"tr",align:null},"Int"),(0,r.kt)("td",{parentName:"tr",align:null},"0~100"),(0,r.kt)("td",{parentName:"tr",align:null},"The CPU utilization threshold of the node. Unit: %. Default value: 65.")))),(0,r.kt)("h2",{id:"use-cpu-suppress"},"Use CPU Suppress"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},"Create a configmap.yaml file based on the following ConfigMap content:")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-yaml"},'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: slo-controller-config\n  namespace: koordinator-system\ndata:\n  # Enable the elastic resource limit feature. \n  resource-threshold-config: |\n    {\n      "clusterStrategy": {\n        "enable": true   \n      }\n    }\n')),(0,r.kt)("ol",{start:2},(0,r.kt)("li",{parentName:"ol"},"Run the following command to update the ConfigMap.\nTo avoid changing other settings in the ConfigMap, we commend that you run the kubectl patch command to update the ConfigMap.")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-bash"},'kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"\n')),(0,r.kt)("ol",{start:3},(0,r.kt)("li",{parentName:"ol"},"Run the following command to query the CPU cores that are allocated to the BE pods on the node:")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"cat /sys/fs/cgroup/cpuset/kubepods.slice/kubepods-besteffort.slice/cpuset.cpus\n")),(0,r.kt)("p",null,"Expected output:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"10-25,35-51,62-77,87-103 \n")),(0,r.kt)("p",null,"The output shows that the following CPU cores are allocated to the BE pods on the node: 10-25, 35-51, 62-77, and 87-103,\nwhich will be changed dynamically according to the load of latency-sensitve pods."))}d.isMDXComponent=!0},8545:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/cpu-suppress-demo-cb563497d58bcee0e9b38996fc9e4f17.svg"}}]);
"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[7826],{3905:(e,t,a)=>{a.d(t,{Zo:()=>c,kt:()=>h});var n=a(7294);function o(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function r(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,n)}return a}function i(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?r(Object(a),!0).forEach((function(t){o(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):r(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function s(e,t){if(null==e)return{};var a,n,o=function(e,t){if(null==e)return{};var a,n,o={},r=Object.keys(e);for(n=0;n<r.length;n++)a=r[n],t.indexOf(a)>=0||(o[a]=e[a]);return o}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(n=0;n<r.length;n++)a=r[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(o[a]=e[a])}return o}var l=n.createContext({}),p=function(e){var t=n.useContext(l),a=t;return e&&(a="function"==typeof e?e(t):i(i({},t),e)),a},c=function(e){var t=p(e.components);return n.createElement(l.Provider,{value:t},e.children)},d="mdxType",u={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},m=n.forwardRef((function(e,t){var a=e.components,o=e.mdxType,r=e.originalType,l=e.parentName,c=s(e,["components","mdxType","originalType","parentName"]),d=p(a),m=o,h=d["".concat(l,".").concat(m)]||d[m]||u[m]||r;return a?n.createElement(h,i(i({ref:t},c),{},{components:a})):n.createElement(h,i({ref:t},c))}));function h(e,t){var a=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var r=a.length,i=new Array(r);i[0]=m;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s[d]="string"==typeof e?e:o,i[1]=s;for(var p=2;p<r;p++)i[p]=a[p];return n.createElement.apply(null,i)}return n.createElement.apply(null,a)}m.displayName="MDXCreateElement"},8481:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>l,contentTitle:()=>i,default:()=>u,frontMatter:()=>r,metadata:()=>s,toc:()=>p});var n=a(7462),o=(a(7294),a(3905));const r={},i="CPU QoS",s={unversionedId:"user-manuals/cpu-qos",id:"version-v1.4/user-manuals/cpu-qos",title:"CPU QoS",description:"Introduction",source:"@site/versioned_docs/version-v1.4/user-manuals/cpu-qos.md",sourceDirName:"user-manuals",slug:"/user-manuals/cpu-qos",permalink:"/docs/user-manuals/cpu-qos",draft:!1,editUrl:"https://github.com/koordinator-sh/koordinator.sh/edit/main/docs/user-manuals/cpu-qos.md",tags:[],version:"v1.4",lastUpdatedBy:"wangjianyu",lastUpdatedAt:1705567859,formattedLastUpdatedAt:"Jan 18, 2024",frontMatter:{},sidebar:"docs",previous:{title:"CPU Burst",permalink:"/docs/user-manuals/cpu-burst"},next:{title:"Memory QoS",permalink:"/docs/user-manuals/memory-qos"}},l={},p=[{value:"Introduction",id:"introduction",level:2},{value:"Background",id:"background",level:2},{value:"Setup",id:"setup",level:2},{value:"Prerequisites",id:"prerequisites",level:3},{value:"Installation",id:"installation",level:3},{value:"Use CPU QoS",id:"use-cpu-qos",level:2}],c={toc:p},d="wrapper";function u(e){let{components:t,...a}=e;return(0,o.kt)(d,(0,n.Z)({},c,a,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"cpu-qos"},"CPU QoS"),(0,o.kt)("h2",{id:"introduction"},"Introduction"),(0,o.kt)("p",null,"Kubernetes allows you to deploy various types of containerized applications on the same node. This causes applications with different priorities to compete for CPU resources. As a result, the performance of the applications with high priorities cannot be guaranteed. Koordinator allows you to use quality of service (QoS) classes to guarantee CPU resources for applications with high priorities. This topic describes how to configure the CPU QoS feature for pods."),(0,o.kt)("h2",{id:"background"},"Background"),(0,o.kt)("p",null,"To fully utilize computing resources, workloads of different priorities are usually deployed on the same node. For example, latency-sensitive (LS) workloads (with high priorities) and best-effort (BE) workloads (with low priorities) can be deployed on the same node. However, this may cause these workloads to compete for computing resources. In Kubernetes, CPU requests and CPU limits are used to control the amount of CPU resources that pods can use. However, pods may still compete for CPU resources. For example, BE pods and LS pods can share CPU cores or vCPU cores. When the loads of the BE pods increase, the performance of the LS pods is compromised. As a result, the response latency of the application that uses the LS pods increases."),(0,o.kt)("p",null,"To reduce the performance impact on the BE pods in this scenario, you can use the CPU QoS feature provided by Koordinator to limit the CPU usage of the LS pods. The CPU QoS feature is based on Alibaba Cloud Linux 2 and Anolis OS. Koordinator allows you to use the group identity feature available in Alibaba Cloud Linux 2 to configure Linux scheduling priorities for pods. In an environment where both LS pods and BE pods are deployed, you can set the priority of LS pods to high and the priority of BE pods to low to avoid resource contention. The LS pods are prioritized to use the limited CPU resources to ensure the service quality of the corresponding application. For more information, see ",(0,o.kt)("a",{parentName:"p",href:"https://www.alibabacloud.com/help/en/elastic-compute-service/latest/group-identity-feature"},"Group identity feature"),"."),(0,o.kt)("p",null,"You can gain the following benefits after you enable the CPU QoS feature:"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},"The wake-up latency of tasks for LS workloads is minimized."),(0,o.kt)("li",{parentName:"ul"},"Waking up tasks for BE workloads does not adversely impact the performance of LS pods."),(0,o.kt)("li",{parentName:"ul"},"Tasks for BE workloads cannot use the simultaneous multithreading (SMT) scheduler to share CPU cores. This further reduces the impact on the performance of LS pods.")),(0,o.kt)("h2",{id:"setup"},"Setup"),(0,o.kt)("h3",{id:"prerequisites"},"Prerequisites"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},"Kubernetes >= 1.18"),(0,o.kt)("li",{parentName:"ul"},"Koordinator >= 0.4"),(0,o.kt)("li",{parentName:"ul"},"Operating System\uff1a",(0,o.kt)("ul",{parentName:"li"},(0,o.kt)("li",{parentName:"ul"},"Alibaba Cloud Linux 2\uff08For more information, see ",(0,o.kt)("a",{parentName:"li",href:"https://www.alibabacloud.com/help/en/elastic-compute-service/latest/group-identity-feature"},"Group identity feature"),"\uff09"),(0,o.kt)("li",{parentName:"ul"},"Anolis OS >= 8.6"),(0,o.kt)("li",{parentName:"ul"},"CentOS 7.9 (Need to install the CPU Co-location scheduler plug-in from OpenAnolis community, see ",(0,o.kt)("a",{parentName:"li",href:"/docs/best-practices/anolis_plugsched"},"best practice"),").")))),(0,o.kt)("h3",{id:"installation"},"Installation"),(0,o.kt)("p",null,"Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to ",(0,o.kt)("a",{parentName:"p",href:"https://koordinator.sh/docs/installation"},"Installation"),"."),(0,o.kt)("h2",{id:"use-cpu-qos"},"Use CPU QoS"),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Create a configmap.yaml file based on the following ConfigMap content:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre",className:"language-yaml"},'# Example of the slo-controller-config ConfigMap.\napiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: slo-controller-config\n  namespace: koordinator-system\ndata:\n  # Enable the CPU QoS feature.\n  resource-qos-config: |\n    {\n      "clusterStrategy": {\n        "lsClass": {\n          "cpuQOS": {\n            "enable": true,\n            "groupIdentity": 2\n          }\n        },\n        "beClass": {\n          "cpuQOS": {\n            "enable": true,\n            "groupIdentity": -1\n          }\n        }\n      }\n    }\n')),(0,o.kt)("p",{parentName:"li"},"Specify ",(0,o.kt)("inlineCode",{parentName:"p"},"lsClass")," and ",(0,o.kt)("inlineCode",{parentName:"p"},"beClass")," to assign the LS and BE classes to different pods. ",(0,o.kt)("inlineCode",{parentName:"p"},"cpuQOS")," includes the CPU QoS parameters. The following table describes the parameters."))),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Configuration item"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Parameter"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Valid values"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Description"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"enable")),(0,o.kt)("td",{parentName:"tr",align:"left"},"Boolean"),(0,o.kt)("td",{parentName:"tr",align:"left"},"truefalse"),(0,o.kt)("td",{parentName:"tr",align:"left"},"true: enables the CPU QoS feature for all containers in the cluster.false: disables the CPU QoS feature for all containers in the cluster.")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"groupIdentity")),(0,o.kt)("td",{parentName:"tr",align:"left"},"Int"),(0,o.kt)("td",{parentName:"tr",align:"left"},"-1~2"),(0,o.kt)("td",{parentName:"tr",align:"left"},"Specify group identities for CPU scheduling. By default, the group identity of LS pods is 2 and the group identity of BE pods is -1. A value of 0 indicates that no group identity is assigned.A greater ",(0,o.kt)("inlineCode",{parentName:"td"},"group identity")," value indicates a higher priority in CPU scheduling. For example, you can set ",(0,o.kt)("inlineCode",{parentName:"td"},"cpu.bvt_warp_ns=2")," for LS pods and set ",(0,o.kt)("inlineCode",{parentName:"td"},"cpu.bvt_warp_ns=-1")," for BE pods because the priority of LS pods is higher than that of BE pods. For more information, see ",(0,o.kt)("a",{parentName:"td",href:"https://www.alibabacloud.com/help/en/elastic-compute-service/latest/group-identity-feature#task-2129392"},"Group identity feature"),".")))),(0,o.kt)("p",null,"   ",(0,o.kt)("strong",{parentName:"p"},"Note")," If ",(0,o.kt)("inlineCode",{parentName:"p"},"koordinator.sh/qosClass")," is not specified for a pod, Koordinator configures the pod based on the original QoS class of the pod. The component uses the BE settings in the preceding ConfigMap if the original QoS class is BE. The component uses the LS settings in the preceding ConfigMap if the original QoS class is not BE"),(0,o.kt)("ol",{start:2},(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Check whether a ConfigMap named ",(0,o.kt)("inlineCode",{parentName:"p"},"slo-controller-config")," exists in the ",(0,o.kt)("inlineCode",{parentName:"p"},"koordinator-system")," namespace."),(0,o.kt)("ul",{parentName:"li"},(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("p",{parentName:"li"},"If a ConfigMap named  ",(0,o.kt)("inlineCode",{parentName:"p"},"slo-controller-config"),"  exists, we commend that you run the kubectl patch command to update the ConfigMap. This avoids changing other settings in the ConfigMap."),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre",className:"language-bash"},'kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"\n'))),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("p",{parentName:"li"},"If no ConfigMap named ",(0,o.kt)("inlineCode",{parentName:"p"},"slo-controller-config"),"  exists, run the kubectl patch command to create a ConfigMap named ack-slo-config:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"kubectl apply -f configmap.yaml\n"))))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Create a file named ls-pod-demo.yaml based on the following YAML content:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre",className:"language-yaml"},'apiVersion: v1\nkind: Pod\nmetadata:\n  name: ls-pod-demo\n  labels:\n    koordinator.sh/qosClass: \'LS\' # Set the QoS class of the pod to LS\nspec:  \n  containers:\n  - command:\n    - "nginx"\n    - "-g"\n    - "daemon off; worker_processes 4;"\n    image: docker.io/koordinatorsh/nginx:v1.18-koord-example\n    imagePullPolicy: Always\n    name: nginx\n    resources:\n      limits:\n        cpu: "4"\n        memory: 10Gi\n      requests:\n        cpu: "4"\n        memory: 10Gi\n  restartPolicy: Never\n  schedulerName: default-scheduler\n'))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Run the following command to deploy the ls-pod-demo pod in the cluster:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"kubectl apply -f ls-pod-demo.yaml\n"))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Run the following command to check whether the CPU group identity of the LS pod in the control group (cgroup) of the node takes effect:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"cat /sys/fs/cgroup/cpu/kubepods.slice/kubepods-pod1c20f2ad****.slice/cpu.bvt_warp_ns\n")),(0,o.kt)("p",{parentName:"li"},"Expected output:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"#The group identity of the LS pod is 2 (high priority). \n2\n"))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Create a file named be-pod-demo.yaml based on the following content:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre",className:"language-yaml"},"apiVersion: v1\nkind: Pod\nmetadata:\n  name: be-pod-demo\n  labels:\n    koordinator.sh/qosClass: 'BE' # Set the QoS class of the pod to BE. \nspec:\n  containers:\n    - args:\n        - '-c'\n        - '1'\n        - '--vm'\n        - '1'\n      command:\n        - stress\n      image: polinux/stress\n      imagePullPolicy: Always\n      name: stress\n  restartPolicy: Always\n  schedulerName: default-scheduler\n  # priorityClassName is required when ColocationProfile enabled (default).\n  priorityClassName: koord-batch\n"))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Run the following command to deploy the be-pod-demo pod in the cluster:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"kubectl apply -f be-pod-demo.yaml\n"))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Run the following command to check whether the CPU group identity of the BE pod in the cgroup of the node takes effect:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"cat /sys/fs/cgroup/cpu/kubepods.slice/kubepods-besteffort.slice/kubepods-besteffort-pod4b6e96c8****.slice/cpu.bvt_warp_ns\n")),(0,o.kt)("p",{parentName:"li"},"Expected output:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"#The group identity of the BE pod is -1 (low priority). \n-1\n")),(0,o.kt)("p",{parentName:"li"},"The output shows that the priority of the LS pod is high and the priority of the BE pod is low. CPU resources are preferably scheduled to the LS pod to ensure the service quality."))))}u.isMDXComponent=!0}}]);
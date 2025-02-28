"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[4509],{3905:(e,t,n)=>{n.d(t,{Zo:()=>p,kt:()=>h});var a=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var s=a.createContext({}),u=function(e){var t=a.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},p=function(e){var t=u(e.components);return a.createElement(s.Provider,{value:t},e.children)},c="mdxType",d={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},m=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,o=e.originalType,s=e.parentName,p=l(e,["components","mdxType","originalType","parentName"]),c=u(n),m=r,h=c["".concat(s,".").concat(m)]||c[m]||d[m]||o;return n?a.createElement(h,i(i({ref:t},p),{},{components:n})):a.createElement(h,i({ref:t},p))}));function h(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=n.length,i=new Array(o);i[0]=m;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l[c]="string"==typeof e?e:r,i[1]=l;for(var u=2;u<o;u++)i[u]=n[u];return a.createElement.apply(null,i)}return a.createElement.apply(null,n)}m.displayName="MDXCreateElement"},3725:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>i,default:()=>d,frontMatter:()=>o,metadata:()=>l,toc:()=>u});var a=n(7462),r=(n(7294),n(3905));const o={},i="Device Scheduling - GPU Share With HAMi",l={unversionedId:"user-manuals/device-scheduling-gpu-share-with-hami",id:"version-v1.6/user-manuals/device-scheduling-gpu-share-with-hami",title:"Device Scheduling - GPU Share With HAMi",description:"Introduction",source:"@site/versioned_docs/version-v1.6/user-manuals/device-scheduling-gpu-share-with-hami.md",sourceDirName:"user-manuals",slug:"/user-manuals/device-scheduling-gpu-share-with-hami",permalink:"/docs/user-manuals/device-scheduling-gpu-share-with-hami",draft:!1,editUrl:"https://github.com/koordinator-sh/koordinator.sh/edit/main/docs/user-manuals/device-scheduling-gpu-share-with-hami.md",tags:[],version:"v1.6",lastUpdatedBy:"wangjianyu",lastUpdatedAt:1740707377,formattedLastUpdatedAt:"Feb 28, 2025",frontMatter:{},sidebar:"docs",previous:{title:"Device Scheduling - Basics",permalink:"/docs/user-manuals/fine-grained-device-scheduling"},next:{title:"Enhanced NodeResourceFit",permalink:"/docs/user-manuals/node-resource-fit-plus-scoring"}},s={},u=[{value:"Introduction",id:"introduction",level:2},{value:"Setup",id:"setup",level:2},{value:"Prerequisite",id:"prerequisite",level:3},{value:"Installation",id:"installation",level:3},{value:"Runtime Requirements",id:"runtime-requirements",level:4},{value:"HAMi-Core Installation",id:"hami-core-installation",level:4},{value:"Configurations",id:"configurations",level:3},{value:"Use GPU Share With HAMi",id:"use-gpu-share-with-hami",level:2}],p={toc:u},c="wrapper";function d(e){let{components:t,...o}=e;return(0,r.kt)(c,(0,a.Z)({},p,o,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"device-scheduling---gpu-share-with-hami"},"Device Scheduling - GPU Share With HAMi"),(0,r.kt)("h2",{id:"introduction"},"Introduction"),(0,r.kt)("p",null,"GPU is an indispensable device for today's large AI model training and inference, and can provide powerful computing power support for AI applications. An NVIDIA A100 80 GB GPU can provide up to 249 times the inference performance on the BERT-LARGE task compared to a CPU. However, behind such powerful computing power is an expensive price. An NVIDIA A100 40GB model GPU chip is priced at around $13,000, while an A100 80GB model GPU chip is priced at around $15,000. We have observed that some inference tasks often use less than a full GPU, but only use, for example, 50% of the computing power or gpu memory. Therefore, sharing a GPU with multiple Pods can significantly improve GPU resource utilization."),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://project-hami.io/docs/developers/hami-core-design/"},"HAMi")," is a ",(0,r.kt)("a",{parentName:"p",href:"https://cncf.io/"},"Cloud Native Computing Foundation")," sandbox project which provides the ability to share Heterogeneous AI devices among tasks. Koordinator takes advantage of HAMi's GPU isolation capabilities on the node side to provide an end-to-end GPU sharing solution."),(0,r.kt)("h2",{id:"setup"},"Setup"),(0,r.kt)("h3",{id:"prerequisite"},"Prerequisite"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"Kubernetes >= 1.18"),(0,r.kt)("li",{parentName:"ul"},"Koordinator >= 1.6")),(0,r.kt)("h3",{id:"installation"},"Installation"),(0,r.kt)("p",null,"Please make sure Koordinator components are correctly installed in your cluster. If not, please refer to ",(0,r.kt)("a",{parentName:"p",href:"/docs/installation"},"Installation"),"."),(0,r.kt)("h4",{id:"runtime-requirements"},"Runtime Requirements"),(0,r.kt)("p",null,"The scheduled GPU devices are bound to the container requires support from the runtime environment. Currently, there are two solutions to achieve this:"),(0,r.kt)("table",null,(0,r.kt)("thead",{parentName:"table"},(0,r.kt)("tr",{parentName:"thead"},(0,r.kt)("th",{parentName:"tr",align:null},"Runtime Environment"),(0,r.kt)("th",{parentName:"tr",align:null},"Installation"))),(0,r.kt)("tbody",{parentName:"table"},(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"Containerd >= 1.7.0 ",(0,r.kt)("br",null)," Koordinator >= 1.6"),(0,r.kt)("td",{parentName:"tr",align:null},"Please make sure NRI is enabled in containerd. If not, please refer to ",(0,r.kt)("a",{parentName:"td",href:"https://github.com/containerd/containerd/blob/main/docs/NRI.md"},"Enable NRI in Containerd"))))),(0,r.kt)("h4",{id:"hami-core-installation"},"HAMi-Core Installation"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/Project-HAMi/HAMi-core"},"HAMi-core")," is the in-container gpu resource controller, it operates by Hijacking the API-call between CUDA-Runtime(libcudart.so) and CUDA-Driver(libcuda.so). The output from building HAMi-core is libvgpu.so. You can directly install HAMi-core on your nodes by deploying the DaemonSet with the YAML file provided below."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-yaml"},'apiVersion: apps/v1\nkind: DaemonSet\nmetadata:\n  name: hami-core-distribute\n  namespace: default\nspec:\n  selector:\n    matchLabels:\n      koord-app: hami-core-distribute\n  template:\n    metadata:\n      labels:\n        koord-app: hami-core-distribute\n    spec:\n      affinity:\n        nodeAffinity:\n          requiredDuringSchedulingIgnoredDuringExecution:\n            nodeSelectorTerms:\n            - matchExpressions:\n              - key: node-type\n                operator: In\n                values:\n                - "gpu"\n      containers:\n      - command:\n        - /bin/sh\n        - -c\n        - |\n          cp -f /k8s-vgpu/lib/nvidia/libvgpu.so /usl/local/vgpu && sleep 3600000\n        image: docker.m.daocloud.io/projecthami/hami:v2.4.0\n        imagePullPolicy: Always\n        name: name\n        resources:\n          limits:\n            cpu: 200m\n            memory: 256Mi\n          requests:\n            cpu: "0"\n            memory: "0"\n        volumeMounts:\n        - mountPath: /usl/local/vgpu\n          name: vgpu-hook\n        - mountPath: /tmp/vgpulock\n          name: vgpu-lock\n      tolerations:\n      - operator: Exists\n      volumes:\n      - hostPath:\n          path: /usl/local/vgpu\n          type: DirectoryOrCreate\n        name: vgpu-hook\n     # https://github.com/Project-HAMi/HAMi/issues/696\n      - hostPath:\n          path: /tmp/vgpulock\n          type: DirectoryOrCreate\n        name: vgpu-lock\n')),(0,r.kt)("p",null,"The above DaemonSet will distribute 'libvgpu.so' to the /usr/local/vgpu directory and create ",(0,r.kt)("inlineCode",{parentName:"p"},"/tmp/vgpulock")," directory for all nodes with node-type=gpu labelled."),(0,r.kt)("h3",{id:"configurations"},"Configurations"),(0,r.kt)("p",null,"DeviceScheduling is ",(0,r.kt)("em",{parentName:"p"},"Enabled")," by default. You can use it without any modification on the koord-scheduler config."),(0,r.kt)("h2",{id:"use-gpu-share-with-hami"},"Use GPU Share With HAMi"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},"Create a Pod to apply for a GPU card with 50% computing power and 50% gpu memory, and specify the need for hami-core isolation through the Pod Label koordinator.sh/gpu-isolation-provider")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-yaml"},"apiVersion: v1\nkind: Pod\nmetadata:\n  name: pod-example\n  namespace: default\n  labels:\n    koordinator.sh/gpu-isolation-provider: hami-core\nspec:\n  schedulerName: koord-scheduler\n  containers:\n  - command:\n    - sleep\n    - 365d\n    image: busybox\n    imagePullPolicy: IfNotPresent\n    name: curlimage\n    resources:\n      limits:\n        cpu: 40m\n        memory: 40Mi\n        koordinator.sh/gpu-shared: 1\n        koordinator.sh/gpu-core: 50\n        koordinator.sh/gpu-memory-ratio: 50\n      requests:\n        cpu: 40m\n        memory: 40Mi\n        koordinator.sh/gpu-shared: 1\n        koordinator.sh/gpu-core: 50\n        koordinator.sh/gpu-memory-ratio: 50\n    terminationMessagePath: /dev/termination-log\n    terminationMessagePolicy: File\n  restartPolicy: Always\n")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"$ kubectl get pod -n default pod-example -o yaml\n")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-yaml"},'apiVersion: v1\nkind: Pod\nmetadata:\n  annotations:\n    scheduling.koordinator.sh/device-allocated: \'{"gpu":[{"minor":1,"resources":{"koordinator.sh/gpu-core":"50","koordinator.sh/gpu-memory":"11520Mi","koordinator.sh/gpu-memory-ratio":"50"}}]}\'\n  name: pod-example\n  namespace: default\n  labels:\n    koordinator.sh/gpu-isolation-provider: hami-core\n...\n')),(0,r.kt)("p",null,"You can find the concrete device allocate result through annotation ",(0,r.kt)("inlineCode",{parentName:"p"},"scheduling.koordinator.sh/device-allocated"),"."),(0,r.kt)("ol",{start:2},(0,r.kt)("li",{parentName:"ol"},"Enter the pod and you can see that the upper limit of the gpu memory seen by the program inside the pod is the value shown in the allocation result above.")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"$ kubectl exec -it -n default pod-example bash\n")),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"image",src:n(9014).Z,width:"1014",height:"460"})))}d.isMDXComponent=!0},9014:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/gpu-share-with-hami-result-492c0b4534ad611c9fb7aa019db15d42.png"}}]);
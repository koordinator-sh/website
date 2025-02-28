"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[8580],{3905:(e,n,o)=>{o.d(n,{Zo:()=>c,kt:()=>m});var t=o(7294);function a(e,n,o){return n in e?Object.defineProperty(e,n,{value:o,enumerable:!0,configurable:!0,writable:!0}):e[n]=o,e}function r(e,n){var o=Object.keys(e);if(Object.getOwnPropertySymbols){var t=Object.getOwnPropertySymbols(e);n&&(t=t.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),o.push.apply(o,t)}return o}function i(e){for(var n=1;n<arguments.length;n++){var o=null!=arguments[n]?arguments[n]:{};n%2?r(Object(o),!0).forEach((function(n){a(e,n,o[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(o)):r(Object(o)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(o,n))}))}return e}function s(e,n){if(null==e)return{};var o,t,a=function(e,n){if(null==e)return{};var o,t,a={},r=Object.keys(e);for(t=0;t<r.length;t++)o=r[t],n.indexOf(o)>=0||(a[o]=e[o]);return a}(e,n);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(t=0;t<r.length;t++)o=r[t],n.indexOf(o)>=0||Object.prototype.propertyIsEnumerable.call(e,o)&&(a[o]=e[o])}return a}var l=t.createContext({}),p=function(e){var n=t.useContext(l),o=n;return e&&(o="function"==typeof e?e(n):i(i({},n),e)),o},c=function(e){var n=p(e.components);return t.createElement(l.Provider,{value:n},e.children)},d="mdxType",u={inlineCode:"code",wrapper:function(e){var n=e.children;return t.createElement(t.Fragment,{},n)}},h=t.forwardRef((function(e,n){var o=e.components,a=e.mdxType,r=e.originalType,l=e.parentName,c=s(e,["components","mdxType","originalType","parentName"]),d=p(o),h=a,m=d["".concat(l,".").concat(h)]||d[h]||u[h]||r;return o?t.createElement(m,i(i({ref:n},c),{},{components:o})):t.createElement(m,i({ref:n},c))}));function m(e,n){var o=arguments,a=n&&n.mdxType;if("string"==typeof e||a){var r=o.length,i=new Array(r);i[0]=h;var s={};for(var l in n)hasOwnProperty.call(n,l)&&(s[l]=n[l]);s.originalType=e,s[d]="string"==typeof e?e:a,i[1]=s;for(var p=2;p<r;p++)i[p]=o[p];return t.createElement.apply(null,i)}return t.createElement.apply(null,o)}h.displayName="MDXCreateElement"},7187:(e,n,o)=>{o.r(n),o.d(n,{assets:()=>l,contentTitle:()=>i,default:()=>u,frontMatter:()=>r,metadata:()=>s,toc:()=>p});var t=o(7462),a=(o(7294),o(3905));const r={sidebar_position:4},i="Running Hadoop YARN with K8s by Koordinator",s={unversionedId:"best-practices/colocation-of-hadoop-yarn",id:"version-v1.6/best-practices/colocation-of-hadoop-yarn",title:"Running Hadoop YARN with K8s by Koordinator",description:"Introduction",source:"@site/versioned_docs/version-v1.6/best-practices/colocation-of-hadoop-yarn.md",sourceDirName:"best-practices",slug:"/best-practices/colocation-of-hadoop-yarn",permalink:"/docs/best-practices/colocation-of-hadoop-yarn",draft:!1,editUrl:"https://github.com/koordinator-sh/koordinator.sh/edit/main/docs/best-practices/colocation-of-hadoop-yarn.md",tags:[],version:"v1.6",lastUpdatedBy:"wangjianyu",lastUpdatedAt:1740707377,formattedLastUpdatedAt:"Feb 28, 2025",sidebarPosition:4,frontMatter:{sidebar_position:4},sidebar:"docs",previous:{title:"Coordinated sharing of CPU resources in Colocation Scenarios - Fine-grained CPU Orchestration",permalink:"/docs/best-practices/fine-grained-cpu-orchestration"},next:{title:"Network Bandwidth Limitation Using Terway QoS",permalink:"/docs/best-practices/network-qos-with-terwayqos"}},l={},p=[{value:"Introduction",id:"introduction",level:2},{value:"Prerequisite",id:"prerequisite",level:2},{value:"Installation",id:"installation",level:2},{value:"Install Koordinator",id:"install-koordinator",level:3},{value:"Install Hadoop YARN",id:"install-hadoop-yarn",level:3},{value:"Install Koordinator YARN Copilot",id:"install-koordinator-yarn-copilot",level:3},{value:"Configuration",id:"configuration",level:2},{value:"(Optional) Advanced Settings",id:"optional-advanced-settings",level:3},{value:"Check YARN Available Resources",id:"check-yarn-available-resources",level:2},{value:"Submit YARN Jobs",id:"submit-yarn-jobs",level:2}],c={toc:p},d="wrapper";function u(e){let{components:n,...r}=e;return(0,a.kt)(d,(0,t.Z)({},c,r,{components:n,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"running-hadoop-yarn-with-k8s-by-koordinator"},"Running Hadoop YARN with K8s by Koordinator"),(0,a.kt)("h2",{id:"introduction"},"Introduction"),(0,a.kt)("p",null,"Koordinator has supported hybrid orchestration workloads on Kubernetes, so that batch jobs can use the requested but\nunused resource as ",(0,a.kt)("inlineCode",{parentName:"p"},"koord-batch")," priority and ",(0,a.kt)("inlineCode",{parentName:"p"},"BE")," QoS class to improve the cluster utilization. However, there are\nstill lots of applications running beyond K8s such as Apache Haddop YARN. As a resource management platform in BigData\necosystem, YARN has supported numbers of computing engines including MapReduce, Spark, Flink, Presto, etc."),(0,a.kt)("p",null,"In order to extend the co-location scenario of Koordinator, now the community has provided Hadoop YARN extended suits\n",(0,a.kt)("inlineCode",{parentName:"p"},"Koordinator YARN Copilot")," in BigData ecosystem, supporting running Hadoop YARN jobs by koord-batch resources with other\nK8s pods. The ",(0,a.kt)("inlineCode",{parentName:"p"},"Koordinator YARN Copilot")," has following characteristics:"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},"Open-Source native: implement against open-sourced version of Hadoop YARN; so there is no hack inside YARN modules."),(0,a.kt)("li",{parentName:"ul"},"Unifed resource priority and QoS strategy: the suits aims to the ",(0,a.kt)("inlineCode",{parentName:"li"},"koord-batch")," priority of Koordinator, and also managed by QoS strategies of koordlet."),(0,a.kt)("li",{parentName:"ul"},"Resource sharing on node level: node resources of ",(0,a.kt)("inlineCode",{parentName:"li"},"koord-batch")," priority can be requested by tasks of YARN or ",(0,a.kt)("inlineCode",{parentName:"li"},"Batch")," pods both."),(0,a.kt)("li",{parentName:"ul"},"Adaptive for multiple environments: the suits can be run under any environment, including public cloud or IDC.")),(0,a.kt)("h2",{id:"prerequisite"},"Prerequisite"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},"Kuberenetes >= 1.18"),(0,a.kt)("li",{parentName:"ul"},"Koordinator >= 1.4"),(0,a.kt)("li",{parentName:"ul"},"Koordinator YARN Copilot >= 0.1"),(0,a.kt)("li",{parentName:"ul"},"Hadoop YARN >= 3.2.1")),(0,a.kt)("h2",{id:"installation"},"Installation"),(0,a.kt)("p",null,"All charts can be simply installed by helm v3.5+, which is a simple command-line tool, and you can get it\nfrom ",(0,a.kt)("a",{parentName:"p",href:"https://github.com/helm/helm/releases"},"here"),"."),(0,a.kt)("p",null,(0,a.kt)("img",{alt:"image",src:o(1749).Z,width:"396",height:"451"})),(0,a.kt)("h3",{id:"install-koordinator"},"Install Koordinator"),(0,a.kt)("p",null,"Please make sure Koordinator components are correctly installed in your cluster. For more information about install and\nupgrade, please refer to ",(0,a.kt)("a",{parentName:"p",href:"/docs/installation"},"Installation"),"."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-shell",metastring:"script",script:!0},"# Firstly add koordinator charts repository if you haven't do this.\n$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/\n\n# [Optional]\n$ helm repo update\n\n# Install the latest version.\n$ helm install koordinator koordinator-sh/koordinator\n")),(0,a.kt)("h3",{id:"install-hadoop-yarn"},"Install Hadoop YARN"),(0,a.kt)("p",null,"Haddop YARN is consist of ResourceManger and NodeManager, and currently we recommend users deploy the ResourceManger\nindependently on hosts, while the NodeManager as pod."),(0,a.kt)("p",null,"Koordinator community provides a demo chart ",(0,a.kt)("inlineCode",{parentName:"p"},"hadoop-yarn")," with Hadoop YARN ResourceManager and NodeManager, also\nincluding HDFS components as optional for running example jobs easily. You can use the demo chart for quick start\nof YARN co-location, otherwise you can refer to ",(0,a.kt)("a",{parentName:"p",href:"https://hadoop.apache.org/docs/stable/hadoop-yarn/hadoop-yarn-site/YARN.html"},"Installation"),"\nfor official guides if you want to build your own YARN cluster."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-shell",metastring:"script",script:!0},"# Firstly add koordinator charts repository if you haven't do this.\n$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/\n\n# [Optional]\n$ helm repo update\n# Install the latest version.\n$ helm install hadoop-yarn koordinator-sh/hadoop-yarn\n\n# check hadoop yarn pods running status\nkubectl get pod -n hadoop-yarn\n")),(0,a.kt)("p",null,"Some key information should be known before you install YARN:"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},"ResourceManager must be accessible in K8s pod, no matter it is deployed as host mode or pod mode."),(0,a.kt)("li",{parentName:"ul"},"NodeManager must be deployed as pod mode with an annotation ",(0,a.kt)("inlineCode",{parentName:"li"},"yarn.hadoop.apache.org/node-id=${nm-hostname}:8041")," to identify node ID in YARN."),(0,a.kt)("li",{parentName:"ul"},"NodeManager must use CgroupsLCEResourcesHandler as linux container executor, and specifies cgroup hierarchy under k8s best-effort directory."),(0,a.kt)("li",{parentName:"ul"},"NodeManager pods request resources as ",(0,a.kt)("inlineCode",{parentName:"li"},"koord-batch")," priority, so Koordinator must be pre-installed with co-location enabled.  ")),(0,a.kt)("p",null,"These features have already been configured in Haddop YARN chart in koordinator repo, and if you are using self-maintained\nYARN, please check the ",(0,a.kt)("a",{parentName:"p",href:"https://github.com/koordinator-sh/charts/blob/main/charts/hadoop-yarn"},"Koordinator repo")," for\nreference during installation."),(0,a.kt)("h3",{id:"install-koordinator-yarn-copilot"},"Install Koordinator YARN Copilot"),(0,a.kt)("p",null,"Koordinator YARN Copilot is consist of ",(0,a.kt)("inlineCode",{parentName:"p"},"yarn-opeartor")," and ",(0,a.kt)("inlineCode",{parentName:"p"},"copilot-agent"),"(WIP),"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-shell",metastring:"script",script:!0},"# Firstly add koordinator charts repository if you haven't do this.\n$ helm repo add koordinator-sh https://koordinator-sh.github.io/charts/\n\n# [Optional]\n$ helm repo update\n\n# Install the latest version.\n$ helm install koordinator-yarn-copilot koordinator-sh/koordinator-yarn-copilot\n")),(0,a.kt)("h2",{id:"configuration"},"Configuration"),(0,a.kt)("ol",null,(0,a.kt)("li",{parentName:"ol"},"configuration of koord-manager")),(0,a.kt)("p",null,"After installing through the helm chart, the ConfigMap slo-controller-config will be created in the koordinator-system\nnamespace. YARN tasks are managed under best-effort cgroup, which should be configured as host level application, and\nhere are the related ",(0,a.kt)("a",{parentName:"p",href:"https://github.com/koordinator-sh/koordinator/issues/1727"},"issue")," of YARN tasks management under\nKoordinator."),(0,a.kt)("p",null,"Create a configmap.yaml file based on the following ConfigMap content:"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-yaml"},'apiVersion: v1\ndata:\n  colocation-config: |\n    {\n      "enable": true\n    }\n  resource-threshold-config: |\n    {\n      "clusterStrategy": {\n        "enable": true\n      }\n    }\n  resource-qos-config: |\n    {\n      "clusterStrategy": {\n        "lsrClass": {\n          "cpuQOS": {\n            "enable": true\n          }\n        },\n        "lsClass": {\n          "cpuQOS": {\n            "enable": true\n          }\n        },\n        "beClass": {\n          "cpuQOS": {\n            "enable": true\n          }\n        }\n      }\n    }\n  host-application-config: |\n    {\n      "applications": [\n        {\n          "name": "yarn-task",\n          "priority": "koord-batch",\n          "qos": "BE",\n          "cgroupPath": {\n            "base": "KubepodsBesteffort",\n            "relativePath": "hadoop-yarn/"\n          }\n        }\n      ]\n    }\nkind: ConfigMap\nmetadata:\n  name: slo-controller-config\n  namespace: koordinator-system\n')),(0,a.kt)("p",null,"To avoid changing other settings in the ConfigMap, we commend that you run the kubectl patch command to update the ConfigMap."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-bash"},'$ kubectl patch cm -n koordinator-system slo-controller-config --patch "$(cat configmap.yaml)"\n')),(0,a.kt)("ol",{start:2},(0,a.kt)("li",{parentName:"ol"},"configuration of koord-yarn-copilot\n",(0,a.kt)("inlineCode",{parentName:"li"},"koord-yarn-copilot")," communicates with YARN ResourceManager during resource syncing, and the ConfigMap defines YARN\nrelated configurations.")),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-yaml"},"apiVersion: v1\ndata:\n  core-site.xml: |\n    <configuration>\n    </configuration>\n  yarn-site.xml: |\n    <configuration>\n        <property>\n            <name>yarn.resourcemanager.admin.address</name>\n            <value>resource-manager.hadoop-yarn:8033</value>\n        </property>\n        <property>\n            <name>yarn.resourcemanager.address</name>\n            <value>resource-manager.hadoop-yarn:8032</value>\n        </property>\n    </configuration>\nkind: ConfigMap\nmetadata:\n  name: yarn-config\n  namespace: koordinator-system\n")),(0,a.kt)("p",null,"You can change the default address and port at ",(0,a.kt)("inlineCode",{parentName:"p"},"yarnConfiguration.resourceManager")," in chart values. "),(0,a.kt)("h3",{id:"optional-advanced-settings"},"(Optional) Advanced Settings"),(0,a.kt)("p",null,"You can check the helm chart ",(0,a.kt)("a",{parentName:"p",href:"https://github.com/koordinator-sh/charts/blob/main/charts/hadoop-yarn"},"hadoop-yarm"),", and\n",(0,a.kt)("a",{parentName:"p",href:"https://github.com/koordinator-sh/charts/blob/main/charts/koordinator-yarn-copilot"},"koordinator-yarn-copilot")," for more\nadvanced settings."),(0,a.kt)("h2",{id:"check-yarn-available-resources"},"Check YARN Available Resources"),(0,a.kt)("ol",null,(0,a.kt)("li",{parentName:"ol"},"Check node allocatable batch resources of Koordinator on node.")),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-bash"},'$ kubectl get node -o yaml | grep batch-cpu\n      kubernetes.io/batch-cpu: "60646"\n      kubernetes.io/batch-cpu: "60486"\n\n$ kubectl get node -o yaml | grep batch-memory\n      kubernetes.io/batch-memory: "245976973438"\n      kubernetes.io/batch-memory: "243254790644"\n')),(0,a.kt)("ol",{start:2},(0,a.kt)("li",{parentName:"ol"},"Check node allocatable resources in YARN\nVisit YARN ResourceManager web UI address ",(0,a.kt)("inlineCode",{parentName:"li"},"${hadoop-yarn-rm-addr}:8088/cluster/nodes")," in browser to get YARN NM status and allocatable\nresources.")),(0,a.kt)("p",null,"If you are using the hadoop-yarn demo chart in Koordinator repo, please execute the following command to make RM accessible locally."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-shell",metastring:"script",script:!0},"$ kubectl port-forward -n hadoop-yarn service/resource-manager 8088:8088\n")),(0,a.kt)("p",null,"Then open the ui in your browser: ",(0,a.kt)("inlineCode",{parentName:"p"},"http://localhost:8088/cluster/nodes")),(0,a.kt)("p",null,"The ",(0,a.kt)("inlineCode",{parentName:"p"},"VCores Avail")," and ",(0,a.kt)("inlineCode",{parentName:"p"},"Mem Avail")," will be exactly same with batch resources of K8s nodes."),(0,a.kt)("h2",{id:"submit-yarn-jobs"},"Submit YARN Jobs"),(0,a.kt)("p",null,"Spark, Flink and other computing engines support submitting jobs to YARN since they were published, check the\nofficial manual like ",(0,a.kt)("a",{parentName:"p",href:"https://spark.apache.org/docs/latest/running-on-yarn.html"},"Spark")," and\n",(0,a.kt)("a",{parentName:"p",href:"https://nightlies.apache.org/flink/flink-docs-master/docs/deployment/resource-providers/yarn/"},"Flink")," before you start\nthe work. "),(0,a.kt)("p",null,"It is worth noting the hadoop-yarn demo chart in Koordinator repo has already integrated with Spark client, you can execute the following\ncommand to submit an example job, and get the running status through web UI of ResourceManager."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-shell",metastring:"script",script:!0},"$ kubectl exec -n hadoop-yarn -it ${yarn-rm-pod-name} yarn-rm -- /opt/spark/bin/spark-submit --master yarn --deploy-mode cluster --class org.apache.spark.examples.SparkPi /opt/spark/examples/jars/spark-examples_2.12-3.3.3.jar 1000\n")))}u.isMDXComponent=!0},1749:(e,n,o)=>{o.d(n,{Z:()=>t});const t=o.p+"assets/images/hadoop-k8s-a092bf3c9bc72245fec2b31b173a8792.svg"}}]);
"use strict";(self.webpackChunkkoordinator_sh=self.webpackChunkkoordinator_sh||[]).push([[4981],{3905:(e,t,o)=>{o.d(t,{Zo:()=>h,kt:()=>m});var a=o(7294);function r(e,t,o){return t in e?Object.defineProperty(e,t,{value:o,enumerable:!0,configurable:!0,writable:!0}):e[t]=o,e}function n(e,t){var o=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),o.push.apply(o,a)}return o}function i(e){for(var t=1;t<arguments.length;t++){var o=null!=arguments[t]?arguments[t]:{};t%2?n(Object(o),!0).forEach((function(t){r(e,t,o[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(o)):n(Object(o)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(o,t))}))}return e}function s(e,t){if(null==e)return{};var o,a,r=function(e,t){if(null==e)return{};var o,a,r={},n=Object.keys(e);for(a=0;a<n.length;a++)o=n[a],t.indexOf(o)>=0||(r[o]=e[o]);return r}(e,t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);for(a=0;a<n.length;a++)o=n[a],t.indexOf(o)>=0||Object.prototype.propertyIsEnumerable.call(e,o)&&(r[o]=e[o])}return r}var u=a.createContext({}),l=function(e){var t=a.useContext(u),o=t;return e&&(o="function"==typeof e?e(t):i(i({},t),e)),o},h=function(e){var t=l(e.components);return a.createElement(u.Provider,{value:t},e.children)},c="mdxType",p={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},d=a.forwardRef((function(e,t){var o=e.components,r=e.mdxType,n=e.originalType,u=e.parentName,h=s(e,["components","mdxType","originalType","parentName"]),c=l(o),d=r,m=c["".concat(u,".").concat(d)]||c[d]||p[d]||n;return o?a.createElement(m,i(i({ref:t},h),{},{components:o})):a.createElement(m,i({ref:t},h))}));function m(e,t){var o=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var n=o.length,i=new Array(n);i[0]=d;var s={};for(var u in t)hasOwnProperty.call(t,u)&&(s[u]=t[u]);s.originalType=e,s[c]="string"==typeof e?e:r,i[1]=s;for(var l=2;l<n;l++)i[l]=o[l];return a.createElement.apply(null,i)}return a.createElement.apply(null,o)}d.displayName="MDXCreateElement"},4755:(e,t,o)=>{o.r(t),o.d(t,{assets:()=>u,contentTitle:()=>i,default:()=>p,frontMatter:()=>n,metadata:()=>s,toc:()=>l});var a=o(7462),r=(o(7294),o(3905));const n={},i="Multi Hierarchy Elastic Quota Management",s={unversionedId:"designs/multi-hierarchy-elastic-quota-management",id:"version-v1.4/designs/multi-hierarchy-elastic-quota-management",title:"Multi Hierarchy Elastic Quota Management",description:"Summary",source:"@site/versioned_docs/version-v1.4/designs/multi-hierarchy-elastic-quota-management.md",sourceDirName:"designs",slug:"/designs/multi-hierarchy-elastic-quota-management",permalink:"/docs/designs/multi-hierarchy-elastic-quota-management",draft:!1,editUrl:"https://github.com/koordinator-sh/koordinator.sh/edit/main/docs/designs/multi-hierarchy-elastic-quota-management.md",tags:[],version:"v1.4",lastUpdatedBy:"wangjianyu",lastUpdatedAt:1705567859,formattedLastUpdatedAt:"Jan 18, 2024",frontMatter:{},sidebar:"docs",previous:{title:"GangScheduling",permalink:"/docs/designs/gang-scheduling"},next:{title:"Colocation of Spark Jobs",permalink:"/docs/best-practices/colocation-of-spark-jobs"}},u={},l=[{value:"Summary",id:"summary",level:2},{value:"Motivation",id:"motivation",level:2},{value:"Compared with competitors",id:"compared-with-competitors",level:3},{value:"Resource Quotas",id:"resource-quotas",level:4},{value:"Elastic Quota",id:"elastic-quota",level:4},{value:"Goals",id:"goals",level:3},{value:"Non-goals/Future work",id:"non-goalsfuture-work",level:3},{value:"Proposal",id:"proposal",level:2},{value:"Key ConceptUser Stories",id:"key-conceptuser-stories",level:3},{value:"Implementation Details",id:"implementation-details",level:3},{value:"Calculate RuntimeQuota",id:"calculate-runtimequota",level:4},{value:"Hierarchy",id:"hierarchy",level:4},{value:"Min Guarantee and Preemption",id:"min-guarantee-and-preemption",level:4},{value:"Configuration Limit",id:"configuration-limit",level:4},{value:"Extension Point",id:"extension-point",level:4},{value:"PreFilter",id:"prefilter",level:5},{value:"PostFilter",id:"postfilter",level:5},{value:"Cache and Controller",id:"cache-and-controller",level:5},{value:"API",id:"api",level:3},{value:"Quota",id:"quota",level:4},{value:"Pod",id:"pod",level:4},{value:"Compatibility",id:"compatibility",level:3},{value:"Unsolved Problems",id:"unsolved-problems",level:2},{value:"Alternatives",id:"alternatives",level:2},{value:"Implementation History",id:"implementation-history",level:2},{value:"References",id:"references",level:2}],h={toc:l},c="wrapper";function p(e){let{components:t,...n}=e;return(0,r.kt)(c,(0,a.Z)({},h,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"multi-hierarchy-elastic-quota-management"},"Multi Hierarchy Elastic Quota Management"),(0,r.kt)("h2",{id:"summary"},"Summary"),(0,r.kt)("p",null,"When several users or teams share a cluster, fairness of resource allocation is very important. This proposal provides\nmulti-hierarchy elastic quota management mechanism for the scheduler. "),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"It supports configuring quota groups in a tree structure, which is similar to the organizational structure of most companies."),(0,r.kt)("li",{parentName:"ul"},'It supports the borrowing / returning of resources between different quota groups, for better resource utilization efficiency.\nThe busy quota groups can automatically temporarily borrow the resources from the idle quota groups, which can improve the\nutilization of the cluster. At the same time, when the idle quota group turn into the busy quota group, it can also automatically\ntake back the "lent-to" resources.'),(0,r.kt)("li",{parentName:"ul"},"It considers the resource fairness between different quota groups. When the busy quota groups borrow the\nresources from the idle quota groups, the resources can be allocated to the busy quota groups under some fair rules.")),(0,r.kt)("h2",{id:"motivation"},"Motivation"),(0,r.kt)("h3",{id:"compared-with-competitors"},"Compared with competitors"),(0,r.kt)("h4",{id:"resource-quotas"},"Resource Quotas"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://kubernetes.io/docs/concepts/policy/resource-quotas/"},"Resource Quotas")," provides the ability to restrain the upper\nlimit of resource usage in one quota group. The quota group resource usage aggregated based on the pod resource configurations.\nSuppose there are still free resources in the cluster, but the resource usage of this quota group is close to the limit.\nThe quota group cannot flexibly borrow the idle resources from the cluster. The only possible way is to manually adjust the\nlimit of the quota group, but it is difficult to determine the timing and value of the adjustment when there are lots of\nquota groups."),(0,r.kt)("h4",{id:"elastic-quota"},"Elastic Quota"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/kubernetes-sigs/scheduler-plugins/blob/master/kep/9-capacity-scheduling/README.md#goals"},"Elastic Quota"),'\nproposed concepts of "max" and "min". "Max" is the upper bound of the resource consumption of the consumers. "Min" is the minimum\nresources that are guaranteed to ensure the functionality/performance of the consumers. This mechanism allows the workloads\nfrom one quota group to "borrow" unused reserved "min" resources from other quota groups. The unused "min" of one quota group\ncan be used by other quota groups, under the condition that there is a mechanism to guarantee the "victim" quota group can\nconsume its "min" resource whenever it needs. '),(0,r.kt)("p",null,'If multiple quota groups need borrow unused reserved "min" resources from other quota groups at the same time,\nthe implementation strategy is FIFO, which means that one quota group may occupy all "borrowed-from "resources,\nwhile other quota groups cannot borrow any resources at all from the cluster.'),(0,r.kt)("p",null,"Neither of the above support multi hierarchy quota management."),(0,r.kt)("h3",{id:"goals"},"Goals"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"Define API to announce multi hierarchy quota configuration.")),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"Provides a scheduler plugin to achieve multi hierarchy quota management ability."))),(0,r.kt)("h3",{id:"non-goalsfuture-work"},"Non-goals/Future work"),(0,r.kt)("p",null,"Users have two ways to manage GPU quotas. One is to only declare the number of GPU cards in the quota group, but do not\ncare about the specific card type assigned. The other is to specify the quotas required by different card types. For example,\nsuppose user A\\B both has 10 GPU quota, and cluster has two GPU types A100\\V100. quotaA only declare 10 GPU quota, so in the\nscheduling process, as long as the total number of GPU cards allocated to A is 10, no matter what the allocation ratio of\na100\\v100 is, it will meet the expectation. QuotaB also declare 10 GPU quota, but has more details with V100 is 5 and A100 is 5,\nso the maximum allocation of V100 is 5 and A100 is 5 in the scheduling will meet the expectation."),(0,r.kt)("p",null,"We know that the GPU card type reflected by the label or annotation on the node, not in the resource dimension, so we can't\nsimply configure nvidia.com/gpu-v100, nvidia.com/gpu-a100 directly into the quota group's resource dimension."),(0,r.kt)("p",null,"What's more complicated is that in a cluster, there will be multiple quota groups like A\\B at the same time,\nThese two modes will conflict. Suppose that the cluster resource has 20 cards, including 10 cards for A100 and 10 cards for V100.\nIf the scheduler first assigns 10 cards to quota groupA with all V100, then quota group B's V100 resource has no way to be guaranteed,\nwhich obviously does not meet expectations. Therefore, we need to solve the problem that if the above two modes coexist,\nthe quota mechanism can still work normally."),(0,r.kt)("p",null,"The above problems will be solved in the next proposal."),(0,r.kt)("h2",{id:"proposal"},"Proposal"),(0,r.kt)("h3",{id:"key-conceptuser-stories"},"Key Concept\\User Stories"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},'Each quota group declares its own "min" and "max". The semantics of "min" is the quota group\'s guaranteed resources,\nif quota group\'s "request" less than or equal to "min", the quota group can obtain equivalent resources to the "request".\nThe semantics of "max" is the quota group\'s upper limit of resources. We require "min" to be less than or equal to max.')),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},'We define "request" as the sum pod\'s request in the quota group. When some quota groups "request" is less than "min", and some\nquota groups "request" is more than "min", the unused resources of the former can be lent to (or you can choose not to share) the\nlatter. The latter should use these resources according to the fair rule. When the former needs to use the "lent-to" resources,\nthe latter should also return the "borrowed-from" resources according to the fair rule.')),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},'We define the "runtime" as the current actual resource that can be used by the quota group. For a quota group whose "request"\nis less than min, the value of "runtime" is equal to "request". That is to say "request" should be unconditionally satisfied\nif the "request" is less than "min". For a quota group whose "request" is greater than "min", the value of "runtime" is between\n"min" and "max", and the part exceeding "min" is based on its own "request", the "lent-to" resources, and the ability of\nother quota groups to compete for "lent-to" resources. This will be described in detail below.')),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"Hierarchy is very important in a resource-shared cluster. Suppose that the cluster shared by multiple departments, and\neach department has multiple teams. If each team is a quota group, we naturally hope that the relationship between departments\nand teams is tree shaped. In this way, no matter how to add, delete or adjust quota groups within the department, it is an\ninternal matter of the department. The cluster administrator only needs to be responsible for the quota configuration at the\nlevel of departments, and the quota group's configuration can delegate power to the department itself. Moreover, tree can\nhelp us easily see the summary of resources from the perspective of departments when there are lots of teams in one department."))),(0,r.kt)("p",null,'Another advantage of tree structure is that we can control the scope of the "lent-to" resource. For example, a department only\nwants to its quota groups can borrow resources from each other, while the resources of the department do not want to be lent\nto other departments. This is very convenient for the tree structure. It should be pointed out that although two levels can\nmeet most scenarios (the more levels, the higher the maintenance complexity), we will support that the height of the quota-tree\nis arbitrary.'),(0,r.kt)("h3",{id:"implementation-details"},"Implementation Details"),(0,r.kt)("h4",{id:"calculate-runtimequota"},"Calculate RuntimeQuota"),(0,r.kt)("p",null,'We use an example to introduce how to calculate "runtime". Suppose the cluster total resource is 100, and has 4 quotas,\nthe configuration and "request" of each quota group described as below:'),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"image",src:o(5222).Z,width:"1338",height:"732"})),(0,r.kt)("p",null,'We first calculate the "min" part of "runtime". It should be like as below:'),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"image",src:o(2192).Z,width:"1444",height:"736"})),(0,r.kt)("p",null,'Then we find quota groupA can lent 5 quotas to B\\C\\D, and the cluster has 40 quotas to allocate, so the sum is 45 for B\\C\\D\nto share. We introduce a new field to represent the allocation fairness, which is called "shared-weight". "shared-weight" determines\nthe ability of quota groups to compete for shared resources. That is to say, B/C/D will allocate resources in the cluster according\nto its "shared-weight".'),(0,r.kt)("p",null,"For example, assuming that the weights of B\\C\\D are 60\\50\\80"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("p",{parentName:"li"},"B can get 45 * 60 / (60 + 50 + 80) = 14")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("p",{parentName:"li"},"C can get 45 * 50 / (60 + 50 + 80) = 12")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("p",{parentName:"li"},"D can get 45 * 80 / (60 + 50 + 80) = 19"))),(0,r.kt)("p",null,"However, quota group B only need 5 more due to request is 20 and min is 15, and quota group C and D are still hungry,\nso quota group B can share 14 - 5 = 9 to C and D."),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"image",src:o(7629).Z,width:"1570",height:"782"})),(0,r.kt)("p",null,"quota group C and D can still share the remained quota of 9 by allocation proportion, which C get 9 ",(0,r.kt)("em",{parentName:"p"}," 50 / (50 + 80) = 3,\nD get 9 ")," 80 / (50 + 80) = 6, and we get the runtime of each quota group finally."),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"image",src:o(4703).Z,width:"1560",height:"778"})),(0,r.kt)("p",null,"The whole process can be summarized as follows:"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},'The quota divided into two categories, one is whose "request" is less than "min", we call it "lent-to-quotas". The other is\nwhose "request" is greater than "min", we call it "borrowed-quotas".')),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},'Calculate the "runtime" of each quota group not exceed "min", so we can get how many resources can be lent to "borrowed-quotas".')),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},'The "borrowed-quotas" share the resources by allocation proportion. ')),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},'If the new "runtime" is larger than "request", there will be new resources which can be lent to the rest "borrowed-quotas".'))),(0,r.kt)("p",null,'It is very difficult to manage the weight of thousands of quota groups in a company. Therefore, we need to set a default value\nfor the "shared-weight". According to our experience in online operations, using max as the default "shared-weight" of the quota\ngroup can satisfy most scenarios. In this way, "max" has both the meaning of resource ceiling and allocation proportion: the\nlarger the "max" is, the more resources it wants. For individual special scenarios, the resource administrator can adjust the weight.'),(0,r.kt)("p",null,'It must be pointed out that if the cluster resources suddenly decrease due to node failure, the sum of "min" may be\ngreater than the total resources of the cluster. If this case happens, we can\'t grantee "min" of each quota group actually.\nSo we will reduce the "min" of each quota group in a moderate proportion, which is to ensure that the sum of\n"min" actually in effect is less than the total resources of the cluster.'),(0,r.kt)("p",null,'We need to introduce the concept of "sys-group". "sys-group" means that the "min" of this quota group is infinite,\nand its request will never be bound by the quota. It is usually used for system level pods. When the scheduler starts,\nthe "sys-group" will be created by default not only in scheduler memory, but also try create the quota group crd.\nIts "min" and "max" are INT_MAX. At the same time, its "min" will not be reduced in proportion to the above process.\nThe real available total resource of normal quota groups is the cluster total resource minus the "used" of the "sys-group".'),(0,r.kt)("p",null,'We also need to introduce the concept of "default-group". If the pod cannot find a matching quota group, it will be\nmatched to the "default-group". the "default-group" will be created by default not only in scheduler memory, but also try\ncreate the quota group crd. Its "min" and "max" has default value, users can modify them on demand.'),(0,r.kt)("h4",{id:"hierarchy"},"Hierarchy"),(0,r.kt)("p",null,"We can organize quota groups using quota-tree, each quota group has its own configuration. Currently, we only allow leaf\nnodes to submit jobs. An example is as below:"),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"image",src:o(6344).Z,width:"1216",height:"792"})),(0,r.kt)("p",null,'When we calculate the "request" of each quota group. We first count the requests of each parent group from the bottom up,\nwhich is the accumulation of mathematical min(child group request, child group max). '),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"image",src:o(6429).Z,width:"1212",height:"792"})),(0,r.kt)("p",null,'Then we calculate the "runtime" from top to bottom. The "runtime" of the parent quota group is the total resources of the\nchild quota groups. First we calculate parent quota group\'s "runtime".'),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"image",src:o(5396).Z,width:"1208",height:"810"})," "),(0,r.kt)("p",null,'Then we calculate child quota group\'s "runtime".'),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"image",src:o(4100).Z,width:"1240",height:"820"})),(0,r.kt)("h4",{id:"min-guarantee-and-preemption"},"Min Guarantee and Preemption"),(0,r.kt)("p",null,'Considering the following situations, suppose that the cluster has two quotas group A\\B. At t0 time, only quota groupA has job\nsubmission, it can borrow from quota group B\'s resource, and the "request" and "used" of quota group are both 100 as below:'),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"image",src:o(3239).Z,width:"1072",height:"454"})),(0,r.kt)("p",null,"At t1 time, quota groupB has job submission too, so the \"runtime\" of quota group A\\B is both 50. However, if quota\ngroupA don't return resource back, quota groupB can't assign any resource cause node resource occupied by the quota groupA."),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"image",src:o(5892).Z,width:"1066",height:"478"})),(0,r.kt)("p",null,'The solution is that we will monitor the relationship between "used" and "runtime" of each quota group in the background thread.\nIf quota group\'s "used" continues to be greater than "runtime", we will start the forced recycling mechanism to kill\nseveral pods in the order of priority from low to high until the "used" is less than or equal to "runtime". If some pods\nin the quota group do not want to be recycled, we require such pods can only use resource up to "min". By default, we\nassume all pods can use resource beyond "min" if "runtime" larger than "min".'),(0,r.kt)("p",null,'We do not adopt the cross quota preemption method to solve the problem that when quota group "used" is less than "runtime"\n(to preempt the quota group whose "used" is greater than the "runtime"). Due to each quota group has an accurate runtime,\nwe can accurately recycle the overused resources of each quota group. This is more direct than preemption.'),(0,r.kt)("p",null,"In addition, we do not think that cross quota preemption is worth recommending. In principle, the priorities of different\nquota groups are not comparable, because they may come from different business lines. The high priority of this business line\nis not more important than the low priority of other business lines. Only priorities within a quota group have comparative\nsignificance. So we will not support cross quota preemption temporary. Moreover, in inner quota preemption, we will limit\nexistUsed - preempted + preempt smaller than runtime."),(0,r.kt)("p",null,'It can be seen from the above, if "min" of the quota group is not equal to "max", the "runtime" part exceeding "min" may\nrecycled by the scheduler. '),(0,r.kt)("h4",{id:"configuration-limit"},"Configuration Limit"),(0,r.kt)("p",null,"We introduce several constraints to ensure that the quota mechanism works properly."),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},'Except for the first level quota group, we require that the sum of "min" of all sub quota groups should be less than or\nequal to the "min" of parent group. The reason for excluding the first level quota group is that the cluster resources\ncannot avoid jitter. If the cluster resource reduced, we don\'t want to hinder the update of the quota groups.')),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},'The "max" of child quota group can be larger than the "max" of parent group. Consider the following scenario, there are\n2 subtrees in the cluster, "dev-parent" and "production-parent". Each subtree has several "quota-groups". When "production"\nis busy, we can limit the resource use of the "dev" by only decreasing the "max" of "dev-parent", instead of decreasing\nthe "max" of each sub quota group of "dev-parent".')),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},'Parent group cannot run pod. We did receive a request to allow the parent group to submit jobs. The priority of the\nparent group\'s self jobs is higher than that of all the sub-groups, which means that the parent group\'s self jobs can\npreempt the "runtime" of the sub-group\'s jobs at any time. This is somewhat similar to the hierarchical relationship of\n"Town City province". Due to complexity\uff0cwe do not support this issue for now.')),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"The parent of node can only be parent group, not child group.")),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"A quota group can't be converted on the attribute of parent group\\child group.")),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"We allow a node on the quota tree to freely change its parent node, as long as it does not break the existing detection rules."))),(0,r.kt)("p",null,'We will introduce a new "web-hook" to check the configuration limitation.'),(0,r.kt)("h4",{id:"extension-point"},"Extension Point"),(0,r.kt)("h5",{id:"prefilter"},"PreFilter"),(0,r.kt)("p",null,"We will check if the (Pod.request + Quota.Used) is less than Quota.Runtime. If not, the scheduling cycle of Pod will fail."),(0,r.kt)("h5",{id:"postfilter"},"PostFilter"),(0,r.kt)("p",null,"We will re-implement the method selectVictimsOnNode in defaultPreempt. The original selectVictimsOnNode method selects all\nthe pods with the lower priority than the preemptor\u2019s priority as potential victims in a node. For now, we only allow\ninner-quota-group preemption."),(0,r.kt)("h5",{id:"cache-and-controller"},"Cache and Controller"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},'We will watch the event of quota group and pod to calculate "runtime" of each quota group. '),(0,r.kt)("li",{parentName:"ol"},'We will create a thread to update quota group crd to display "request\\used\\runtime" periodicity.'),(0,r.kt)("li",{parentName:"ol"},'We will create a thread to monitor "used" and "runtime" of each quota group. If quota group\'s "used" continues to be\ngreater than "runtime", we will start the forced recycling mechanism to kill several pods in the order of priority from\nlow to high until the "used" is less than or equal to "runtime".')),(0,r.kt)("h3",{id:"api"},"API"),(0,r.kt)("h4",{id:"quota"},"Quota"),(0,r.kt)("p",null,"We will reuse ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/kubernetes-sigs/scheduler-plugins/blob/master/kep/9-capacity-scheduling/README.md#goals"},"Elastic Quota"),"\n's crd to declare quota group."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-go"},"type ElasticQuota struct {\n    metav1.TypeMeta\n    metav1.ObjectMeta\n    Spec   ElasticQuotaSpec\n    Status ElasticQuotaStatus\n}\n\ntype ElasticQuotaSpec struct {\n    Min v1.ResourceList\n    Max v1.ResourceList\n}\n\ntype ElasticQuotaStatus struct {\n    Used v1.ResourceList\n}\n")),(0,r.kt)("p",null,"we will also add new annotation and labels to achieve our desired functionality."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-yaml"},'annotations:\n  quota.scheduling.koordinator.sh/runtime: {cpu:4, memory: 8Gi}\n  quota.scheduling.koordinator.sh/shared-weight: {cpu:4, memory: 8Gi}\nlabels:\n  quota.scheduling.koordinator.sh/is-parent: false\n  quota.scheduling.koordinator.sh/parent-quota-name: "parent"\n  quota.scheduling.koordinator.sh/allow-lent-resource: true\n')),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"quota.scheduling.koordinator.sh/runtime"),' is updated by the scheduler. It reflects the "runtime" of the quota group.'),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"quota.scheduling.koordinator.sh/is-parent"),' is disposed by the user. It reflects the "child\\parent" attribute of the quota group. Default is child.'),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"quota.scheduling.koordinator.sh/parent-quota-name")," is disposed by the user. It reflects the parent quota name. Default is root."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"quota.scheduling.koordinator.sh/shared-weight"),' is disposed by the user. It reflects the ability to share the "lent to" resource. Default equals to "max".'),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"quota.scheduling.koordinator.sh/allow-lent-resource"),' is disposed by the user. It reflects whether quota group allows lent unused "min" to others.')),(0,r.kt)("p",null,"Here is a example:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-yaml"},'apiVersion: scheduling.sigs.k8s.io/v1alpha1\nkind: ElasticQuota\nmetadata:\n  name: test\n  namespace: test\n  annotations:\n    quota.scheduling.koordinator.sh/runtime: {cpu:4, memory: 8Gi}\n    quota.scheduling.koordinator.sh/shared-weight: {cpu:4, memory: 8Gi}\n  labels:\n    quota.scheduling.koordinator.sh/is-parent: false\n    quota.scheduling.koordinator.sh/parent-quota-name: "parent"\n    quota.scheduling.koordinator.sh/allow-lent-resource: true\nspec:\n  max:\n    cpu: 20\n    memory: 40Gi\n    nvidia.com/gpu: 2\n  min:\n    cpu: 10\n    memory: 20Gi\n    nvidia.com/gpu: 1\n')),(0,r.kt)("h4",{id:"pod"},"Pod"),(0,r.kt)("p",null,"We introduce a new label on the pod to associate pod with quota group:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-yaml"},'labels:\n  quota.scheduling.koordinator.sh/quota-name: "test1"\n')),(0,r.kt)("p",null,"if pod's don't have the label, we will follow ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/kubernetes-sigs/scheduler-plugins/blob/master/kep/9-capacity-scheduling/README.md#goals"},"Elastic Quota"),"\nusing namespace to associate pod with quota group."),(0,r.kt)("h3",{id:"compatibility"},"Compatibility"),(0,r.kt)("p",null,"We are fully compatible with ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/kubernetes-sigs/scheduler-plugins/blob/master/kep/9-capacity-scheduling/README.md#goals"},"Elastic Quota"),' \'s interface.\nIf pod\'s don\'t have the "quota-name" label, we will use the namespace to associate pod with quota group. If the pod has\nthe "quota-name" label, we will use it to associate pod with quota group instead of namespace. If we can\'t find the\nmatched quota group, we force the pod to associate with the "default-group". '),(0,r.kt)("h2",{id:"unsolved-problems"},"Unsolved Problems"),(0,r.kt)("p",null,"Please see Non-goals/Future work."),(0,r.kt)("h2",{id:"alternatives"},"Alternatives"),(0,r.kt)("h2",{id:"implementation-history"},"Implementation History"),(0,r.kt)("h2",{id:"references"},"References"))}p.isMDXComponent=!0},3239:(e,t,o)=>{o.d(t,{Z:()=>a});const a=o.p+"assets/images/quotaguarantee1-2a56b4053b43e9ad3693262f60af6a9d.jpg"},5892:(e,t,o)=>{o.d(t,{Z:()=>a});const a=o.p+"assets/images/quotaguarantee2-3d1d87a84c0f6a72153fcb228763391d.jpg"},6344:(e,t,o)=>{o.d(t,{Z:()=>a});const a=o.p+"assets/images/quotatree1-b68ec769c15547410ee4e5bd6eec1b27.jpg"},6429:(e,t,o)=>{o.d(t,{Z:()=>a});const a=o.p+"assets/images/quotatree2-4dc5d14fca1612f275811ad3e3894b9e.jpg"},5396:(e,t,o)=>{o.d(t,{Z:()=>a});const a=o.p+"assets/images/quotatree3-19edd3d6aec62d109f15d7f190207dcc.jpg"},4100:(e,t,o)=>{o.d(t,{Z:()=>a});const a=o.p+"assets/images/quotatree4-ec7592889798a705a13bda326bf22813.jpg"},5222:(e,t,o)=>{o.d(t,{Z:()=>a});const a=o.p+"assets/images/runtimequota1-74410cc31ce756d123d131616062720b.jpg"},2192:(e,t,o)=>{o.d(t,{Z:()=>a});const a=o.p+"assets/images/runtimequota2-c5a2c35d3999f5897b998213e27275f6.jpg"},7629:(e,t,o)=>{o.d(t,{Z:()=>a});const a=o.p+"assets/images/runtimequota3-f6b93a7ae7b63ae9232c3c97d8efd03b.jpg"},4703:(e,t,o)=>{o.d(t,{Z:()=>a});const a=o.p+"assets/images/runtimequota4-1ac93330d7444d8cfc54122eff7597b3.jpg"}}]);
import Translate from '@docusaurus/Translate';
import React from 'react';

const features = [
  {
    title: <Translate>Flexible Scheduling Policies</Translate>,
    Svg: require('@site/static/img/workloads-orchestration-feature.svg').default,
    description: (
      <>

        <Translate>Koordinator provides a range of options for customizing scheduling policies, allowing users to fine-tune the behavior
          of the system to suit their specific needs, such as Web Service, Spark, Presto, TensorFlow, etc.
          We provide a profile tool to help you manage workload scheduling policies, which allows to control scheduling policies without modifying the existing workload controller</Translate>

        <br></br>

        <Translate>These profiles provide best practices for running typical workloads on kubernetes, and you can easily extend them if they don't directly meet your needs.
        The koordinator community will continue to add more best practices for workload colocation.</Translate>
      </>
    ),
  },

  {
    title: <Translate>Improved Resource Utilization</Translate>,
    Svg: require('@site/static/img/resource-model-feature.svg').default,
    description: (
      <>
        <Translate>Koordinator introduces a well-designed priority and QoS mechanism to co-locate different types of workloads in a cluster and run different types of pods on a single node.
        On the basis of dividing priority and QoS, it achieves high resource utilizations through resource overcommitment and ensure QoS guarantees by leveraging an application profiling mechanism.</Translate>
       
       <br></br>

        <Translate>The general idea is to overcommit to low-priority pods by reclaiming high-priority resources that have been applied for but not used, and avoid prediction failure through reasonable resource profiling mechanism and node bottom-up strategy.</Translate>
      </>
    ),
    reverse: true,
  },

  {
    title: <Translate>Enhanced Workload Performance</Translate>,
    Svg: require('@site/static/img/resource-isolation-feature.svg').default,
    description: (
      <>
        <Translate>Koordinator introduces a QoSManager to coordinate a set of plugins which are responsible for SLO guarantee by priority, mitigating interference among pods.
        These plugins dynamically tunes the "knobs" of resource parameters on different scenarios, according to resource profiling, interference detection results and SLO configuration.</Translate>

        <br></br>

        <Translate>The QoSManager continuously adjusts the resource isolation parameters of each Pod to eliminate the long-tail jitter of latency-sensitive workloads.
        Therefore, even if you don't care about resource utilization improvement, it will provide a series of methods to improve runtime stability and performance.</Translate>

      </>
    ),
  },

  {
    title: <Translate>Easy Integration</Translate>,
    Svg: require('@site/static/img/easy-integration.svg').default,
    description: (
      <>
        <Translate>Koordinator consists of control plane components and node components, and does not require invasive modifications to the native components of Kubernetes.
          It runs in a similar fashion to a sidecar within a Kubernetes cluster, and based on the chosen policies, it schedules and manages user Pods, 
          observes their runtime status, and optimizes their performance.</Translate>

        <br></br>

        <Translate>Koordinator follows the principle of loose coupling, allowing users to use the entire set of components or a combination of some components
           to meet their specific business requirements.</Translate>

      </>
    ),
    reverse: true,
  },

];


export default features

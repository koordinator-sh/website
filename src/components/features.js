import React from 'react';
import Translate from '@docusaurus/Translate';

const features = [
  {
    title: <Translate>Co-located Workloads Orchestration</Translate>,
    Svg: require('@site/static/img/workloads-orchestration-feature.svg').default,
    description: (
      <>

        <Translate>Koordinator contains a set of colocation profiles, such as Spark profile, Presto profile, TensorFlow profile, etc.
        These profiles allow you to run workloads directly in a co-located manner without customizing the original workload controllers,
        and all you need to do is install these profiles CRs.</Translate>

        <br></br>

        <Translate>These profiles provide best practices for running typical workloads on kubernetes, and you can easily extend them if they don't directly meet your needs.
        The koordinator community will continue to add more best practices for workload colocation.</Translate>
      </>
    ),
  },
  {
    title: <Translate>Overcommitment and QoS based Scheduling</Translate>,
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
    title: <Translate>Interference detection and Resource Isolation</Translate>,
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
];


export default features

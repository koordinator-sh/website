import React from 'react';

const features = [
  {
    title: '',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Well-designed priority and QoS mechanism to co-locate different types of workloads in a cluster and run different types of pods on a single node.
      </>
    ),
  },
  {
    title: '',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Allowing for resource overcommitments to achieve high resource utilizations and ensure QoS guarantees by leveraging an application profiling mechanism.
      </>
    ),
    reverse: true,
  },
  {
    title: '',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Fine-grained resource orchestration and isolation mechanism to improve the efficiency of latency-sensitive workloads and batch jobs.
      </>
    ),
  },
];


export default features

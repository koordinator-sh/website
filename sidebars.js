/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'introduction',
        'installation',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      collapsed: false,
      items: [
        'architecture/overview',
        'architecture/resource-model',
        'architecture/priority',
        'architecture/qos',
      ],
    },
    {
      type: 'category',
      label: 'User Manuals',
      collapsed: true,
      items: [
        'user-manuals/colocation-profile',
        'user-manuals/load-aware-scheduling',
        'user-manuals/fine-grained-cpu-orchestration',
      ],
    },
    {
      type: 'category',
      label: 'Design Details',
      collapsed: true,
      items: [
        'designs/koordlet-overview',
        'designs/runtime-proxy',
        'designs/load-aware-scheduling',
        'designs/fine-grained-cpu-orchestration',
      ],
    },
    {
      type: 'category',
      label: 'Best Practices',
      collapsed: true,
      items: [
        'best-practices/colocation-of-spark-jobs',
      ],
    },
  ],
};

module.exports = sidebars;

console.log(JSON.stringify(sidebars, null, 2))
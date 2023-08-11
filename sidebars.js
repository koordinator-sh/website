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
        'user-manuals/load-aware-descheduling',
        'user-manuals/fine-grained-cpu-orchestration',
        'user-manuals/resource-reservation',
        'user-manuals/pod-migration-job',
        'user-manuals/fine-grained-device-scheduling',
        'user-manuals/gang-scheduling',
        'user-manuals/multi-hierarchy-elastic-quota-management',
        'user-manuals/slo-config',
        'user-manuals/cpu-suppress',
        'user-manuals/cpu-burst',
        'user-manuals/cpu-qos',
        'user-manuals/cpu-evict',
        'user-manuals/memory-qos',
        'user-manuals/memory-evict',
        'user-manuals/performance-collector',
      ],
    },
    {
      type: 'category',
      label: 'Design Details',
      collapsed: true,
      items: [
        'designs/koordlet-overview',
        'designs/runtime-proxy',
        'designs/nri-mode-resource-management',
        'designs/enhanced-scheduler-extension',
        'designs/load-aware-scheduling',
        'designs/fine-grained-cpu-orchestration',
        'designs/resource-reservation',
        'designs/pod-migration-job',
        'designs/descheduler-framework',
        'designs/fine-grained-device-scheduling',
        'designs/gang-scheduling',
        'designs/multi-hierarchy-elastic-quota-management',
      ],
    },
    {
      type: 'category',
      label: 'Best Practices',
      collapsed: true,
      items: [
        'best-practices/colocation-of-spark-jobs',
        'best-practices/anolis_plugsched',
        'best-practices/fine-grained-cpu-orchestration',
      ],
    },
  ],
};

module.exports = sidebars;

console.log(JSON.stringify(sidebars, null, 2))

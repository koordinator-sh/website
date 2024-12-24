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
        {
          'Task Scheduling': [
            'user-manuals/gang-scheduling',
            'user-manuals/capacity-scheduling',
          ],
          'Heterogeneous Resources Scheduling': [
            'user-manuals/fine-grained-device-scheduling',
            'user-manuals/device-scheduling-gpu-share-with-hami',
          ],
          'Load-aware Scheduling': [
            'user-manuals/load-aware-scheduling',
            'user-manuals/load-aware-descheduling',
          ],
          'Fine-grained Scheduling': [
            'user-manuals/fine-grained-cpu-orchestration',
            'user-manuals/cpu-burst',
            'user-manuals/cpu-qos',
            'user-manuals/memory-qos',
          ],
          'Colocation': [
            "user-manuals/colocation-profile",
            "user-manuals/cpu-suppress",
            "user-manuals/cpu-evict",
            "user-manuals/memory-evict",
            "user-manuals/slo-config",
            "user-manuals/host-application-qos",
            "user-manuals/performance-collector",
            "user-manuals/installation-runtime-proxy",
          ],
          'NodeResourceFitPlus' : [
            'user-manuals/node-resource-fit-plus-scoring',
          ],
          'Utils' : [
            'user-manuals/resource-reservation',
            'user-manuals/pod-migration-job',
          ]
        }
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
        'designs/node-prediction',
        'designs/enhanced-scheduler-extension',
        'designs/load-aware-scheduling',
        'designs/fine-grained-cpu-orchestration',
        'designs/resource-reservation',
        'designs/pod-migration-job',
        'designs/descheduler-framework',
        'designs/fine-grained-device-scheduling',
        'designs/gang-scheduling',
        'designs/multi-hierarchy-elastic-quota-management',
        'designs/koordinator-yarn',
        'designs/node-resource-fit-plus-scoring',
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
        'best-practices/colocation-of-hadoop-yarn',
        'best-practices/network-qos-with-terwayqos',
      ],
    },
  ],
};

module.exports = sidebars;

console.log(JSON.stringify(sidebars, null, 2))

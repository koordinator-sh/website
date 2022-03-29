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
      label: 'Core Concepts',
      collapsed: false,
      items: [
        'core-concepts/architecture',
        'core-concepts/priority',
        'core-concepts/qos',
      ],
    },
    {
      type: 'category',
      label: 'User Manuals',
      collapsed: false,
      items: [
        'user-manuals/colocation-profile',
      ],
    },
    {
      type: 'category',
      label: 'Best Practices',
      collapsed: false,
      items: [
        'best-practices/colocation-of-spark-jobs',
      ],
    },
  ],
};

module.exports = sidebars;

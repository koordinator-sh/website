// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Koordinator',
  tagline: 'QoS based scheduling system for hybrid workloads orchestration on Kubernetes',
  url: 'https://koordinator.sh',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico', // TODO(FillZpp)
  organizationName: 'koordinator-sh', // Usually your GitHub org/user name.
  projectName: 'koordinator.sh', // Usually your repo name.

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          //editUrl: 'https://github.com/koordinator-sh/koordinator.sh/tree/main',
          editUrl: function ({
            locale,
            docPath,
          }) {
            return `https://github.com/koordinator-sh/koordinator.sh/edit/main/docs/${docPath}`;
          },
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          includeCurrentVersion: true,
          // lastVersion: 'v0.1', // TODO(FillZpp)
        },
        blog: {
          blogSidebarTitle: 'All posts',
          blogSidebarCount: 'ALL',
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            'https://github.com/koordinator-sh/koordinator.sh/tree/main/blog',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  // i18n: {
  //   defaultLocale: 'en',
  //   locales: ['en', 'zh'],
  //   localeConfigs: {
  //     en: {
  //       label: 'English',
  //     },
  //     zh: {
  //       label: '简体中文',
  //     },
  //   },
  // },

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      announcementBar: {
        id: 'start',
        content:
          '⭐️ If you like Koordinator, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/koordinator-sh/koordinator">GitHub</a>! ⭐️',
      },
      algolia: { // TODO(FillZpp)
        apiKey: '72ec0a3c892141cf32490c676bb66628',
        indexName: 'openkruise',
        appId: 'FKASWWQYOP',
      },
      navbar: {
        title: 'Koordinator',
        logo: {
          alt: 'Koordinator',
          src: 'img/logo.svg', // TODO(FillZpp)
        },
        items: [
          {
            type: 'docsVersionDropdown',
            position: 'right',
          },
          {to: 'docs/introduction', label: 'Documentation', position: 'left'},
          {to: '/blog', label: 'Blog', position: 'left'},
          {
            type: 'localeDropdown',
            position: 'right',
          },
          {
            href: 'https://github.com/koordinator-sh/koordinator',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
            ],
          },
          {
            title: 'Community',
            items: [
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/koordinator-sh/koordinator',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} The Koordinator Authors. All rights reserved.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;

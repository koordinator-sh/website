// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const versions = require('./versions.json');

function getNextVersionName() {
  const expectedPrefix = 'v1.';

  const lastReleasedVersion = versions[0];
  if (!lastReleasedVersion.includes(expectedPrefix)) {
    throw new Error(
      'this code is only meant to be used during the 2.0 phase.',
    );
  }
  const version = parseInt(lastReleasedVersion.replace(expectedPrefix, ''), 10);
  return `${expectedPrefix}${version + 1}`;
}


/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Koordinator',
  tagline: 'QoS-based scheduling for efficient orchestration of microservices, AI, and big data workloads on Kubernetes',
  url: 'https://koordinator.sh',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'koordinator-sh', // Usually your GitHub org/user name.
  projectName: 'koordinator.sh', // Usually your repo name.
  trailingSlash: false,


  presets: [
    [
      '@docusaurus/preset-classic',
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
          lastVersion: undefined,
          onlyIncludeVersions: (() => {
            return ['current', ...versions.slice(0, 3)];
          })(),
          versions: {
            current: {
              label: `${getNextVersionName()} 🚧`,
            },
          },
        },
        blog: {
          blogSidebarTitle: 'All posts',
          blogSidebarCount: 'ALL',
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            'https://github.com/koordinator-sh/koordinator.sh/edit/main/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-Hans'],
    localeConfigs: {
      en: {
        label: 'English',
      },
      'zh-Hans': {
        label: '简体中文',
      },
    },
  },

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      announcementBar: {
        id: 'start',
        content:
          '⭐️ If you like Koordinator, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/koordinator-sh/koordinator">GitHub</a>! ⭐️',
      },
      algolia: {
        apiKey: '72ec0a3c892141cf32490c676bb66628',
        indexName: 'koordinator',
        appId: 'FKASWWQYOP',
        contextualSearch: false,
        searchParameters: {},
      },
      navbar: {
        title: 'Koordinator',
        logo: {
          alt: 'Koordinator',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docsVersionDropdown',
            position: 'right',
          },
         
          {to: 'docs', label: 'Documentation', position: 'left'},
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
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Getting Started',
                href: 'docs/installation',
              },
              {
                label: 'User Manuals',
                href: 'docs/user-manuals/colocation-profile',
              },
              {
                label: 'Architecture',
                href: 'docs/architecture/overview',
              }
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Slack ( #koordinator channel )',
                href: 'https://join.slack.com/t/koordinator-sh/shared_invite/zt-1756qoub4-Cn4~esfdlfAPsD7cwO2NzA',
              },
              {
                label: 'DingTalk (GroupID: 33383887)',
                href: '.',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/koordinator-sh/koordinator',
              },
              {
                label: 'Blog',
                href: 'blog',
              },
            ],
          },
        ],
        copyright: `
        <div style="font-size: 18px">
        <br />
        <strong>Koordinator is a <a href="https://www.cncf.io/">Cloud Native Computing Foundation</a> sandbox project</strong>
        <br />
        </div>
        <br />
        <img src="img/cncf-color.svg" alt="CNCF" width="auto" height="100px"/>
        <br />
        <div style="font-size: 14px">
        The Linux Foundation® (TLF) has registered trademarks and uses trademarks. For a list of TLF trademarks, see <a href="https://www.linuxfoundation.org/trademark-usage/">Trademark Usage</a>.
        <br />
        Copyright © ${new Date().getFullYear()} The Koordinator Authors. All rights reserved.
        </div>
        `
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;

# Website

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

## Localization README

| Language                |
| ----------------------- |
| [Chinese](README-zh.md) |

## Contributing

You are very welcome to contribute docs. All documentation is in the docs directory, and the writing style can refer to the existing documentation.

This is **IMPORTANT** to know:

- If you are adding docs for those features in next release, please add:
  - EN docs into `docs/`
  - ZH docs into `i18n/zh-Hans/docusaurus-plugin-content-docs/current`
- If you are adding docs for features that have already supported in stable release (e.g., v1.0), please add:
  - EN docs into both `docs/` and `versioned_docs/version-v1.0`
  - ZH docs into both `i18n/zh-Hans/docusaurus-plugin-content-docs/current` and `i18n/zh-Hans/docusaurus-plugin-content-docs/version-v1.0`
- If you are publishing blog, please add:
  - EN docs into `blog/`
  - ZH docs into `i18n/zh-Hans/docusaurus-plugin-content-blog/`

You can debug the docs locally with the following command:

```
# EN
$ npm run start

# ZH
$ npm run start -- --locale zh-Hans
```

When your pull request is merged, the bot is automatically built and published to the `gh-pages` branch and eventually visible in [koordinator.sh](https://koordinator.sh). 

## Version release

```
$ npm run docusaurus docs:version v1.x
```

It will automatically copy new version directories from the current directories for both EN and ZH docs.

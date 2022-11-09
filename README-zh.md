# Website

官网使用一个现代化的静态网站生成器 [Docusaurus 2](https://docusaurus.io/) 生成。

## 贡献

非常欢迎您贡献文档。所有中文文档都在 `/i18n/zh-Hans/docusaurus-plugin-content-docs` 目录中，书写风格可以参考现有的文档。

重点注意:

- 如果你添加的是下个版本中将会发布功能的文件，请添加：
  - 英文文档到 `docs/`
  - 中文文档到 `i18n/zh-Hans/docusaurus-plugin-content-docs/current`
- 如果你添加的是当前稳定版本包含的功能文档（例如 v1.0），请添加：
  - 英文文档到 `docs/` 和 `versioned_docs/version-v1.0` 两个地方
  - 中文文档到 `i18n/zh-Hans/docusaurus-plugin-content-docs/current` 和 `i18n/zh-Hans/docusaurus-plugin-content-docs/version-v1.0` 两个地方

您可以使用以下命令在本地调试文档：

```
# EN
$ npm run start

# ZH
$ npm run start -- --locale zh-Hans
```

当你的 PR 被合并时, 机器人会自动构建发布到 `gh-pages` 分支并且最终可在 [koordinator.sh](https://koordinator.sh) 查看。

## 翻译注意事项

- 数字和英文两边是中文要加空格。
- 品牌名称和概念一般不翻译，但要统一写法，注意大小写。
- 拒绝机翻。翻译完请先阅读一遍，力争做到：
    - 不悖原文，即是译文要准确，不偏离，不遗漏，也不要随意增减意思
    - 不拘泥于原文形式，译文通顺明白。不追求与原文严格一致，在能够更好地表达原文内容的基础上可以意译。
- 你和您不要混用，统一使用用 **“你”**。
- 不会翻译的词汇可以不翻译，可以在 PR 中说明，review 的时候会查看/修正。
- 注意中英文标点符号。
- 注意链接，中文的文档里对应的链接也用中文链接。
- `PR` 命名规范 `Translate <翻译文件相对路径>`，如 `Translate i18n/zh-Hans/docusaurus-plugin-content-docs/current/introduction.md`。

## 版本发布

```
$ npm run docusaurus docs:version v1.x
```

它会自动从中英文的 current 目录拷贝出来一份新版本的文档目录。

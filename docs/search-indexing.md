# 搜索引擎收录

## 已配置内容

- 首页与功能介绍页的独立标题、描述、canonical 和允许索引的 robots 元信息。
- WebSite、WebApplication 与功能介绍页的 JSON-LD 结构化数据，内容对应现有功能，不声明评分、评价或官方授权。
- 无需 JavaScript 即可阅读的 `public/guide.html`，包含真实词库范围、听写批改规则、发音、错词复习、学习记录及本地保存说明；应用页脚提供可抓取入口。
- 首页加载或 JavaScript 不可用时可见的简介与说明页链接。
- `public/sitemap.xml` 仅包含首页和功能介绍页。错词本、个人学习记录和各个本地状态视图不作为独立索引网址。

线上地址按当前 GitHub Pages 仓库设置：`https://cjd0901.github.io/IELTS-dictation-practice/`。更换域名或仓库名时，需要同步更新首页、介绍页和站点地图内的绝对网址。构建时继续使用现有 GitHub Pages 部署流程传入的 base 路径。

## 部署后提交 Google

1. 将修改提交并推送，等待 GitHub Actions 部署成功。确认首页、`guide.html` 与 `sitemap.xml` 可以在公网正常打开。
2. 登录 [Google Search Console](https://search.google.com/search-console/)，添加“网址前缀”资源：`https://cjd0901.github.io/IELTS-dictation-practice/`。GitHub 的共享域名不适合通过 DNS 验证整个 `github.io` 域名。
3. 按控制台提供的方法验证。若选择 HTML 文件验证，将 Google 提供的原始验证文件放入 `public/`，重新部署后再点击验证；若使用 HTML 标签验证，将提供的真实 `google-site-verification` 标签加入 `index.html` 的 `<head>` 并部署。保持验证文件或标签长期存在。
4. 在“站点地图”提交 `https://cjd0901.github.io/IELTS-dictation-practice/sitemap.xml`。
5. 使用“网址检查”分别检查首页及功能介绍页，测试实际网址，再请求编入索引。之后通过控制台检查抓取、索引和搜索展示情况。

验证需要网站所有者的账号和控制台提供的真实验证信息，本项目没有预填虚假的验证令牌。

## Bing 等搜索引擎

在 [Bing Webmaster Tools](https://www.bing.com/webmasters/about) 中添加站点并完成所有权验证，按控制台提示部署验证文件或标签，提交同一份站点地图。

## GitHub Pages 子路径与 robots.txt

搜索引擎只读取站点主机根目录的 robots.txt：当前应为 `https://cjd0901.github.io/robots.txt`。放在 `/IELTS-dictation-practice/robots.txt` 的文件不能代替主机根目录规则，因此本仓库未添加一个看似有效的子路径 robots.txt。

如果主机根目录没有 robots.txt，默认允许抓取；如果用户主页仓库配置了禁止规则，需要在那里调整。本站通过页面 robots 元信息允许索引，站点地图通过 Search Console、Bing 控制台及 HTML 链接提供。

## 验证与范围

`npm test` 验证 SEO 文件中的结构化数据、规范网址、站点地图、真实词库数量及说明页链接；`npm run build -- --base=/IELTS-dictation-practice/` 用于检查部署子路径。

SEO 配置能帮助发现和理解页面，不会自动完成账号验证，也不能保证收录、排名或收录时间。搜索引擎需要在部署后自行抓取与评估。

参考：[Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)、[站点地图](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)、[所有权验证](https://support.google.com/webmasters/answer/9008080)、[请求抓取](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)、[robots.txt 位置](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt)。

# Still 时刻

精选浏览器时钟画廊。Astro + TypeScript + 原生 CSS，发布为静态 HTML。

- 在线体验：https://xalexalice.github.io/fliqlo/
- 独立翻页时钟：https://xalexalice.github.io/fliqlo/standalone/flip-minimal.html
- 原版时钟：https://xalexalice.github.io/fliqlo/legacy/fliqlo.html
- 离线下载包：https://github.com/xalexalice/fliqlo/releases/latest

支持分类和搜索、当前浏览器收藏、分享收藏快照、显式导入、单款详情与下载、GitHub Issue 投稿。
5 款新增时钟的 JavaScript 和 CSS 全部内嵌，下载 HTML 后双击即可在浏览器离线运行。
原版 `fliqlo.html` 保持字节不变；它依赖 Tailwind CDN 和在线字体，需要联网。
全部 6 款时钟支持中文、英语、日语、韩语、法语、德语、西班牙语，以及全屏和空闲 3 秒自动隐藏工具栏。
移动鼠标、触摸或键盘操作可唤回工具栏；新增时钟在键盘操作控件或打开语言菜单时保持工具栏可见。点击全屏按钮或按 `F` 进入、退出全屏。
首页顶部和时钟列表下方均提供「独立翻页时钟」「原版时钟」直达入口。
首页、全部详情、收藏、分享、投稿和 404 页面也支持上述七种语言；在右上角选择语言，导航、搜索标签、日期、元信息和操作提示会一起切换。
网站与时钟共用 `clk_lang` 语言设置，连接原版已有的语言选择。分享链接带 `?lang=…`，在另一浏览器打开也会采用对应语言。

## 本地开发

Node.js >= 22.12（CI 使用 Node 24），npm >= 9.6.5。

```bash
npm ci
npm run dev
```

开发地址 `http://localhost:4321/fliqlo/`。

```bash
npm run check
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4321
npm run test:browser
npx astro preview stop
```

浏览器测试使用本机 Google Chrome（Playwright `channel: chrome`）。无 Chrome 的环境先执行 `npx playwright install chrome`。
`dist/` 是完整发布目录，`dist/standalone/*.html` 是不依赖服务器的单文件时钟。
`npm run build` 校验所有路由、GitHub Pages 子路径、独立 HTML 无外部资源，以及原文件 SHA-256。

## 部署

GitHub 仓库 **Settings → Pages → Source → GitHub Actions**。
推送到 `main` 会先运行类型检查、单元测试与构建，再发布到 GitHub Pages。
更换仓库时同步修改 `astro.config.mjs` 的 `site` / `base`，以及 `src/lib/paths.ts` 与目录数据中的仓库链接。

## 添加时钟

编辑 `src/data/clocks.json` 添加名称、分类、标签、许可、来源与预览样式。
原生款式在 `src/scripts/clock-runtime.ts` 和 `src/styles/standalone.css` 实现，由 `scripts/build-clocks.mjs` 打包成单文件 HTML。
外观预览在 `src/components/ClockPreview.astro` 与 `src/styles/previews.css` 实现，列表不加载运行中的 iframe。
贡献作品使用仓库的「提交一款时钟」Issue 表单。许可与浏览器兼容性审核后再合并。

## 存储与分享

收藏键为 `clock-gallery:fliqlo:favorites:v1`，只保存在当前浏览器。
收藏分享采用 `/share/#v=1&ids=orbit,mono`；最多 20 个 ID、2048 字符，校验版本、字符、重复与未知 ID。
链接是一份只读快照，点击导入才会合并到接收方收藏。不提供账户或跨设备自动同步。
单款分享链接打开详情页；时钟设置不编码到分享链接，原版设置行为保持不变。
屏幕常亮需用户主动开启，依赖浏览器 Wake Lock 支持；全屏依赖浏览器 Fullscreen API。

## 许可

新增画廊代码与 4 款原生时钟按 MIT 发布；Classic Flip 使用 `flipclock@1.0.1`，随独立 HTML 保留其及运行依赖的许可文本。
参见 `LICENSE`、`THIRD_PARTY_NOTICES.md` 与构建后的 `standalone/THIRD_PARTY_LICENSES.txt`。
原始 `fliqlo.html` 和用户提供的 Logo 不重新授权为 MIT。调研对象的代码、字体与背景未被无许可复制。

调研与设计依据见 `docs/research-and-design.md`。

# Still 时刻

精选浏览器时钟画廊。Astro + TypeScript + 原生 CSS，发布为静态 HTML。

- 在线体验：https://xalexalice.github.io/fliqlo/
- 独立翻页时钟：https://xalexalice.github.io/fliqlo/standalone/flip-minimal.html
- 原版时钟（增强入口）：https://xalexalice.github.io/fliqlo/standalone/fliqlo.html
- 离线下载包：https://github.com/xalexalice/fliqlo/releases/latest

支持分类和搜索、当前浏览器收藏、分享收藏快照、显式导入、单款详情与下载、GitHub Issue 投稿。
13 款时钟的 JavaScript、CSS 和所需字体全部内嵌，下载 HTML 后双击即可在浏览器离线运行。
原版 `fliqlo.html` 保持字节不变；它依赖 Tailwind CDN 和在线字体，需要联网。
首页与详情默认打开它的增强副本，增加自定义背景；详情的「原始 HTML」下载与 ZIP 中的 `fliqlo-original.html` 仍是原件。
全部 14 款时钟提供「背景」按钮，可选择本机图片或浏览器支持的 MP4 / WebM 视频；视频静音循环播放，自动播放被阻止时可手动播放。背景铺满屏幕，保留日期与时钟的对比度，并支持恢复默认背景。
图片和视频不会上传，也不写入浏览器存储，仅在当前页面使用；刷新或重新打开后需重新选择。下载的 HTML 同样支持选择背景文件。
全部 14 款时钟支持中文、英语、日语、韩语、法语、德语、西班牙语，以及全屏和空闲 3 秒自动隐藏工具栏。
13 款离线时钟的顶部标题也会随工具栏一起隐藏和恢复，隐藏时保留占位，时钟位置不变。
移动鼠标、触摸或键盘操作可唤回工具栏；新增时钟在键盘操作控件或打开语言菜单时保持工具栏可见。点击全屏按钮或按 `F` 进入、退出全屏。
首页顶部和时钟列表下方均提供「独立翻页时钟」「原版时钟」直达入口。
首页、全部详情、收藏、分享、投稿和 404 页面也支持上述七种语言；在右上角选择语言，导航、搜索标签、日期、元信息和操作提示会一起切换。
网站与时钟共用 `clk_lang` 语言设置，连接原版已有的语言选择。分享链接带 `?lang=…`，在另一浏览器打开也会采用对应语言。

## v1.3.0 新增款式

首页现在有 14 款时钟：原有 6 款，加上确认的全部 8 款。

| 确认编号 | 首页名称 | 款式 | 独立 HTML |
| --- | --- | --- | --- |
| A1 | Station | 瑞士车站钟 | [打开](https://xalexalice.github.io/fliqlo/standalone/station.html) |
| A2 | Neumorphic | 柔和立体指针钟 | [打开](https://xalexalice.github.io/fliqlo/standalone/neumorphic.html) |
| A3 | Roman | 奶油金罗马钟 | [打开](https://xalexalice.github.io/fliqlo/standalone/roman.html) |
| A4 | Chronograph | 机械表盘钟 | [打开](https://xalexalice.github.io/fliqlo/standalone/chronograph.html) |
| D1 | Aura | 玻璃数字钟 | [打开](https://xalexalice.github.io/fliqlo/standalone/aura.html) |
| D2 | Rolling | 滚动数字钟 | [打开](https://xalexalice.github.io/fliqlo/standalone/rolling.html) |
| D3 | Bubble | 彩色气泡数字钟 | [打开](https://xalexalice.github.io/fliqlo/standalone/bubble.html) |
| D4 | Nixie | 蒸汽辉光管钟 | [打开](https://xalexalice.github.io/fliqlo/standalone/nixie.html) |

八款均可完全离线运行，支持收藏、分享、七语言、全屏、标题与工具栏自动隐藏、自定义图片及循环视频背景。
Tiqlo Bubble 已从 Flutter 适配为原生 HTML；Nixie 已将外链字体换成内嵌、授权明确的 DSEG7。

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
新增八款共用 `src/lib/clock-faces.mjs` 的表盘标记和 `src/scripts/clock-faces.ts` 的时间更新；字体来自 `public/assets/fonts/`，构建时按款式内嵌。
贡献作品使用仓库的「提交一款时钟」Issue 表单。许可与浏览器兼容性审核后再合并。

## 存储与分享

收藏键为 `clock-gallery:fliqlo:favorites:v1`，只保存在当前浏览器。
收藏分享采用 `/share/#v=1&ids=orbit,mono`；最多 20 个 ID、2048 字符，校验版本、字符、重复与未知 ID。
链接是一份只读快照，点击导入才会合并到接收方收藏。不提供账户或跨设备自动同步。
单款分享链接打开详情页；时钟设置不编码到分享链接，原版设置行为保持不变。
屏幕常亮需用户主动开启，依赖浏览器 Wake Lock 支持；全屏依赖浏览器 Fullscreen API。

## 许可

新增画廊代码、背景功能与 4 款原生时钟按 MIT 发布；8 款获确认的新设计按原项目 MIT 许可适配，保留作者声明；Classic Flip 使用 `flipclock@1.0.1`，随独立 HTML 保留其及运行依赖的许可文本。
参见 `LICENSE`、`THIRD_PARTY_NOTICES.md` 与构建后的 `standalone/THIRD_PARTY_LICENSES.txt`。
原始 `fliqlo.html` 和用户提供的 Logo 不重新授权为 MIT。新增设计的来源和固定版本记录在 `src/data/clock-sources.json`；字体与校验值记录在 `src/data/clock-fonts.json`，完整 MIT / OFL 许可随每款 HTML 和 ZIP 提供。

调研与设计依据见 `docs/research-and-design.md`。

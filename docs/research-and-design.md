# 网页时钟收藏分享站点调研与方案

建议自建一个轻量的时钟目录站，保留现有 `fliqlo.html`，通过独立页面接入不同风格的时钟。主技术栈采用 Astro、TypeScript 和原生 CSS/JavaScript，内容在 GitHub 维护，发布到 GitHub Pages。新增翻页钟优先评估 `flipclock@1.0.1`，按需加载到独立时钟页。

本方案按首版本机收藏、链接分享、GitHub 投稿设计。账号与跨设备自动同步会引入后端和权限管理；如果这是首版硬性要求，应改用后文的同步方案。

调研日期为 2026 年 10 月 10 日 UTC，纽约当地为 10 月 9 日。更新时间采用默认分支最新提交的 committer 时间，另列正式包发布时间，避免将仓库推送、文档修改和功能迭代混为一谈。星标为读取时的快照；它只反映关注度。核验快照与固定提交链接保存在 `research-sources.json`。

## 五个候选项目

这五个项目包含三个可复用的时钟组件、一个有网页渲染实现的风格时钟，以及一个可参考线上体验的时钟站点。成熟度并不相同：有发布、类型和测试的组件更适合工程接入；长期运行的网站也可能缺少源码授权或现代构建能力。所核验的五个项目都没有直接提供完整的收藏分享社区。

| 项目与关注度 | 内容和功能 | 默认分支最近提交 UTC | 正式包或发布 | 许可证 | 技术栈与成熟度判断 |
| --- | --- | --- | --- | --- | --- |
| [objectivehtml/FlipClock](https://github.com/objectivehtml/FlipClock)，2,783 stars | 翻页时钟、计数器、经过时间、字母翻牌；自定义主题、表盘、事件钩子 | 2025-08-24，文档页脚版权修改 | npm 1.0.1，2025-08-24 | MIT | TypeScript、SolidJS、date-fns、goober；Vite/tsup、Vitest。类型、扩展接口与测试较完整，优先作为新增翻页钟组件候选 |
| [pqina/flip](https://github.com/pqina/flip)，1,023 stars | 翻牌显示引擎、倒计时、计数器、多种布局；有原生 HTML 示例及 React/Vue 集成示例 | 2026-07-13，仅修改 LICENSE | npm 1.8.4，2024-11-26；GitHub 无正式 Release | MIT | JavaScript、SCSS、内置 Tick 引擎；源码构建仍使用 Gulp 3/Babel 6。发行产物便于接入，维护活跃度不能从最新提交日期推断 |
| [wojtekmaj/react-clock](https://github.com/wojtekmaj/react-clock)，393 stars | 指针钟；表盘刻度、数字、指针宽度和长度、秒针、尺寸、毫秒精度可配置 | 2026-10-07，依赖更新 | npm/GitHub v6.0.0，2025-05-29 | MIT | React、TypeScript、HTML/CSS；Vitest 测试及 CI。指针钟组件成熟，但消费方必须提供时间值和刷新逻辑 |
| [brillout/clocktab](https://github.com/brillout/clocktab)，60 stars | 完整数字时钟站；主题预设、背景、字体、12/24 小时、日期、秒数、标签页标题和图标；还有倒计时及文字展示页面 | 2023-03-11，背景图片修改 | 未发现正式 Release | 未发现明确授权 | JavaScript/TypeScript、React、Goldpage 渲染配置、tab-utils 子模块。适合参考产品体验；作者 README 明确说明代码陈旧、逐步现代化 |
| [Wandmalfarbe/evangelion-clock-screensaver](https://github.com/Wandmalfarbe/evangelion-clock-screensaver)，597 stars | EVA 风格数字钟，Normal/Red 两种皮肤；显示时分秒；macOS 屏保内部采用网页渲染 | 2025-06-29，间接依赖 ws 更新 | GitHub v.1.1.2，2022-04-16 | BSD-3-Clause；字体另有条款 | HTML/CSS、JavaScript、SVG；Grunt 构建；Objective-C 屏保外壳。已有正式发行，可抽取网页部分，不能把整个桌面工程直接当网页站点 |

PQINA 最近提交只改授权文本，react-clock 和 EVA 最近提交改依赖，都不代表新增时钟功能。Clock Tab 默认分支已三年多没有新提交，不能把在线可访问视为工程持续维护。上述日期均可通过核验记录中的固定提交与 npm registry 记录复核。

## 值得借鉴的代码

| 项目 | 已核验的代码位置 | 借鉴价值和复用方式 |
| --- | --- | --- |
| FlipClock | [Clock.ts](https://github.com/objectivehtml/FlipClock/blob/a7ff42742912b7dd9b47719fe0ebc2b1b00ccf4b/src/faces/Clock.ts)、[翻页主题](https://github.com/objectivehtml/FlipClock/blob/a7ff42742912b7dd9b47719fe0ebc2b1b00ccf4b/src/themes/flipclock/index.tsx)、[Timer.ts](https://github.com/objectivehtml/FlipClock/blob/a7ff42742912b7dd9b47719fe0ebc2b1b00ccf4b/src/Timer.ts)、[Clock 测试](https://github.com/objectivehtml/FlipClock/blob/a7ff42742912b7dd9b47719fe0ebc2b1b00ccf4b/test/faces/Clock.test.ts) | 借鉴时间数据与视觉主题分离、翻页状态处理，以及停止和卸载生命周期。优先安装固定版本，通过公开 API 接入；不要复制整个工程。当前版依赖 SolidJS，不能沿用早期 jQuery 教程的假设 |
| PQINA Flip | [翻页渲染器](https://github.com/pqina/flip/blob/5ba01ae23451fb15c9e07a30eca69d6126f67628/src/js/index.js)、[布局样式](https://github.com/pqina/flip/blob/5ba01ae23451fb15c9e07a30eca69d6126f67628/src/sass/modules/_layout.scss)、[示例](https://github.com/pqina/flip/blob/5ba01ae23451fb15c9e07a30eca69d6126f67628/example/index.html) | 值得参考上下半卡片、旋转、阴影、初始值处理，以及不可见时跳过绘制。若最终选择它，可用已发布的 1.8.4 产物；不继承旧 Gulp 构建链。翻牌视觉的读屏处理可参考其 README |
| react-clock | [Clock.tsx](https://github.com/wojtekmaj/react-clock/blob/403d393aa5b4d40eeb8128e55d0dc309f6843406/packages/react-clock/src/Clock.tsx)、[Hand.tsx](https://github.com/wojtekmaj/react-clock/blob/403d393aa5b4d40eeb8128e55d0dc309f6843406/packages/react-clock/src/Hand.tsx)、[Clock.css](https://github.com/wojtekmaj/react-clock/blob/403d393aa5b4d40eeb8128e55d0dc309f6843406/packages/react-clock/src/Clock.css) | 借鉴连续指针角度、刻度生成、百分比尺寸与 CSS 定位。若项目已经使用 React，可直接用组件；本主方案先做原生指针钟，避免只为一个表盘加载额外框架。复制或改写其实现时保留授权 |
| Clock Tab | [主题预设](https://github.com/brillout/clocktab/blob/16f270ac91c2bff138df0f02af66848944105077/views/ClockPage/js/PRESETS.js)、[选项定义](https://github.com/brillout/clocktab/blob/16f270ac91c2bff138df0f02af66848944105077/views/ClockPage/js/init_clock_options.js)、[文字尺寸计算](https://github.com/brillout/clocktab/blob/16f270ac91c2bff138df0f02af66848944105077/views/BigText/get_max_font_size.js) | 参考“预设主题与设置分离”、大屏文字自适应和设置信息层级。未发现明确授权，先独立实现这些体验，不复制源码、字体或背景。根 package.json 是指向子模块的符号链接，也不适合当作可直接复用的完整脚手架 |
| EVA Clock | [更新时间脚本](https://github.com/Wandmalfarbe/evangelion-clock-screensaver/blob/5c66f2e92b5a4a14ab83f05462234d60cb9a563c/webview/script.js)、[网页样式](https://github.com/Wandmalfarbe/evangelion-clock-screensaver/blob/5c66f2e92b5a4a14ab83f05462234d60cb9a563c/webview/style.css)、[SVG 皮肤](https://github.com/Wandmalfarbe/evangelion-clock-screensaver/blob/5c66f2e92b5a4a14ab83f05462234d60cb9a563c/webview/svg/style-normal.svg) | 借鉴显示数字更新与 SVG 皮肤分离，以及 Grunt 合成独立 HTML 的思路。网页部分适合作为不同视觉风格的种子作品；不引入 Objective-C/Xcode 外壳。字体先替换为明确允许再分发的字体，并补独立网页的响应式和退出清理 |

三个 MIT 项目及 EVA 的 BSD 3-Clause 代码可按各自授权复用，分发时保留版权、许可与免责声明；BSD 还限制未经许可使用作者或贡献者名称背书。EVA 附带 DS-Digital 字体采用独立 shareware 条款，不能当作 BSD 字体使用，参见 [原项目字体说明](https://github.com/Wandmalfarbe/evangelion-clock-screensaver/blob/5c66f2e92b5a4a14ab83f05462234d60cb9a563c/webview/ds-digital/DIGITAL.TXT)。拟建站自身可采用 MIT，并用 THIRD_PARTY_NOTICES 记录来源和版本；图片、字体授权单独核对。公开仓库本身不等于获得任意复制与分发授权，参见 [GitHub 官方说明](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)。

## 现有时钟的接入

项目目前只有 `fliqlo.html`，39,222 字节。源码已有五种内置主题与自定义配色、五种字体风格、多语言、12/24 小时、秒数开关、日期与周数、设置抽屉、控件自动隐藏、全屏和 Wake Lock。时间来自 `new Date()`，设置存储在 `clk_*` localStorage 键中。

它当前是数字时钟，未实现上下半卡片翻页动画，也没有 URL 配置解析或 postMessage 接口。产品描述应按实际功能标为极简数字钟，新增真正的翻页钟作为另一件作品。

原件保留在项目根目录。构建时按字节复制到 `public/legacy/fliqlo.html`，站点详情页通过“打开时钟”进入它；目录页只用静态缩略图。第一版分享该作品的详情链接，不承诺接收者重现发送者的字体和配色。后续配置分享应在新时钟版本中实现，不通过修改原件或操纵 iframe 内部 DOM 接入。

如后续需要在详情页嵌入原件，只嵌入这类经过审核的自有页面，并配置全屏和 screen-wake-lock 权限。原件依赖 localStorage，不能给它一个会产生不透明源的 sandbox 后仍声称全部设置可用。第三方网页首版采用外链；不统一强行嵌入。相关权限及 sandbox 行为见 [MDN iframe 文档](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe)。

原件仍依赖 Tailwind Play CDN 和 Google Fonts，不能据此承诺离线运行或所有网络环境下字体可用。生产优化时应另建派生版本，采用预编译 CSS 和明确授权的本地字体，保留原文件。Tailwind 官方将 [Play CDN](https://tailwindcss.com/docs/installation/play-cdn) 定位为开发用途。

本次未修改原件。保留校验基线 SHA-256：`0c572fd4814643a979aeb2d6e69914f7be6e2f9130c387971cc2a8e9c8a07b8b`。

## 主方案与首版范围

Astro 负责生成可直接访问的目录、作品详情和分享元数据；TypeScript 负责收藏、搜索、分享与时钟交互。首版数据由仓库内 JSON 提供，浏览器不实时访问 GitHub API，也不存储 GitHub token。这个规模下，静态发布和人工审核足以支撑内容维护。

| 页面 | 核心行为 |
| --- | --- |
| 首页 `/` | 作品卡片、名称和标签搜索、风格筛选、编辑精选和最新收录；卡片有收藏与打开入口 |
| 作品 `/clocks/[id]/` | 大预览、作品说明、作者和来源、许可证、收藏、分享链接、打开时钟 |
| 我的收藏 `/favorites/` | 显示本机收藏；取消收藏；分享当前收藏集合的快照 |
| 分享集合 `/share/` | 读取链接携带的作品 ID，展示只读集合；用户主动选择后可加入自己的收藏 |
| 投稿 `/submit/` | 说明收录标准，链接到 GitHub Issue Form；开发者也可提交 PR |

时钟展示采用独立页。自有原件直接打开其静态副本；新增时钟只在展示页加载对应渲染代码；第三方作品打开原站。首页不同时运行多组计时器或 iframe。

收藏使用稳定作品 ID 和独立命名空间，如 `clock-gallery:fliqlo:favorites:v1`，与原件的 `clk_*` 设置分开。清除浏览器数据、换浏览器或换设备会丢失本机收藏。第一版不展示虚构的全站收藏量或“热门”排序，采用编辑精选和收录时间。

单作品分享生成详情页链接，支持系统分享时调用 Web Share，不支持时提供复制链接。每个详情页预生成标题、说明和 OG 缩略图；分享集合使用通用 OG 图，不承诺静态站能动态生成每个用户的集合卡片。

集合分享可采用 `/share/#v=1&ids=fliqlo,flip-minimal`，只携带稳定 ID，不携带任意 HTML 或脚本。建议首版上限 20 件及 2 KB 链接长度；读取时去重并校验 ID，失效作品显示提示。集合是生成时的快照，后续本机增删不会修改已分享链接。新时钟的配置分享放到后续迭代，使用版本化、白名单参数。

社区投稿进入 GitHub Issue，由维护者审核作品来源、许可证、预览和链接后合入目录。普通访问者分享作品链接不需要 GitHub 账号；通过 GitHub 投稿需要账号。用户提交的 HTML/JS 不经审核自动上线。

## 内容结构与维护

采用一个目录文件即可。每件作品至少记录 `id`、`title`、`description`、`tags`、`preview`、`mode`、`entry`、`sourceUrl`、`author`、`license`、`licenseUrl`、`addedAt`。`mode` 仅区分自有内置、保留原件和第三方外链；ID 一旦发布保持稳定。

建议未来实现的目录结构如下，本次只交付调研文档和证据记录：

```text
fliqlo.html                     保留原件
docs/research-and-design.md      本方案
docs/research-sources.json       核验记录
src/data/clocks.json            作品目录
src/pages/                      首页 详情 收藏 分享 投稿
src/clocks/                     新增时钟渲染代码
src/scripts/                    收藏 搜索 分享
public/previews/                静态预览
public/legacy/fliqlo.html        构建生成的原件副本
scripts/copy-legacy.mjs          复制并校验原件
.github/ISSUE_TEMPLATE/          投稿表单
.github/workflows/              校验 构建 发布
```

PR 校验目录字段、唯一 ID、资源路径和许可证标记；构建成功后由主分支发布。锁定依赖版本并保留 lockfile，新增第三方代码附授权文本。README 写清开发、构建、收录和来源规则。

GitHub 项目页通常带仓库路径，例如 `/fliqlo/`。配置 `site` 和 `base`，所有详情链接、图片、分享链接与原件副本路径都使用同一 base；详情页在构建时生成，支持直接打开和刷新。部署步骤遵循 [Astro 官方 GitHub Pages 指南](https://docs.astro.build/en/guides/deploy/github/)。

## 界面设计

界面以时钟作品为视觉中心：深色中性背景、留白和统一卡片，不叠加大面积装饰效果。桌面约三列，平板两列，窄屏一列；缩略图统一 16:10。导航保持“探索、我的收藏、投稿、GitHub”四个入口，详情页主操作是“打开时钟”，收藏和分享为次操作。

建议初始色彩为背景 `#0B0D10`、卡片 `#171A20`、正文 `#F5F7FA`、次要正文 `#B6BEC9`、强调 `#7DD3FC`。采用系统字体降低加载成本，数字使用等宽或 tabular-nums。正文至少 16px，交互区域至少 44px，保留清晰的键盘焦点，收藏按钮提供名称和状态。配色上线前实际检查对比度。

卡片显示名称、两三个标签和明确的打开/收藏按钮，避免把多个操作嵌入同一个链接。播放页沉浸展示，控件在键盘焦点、设置打开时保持可见，Esc 可退出设置和全屏。尊重 `prefers-reduced-motion`；隐藏翻牌重复内容，提供可读时间文本，不让读屏每秒播报。

新时钟读取真实系统时间，而不是每次回调累加一秒；页面恢复可见时立即重新取时。每次离开时清理计时器、动画和监听器。Wake Lock 只在用户选择常亮后请求，实际状态清楚显示，失效时允许继续正常看钟。它受 HTTPS、页面可见性、设备和浏览器策略限制，不能保证后台运行或永久常亮，见 [MDN Wake Lock 文档](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)。

## 实施顺序与验收

1. 搭建目录和原件入口。验收：原件哈希不变；手机可浏览；每个详情链接直接打开与刷新均正常；子路径发布后资源无 404。
2. 完成收藏、分享和投稿入口。验收：收藏刷新后保留；另一浏览器打开单作品和集合链接得到同一作品集合；导入分享集合需用户主动操作；未知 ID 有明确提示；投稿说明与 GitHub 表单可达。
3. 增加新的翻页钟和指针钟。验收：12/24 小时、跨午夜、隐藏页面恢复、退出清理、键盘和减少动画均正常；全屏/常亮按实际支持情况反馈；第三方授权记录完整。

第一版内容可从原有数字钟、新翻页钟、极简指针钟和少量经过筛选的外链开始。增加可辨认的风格比引入大量重复翻页实现更有价值。倒计时、账号、评论和排行按后续需求进入迭代。

如果首版必须跨设备同步，保留 Astro 前端和 Git 维护目录，另接 Supabase Auth/Postgres：使用 `favorites(user_id, clock_id, created_at)`、唯一约束与按用户隔离的 RLS。浏览器仅使用公开客户端配置，service role 留在服务端；公开集合另设集合与条目表，由用户显式发布。这样需要认证、迁移、权限和备份测试，发布成本明显高于本机收藏。当前没有收到必须首版同步的要求，因此主方案采用静态版本。

## 交付范围

本次完成五项目比较、关键源码审阅、许可证核验和站点方案，保存到指定项目的 `docs/`。未创建站点代码、GitHub 仓库或发布部署。文档核验包括来源字段、固定提交路径、正式包版本与原件 SHA-256；实际依赖兼容性、布局、运行性能和浏览器行为在实现阶段按上述验收标准验证。

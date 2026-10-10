import { build } from 'esbuild';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { clockFaceMarkup } from '../src/lib/clock-faces.mjs';

const clocks = JSON.parse(await readFile('src/data/clocks.json', 'utf8'));
const sources = JSON.parse(await readFile('src/data/clock-sources.json', 'utf8'));
const fonts = JSON.parse(await readFile('src/data/clock-fonts.json', 'utf8'));
const fontRules = [];
for (const font of fonts) {
  const bytes = await readFile(`public/assets/fonts/${font.file}`);
  if (createHash('sha256').update(bytes).digest('hex') !== font.sha256) throw new Error(`Font changed: ${font.file}`);
  const rule = url => `@font-face{font-family:'${font.id}';src:url('${url}') format('${font.format}');font-weight:${font.weight};font-display:swap}`;
  fontRules.push({ ...font, inline: rule(`data:font/${font.format === 'truetype' ? 'ttf' : font.format};base64,${bytes.toString('base64')}`), site: rule(`fonts/${font.file}`) });
}
await writeFile('public/assets/clock-fonts.css', fontRules.map(font => font.site).join('\n'));
const languages = JSON.parse(await readFile('src/data/languages.json', 'utf8'));
const languageOptions = Object.entries(languages).map(([locale, copy]) => `<option value="${locale}">${copy.label}</option>`).join('');
const original = await readFile('fliqlo.html');
const originalHash = '0c572fd4814643a979aeb2d6e69914f7be6e2f9130c387971cc2a8e9c8a07b8b';
if (createHash('sha256').update(original).digest('hex') !== originalHash) throw new Error('Original fliqlo.html changed.');
await mkdir('public/standalone', { recursive: true });
await mkdir('public/legacy', { recursive: true });
await copyFile('fliqlo.html', 'public/legacy/fliqlo.html');
const runtimes = {};
for (const useFlip of [false, true]) {
  const bundle = await build({ entryPoints: ['src/scripts/clock-runtime.ts'], bundle: true, write: false, format: 'iife', platform: 'browser', minify: true, legalComments: 'inline', target: 'es2022', define: { FLIP_CLOCK: String(useFlip) } });
  runtimes[String(useFlip)] = bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
}
const backgroundCss = await readFile('src/styles/background.css', 'utf8');
const css = await readFile('src/styles/standalone.css', 'utf8') + backgroundCss;
const facesCss = await readFile('src/styles/clock-faces.css', 'utf8');
const nixieCss = await readFile('src/styles/nixie.css', 'utf8');
const nixieMarkup = await readFile('src/lib/nixie-markup.html', 'utf8');
const originalBundle = await build({ entryPoints: ['src/scripts/original-background.ts'], bundle: true, write: false, format: 'iife', platform: 'browser', minify: true, target: 'es2022' });
const originalRuntime = originalBundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const enhancedOriginal = original.toString('utf8').replace('</head>', `<style>${backgroundCss}</style></head>`).replace('</body>', `<script>${originalRuntime}</script></body>`);
await writeFile('public/standalone/fliqlo.html', enhancedOriginal);
const flipCss = await readFile('node_modules/flipclock/dist/themes/flipclock.css', 'utf8');
const dependencies = ['flipclock', 'date-fns', 'goober', 'solid-js'];
let notices = 'Third-party licenses bundled in Classic Flip\n';
for (const dependency of dependencies) {
  const names = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license.txt', 'LICENSE.MIT'];
  let license;
  for (const name of names) { try { license = await readFile(`node_modules/${dependency}/${name}`, 'utf8'); break; } catch {} }
  if (!license) throw new Error(`Missing license for ${dependency}`);
  notices += `\n--- ${dependency} ---\n${license}\n`;
}
let allNotices = notices;
for (const source of [...sources, ...fonts]) allNotices += `\n--- ${source.repository || source.id} ---\n${await readFile(source.license, 'utf8')}\n`;
await writeFile('public/standalone/THIRD_PARTY_LICENSES.txt', allNotices.trimEnd() + '\n');
const ownLicense = await readFile('LICENSE', 'utf8');
const analog = `<svg viewBox="0 0 240 240" width="100%" aria-hidden="true"><circle cx="120" cy="120" r="106" class="dial-edge"/>${Array.from({ length: 60 }, (_, i) => `<line x1="120" y1="${i % 5 === 0 ? 23 : 27}" x2="120" y2="32" transform="rotate(${i * 6} 120 120)" class="dial-tick ${i % 5 === 0 ? 'dial-major' : ''}"/>`).join('')}<line id="hour-hand" x1="120" y1="120" x2="120" y2="66" class="hand-hour"/><line id="minute-hand" x1="120" y1="120" x2="120" y2="43" class="hand-minute"/><line id="second-hand" x1="120" y1="140" x2="120" y2="35" class="hand-second"/><circle cx="120" cy="120" r="4" fill="#e5ab7b"/></svg>`;
for (const clock of clocks.filter(clock => clock.offline)) {
  const runtime = runtimes[String(clock.id === 'flip-minimal')];
  const clockFonts = fontRules.filter(font => font.clocks.includes(clock.id));
  const clockSources = sources.filter(source => source.clocks.includes(clock.id));
  let clockNotices = clock.id === 'flip-minimal' ? notices : '';
  for (const source of [...clockSources, ...clockFonts]) clockNotices += `\n--- ${source.repository || source.id} ---\n${await readFile(source.license, 'utf8')}\n`;
  const face = clock.id === 'orbit' ? analog : clock.id === 'nixie' ? nixieMarkup : clockFaceMarkup(clock.id);
  const faceCss = clockSources.length ? facesCss + (clock.id === 'nixie' ? nixieCss : '') + clockFonts.map(font => font.inline).join('') : '';
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#111714"><title>${clock.name} — Still 时刻</title><meta name="description" content="${clock.description}"><style>${clock.id === 'flip-minimal' ? flipCss : ''}${css}${faceCss}</style></head><body class="clock-${clock.id}" data-clock="${clock.id}" data-name="${clock.name}"><main class="clock-stage"><h1 id="clock-name" class="clock-name">${clock.name.toUpperCase()} / ${clock.subtitle}</h1><div id="clock" class="clock-display" role="img">${face}</div><span id="period"></span><div id="date"></div>${clock.id === 'terminal' ? '<div id="timezone"></div>' : ''}<span id="readable-time" class="sr-only"></span></main><footer id="clock-controls" class="clock-controls"><p id="status" role="status"></p><div id="clock-toolbar" class="clock-toolbar" role="group" aria-label="时钟设置"><select id="language" aria-label="语言">${languageOptions}</select><button id="format" aria-pressed="true">24 小时</button><button id="seconds" aria-pressed="true">显示秒：开</button><button id="wake" aria-pressed="false">屏幕常亮：关</button><button id="background-open" type="button">背景</button><button id="fullscreen" aria-pressed="false">全屏</button></div></footer><noscript>请启用 JavaScript 来运行时钟。</noscript><script>${runtime}</script></body></html>`;
  await writeFile(`public/standalone/${clock.id}.html`, html.replace('</body>', `<!-- ${clockNotices.replace(/--/g, '—')}\n${ownLicense.replace(/--/g, '—')} --></body>`));
}
console.log(`Built ${clocks.filter(clock => clock.offline).length} offline HTML clocks and enhanced original; original preserved.`);

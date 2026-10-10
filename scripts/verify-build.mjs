import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const hash = data => createHash('sha256').update(data).digest('hex');
assert.equal(hash(await readFile('fliqlo.html')), hash(await readFile('dist/legacy/fliqlo.html')), 'Original must be byte-identical.');
const clocks = JSON.parse(await readFile('src/data/clocks.json', 'utf8'));
for (const route of ['index.html', 'favorites/index.html', 'share/index.html', 'submit/index.html', '404.html']) await access(`dist/${route}`);
for (const clock of clocks) {
  await access(`dist/clocks/${clock.id}/index.html`);
  const html = await readFile(`dist/standalone/${clock.id}.html`, 'utf8');
  assert(html.includes('background-open') && html.includes('background-dialog'), `${clock.id} is missing background controls.`);
  if (!clock.offline) continue;
  assert(!/<(?:script|link|img|iframe)[^>]+(?:src|href)\s*=\s*["'][^"']+/i.test(html), `${clock.id} has an external resource.`);
  assert(!/\bimport\s*\(/.test(html), `${clock.id} has a runtime import.`);
  assert(html.includes('id="clock"'));
}
const homepage = await readFile('dist/index.html', 'utf8');
assert(homepage.includes('/fliqlo/assets/logo.png'), 'Pages base path missing.');
console.log('Verified routes, self-contained HTML, base paths, and original file integrity.');

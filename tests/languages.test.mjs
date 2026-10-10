import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const site = JSON.parse(await readFile(new URL('../src/data/site-languages.json', import.meta.url), 'utf8'));
const clocks = JSON.parse(await readFile(new URL('../src/data/languages.json', import.meta.url), 'utf8'));
const catalogue = JSON.parse(await readFile(new URL('../src/data/clocks.json', import.meta.url), 'utf8'));

test('all seven site languages cover every message and retain substitution fields', () => {
  assert.deepEqual(Object.keys(site).sort(), Object.keys(clocks).sort());
  assert.equal(Object.keys(site).length, 7);
  const fields = text => [...text.matchAll(/\{\w+\}/g)].map(match => match[0]).sort();
  for (const [locale, messages] of Object.entries(site)) {
    assert.deepEqual(Object.keys(messages).sort(), Object.keys(site['zh-CN']).sort(), locale);
    for (const [key, value] of Object.entries(messages)) {
      assert.equal(typeof value, 'string', `${locale}: ${key}`);
      assert(value.trim(), `${locale}: ${key}`);
      assert.deepEqual(fields(value), fields(site['zh-CN'][key]), `${locale}: ${key}`);
    }
  }
});

test('background controls and feedback cover all seven clock languages', () => {
  const keys = Object.keys(clocks['zh-CN'].background).sort();
  for (const [locale, copy] of Object.entries(clocks)) {
    assert.deepEqual(Object.keys(copy.background).sort(), keys, locale);
    for (const [key, value] of Object.entries(copy.background)) assert(value.trim(), `${locale}: background.${key}`);
  }
});

test('every catalogue clock has descriptions and offline titles in all languages', () => {
  for (const [locale, copy] of Object.entries(clocks)) {
    for (const clock of catalogue) {
      assert(site[locale][`clock.description.${clock.id}`]?.trim(), `${locale}: ${clock.id} description`);
      if (clock.offline) assert(copy.subtitles[clock.id]?.trim(), `${locale}: ${clock.id} subtitle`);
    }
  }
});

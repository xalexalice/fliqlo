import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseFavorites, parseShareHash, createShareHash } from '../src/lib/collection.mjs';
import { timeParts } from '../src/lib/time.mjs';
const catalogue = JSON.parse(await readFile(new URL('../src/data/clocks.json', import.meta.url), 'utf8'));

test('corrupt or stale favourites cannot add unknown IDs', () => {
  assert.deepEqual(parseFavorites('{broken', catalogue), []);
  assert.deepEqual(parseFavorites('{"id":"orbit"}', catalogue), []);
  assert.deepEqual(parseFavorites('["orbit","deleted",null,"orbit"]', catalogue), ['orbit']);
});
test('collection snapshot round trips without changing its order', () => {
  const hash = createShareHash(['mono', 'orbit', 'mono']);
  assert.deepEqual(parseShareHash(hash, catalogue), { ids: ['mono', 'orbit'], missing: [], error: '' });
});
test('stale shares retain available clocks and report unavailable ones', () => {
  assert.deepEqual(parseShareHash('#v=1&ids=removed,orbit', catalogue), { ids: ['orbit'], missing: ['removed'], error: '' });
});
test('unsupported, oversized, and malformed shares are rejected', () => {
  for (const hash of ['#v=2&ids=orbit', '#v=1&ids=', '#v=1&ids=%3Cscript%3E', '#v=1&ids=' + Array.from({ length: 21 }, (_, i) => 'id' + i).join(','), '#' + 'a'.repeat(2048)]) assert(parseShareHash(hash, catalogue).error);
  assert.throws(() => createShareHash([]));
  assert.throws(() => createShareHash(['<script>']));
  assert.throws(() => createShareHash(Array.from({ length: 21 }, (_, i) => `id-${i}`)));
});
test('midnight, noon, and analog fractional angles use device local time', () => {
  const midnight = timeParts(new Date(2026, 9, 9, 0, 0, 0), false);
  assert.equal(midnight.hours, '12'); assert.equal(midnight.period, 'AM');
  const noon = timeParts(new Date(2026, 9, 9, 12, 0, 0), false);
  assert.equal(noon.hours, '12'); assert.equal(noon.period, 'PM');
  const afternoon = timeParts(new Date(2026, 9, 9, 15, 30, 30));
  assert.equal(afternoon.hours, '15'); assert.equal(afternoon.hourAngle, 105); assert.equal(afternoon.minuteAngle, 183); assert.equal(afternoon.secondAngle, 180);
});

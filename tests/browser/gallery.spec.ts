import catalogue from '../../src/data/clocks.json' with { type: 'json' };
import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

test('search, categories, empty state, favourites, share and explicit import', async ({ page, context }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('[data-clock-id]:visible')).toHaveCount(14);
  await page.getByRole('button', { name: '指针', exact: true }).click();
  await expect(page.locator('[data-clock-id]:visible')).toHaveCount(5);
  await page.getByRole('button', { name: '全部', exact: true }).click();
  await page.getByRole('searchbox').fill('NOT-A-CLOCK');
  await expect(page.locator('#empty-state')).toBeVisible();
  await page.getByRole('button', { name: '查看全部时钟' }).click();
  await page.getByRole('searchbox').fill('浅色');
  await expect(page.locator('[data-clock-id]:visible')).toHaveCount(5);
  await page.getByRole('searchbox').fill('');
  await page.getByRole('button', { name: '收藏 Orbit', exact: true }).click();
  await page.getByRole('button', { name: '收藏 Classic Flip', exact: true }).click();
  await page.getByRole('navigation').getByRole('link', { name: '我的收藏', exact: false }).click();
  await expect(page.locator('[data-clock-id]:visible')).toHaveCount(2);
  await page.reload();
  await expect(page.locator('[data-clock-id]:visible')).toHaveCount(2);
  await page.getByRole('button', { name: '分享收藏' }).click();
  const url = await page.locator('#share-url').inputValue();
  expect(url).toContain('#v=1&ids=orbit,flip-minimal');
  const other = await context.browser()!.newContext();
  const recipient = await other.newPage();
  await recipient.goto(url);
  await expect(recipient.locator('[data-clock-id]:visible')).toHaveCount(2);
  expect(await recipient.evaluate(() => localStorage.getItem('clock-gallery:fliqlo:favorites:v1'))).toBeNull();
  await recipient.getByRole('button', { name: '导入我的收藏' }).click();
  await recipient.getByRole('navigation').getByRole('link', { name: '我的收藏', exact: false }).click();
  await expect(recipient.locator('[data-clock-id]:visible')).toHaveCount(2);
  await other.close();
  expect(errors).toEqual([]);
});

test('invalid and stale collection links stay safe and show useful messages', async ({ page }) => {
  await page.goto('share/#v=1&ids=orbit,missing');
  await expect(page.locator('[data-clock-id]:visible')).toHaveCount(1);
  await expect(page.locator('#share-message')).toContainText('missing');
  await page.goto('share/#v=1&ids=%3Cscript%3E');
  await expect(page.locator('#share-message')).toContainText('无效');
  await expect(page.locator('#import-collection')).toBeHidden();
});

test('HTML download preserves the original bytes', async ({ page }) => {
  await page.goto('clocks/fliqlo/');
  const pending = page.waitForEvent('download');
  await page.getByRole('link', { name: '原始 HTML', exact: true }).click();
  const download = await pending;
  const downloaded = await readFile((await download.path())!);
  const original = await readFile('fliqlo.html');
  expect(createHash('sha256').update(downloaded).digest('hex')).toBe(createHash('sha256').update(original).digest('hex'));
  const enhancedPending = page.waitForEvent('download');
  await page.getByRole('link', { name: 'HTML', exact: true }).click();
  const enhanced = await enhancedPending;
  expect(await readFile((await enhanced.path())!)).toEqual(await readFile('dist/standalone/fliqlo.html'));
});

for (const id of catalogue.filter(clock => clock.offline).map(clock => clock.id)) {
  test(`${id} runs as an offline local HTML and resynchronizes after a clock change`, async ({ page, context }) => {
    const external: string[] = [], errors: string[] = [];
    page.on('request', request => { if (/^https?:/.test(request.url())) external.push(request.url()); });
    page.on('pageerror', error => errors.push(error.message));
    await context.setOffline(true);
    await page.clock.install({ time: new Date('2026-10-09T01:24:08Z') });
    await page.goto(pathToFileURL(resolve(`dist/standalone/${id}.html`)).href);
    await expect(page.locator('#readable-time')).toHaveText('09:24:08');
    if (id === 'flip-minimal') await expect(page.locator('.flip-clock-card')).toHaveCount(6);
    if (id === 'orbit') await expect(page.locator('#hour-hand')).toHaveAttribute('transform', 'rotate(282 120 120)');
    await page.clock.setSystemTime(new Date('2026-10-09T06:00:01Z'));
    await page.clock.runFor(1100);
    await expect(page.locator('#readable-time')).toHaveText('14:00:02');
    if (!['orbit', 'station', 'neumorphic', 'roman', 'chronograph'].includes(id)) { await page.locator('#format').click(); await expect(page.locator('#readable-time')).toHaveText('02:00:02 PM'); }
    await page.locator('#seconds').click();
    await expect(page.locator('#readable-time')).toHaveText(['orbit', 'station', 'neumorphic', 'roman', 'chronograph'].includes(id) ? '14:00' : '02:00 PM');
    if (id === 'flip-minimal') await expect(page.locator('.flip-clock-card')).toHaveCount(4);
    await page.getByRole('button', { name: '全屏', exact: true }).click();
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
    await page.getByRole('button', { name: '退出全屏' }).click();
    expect(external).toEqual([]); expect(errors).toEqual([]);
  });
}

test('mobile routes have no horizontal overflow and retain keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['./', 'clocks/flip-minimal/', 'favorites/', 'share/#v=1&ids=orbit', 'submit/']) {
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
  }
  await page.goto('./');
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  await page.goto(pathToFileURL(resolve('dist/standalone/flip-minimal.html')).href);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/flip-mobile.png' });
});

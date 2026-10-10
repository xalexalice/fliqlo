import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const locales = [
  ['zh-CN', '全屏', '显示秒：开', '星期五'],
  ['en-US', 'Fullscreen', 'Seconds: on', 'Friday'],
  ['ja-JP', '全画面', '秒表示：オン', '金曜日'],
  ['ko-KR', '전체 화면', '초 표시: 켜짐', '금요일'],
  ['fr-FR', 'Plein écran', 'Secondes : oui', 'vendredi'],
  ['de-DE', 'Vollbild', 'Sekunden: an', 'Freitag'],
  ['es-ES', 'Pantalla completa', 'Segundos: sí', 'viernes'],
];

test('both clock shortcuts also appear below the gallery and open their HTML pages', async ({ page }) => {
  await page.goto('./');
  const links = page.getByRole('navigation', { name: '时钟直达入口' });
  const grid = await page.locator('#clock-grid').boundingBox();
  const shortcuts = await links.boundingBox();
  expect(shortcuts!.y).toBeGreaterThanOrEqual(grid!.y + grid!.height);
  for (const [name, route] of [['独立翻页时钟', 'standalone/flip-minimal.html'], ['原版时钟', 'legacy/fliqlo.html']]) {
    const popupPromise = page.waitForEvent('popup');
    await links.getByRole('link', { name, exact: true }).click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(new RegExp(route.replace('.', '\\.')));
    await popup.close();
  }
  await page.getByRole('searchbox').fill('not-a-clock');
  await expect(links.getByRole('link')).toHaveCount(2);
});

for (const id of ['flip-minimal', 'orbit', 'mono', 'dawn', 'terminal']) {
  test(`${id}: seven languages persist in offline HTML, including dates and fullscreen labels`, async ({ page, context }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await context.setOffline(true);
    await page.clock.install({ time: new Date('2026-10-09T01:24:08Z') });
    await page.goto(pathToFileURL(resolve(`dist/standalone/${id}.html`)).href);
    await expect(page.locator('#language option')).toHaveCount(7);
    for (const [locale, fullscreen, seconds, weekday] of locales) {
      await page.locator('#language').selectOption(locale);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('#fullscreen')).toHaveText(fullscreen);
      await expect(page.locator('#seconds')).toHaveText(seconds);
      await expect(page.locator('#date')).toContainText(weekday);
      if (locale !== 'zh-CN') await expect(page.locator('#clock-name')).not.toContainText(/[\u4e00-\u9fff]{3,}/);
    }
    await page.locator('#language').selectOption('en-US');
    await page.locator('#fullscreen').click();
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
    await expect(page.locator('#fullscreen')).toHaveText('Exit fullscreen');
    await page.locator('#fullscreen').click();
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
    await page.reload();
    await expect(page.locator('#language')).toHaveValue('en-US');
    await expect(page.locator('#date')).toContainText('Friday');
    expect(errors).toEqual([]);
  });

  test(`${id}: idle controls hide without shifting the clock and wake for mouse, touch and keyboard`, async ({ page, context }) => {
    await context.setOffline(true);
    await page.clock.install({ time: new Date('2026-10-09T01:24:08Z') });
    await page.goto(pathToFileURL(resolve(`dist/standalone/${id}.html`)).href);
    const clockBefore = await page.locator('#clock').boundingBox();
    await page.clock.runFor(3500);
    await expect(page.locator('body')).toHaveClass(/is-idle/);
    await expect(page.locator('#clock-controls')).toHaveCSS('opacity', '0');
    await expect(page.locator('#clock-name')).toHaveCSS('opacity', '0');
    const clockAfter = await page.locator('#clock').boundingBox();
    expect(clockAfter!.y).toBe(clockBefore!.y);
    expect(clockAfter!.height).toBe(clockBefore!.height);
    expect(clockAfter!.x + clockAfter!.width / 2).toBeCloseTo(clockBefore!.x + clockBefore!.width / 2, 1);
    await page.mouse.move(10, 10);
    await expect(page.locator('body')).not.toHaveClass(/is-idle/);
    await expect(page.locator('#clock-name')).toHaveCSS('opacity', '1');
    await page.clock.runFor(3500);
    await page.dispatchEvent('body', 'touchstart');
    await expect(page.locator('body')).not.toHaveClass(/is-idle/);
    await expect(page.locator('#clock-name')).toHaveCSS('opacity', '1');
    await page.clock.runFor(3500);
    await page.keyboard.press('Tab');
    await expect(page.locator('#language')).toBeFocused();
    await page.clock.runFor(4000);
    await expect(page.locator('body')).not.toHaveClass(/is-idle/);
    await expect(page.locator('#clock-name')).toHaveCSS('opacity', '1');
    await page.locator('#clock').click();
    await page.locator('#fullscreen').click();
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
    await page.clock.runFor(3500);
    await expect(page.locator('body')).toHaveClass(/is-idle/);
    await expect(page.locator('#clock-name')).toHaveCSS('opacity', '0');
    await page.keyboard.press('f');
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
    await expect(page.locator('body')).not.toHaveClass(/is-idle/);
    await expect(page.locator('#clock-name')).toHaveCSS('opacity', '1');
  });
}

test('all languages fit on small screens', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  for (const id of ['flip-minimal', 'orbit', 'mono', 'dawn', 'terminal']) {
    await page.goto(pathToFileURL(resolve(`dist/standalone/${id}.html`)).href);
    for (const [locale] of locales) {
      await page.locator('#language').selectOption(locale);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});

test('fullscreen failure messages follow the selected language', async ({ page }) => {
  await page.addInitScript(() => { Element.prototype.requestFullscreen = () => Promise.reject(new Error('Blocked')); });
  await page.goto(pathToFileURL(resolve('dist/standalone/mono.html')).href);
  await page.locator('#language').selectOption('en-US');
  await page.locator('#fullscreen').click();
  await expect(page.locator('#status')).toContainText('Fullscreen was blocked');
  await page.locator('#language').selectOption('zh-CN');
  await expect(page.locator('#status')).toContainText('浏览器未允许全屏');
});

test('original retains its seven languages, idle toolbar and fullscreen', async ({ page }) => {
  // External styles are unnecessary for these original script behaviour checks.
  await page.route(/^https:\/\/(?:cdn\.tailwindcss\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)/, route => route.abort());
  await page.clock.install({ time: new Date('2026-10-09T01:24:08Z') });
  await page.goto('legacy/fliqlo.html');
  await expect(page.locator('#select-lang option')).toHaveCount(7);
  await page.clock.runFor(3500);
  await expect(page.locator('#control-bar')).toHaveClass(/hidden-state/);
  await page.mouse.move(10, 10);
  await expect(page.locator('#control-bar')).not.toHaveClass(/hidden-state/);
  await page.evaluate(() => document.querySelector<HTMLButtonElement>('#btn-open-settings')!.click());
  for (const [locale, , , weekday] of locales) {
    await page.locator('#select-lang').selectOption(locale, { force: true });
    await expect(page.locator('#date-weekday')).toContainText(new RegExp(weekday, 'i'));
  }
  await page.evaluate(() => document.querySelector<HTMLButtonElement>('#btn-close-settings')!.click());
  await page.locator('#select-lang').evaluate(select => (select as HTMLSelectElement).blur());
  await page.keyboard.press('f');
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await page.keyboard.press('f');
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
});

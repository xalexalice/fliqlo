import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

test('Nixie keeps all six tubes on one row on wide, short and portrait screens', async ({ page, context }) => {
  await context.setOffline(true);
  await page.clock.install({ time: new Date('2026-10-11T09:24:08+08:00') });
  await page.clock.pauseAt(new Date('2026-10-11T09:24:08+08:00'));
  await page.goto(pathToFileURL(resolve('dist/standalone/nixie.html')).href);
  for (const [width, height] of [[1440, 900], [1024, 600], [812, 375], [667, 375], [375, 667], [320, 568]]) {
    await page.setViewportSize({ width, height });
    const tubes = await page.locator('.nixie-tube:visible').evaluateAll(tubes => tubes.map(tube => {
      const { x, y, width, height } = tube.getBoundingClientRect();
      return { x, y, width, height };
    }));
    expect(tubes).toHaveLength(6);
    tubes.forEach((tube, index) => {
      expect(tube.y, `${width}×${height}`).toBeCloseTo(tubes[0].y, 3);
      expect(tube.x).toBeGreaterThanOrEqual(0);
      expect(tube.x + tube.width).toBeLessThanOrEqual(width);
      if (index) expect(tube.x).toBeGreaterThan(tubes[index - 1].x + tubes[index - 1].width);
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(height);
  }
  expect(await page.locator('[data-nixie-digit]:not(.nixie-glow)').allTextContents()).toEqual(['0', '9', '2', '4', '0', '8']);
  await page.locator('#seconds').click();
  await expect(page.locator('.nixie-tube:visible')).toHaveCount(4);
  await expect(page.locator('.nixie-colon:visible')).toHaveCount(1);
  await page.locator('#format').click();
  await page.clock.setSystemTime(new Date('2026-10-11T14:24:08+08:00'));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(await page.locator('[data-nixie-digit]:not(.nixie-glow):visible').allTextContents()).toEqual(['0', '2', '2', '4']);
});

test('Nixie gallery and detail previews also show six horizontal tubes', async ({ page }) => {
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['./', './clocks/nixie/']) {
      await page.goto(route);
      const tubes = await page.locator('.nixie-tube').evaluateAll(tubes => tubes.map(tube => tube.getBoundingClientRect().y));
      expect(tubes).toHaveLength(6);
      tubes.forEach(y => expect(y).toBeCloseTo(tubes[0], 3));
    }
  }
});

test('gallery controls have touch targets, visible keyboard focus and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  for (const selector of ['.filter-tab', '.favorite-button', '.card-launch', '#site-language', '.footer-links a']) {
    for (const control of await page.locator(selector).all()) {
      const box = (await control.boundingBox())!;
      expect(box.height, selector).toBeGreaterThanOrEqual(44);
    }
  }
  await page.keyboard.press('Tab');
  expect(await page.locator('.skip-link').evaluate(link => getComputedStyle(link).outlineStyle)).not.toBe('none');
  expect(await page.locator('.hero-copy').evaluate(hero => hero.getAnimations().length)).toBe(0);
  await page.locator('[data-favorite="nixie"]').click();
  await expect(page.locator('[data-favorite="nixie"]')).toHaveAttribute('aria-pressed', 'true');
});

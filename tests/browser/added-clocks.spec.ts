import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const analog = ['station', 'neumorphic', 'roman', 'chronograph'];
const added = [...analog, 'aura', 'rolling', 'bubble', 'nixie'];
for (const id of added) {
  test(`${id}: the visible face follows device time and seconds settings offline`, async ({ page, context }) => {
    await context.setOffline(true);
    await page.clock.install({ time: new Date('2026-10-09T01:24:08Z') });
    await page.goto(pathToFileURL(resolve(`dist/standalone/${id}.html`)).href);
    if (analog.includes(id)) {
      expect(await page.locator('[data-hand="hour"]').evaluate(hand => (hand as SVGGraphicsElement).transform.baseVal.getItem(0).angle)).toBeCloseTo(282 + 8 / 120, 3);
      await expect(page.locator('[data-hand="second"]')).toHaveAttribute('transform', 'rotate(48 120 120)');
      await expect(page.locator('#format')).toBeHidden();
    } else if (id === 'aura') {
      await expect(page.locator('[data-face-time]')).toHaveText('09:24:08');
      await page.locator('#language').selectOption('en-US');
      await expect(page.locator('[data-face-weekday]')).toHaveText('Friday');
    } else if (id === 'rolling') {
      expect(await page.locator('[data-digit]').evaluateAll(cells => cells.map(cell => (cell as HTMLElement).dataset.value).join(''))).toBe('092408');
    } else if (id === 'bubble') {
      expect(await page.locator('[data-bubble-digit]').allTextContents()).toEqual(['0', '9', '2', '4']);
      await expect(page.locator('[data-bubble-seconds]')).toHaveText('08');
    } else {
      await expect(page.locator('[data-nixie-digit="0"]')).toHaveText(['0', '0']);
      await expect(page.locator('[data-nixie-digit="4"]')).toHaveText(['0', '0']);
    }
    await page.clock.setSystemTime(new Date('2026-10-09T06:00:01Z'));
    await page.clock.runFor(1100);
    if (analog.includes(id)) expect(await page.locator('[data-hand="hour"]').evaluate(hand => (hand as SVGGraphicsElement).transform.baseVal.getItem(0).angle)).toBeCloseTo(60 + 2 / 120, 3);
    else if (id === 'aura') await expect(page.locator('[data-face-time]')).toHaveText('14:00:02');
    else if (id === 'rolling') expect(await page.locator('[data-digit]').evaluateAll(cells => cells.map(cell => (cell as HTMLElement).dataset.value).join(''))).toBe('140002');
    else if (id === 'bubble') expect(await page.locator('[data-bubble-digit]').allTextContents()).toEqual(['1', '4', '0', '0']);
    else await expect(page.locator('[data-nixie-digit="1"]')).toHaveText(['4', '4']);
    await page.locator('#seconds').click();
    if (analog.includes(id)) await expect(page.locator('[data-hand="second"]')).toBeHidden();
    else if (id === 'aura') await expect(page.locator('[data-face-time]')).toHaveText('14:00');
    else if (id === 'rolling') await expect(page.locator('[data-digit]:visible')).toHaveCount(4);
    else if (id === 'bubble') await expect(page.locator('[data-bubble-seconds]')).toBeHidden();
    else await expect(page.locator('.small-row')).toBeHidden();
    const font = { aura: "700 32px 'Space Mono'", rolling: "400 32px 'Victor Mono'", bubble: '500 32px Fredoka', nixie: '400 32px DSEG7' }[id];
    if (font) {
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(font => document.fonts.check(font), font)).toBe(true);
    }
  });
}

test('rolling animation respects reduced motion and mobile landscape stays inside the viewport', async ({ page, context }) => {
  await context.setOffline(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date('2026-10-09T01:24:08Z') });
  await page.goto(pathToFileURL(resolve('dist/standalone/rolling.html')).href);
  expect(await page.locator('.face-rolling').evaluate(face => face.getAnimations({ subtree: true }).length)).toBe(0);
  await page.setViewportSize({ width: 812, height: 375 });
  for (const id of added) {
    await page.goto(pathToFileURL(resolve(`dist/standalone/${id}.html`)).href);
    const face = await page.locator('#clock').boundingBox();
    expect(face!.x).toBeGreaterThanOrEqual(0);
    expect(face!.x + face!.width).toBeLessThanOrEqual(812);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('new gallery previews fit their cards at desktop and mobile sizes', async ({ page }) => {
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    await page.evaluate(() => document.fonts.ready);
    for (const id of added) {
      const preview = page.locator(`.preview-${id}`);
      const frame = await preview.boundingBox();
      const face = await preview.locator('.face-analog, .face-aura, .face-rolling, .face-bubble, .nixie-face').boundingBox();
      expect(face!.x, id).toBeGreaterThanOrEqual(frame!.x - 1);
      expect(face!.x + face!.width, id).toBeLessThanOrEqual(frame!.x + frame!.width + 1);
      expect(face!.height, id).toBeLessThanOrEqual(frame!.height + 1);
    }
  }
});

test('Roman numerals leave a clear gap before the major dial ticks', async ({ page, context }) => {
  await context.setOffline(true);
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(pathToFileURL(resolve('dist/standalone/roman.html')).href);
    const numbers = page.locator('.face-roman .face-number');
    const ticks = page.locator('.face-roman .face-major');
    const rightNumber = await numbers.nth(3).boundingBox();
    const rightTick = await ticks.nth(3).boundingBox();
    const leftNumber = await numbers.nth(9).boundingBox();
    const leftTick = await ticks.nth(9).boundingBox();
    expect(rightTick!.x - (rightNumber!.x + rightNumber!.width)).toBeGreaterThan(2);
    expect(leftNumber!.x - (leftTick!.x + leftTick!.width)).toBeGreaterThan(2);
  }
});

test('multi-character dial labels advance from left to right', async ({ page, context }) => {
  await context.setOffline(true);
  for (const id of ['roman', 'chronograph']) {
    await page.goto(pathToFileURL(resolve(`dist/standalone/${id}.html`)).href);
    const advances = await page.locator('.face-number').evaluateAll(labels => labels.flatMap(label => {
      const text = label as SVGTextContentElement;
      return Array.from({ length: text.getNumberOfChars() - 1 }, (_, i) => text.getStartPositionOfChar(i + 1).x - text.getStartPositionOfChar(i).x);
    }));
    expect(advances.length).toBeGreaterThan(0);
    expect(advances.every(advance => advance > 2)).toBe(true);
  }
});

import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import catalogue from '../../src/data/clocks.json' with { type: 'json' };

test('Station keeps distinct hand lengths and the approved long hour markers', async ({ page, context }) => {
  await context.setOffline(true);
  await page.clock.install({ time: new Date('2026-10-11T12:00:00+08:00') });
  await page.goto(pathToFileURL(resolve('dist/standalone/station.html')).href);
  const proportions = await page.locator('.face-station').evaluate(svg => {
    const hour = svg.querySelector<SVGRectElement>('[data-hand="hour"] rect')!;
    const minute = svg.querySelector<SVGRectElement>('[data-hand="minute"] rect')!;
    const second = svg.querySelector<SVGCircleElement>('[data-hand="second"] circle')!;
    const radius = svg.querySelector<SVGCircleElement>('.face-edge')!.r.baseVal.value;
    const major = svg.querySelector<SVGGeometryElement>('.face-major')!.getTotalLength();
    const minor = svg.querySelector<SVGGeometryElement>('.face-tick:not(.face-major)')!.getTotalLength();
    return { hour: 120 - hour.y.baseVal.value, minute: 120 - minute.y.baseVal.value, second: 120 - second.cy.baseVal.value, radius, major, minor };
  });
  expect(proportions.hour / proportions.minute).toBeGreaterThan(0.75);
  expect(proportions.hour / proportions.minute).toBeLessThan(0.82);
  expect(proportions.second / proportions.hour).toBeCloseTo(1, 2);
  expect(proportions.minute / proportions.radius).toBeLessThan(0.95);
  expect(proportions.major / proportions.minor).toBeCloseTo(3, 2);
  expect(proportions.major / proportions.radius).toBeGreaterThan(0.15);
});

for (const id of catalogue.filter(clock => clock.category === '指针').map(clock => clock.id)) {
  test(`${id}: rendered hand tips agree with local time around the full dial`, async ({ page, context }) => {
    await context.setOffline(true);
    await page.clock.install({ time: new Date('2026-10-11T00:00:00+08:00') });
    await page.clock.pauseAt(new Date('2026-10-11T00:00:01+08:00'));
    await page.goto(pathToFileURL(resolve(`dist/standalone/${id}.html`)).href);
    for (const [hour, minute, second] of [[0, 0, 0], [12, 0, 0], [3, 15, 30], [6, 30, 45], [9, 45, 15], [23, 59, 59]]) {
      const time = [hour, minute, second].map(value => String(value).padStart(2, '0')).join(':');
      await page.clock.setSystemTime(new Date(`2026-10-11T${time}+08:00`));
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
      const angles = await page.locator('#clock svg').evaluate(svg => {
        const center = new DOMPoint(120, 120).matrixTransform((svg as SVGSVGElement).getScreenCTM()!);
        return ['hour', 'minute', 'second'].map(unit => {
          const hand = svg.querySelector<SVGGraphicsElement>(`[data-hand="${unit}"], #${unit}-hand`)!;
          const shape = hand.querySelector<SVGGraphicsElement>(unit === 'second' ? 'circle' : 'rect') || hand;
          const number = (attribute: string) => Number(shape.getAttribute(attribute));
          const point = shape.tagName === 'rect' ? new DOMPoint(number('x') + number('width') / 2, number('y'))
            : shape.tagName === 'circle' ? new DOMPoint(number('cx'), number('cy')) : new DOMPoint(number('x2'), number('y2'));
          const tip = point.matrixTransform(shape.getScreenCTM()!);
          return (Math.atan2(tip.x - center.x, center.y - tip.y) * 180 / Math.PI + 360) % 360;
        });
      });
      const expected = [(hour % 12) * 30 + minute / 2 + second / 120, minute * 6 + second / 10, second * 6];
      angles.forEach((angle, index) => {
        const difference = Math.abs(angle - expected[index]);
        expect(Math.min(difference, 360 - difference), `${time}, ${['hour', 'minute', 'second'][index]} hand`).toBeLessThan(0.001);
      });
    }
  });
}

for (const clock of catalogue.filter(clock => clock.offline)) {
  test(`${clock.id}: clock and controls fit short and portrait screens`, async ({ page, context }) => {
    await context.setOffline(true);
    await page.clock.install({ time: new Date('2026-10-11T09:24:08+08:00') });
    await page.goto(pathToFileURL(resolve(`dist/standalone/${clock.id}.html`)).href);
    await page.locator('#language').selectOption('de-DE');
    if (await page.locator('#format').isVisible()) await page.locator('#format').click();
    for (const [width, height] of [[1280, 720], [1024, 600], [812, 375], [667, 375], [320, 568], [375, 667]]) {
      await page.setViewportSize({ width, height });
      const bounds = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
      expect(bounds.width, `${clock.id}, ${width}×${height}: horizontal overflow`).toBeLessThanOrEqual(width);
      expect(bounds.height, `${clock.id}, ${width}×${height}: vertical overflow`).toBeLessThanOrEqual(height);
    }
    const before = await page.locator('#clock').boundingBox();
    await page.clock.fastForward(3500);
    await expect(page.locator('body')).toHaveClass(/is-idle/);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(667);
    expect((await page.locator('#clock').boundingBox())!.y).toBe(before!.y);
  });
}

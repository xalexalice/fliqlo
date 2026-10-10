import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import catalogue from '../../src/data/clocks.json' with { type: 'json' };
import languages from '../../src/data/languages.json' with { type: 'json' };

for (const id of catalogue.filter(clock => clock.offline).map(clock => clock.id)) {
  test(`${id}: AM/PM is optional in 12-hour mode and the choice persists`, async ({ page, context }) => {
    await context.setOffline(true);
    await page.clock.install({ time: new Date('2026-10-11T00:24:08+08:00') });
    await page.clock.pauseAt(new Date('2026-10-11T00:24:08+08:00'));
    await page.goto(pathToFileURL(resolve(`dist/standalone/${id}.html`)).href);
    const label = page.locator(id === 'aura' ? '[data-face-period]' : '#period');
    const toggle = page.locator('#ampm');
    await expect(toggle).toBeHidden();
    await page.locator('#format').click();
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    for (const [hours, period] of [[0, 'AM'], [11, 'AM'], [12, 'PM'], [23, 'PM']] as const) {
      await page.clock.setSystemTime(new Date(`2026-10-11T${String(hours).padStart(2, '0')}:24:08+08:00`));
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
      await expect(label).toHaveText(period);
      await expect(label).toBeVisible();
      await expect(page.locator('#readable-time')).toContainText(period);
    }
    for (const locale of Object.keys(languages)) {
      await page.locator('#language').selectOption(locale);
      await expect(toggle).toHaveText(languages[locale as keyof typeof languages].ampmOn);
    }
    await toggle.click();
    await expect(label).toBeEmpty();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await page.reload();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(label).toBeEmpty();
    await page.locator('#format').click();
    await expect(toggle).toBeHidden();
    await page.locator('#format').click();
    await expect(label).toBeEmpty();
    await toggle.click();
    await expect(label).toHaveText('PM');
  });
}

test('enhanced original retains its working AM/PM preference', async ({ page }) => {
  await page.route(/^https:\/\/(?:cdn\.tailwindcss\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)/, route => route.abort());
  await page.clock.install({ time: new Date('2026-10-11T12:24:08+08:00') });
  await page.goto('./standalone/fliqlo.html');
  await page.locator('#toggle-format').evaluate(button => (button as HTMLButtonElement).click());
  await expect(page.locator('#ampm')).toHaveText('PM');
  await expect(page.locator('#ampm')).not.toHaveClass(/hidden/);
  await page.locator('#btn-toggle-ampm').evaluate(button => (button as HTMLButtonElement).click());
  await expect(page.locator('#ampm')).toHaveClass(/hidden/);
  await page.reload();
  await expect(page.locator('#ampm')).toHaveClass(/hidden/);
  await page.locator('#btn-toggle-ampm').evaluate(button => (button as HTMLButtonElement).click());
  await expect(page.locator('#ampm')).not.toHaveClass(/hidden/);
});

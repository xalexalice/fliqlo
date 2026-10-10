import { test, expect } from '@playwright/test';

const cases = [
  { locale: 'zh-CN', gallery: '时钟画廊', analog: '指针', light: '浅色', favorites: '我的收藏', subtitle: '静谧指针' },
  { locale: 'en-US', gallery: 'Gallery', analog: 'Analog', light: 'Light', favorites: 'Favourites', subtitle: 'Quiet hands' },
  { locale: 'ja-JP', gallery: 'ギャラリー', analog: 'アナログ', light: 'ライト', favorites: 'お気に入り', subtitle: '静かな針' },
  { locale: 'ko-KR', gallery: '갤러리', analog: '아날로그', light: '밝은', favorites: '즐겨찾기', subtitle: '고요한 시곗바늘' },
  { locale: 'fr-FR', gallery: 'Galerie', analog: 'À aiguilles', light: 'Clair', favorites: 'Favoris', subtitle: 'Aiguilles paisibles' },
  { locale: 'de-DE', gallery: 'Galerie', analog: 'Analog', light: 'Hell', favorites: 'Favoriten', subtitle: 'Ruhige Zeiger' },
  { locale: 'es-ES', gallery: 'Galería', analog: 'Analógico', light: 'Claro', favorites: 'Favoritos', subtitle: 'Agujas tranquilas' },
];

for (const entry of cases) {
  test(`${entry.locale}: localized search, filters, navigation and clock launch`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('./');
    await page.locator('#site-language').selectOption(entry.locale);
    await expect(page.locator('html')).toHaveAttribute('lang', entry.locale);
    await expect(page.locator('.site-header nav a').first()).toHaveText(entry.gallery);
    await expect(page.locator('[data-clock-subtitle="orbit"]')).toHaveText(entry.subtitle);
    await page.locator('#clock-search').fill(entry.light);
    await expect(page.locator('[data-clock-id]:visible')).toHaveCount(2);
    await page.locator('#clock-search').fill('');
    await page.getByRole('button', { name: entry.analog, exact: true }).click();
    await expect(page.locator('[data-clock-id]:visible')).toHaveCount(1);
    await page.locator('[data-favorite="orbit"]').click();
    await page.locator('.site-header nav').getByRole('link', { name: entry.favorites }).click();
    await expect(page.locator('#site-language')).toHaveValue(entry.locale);
    await expect(page.locator('[data-clock-id]:visible')).toHaveCount(1);
    await page.locator('[data-clock-id="orbit"] .card-title').click();
    await expect(page.locator('.detail-info h1')).toHaveText('Orbit');
    await expect(page.locator('html')).toHaveAttribute('lang', entry.locale);
    const popupPromise = page.waitForEvent('popup');
    await page.locator('.detail-launch').click();
    const clock = await popupPromise;
    await expect(clock.locator('#language')).toHaveValue(entry.locale);
    await expect(clock.locator('html')).toHaveAttribute('lang', entry.locale);
    await clock.close();
    expect(errors).toEqual([]);
  });
}

test('language travels with shared links, translates feedback and bridges to the original clock', async ({ page, browser, context }) => {
  await page.goto('./?lang=en-US');
  await page.getByRole('button', { name: 'Save Orbit', exact: true }).click();
  await expect(page.locator('#toast')).toHaveText('Added to favourites');
  await page.locator('.site-header nav').getByRole('link', { name: 'Favourites' }).click();
  await page.getByRole('button', { name: 'Share collection' }).click();
  const url = await page.locator('#share-url').inputValue();
  expect(url).toContain('lang=en-US');
  const other = await browser.newContext();
  const recipient = await other.newPage();
  await recipient.goto(url);
  await expect(recipient.locator('html')).toHaveAttribute('lang', 'en-US');
  await recipient.getByRole('button', { name: 'Import to favourites' }).click();
  await expect(recipient.locator('#toast')).toHaveText('Merged into favourites');
  await recipient.goto('./share/?lang=de-DE#v=1&ids=%3Cscript%3E');
  await expect(recipient.locator('#share-message')).toContainText('ungültig');
  await recipient.locator('#site-language').selectOption('en-US');
  await expect(recipient.locator('#share-message')).toContainText('invalid');
  await other.close();
  await page.locator('.dialog-close').click();
  await page.locator('.site-header nav').getByRole('link', { name: 'Gallery', exact: true }).click();
  // Verify the original's existing localStorage preference without changing its bytes.
  await context.route(/^https:\/\/(?:cdn\.tailwindcss\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)/, route => route.abort());
  const popupPromise = page.waitForEvent('popup');
  await page.locator('.gallery-clock-links a').last().click();
  const original = await popupPromise;
  await expect(original.locator('#select-lang')).toHaveValue('en-US');
  await expect(original.locator('#lbl-language')).toHaveText('Language');
  await original.close();
});

test('all pages fit at 320px in every language, with translated text and metadata', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const routes = ['./', 'favorites/', 'share/#v=1&ids=orbit', 'submit/', '404.html', ...['flip-minimal', 'fliqlo', 'orbit', 'mono', 'dawn', 'terminal'].map(id => `clocks/${id}/`)];
  for (const entry of cases) {
    for (const route of routes) {
      const url = new URL(route, 'http://127.0.0.1:4321/fliqlo/'); url.searchParams.set('lang', entry.locale);
      await page.goto(url.href);
      await expect(page.locator('html')).toHaveAttribute('lang', entry.locale);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.title()).not.toContain('meta.');
      expect(await page.locator('meta[name="description"]').getAttribute('content')).not.toContain('clock.description.');
      if (['en-US', 'ko-KR', 'fr-FR', 'de-DE', 'es-ES'].includes(entry.locale)) {
        const untranslated = await page.evaluate(() => {
          const result: string[] = [];
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            const node = walker.currentNode, element = node.parentElement;
            if (!element || element.closest('script, style, option, noscript, [hidden], dialog:not([open])')) continue;
            if (element.getClientRects().length && /[\u4e00-\u9fff]/.test(node.textContent || '')) result.push(node.textContent!);
          }
          return result;
        });
        expect(untranslated, `${entry.locale} ${route}`).toEqual([]);
      }
    }
  }
  expect(errors).toEqual([]);
});

test('language changes in another tab also update the site', async ({ page, context }) => {
  await page.goto('./?lang=en-US');
  const clock = await context.newPage();
  await clock.goto('standalone/mono.html?lang=en-US');
  await clock.locator('#language').selectOption('ja-JP');
  await expect(page.locator('#site-language')).toHaveValue('ja-JP');
  await expect(page.locator('.site-header nav a').first()).toHaveText('ギャラリー');
  await page.locator('#site-language').selectOption('ko-KR');
  await expect(clock.locator('#language')).toHaveValue('ko-KR');
  await expect(clock.locator('#fullscreen')).toHaveText('전체 화면');
  await clock.close();
});

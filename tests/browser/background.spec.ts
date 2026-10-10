import { test, expect, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const image = { name: 'local-landscape.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="720" height="480"><rect width="720" height="480" fill="#71988c"/><path d="M0 480V320L180 160L450 400L570 270L720 360V480" fill="#274f43"/></svg>') };
const video = resolve('tests/fixtures/background.webm');
const locales = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'fr-FR', 'de-DE', 'es-ES'];
const titles = ['自定义背景', 'Custom background', '背景をカスタマイズ', '사용자 지정 배경', 'Fond personnalisé', 'Eigener Hintergrund', 'Fondo personalizado'];

async function openClock(page: Page, id: string) {
  if (id === 'fliqlo') await page.route(/^https:\/\/(?:cdn\.tailwindcss\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)/, route => route.abort());
  await page.goto(pathToFileURL(resolve(`dist/standalone/${id}.html`)).href);
  // The original uses a CDN stylesheet. Keep its closed drawer from intercepting
  // clicks when exercising media controls offline without that stylesheet.
  if (id === 'fliqlo') await page.addStyleTag({content:'#settings-drawer.opacity-0{opacity:0}#settings-drawer.pointer-events-none{pointer-events:none}'});
}

for (const id of ['flip-minimal', 'fliqlo', 'orbit', 'mono', 'dawn', 'terminal']) {
  test(`${id}: local image and looping video backgrounds work in HTML, idle and fullscreen`, async ({ page, context }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    const uploads: string[] = []; page.on('request', request => { if (request.method() === 'POST') uploads.push(request.url()); });
    await context.setOffline(true);
    await openClock(page, id);
    await page.locator('#background-open').click();
    await expect(page.locator('#background-dialog')).toBeVisible();
    await page.locator('#background-file').setInputFiles(image);
    await expect(page.locator('body')).toHaveClass(/has-custom-background/);
    await expect(page.locator('#background-layer img')).toHaveCSS('object-fit', 'cover');
    await expect(page.locator('#background-status')).toHaveText('图片背景已应用。');
    expect(await page.locator('#background-layer img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(720);
    await page.locator('#background-file').setInputFiles(video);
    await expect(page.locator('#background-layer video')).toHaveCount(1);
    await expect(page.locator('#background-status')).toContainText('静音循环播放');
    expect(await page.locator('#background-layer video').evaluate((v: HTMLVideoElement) => ({ muted: v.muted, loop: v.loop, inline: v.playsInline, playing: !v.paused }))).toEqual({muted:true, loop:true, inline:true, playing:true});
    await page.locator('#background-close').click();
    await page.locator(id === 'fliqlo' ? '#btn-fullscreen' : '#fullscreen').evaluate((button: HTMLButtonElement) => button.click());
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
    // Observe the media timeline wrap, rather than merely inspecting the loop attribute.
    const looped = await page.locator('#background-layer video').evaluate((v: HTMLVideoElement) => new Promise<boolean>(resolve => {
      let last = v.currentTime; const started = performance.now();
      const frame = () => {
        if (v.currentTime < last - .1) return resolve(true);
        last = v.currentTime;
        if (performance.now() - started > 4000) return resolve(false);
        requestAnimationFrame(frame);
      }; frame();
    }));
    expect(looped).toBe(true);
    if (id === 'fliqlo') await expect(page.locator('#control-bar')).toHaveClass(/hidden-state/);
    else {
      await expect(page.locator('#clock-controls')).toHaveCSS('opacity','0');
      await expect(page.locator('#clock-name')).toHaveCSS('opacity','0');
    }
    await page.keyboard.press('f');
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
    await page.locator('#background-open').click();
    await page.locator('#background-reset').click();
    await expect(page.locator('body')).not.toHaveClass(/has-custom-background/);
    await expect(page.locator('#background-layer')).toBeEmpty();
    await expect(page.locator('#background-reset')).toBeDisabled();
    await expect(page.locator('#background-name')).toBeEmpty();
    expect(uploads).toEqual([]); expect(errors).toEqual([]);
  });
}

test('background dialog and errors translate on all clocks and fit on a 320px screen', async ({ page }) => {
  await page.setViewportSize({width:320, height:568});
  for (const id of ['flip-minimal', 'fliqlo', 'orbit', 'mono', 'dawn', 'terminal']) {
    await openClock(page, id);
    for (let i=0; i<locales.length; i++) {
      await page.locator(id === 'fliqlo' ? '#select-lang' : '#language').evaluate((select: HTMLSelectElement, locale) => {select.value=locale; select.dispatchEvent(new Event('change'));}, locales[i]);
      await page.locator('#background-open').click();
      await expect(page.locator('#background-title')).toHaveText(titles[i]);
      await page.locator('#background-file').setInputFiles({name:'unsupported.txt', mimeType:'text/plain', buffer:Buffer.from('test')});
      await expect(page.locator('#background-status')).not.toBeEmpty();
      if (i !== 0 && i !== 2) await expect(page.locator('#background-dialog')).not.toContainText(/[\u4e00-\u9fff]/);
      const box = await page.locator('#background-dialog').boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(320);
      expect(await page.locator('#background-dialog').evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth)).toBe(true);
      await page.keyboard.press('Escape');
      await expect(page.locator('#background-dialog')).not.toBeVisible();
    }
  }
});

test('invalid files retain the current background; replacement and reset release local URLs', async ({ page }) => {
  await page.addInitScript(() => {
    const create=URL.createObjectURL.bind(URL), revoke=URL.revokeObjectURL.bind(URL);
    (window as any).mediaURLs = {created:[] as string[], revoked:[] as string[]};
    URL.createObjectURL = file => {const url=create(file); (window as any).mediaURLs.created.push(url); return url;};
    URL.revokeObjectURL = url => {(window as any).mediaURLs.revoked.push(url); revoke(url);};
  });
  await openClock(page, 'mono');
  await page.locator('#language').selectOption('en-US');
  await page.locator('#background-open').click();
  await page.locator('#background-file').setInputFiles(image);
  await expect(page.locator('#background-status')).toHaveText('Image background applied.');
  const originalURL=await page.locator('#background-layer img').getAttribute('src');
  for (const mimeType of ['text/plain','image/png','video/webm']) {
    await page.locator('#background-file').setInputFiles({name:'invalid',mimeType,buffer:Buffer.from('invalid media bytes')});
    await expect(page.locator('#background-status')).toContainText('could not be loaded');
    await expect(page.locator('#background-layer img')).toHaveAttribute('src',originalURL!);
  }
  await page.locator('#background-file').setInputFiles(video);
  await expect(page.locator('#background-status')).toContainText('Video background applied');
  await page.locator('#background-reset').click();
  expect(await page.evaluate(() => {const urls=(window as any).mediaURLs; return [...urls.created].sort().join() === [...urls.revoked].sort().join();})).toBe(true);
  await page.locator('#background-file').setInputFiles(image);
  await expect(page.locator('body')).toHaveClass(/has-custom-background/);
  await page.reload();
  await expect(page.locator('body')).not.toHaveClass(/has-custom-background/);
});

test('blocked autoplay offers a working manual play button', async ({ page }) => {
  await page.addInitScript(() => {
    const play=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function() {return (window as any).allowVideoPlay ? play.call(this) : Promise.reject(new Error('Autoplay blocked'));};
  });
  await openClock(page,'dawn');
  await page.locator('#background-open').click();
  await page.locator('#background-file').setInputFiles(video);
  await expect(page.locator('#background-status')).toContainText('暂未允许自动播放');
  await expect(page.locator('#background-play')).toBeVisible();
  await page.evaluate(() => {(window as any).allowVideoPlay=true;});
  await page.locator('#background-play').click();
  await expect(page.locator('#background-status')).toContainText('静音循环播放');
  await expect(page.locator('#background-play')).toBeHidden();
  expect(await page.locator('#background-layer video').evaluate((v: HTMLVideoElement) => v.paused)).toBe(false);
});

test('reset and a new choice prevent a late video load from restoring the old background', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () => new Promise<void>(resolve => {(window as any).finishVideoStart = resolve;});
  });
  await openClock(page, 'mono');
  await page.locator('#background-open').click();
  await page.locator('#background-file').setInputFiles(video);
  await page.waitForFunction(() => typeof (window as any).finishVideoStart === 'function');
  await page.locator('#background-reset').click();
  await expect(page.locator('body')).not.toHaveClass(/has-custom-background/);
  await page.locator('#background-file').setInputFiles(image);
  await expect(page.locator('#background-name')).toHaveText(image.name);
  await page.evaluate(async () => {(window as any).finishVideoStart(); await Promise.resolve();});
  await expect(page.locator('#background-layer img')).toHaveCount(1);
  await expect(page.locator('#background-layer video')).toHaveCount(0);
  await expect(page.locator('#background-name')).toHaveText(image.name);
});

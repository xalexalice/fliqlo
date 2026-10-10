import languages from '../data/languages.json';
import type { Language } from '../lib/language';

export function mountBackground(button: HTMLButtonElement, getLanguage: () => Language) {
  const layer = document.createElement('div');
  layer.id = 'background-layer';
  layer.setAttribute('aria-hidden', 'true');
  const dialog = document.createElement('dialog');
  dialog.id = 'background-dialog';
  dialog.setAttribute('aria-labelledby', 'background-title');
  dialog.innerHTML = `<div class="background-heading"><h2 id="background-title"></h2><button id="background-close" type="button"></button></div><p id="background-hint"></p><input id="background-file" type="file" accept="image/*,video/*" hidden><div class="background-actions"><button id="background-choose" type="button"></button><button id="background-reset" type="button" disabled></button><button id="background-play" type="button" hidden></button></div><p id="background-name"></p><p id="background-status" role="status" aria-live="polite"></p>`;
  document.body.prepend(layer);
  document.body.append(dialog);
  const input = dialog.querySelector<HTMLInputElement>('#background-file')!;
  const reset = dialog.querySelector<HTMLButtonElement>('#background-reset')!;
  const play = dialog.querySelector<HTMLButtonElement>('#background-play')!;
  const status = dialog.querySelector<HTMLElement>('#background-status')!;
  const name = dialog.querySelector<HTMLElement>('#background-name')!;
  type Media = { element: HTMLImageElement | HTMLVideoElement; url: string; name: string };
  type Message = 'loading' | 'imageReady' | 'videoReady' | 'fileError' | 'playError';
  let active: Media | undefined;
  let pending: Media | undefined;
  let message: Message | undefined;
  let selection = 0;

  function render() {
    const copy = languages[getLanguage()].background;
    button.textContent = copy.open;
    for (const key of ['title', 'close', 'hint', 'choose', 'reset', 'play'] as const) {
      dialog.querySelector(`#background-${key}`)!.textContent = copy[key];
    }
    reset.disabled = !active && !pending;
    name.textContent = active?.name || '';
    status.textContent = message ? copy[message] : '';
  }
  function dispose(media: Media | undefined) {
    if (!media) return;
    if (media.element instanceof HTMLVideoElement) media.element.pause();
    media.element.removeAttribute('src');
    if (media.element instanceof HTMLVideoElement) media.element.load();
    media.element.remove();
    URL.revokeObjectURL(media.url);
  }
  function clear() {
    selection++;
    dispose(pending); pending = undefined;
    dispose(active); active = undefined;
    layer.replaceChildren();
    document.body.classList.remove('has-custom-background');
    message = undefined; play.hidden = true; input.value = ''; render();
  }
  async function startVideo(video: HTMLVideoElement) {
    try { await video.play(); return true; }
    catch { return false; }
  }
  function choose(file: File) {
    const request = ++selection;
    dispose(pending); pending = undefined;
    const video = file.type.startsWith('video/');
    if (!video && !file.type.startsWith('image/')) { message = 'fileError'; render(); return; }
    const element = video ? document.createElement('video') : document.createElement('img');
    const media: Media = { element, url: URL.createObjectURL(file), name: file.name };
    pending = media; message = 'loading'; render();
    if (element instanceof HTMLVideoElement) {
      element.muted = true; element.defaultMuted = true;
      element.loop = true; element.autoplay = true; element.playsInline = true;
      element.preload = 'auto';
    } else { element.alt = ''; }
    element.addEventListener('error', () => {
      if (request !== selection) return;
      if (pending === media) { dispose(pending); pending = undefined; }
      else if (active === media) { dispose(active); active = undefined; document.body.classList.remove('has-custom-background'); }
      message = 'fileError'; play.hidden = true; render();
    }, { once: true });
    element.addEventListener(video ? 'loadeddata' : 'load', async () => {
      if (request !== selection) return;
      const playing = element instanceof HTMLVideoElement ? await startVideo(element) : true;
      if (request !== selection || pending !== media) return;
      dispose(active); active = media; pending = undefined;
      layer.replaceChildren(element);
      document.body.classList.add('has-custom-background');
      message = !playing ? 'playError' : video ? 'videoReady' : 'imageReady';
      play.hidden = playing; render();
    }, { once: true });
    element.src = media.url;
  }

  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-controls', dialog.id);
  button.addEventListener('click', () => { render(); dialog.showModal(); });
  dialog.querySelector('#background-close')!.addEventListener('click', () => dialog.close());
  dialog.querySelector('#background-choose')!.addEventListener('click', () => input.click());
  input.addEventListener('change', () => { const file = input.files?.[0]; input.value = ''; if (file) choose(file); });
  reset.addEventListener('click', clear);
  play.addEventListener('click', async () => {
    const media = active;
    if (!media || !(media.element instanceof HTMLVideoElement)) return;
    const playing = await startVideo(media.element);
    if (media !== active) return;
    message = playing ? 'videoReady' : 'playError'; play.hidden = playing; render();
  });
  // Keep the original clock's shortcuts from handling buttons inside this dialog.
  dialog.addEventListener('keydown', event => event.stopPropagation());
  dialog.addEventListener('click', event => event.stopPropagation());
  dialog.addEventListener('close', () => window.dispatchEvent(new Event('mousemove')));
  document.addEventListener('visibilitychange', () => {
    if (!(active?.element instanceof HTMLVideoElement)) return;
    if (document.hidden) active.element.pause(); else void resumeVideo();
  });
  async function resumeVideo() {
    const media = active;
    if (!media || !(media.element instanceof HTMLVideoElement)) return;
    if (!await startVideo(media.element) && media === active) { message = 'playError'; play.hidden = false; render(); }
  }
  window.addEventListener('pagehide', event => { if (!event.persisted) clear(); else if (active?.element instanceof HTMLVideoElement) active.element.pause(); });
  window.addEventListener('pageshow', event => { if (event.persisted) void resumeVideo(); });
  render();
  return { render };
}

import { timeParts } from '../lib/time.mjs';
import languages from '../data/languages.json';
import { getLanguage, saveLanguage, isLanguage, LANGUAGE_KEY, type Language } from '../lib/language';
import { mountBackground } from './clock-background';
declare const FLIP_CLOCK: boolean;

type Message = 'storageError' | 'fullscreenError' | 'wakeError';
const id = document.body.dataset.clock!;
const storageKey = `clock-gallery:fliqlo:settings:${id}:v1`;
let twentyFour = true;
let seconds = true;
let language: Language = 'zh-CN';
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
  twentyFour = saved.twentyFour !== false; seconds = saved.seconds !== false;
  if (isLanguage(saved.language)) language = saved.language;
} catch { /* Clock works without storage. */ }
language = getLanguage(language);
saveLanguage(language);
const display = document.querySelector<HTMLElement>('#clock')!;
const dateLabel = document.querySelector<HTMLElement>('#date')!;
const periodLabel = document.querySelector<HTMLElement>('#period')!;
const readable = document.querySelector<HTMLElement>('#readable-time')!;
const nameLabel = document.querySelector<HTMLElement>('#clock-name')!;
const formatButton = document.querySelector<HTMLButtonElement>('#format')!;
const secondsButton = document.querySelector<HTMLButtonElement>('#seconds')!;
const languageSelect = document.querySelector<HTMLSelectElement>('#language')!;
const controls = document.querySelector<HTMLElement>('#clock-controls')!;
const toolbar = document.querySelector<HTMLElement>('#clock-toolbar')!;
const status = document.querySelector<HTMLElement>('#status')!;
const fullscreen = document.querySelector<HTMLButtonElement>('#fullscreen')!;
const wakeButton = document.querySelector<HTMLButtonElement>('#wake')!;
const wakeSupported = 'wakeLock' in navigator;
let message: Message | undefined;
let dateFormat = makeDateFormat();
let flip: { unmount: () => unknown } | undefined;
let flipFace: { value: { value: string } } | undefined;
let wakeRequested = false;
let wakeLock: WakeLockSentinel | undefined;
const background = mountBackground(document.querySelector<HTMLButtonElement>('#background-open')!, () => language);

function makeDateFormat() { return new Intl.DateTimeFormat(language, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }); }
function renderControls() {
  const copy = languages[language];
  document.documentElement.lang = language;
  document.title = `${document.body.dataset.name} — Still${language === 'zh-CN' ? ' 时刻' : ''}`;
  languageSelect.value = language;
  languageSelect.setAttribute('aria-label', copy.language);
  toolbar.setAttribute('aria-label', copy.settings);
  nameLabel.textContent = `${document.body.dataset.name!.toUpperCase()} / ${copy.subtitles[id as keyof typeof copy.subtitles]}`;
  formatButton.textContent = twentyFour ? copy.format24 : copy.format12;
  formatButton.setAttribute('aria-pressed', String(twentyFour));
  secondsButton.textContent = seconds ? copy.secondsOn : copy.secondsOff;
  secondsButton.setAttribute('aria-pressed', String(seconds));
  fullscreen.textContent = document.fullscreenElement ? copy.exitFullscreen : copy.fullscreen;
  fullscreen.setAttribute('aria-pressed', String(Boolean(document.fullscreenElement)));
  const awake = Boolean(wakeLock && !wakeLock.released);
  wakeButton.disabled = !wakeSupported;
  wakeButton.textContent = !wakeSupported ? copy.wakeUnavailable : awake ? copy.wakeOn : copy.wakeOff;
  wakeButton.setAttribute('aria-pressed', String(awake));
  status.textContent = message ? copy[message] : '';
  background.render();
}

async function mountFlip() {
  if (FLIP_CLOCK) {
    const { flipClock, clock, theme, css } = await import('flipclock');
    // Feed wall-clock time each tick, including after sleep or a system clock change.
    flipFace = clock({ format: seconds ? '[HH]:[mm]:[ss]' : '[HH]:[mm]' });
    flip = flipClock({ parent: display, autoStart: false, face: flipFace as ReturnType<typeof clock>, theme: theme({ dividers: ':', css: css({ fontSize: 'clamp(30px, 9vw, 120px)' }) }) });
    render();
  }
}

function render() {
  const now = new Date();
  const part = timeParts(now, twentyFour);
  const time = `${part.hours}:${part.minutes}${seconds ? `:${part.seconds}` : ''}`;
  readable.textContent = `${time}${twentyFour ? '' : ` ${part.period}`}`;
  display.setAttribute('aria-label', readable.textContent);
  dateLabel.textContent = dateFormat.format(now);
  periodLabel.textContent = twentyFour || id === 'orbit' ? '' : part.period;
  if (id === 'flip-minimal') { if (flipFace) flipFace.value.value = time; }
  else if (id === 'orbit') {
    document.querySelector('#hour-hand')!.setAttribute('transform', `rotate(${part.hourAngle} 120 120)`);
    document.querySelector('#minute-hand')!.setAttribute('transform', `rotate(${part.minuteAngle} 120 120)`);
    const secondHand = document.querySelector<SVGElement>('#second-hand')!;
    secondHand.setAttribute('transform', `rotate(${part.secondAngle} 120 120)`);
    secondHand.style.display = seconds ? '' : 'none';
  } else { display.textContent = time; }
  document.body.classList.toggle('without-seconds', !seconds);
  const zone = document.querySelector('#timezone');
  if (zone) zone.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
}
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({ twentyFour, seconds, language })); }
  catch { message = 'storageError'; }
  if (!saveLanguage(language)) message = 'storageError';
  renderControls();
}
formatButton.addEventListener('click', () => { twentyFour = !twentyFour; persist(); render(); });
secondsButton.addEventListener('click', async () => { seconds = !seconds; persist(); if (id === 'flip-minimal') { flip?.unmount(); display.replaceChildren(); await mountFlip(); } render(); });
function changeLanguage(value: Language) {
  language = value; dateFormat = makeDateFormat(); persist(); render();
  const url = new URL(location.href); url.searchParams.set('lang', language); history.replaceState(null, '', url);
}
languageSelect.addEventListener('change', () => {
  if (!isLanguage(languageSelect.value)) return;
  changeLanguage(languageSelect.value);
  if (!keyboardInteraction) languageSelect.blur();
  resetIdleTimer();
});
window.addEventListener('storage', event => { if (event.key === LANGUAGE_KEY && isLanguage(event.newValue)) changeLanguage(event.newValue); });
if (id === 'orbit') formatButton.hidden = true;

let idleTimer: ReturnType<typeof setTimeout>;
let keyboardInteraction = false;
function resetIdleTimer() {
  clearTimeout(idleTimer);
  document.body.classList.remove('is-idle');
  if (document.hidden) return;
  idleTimer = setTimeout(() => {
    // Keep keyboard focus and an open language picker visible.
    if (document.querySelector<HTMLDialogElement>('#background-dialog')?.open) return;
    if (controls.contains(document.activeElement) && (keyboardInteraction || document.activeElement === languageSelect)) return;
    document.body.classList.add('is-idle');
  }, 3000);
}
window.addEventListener('mousemove', resetIdleTimer, { passive: true });
window.addEventListener('pointerdown', () => { keyboardInteraction = false; resetIdleTimer(); }, { passive: true });
window.addEventListener('touchstart', () => { keyboardInteraction = false; resetIdleTimer(); }, { passive: true });
window.addEventListener('keydown', event => {
  keyboardInteraction = true; resetIdleTimer();
  if (event.target instanceof HTMLElement && event.target.matches('input, select, textarea, [contenteditable]')) return;
  if (event.key.toLowerCase() === 'f' && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); void toggleFullscreen(); }
});
controls.addEventListener('focusin', resetIdleTimer);
controls.addEventListener('focusout', resetIdleTimer);

async function toggleFullscreen() {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { message = 'fullscreenError'; renderControls(); }
}
fullscreen.addEventListener('click', () => { void toggleFullscreen(); });
document.addEventListener('fullscreenchange', () => { renderControls(); resetIdleTimer(); });
async function acquireWake() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    renderControls();
    wakeLock.addEventListener('release', renderControls);
  } catch { wakeRequested = false; message = 'wakeError'; renderControls(); }
}
wakeButton.addEventListener('click', async () => {
  wakeRequested = !wakeRequested;
  if (wakeRequested) await acquireWake(); else { await wakeLock?.release(); wakeLock = undefined; renderControls(); }
});

let tick: ReturnType<typeof setTimeout>;
function schedule() { clearTimeout(tick); render(); if (!document.hidden) tick = setTimeout(schedule, 1000 - Date.now() % 1000 + 5); }
document.addEventListener('visibilitychange', () => { schedule(); resetIdleTimer(); if (!document.hidden && wakeRequested) void acquireWake(); });
window.addEventListener('pageshow', () => { schedule(); resetIdleTimer(); });
window.addEventListener('pagehide', () => { clearTimeout(tick); clearTimeout(idleTimer); flip?.unmount(); void wakeLock?.release(); });
window.addEventListener('pageshow', event => { if (event.persisted && id === 'flip-minimal') { display.replaceChildren(); void mountFlip(); } });
if (id === 'flip-minimal') void mountFlip();
renderControls(); schedule(); resetIdleTimer();

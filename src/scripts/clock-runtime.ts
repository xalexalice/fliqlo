import { timeParts } from '../lib/time.mjs';
declare const FLIP_CLOCK: boolean;

const id = document.body.dataset.clock!;
const storageKey = `clock-gallery:fliqlo:settings:${id}:v1`;
let twentyFour = true;
let seconds = true;
try { const saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); twentyFour = saved.twentyFour !== false; seconds = saved.seconds !== false; } catch { /* Clock works without storage. */ }
const display = document.querySelector<HTMLElement>('#clock')!;
const dateLabel = document.querySelector<HTMLElement>('#date')!;
const periodLabel = document.querySelector<HTMLElement>('#period')!;
const readable = document.querySelector<HTMLElement>('#readable-time')!;
const formatButton = document.querySelector<HTMLButtonElement>('#format')!;
const secondsButton = document.querySelector<HTMLButtonElement>('#seconds')!;
const status = document.querySelector<HTMLElement>('#status')!;
const dateFormat = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
let flip: { unmount: () => unknown } | undefined;
let flipFace: { value: { value: string } } | undefined;

async function mountFlip() {
  if (!FLIP_CLOCK) return;
  const { flipClock, clock, theme, css } = await import('flipclock');
  // The library's default face uses elapsed time. Feed wall-clock time each tick
  // so returning from sleep or changing the system clock never leaves it behind.
  flipFace = clock({ format: seconds ? '[HH]:[mm]:[ss]' : '[HH]:[mm]' });
  flip = flipClock({ parent: display, autoStart: false, face: flipFace as ReturnType<typeof clock>, theme: theme({ dividers: ':', css: css({ fontSize: 'clamp(30px, 9vw, 120px)' }) }) });
  render();
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
  formatButton.textContent = twentyFour ? '24 小时' : '12 小时';
  formatButton.setAttribute('aria-pressed', String(twentyFour));
  secondsButton.textContent = seconds ? '显示秒：开' : '显示秒：关';
  secondsButton.setAttribute('aria-pressed', String(seconds));
  const zone = document.querySelector('#timezone');
  if (zone) zone.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
}
function persist() { try { localStorage.setItem(storageKey, JSON.stringify({ twentyFour, seconds })); } catch { status.textContent = '设置仅在本次打开期间生效。'; } }
formatButton.addEventListener('click', () => { twentyFour = !twentyFour; persist(); render(); });
secondsButton.addEventListener('click', async () => { seconds = !seconds; persist(); if (id === 'flip-minimal') { flip?.unmount(); display.replaceChildren(); await mountFlip(); } render(); });
if (id === 'orbit') formatButton.hidden = true;
if (id === 'flip-minimal') void mountFlip();
render();
let tick: ReturnType<typeof setTimeout>;
function schedule() { clearTimeout(tick); render(); if (!document.hidden) tick = setTimeout(schedule, 1000 - Date.now() % 1000 + 5); }
schedule();

const fullscreen = document.querySelector<HTMLButtonElement>('#fullscreen')!;
fullscreen.addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { status.textContent = '浏览器未允许全屏，可使用浏览器的全屏菜单。'; }
});
document.addEventListener('fullscreenchange', () => { fullscreen.textContent = document.fullscreenElement ? '退出全屏' : '全屏'; });
const wakeButton = document.querySelector<HTMLButtonElement>('#wake')!;
let wakeRequested = false;
let wakeLock: WakeLockSentinel | undefined;
if (!('wakeLock' in navigator)) { wakeButton.disabled = true; wakeButton.textContent = '常亮暂不可用'; }
async function acquireWake() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeButton.textContent = '屏幕常亮：开';
    wakeButton.setAttribute('aria-pressed', 'true');
    wakeLock.addEventListener('release', () => { wakeButton.textContent = '屏幕常亮：关'; wakeButton.setAttribute('aria-pressed', 'false'); });
  } catch { wakeRequested = false; status.textContent = '当前环境未允许屏幕常亮。'; }
}
wakeButton.addEventListener('click', async () => {
  wakeRequested = !wakeRequested;
  if (wakeRequested) await acquireWake(); else { await wakeLock?.release(); wakeLock = undefined; }
});
document.addEventListener('visibilitychange', () => { schedule(); if (!document.hidden && wakeRequested) void acquireWake(); });
window.addEventListener('pageshow', schedule);
window.addEventListener('pagehide', () => { clearTimeout(tick); flip?.unmount(); void wakeLock?.release(); });
window.addEventListener('pageshow', event => { if (event.persisted && id === 'flip-minimal') { display.replaceChildren(); void mountFlip(); } });

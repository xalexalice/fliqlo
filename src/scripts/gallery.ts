import { FAVORITES_KEY, parseFavorites, createShareHash, parseShareHash, knownIds } from '../lib/collection.mjs';
import { path } from '../lib/paths';
import type clocks from '../data/clocks.json';

const catalogue: typeof clocks = JSON.parse(document.querySelector('#catalogue')!.textContent!);
const page = document.body.dataset.page;
const toastElement = document.querySelector<HTMLElement>('#toast')!;
let toastTimer: ReturnType<typeof setTimeout>;
const toast = (message: string) => { toastElement.textContent = message; toastElement.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastElement.hidden = true; }, 3500); };
let favorites: string[] = [];
try { favorites = parseFavorites(localStorage.getItem(FAVORITES_KEY), catalogue); } catch { /* Storage may be disabled. */ }
const cards = [...document.querySelectorAll<HTMLElement>('[data-clock-id]')];
let category = '全部';
let sharedIds: string[] = [];
const search = document.querySelector<HTMLInputElement>('#clock-search');
const sort = document.querySelector<HTMLSelectElement>('#clock-sort');

function refresh() {
  document.querySelectorAll('[data-favorite-count]').forEach(el => { el.textContent = String(favorites.length); });
  document.querySelectorAll<HTMLButtonElement>('[data-favorite]').forEach(button => {
    const active = favorites.includes(button.dataset.favorite!);
    const clock = catalogue.find(clock => clock.id === button.dataset.favorite)!;
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', `${active ? '取消收藏' : '收藏'} ${clock.name}`);
    const label = button.querySelector('[data-favorite-label]');
    if (label) label.textContent = active ? '已收藏' : '收藏';
  });
  const query = (search?.value || '').trim().toLowerCase();
  let visible = 0;
  cards.forEach(card => {
    const clock = catalogue.find(clock => clock.id === card.dataset.clockId)!;
    const matches = page === 'favorites' ? favorites.includes(clock.id) : page === 'share' ? sharedIds.includes(clock.id) : (category === '全部' || clock.category === category) && `${clock.name} ${clock.subtitle} ${clock.tags.join(' ')}`.toLowerCase().includes(query);
    card.hidden = !matches;
    if (matches) visible++;
  });
  const count = document.querySelector('#result-count');
  if (count) count.textContent = `${visible} 款${page === 'favorites' ? '收藏' : page === 'share' ? '分享' : '精选'}时钟`;
  const empty = document.querySelector<HTMLElement>('#empty-state');
  if (empty) empty.hidden = visible > 0;
  const share = document.querySelector<HTMLButtonElement>('#share-collection');
  if (share) share.disabled = favorites.length === 0;
}

function save(next: string[]) {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); favorites = next; refresh(); return true; }
  catch { toast('浏览器未允许保存收藏，请检查隐私或存储设置。'); return false; }
}
document.querySelectorAll<HTMLButtonElement>('[data-favorite]').forEach(button => button.addEventListener('click', () => {
  const id = button.dataset.favorite!;
  const active = favorites.includes(id);
  if (save(active ? favorites.filter(value => value !== id) : [...favorites, id])) toast(active ? '已移出收藏' : '已加入我的收藏');
}));
document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(button => button.addEventListener('click', () => {
  category = button.dataset.filter!;
  document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(item => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
  refresh();
}));
search?.addEventListener('input', refresh);
sort?.addEventListener('change', () => {
  const ordered = [...catalogue].sort((a, b) => sort.value === 'newest' ? b.added.localeCompare(a.added) || a.featured - b.featured : a.featured - b.featured);
  const grid = document.querySelector('#clock-grid')!;
  ordered.forEach(clock => grid.append(cards.find(card => card.dataset.clockId === clock.id)!));
});
document.querySelector('#reset-search')?.addEventListener('click', () => { if (search) search.value = ''; document.querySelector<HTMLButtonElement>('[data-filter="全部"]')?.click(); search?.focus(); });

const dialog = document.querySelector<HTMLDialogElement>('#share-dialog')!;
const shareInput = document.querySelector<HTMLInputElement>('#share-url')!;
const copyStatus = document.querySelector<HTMLElement>('#copy-status')!;
function showShare(url: string) { shareInput.value = url; copyStatus.textContent = ''; dialog.showModal(); shareInput.focus(); shareInput.select(); }
document.querySelectorAll<HTMLButtonElement>('[data-share-clock]').forEach(button => button.addEventListener('click', () => showShare(new URL(path(`clocks/${button.dataset.shareClock}/`), location.origin).href)));
document.querySelector('#share-collection')?.addEventListener('click', () => {
  try { showShare(new URL(path('share/'), location.origin).href + createShareHash(favorites)); }
  catch (error) { toast((error as Error).message); }
});
document.querySelector('#copy-link')!.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(shareInput.value); copyStatus.textContent = '已复制，可以发送给朋友了。'; }
  catch { shareInput.focus(); shareInput.select(); copyStatus.textContent = '请按 Ctrl+C 或 ⌘C 复制选中的链接。'; }
});
function loadShare() {
  const parsed = parseShareHash(location.hash, catalogue);
  sharedIds = parsed.ids;
  document.querySelector('#share-message')!.textContent = parsed.error || (parsed.missing.length ? `${parsed.missing.length} 款时钟已不可用：${parsed.missing.join('、')}` : '');
  document.querySelector<HTMLElement>('#import-collection')!.hidden = sharedIds.length === 0;
  refresh();
}
if (page === 'share') {
  loadShare();
  window.addEventListener('hashchange', loadShare);
  document.querySelector('#import-collection')!.addEventListener('click', () => { if (save(knownIds([...favorites, ...sharedIds], catalogue))) toast('已合并到我的收藏'); });
}
window.addEventListener('storage', event => { if (event.key === FAVORITES_KEY || event.key === null) { favorites = parseFavorites(event.newValue, catalogue); refresh(); } });
refresh();

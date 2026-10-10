import messages from '../data/site-languages.json';
import languages from '../data/languages.json';
import { getLanguage, saveLanguage, isLanguage, LANGUAGE_KEY, type Language } from './language';

let language: Language = getLanguage();
export function locale() { return language; }
export function t(key: string, values: Record<string, string | number> = {}) {
  const copy: Record<string, string> = messages[language as keyof typeof messages];
  return (copy[key] || key).replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));
}
export function subtitle(id: string) {
  return id === 'fliqlo' ? t('clock.subtitle.fliqlo') : languages[language].subtitles[id as keyof typeof languages['zh-CN']['subtitles']];
}
export function localURL(route: string) {
  const url = new URL(route, location.origin);
  url.searchParams.set('lang', language);
  return url.href;
}
function apply() {
  document.documentElement.lang = language;
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(element => {
    const value = t(element.dataset.i18n!, { name: element.dataset.i18nName || '' });
    if (element.hasAttribute('data-i18n-html')) element.innerHTML = value; // Only trusted, bundled translation strings.
    else element.textContent = value;
  });
  for (const attribute of ['aria-label', 'placeholder']) {
    document.querySelectorAll<HTMLElement>(`[data-i18n-${attribute}]`).forEach(element => {
      element.setAttribute(attribute, t(element.getAttribute(`data-i18n-${attribute}`)!, { name: element.dataset.i18nName || '' }));
    });
  }
  document.querySelectorAll<HTMLElement>('[data-clock-subtitle]').forEach(element => { element.textContent = subtitle(element.dataset.clockSubtitle!); });
  const previewDate = new Intl.DateTimeFormat(language, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(2026, 9, 9));
  document.querySelectorAll<HTMLElement>('[data-preview-date]').forEach(element => { element.textContent = previewDate; });
  const page = document.body.dataset.page!;
  const clock = document.body.dataset.detailClock;
  document.title = clock ? `${document.body.dataset.detailName} — Still${language === 'zh-CN' ? ' 时刻' : ''}` : t(`meta.${page === 'gallery' ? 'home' : page}`);
  const description = clock ? t(`clock.description.${clock}`) : t('meta.description');
  document.querySelector<HTMLMetaElement>('meta[name="description"]')!.content = description;
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')!.content = document.title;
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')!.content = description;
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link => {
    if (link.getAttribute('href')!.startsWith('#')) return;
    const url = new URL(link.href);
    if (url.origin === location.origin) { url.searchParams.set('lang', language); link.href = url.href; }
  });
  document.querySelector<HTMLSelectElement>('#site-language')!.value = language;
}
export function initLanguage(onChange: () => void) {
  saveLanguage(language);
  apply();
  function change(value: unknown, remember: boolean) {
    if (!isLanguage(value)) return;
    language = value;
    if (remember) saveLanguage(language);
    const url = new URL(location.href); url.searchParams.set('lang', language); history.replaceState(null, '', url);
    apply(); onChange();
  }
  document.querySelector<HTMLSelectElement>('#site-language')!.addEventListener('change', event => {
    change((event.target as HTMLSelectElement).value, true);
  });
  window.addEventListener('storage', event => { if (event.key === LANGUAGE_KEY) change(event.newValue, false); });
  window.addEventListener('pageshow', event => {
    if (event.persisted) { try { change(localStorage.getItem(LANGUAGE_KEY), false); } catch { /* Keep the current language. */ } }
  });
}

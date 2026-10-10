import languages from '../data/languages.json';

export type Language = keyof typeof languages;
export const LANGUAGE_KEY = 'clk_lang'; // Also used by the preserved original clock.
export function isLanguage(value: unknown): value is Language { return typeof value === 'string' && Object.hasOwn(languages, value); }
export function getLanguage(fallback: Language = 'zh-CN'): Language {
  const query = new URL(location.href).searchParams.get('lang');
  if (isLanguage(query)) return query;
  try { const saved = localStorage.getItem(LANGUAGE_KEY); if (isLanguage(saved)) return saved; } catch { /* Language still works without storage. */ }
  return fallback;
}
export function saveLanguage(language: Language) {
  try { localStorage.setItem(LANGUAGE_KEY, language); return true; } catch { return false; }
}

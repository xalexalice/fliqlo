export const FAVORITES_KEY = 'clock-gallery:fliqlo:favorites:v1';
export const MAX_SHARE_IDS = 20;
export const MAX_SHARE_LENGTH = 2048;

export function knownIds(values, catalogue) {
  const allowed = new Set(catalogue.map(clock => clock.id));
  return Array.isArray(values) ? [...new Set(values.filter(id => typeof id === 'string' && allowed.has(id)))] : [];
}

export function parseFavorites(raw, catalogue) {
  try { return knownIds(JSON.parse(raw || '[]'), catalogue); }
  catch { return []; }
}

export function createShareHash(ids) {
  const unique = [...new Set(ids)];
  if (!unique.length || unique.length > MAX_SHARE_IDS || unique.some(id => !/^[a-z0-9-]+$/.test(id))) {
    throw new Error('share.invalidSelection');
  }
  const hash = '#v=1&ids=' + unique.join(',');
  if (hash.length > MAX_SHARE_LENGTH) throw new Error('share.tooLong');
  return hash;
}

export function parseShareHash(hash, catalogue) {
  if (hash.length > MAX_SHARE_LENGTH) return { ids: [], missing: [], error: 'share.tooLong' };
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const values = [...new Set((params.get('ids') || '').split(',').filter(Boolean))];
  if (params.get('v') !== '1' || !values.length || values.length > MAX_SHARE_IDS || values.some(id => !/^[a-z0-9-]+$/.test(id))) {
    return { ids: [], missing: [], error: 'share.invalid' };
  }
  const ids = knownIds(values, catalogue);
  return { ids, missing: values.filter(id => !ids.includes(id)), error: '' };
}

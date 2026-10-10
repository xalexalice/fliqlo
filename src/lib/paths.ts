export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const path = (route = '') => `${base}/${route.replace(/^\//, '')}`;
export const repo = 'https://github.com/xalexalice/fliqlo';
export const playPath = (id: string) => path(id === 'fliqlo' ? 'legacy/fliqlo.html' : `standalone/${id}.html`);

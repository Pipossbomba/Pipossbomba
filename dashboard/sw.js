/* Life OS — service worker com cache versionado */
const CACHE = 'fl-dashboard-v26';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './vendor/chart.umd.js',
  './vendor/fonts.css',
  './vendor/fonts/inter-latin-400-normal.woff2',
  './vendor/fonts/inter-latin-500-normal.woff2',
  './vendor/fonts/inter-latin-600-normal.woff2',
  './vendor/fonts/inter-latin-700-normal.woff2',
  './vendor/fonts/doto-latin-400-normal.woff2',
  './vendor/fonts/doto-latin-600-normal.woff2',
  './vendor/fonts/doto-latin-700-normal.woff2',
  './vendor/fonts/doto-latin-900-normal.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // nunca cachear chamadas a APIs (Anthropic, meteo)
  if (url.hostname.includes('api.anthropic.com') || url.hostname.includes('api.open-meteo.com')
      || url.hostname.includes('googleapis.com') || url.hostname.includes('accounts.google.com')) return;

  // Shell própria + CDN: cache-first com revalidação em segundo plano
  // (stale-while-revalidate) — arranque instantâneo mesmo em rede lenta,
  // e a cache atualiza-se sozinha para a visita seguinte.
  const isCDN = /cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url.hostname);
  const isShell = url.origin === location.origin;

  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res.ok && (isCDN || isShell)) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => hit);
      return (isCDN || isShell) ? (hit || net) : net;
    })
  );
});

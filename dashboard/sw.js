/* Life OS — service worker com cache versionado */
const CACHE = 'fl-dashboard-v16';
const CORE = [
  './',
  './index.html',
  './manifest.json'
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

  // CDN (Chart.js, Google Fonts): cache-first para funcionar offline
  const isCDN = /cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url.hostname);

  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res.ok && (isCDN || url.origin === location.origin)) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => hit);
      return isCDN ? (hit || net) : (net.catch(() => hit) || hit);
    })
  );
});

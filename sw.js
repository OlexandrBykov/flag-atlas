const CACHE = 'flag-atlas-v6';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './vendor/d3.min.js', './vendor/topojson-client.min.js', './fonts/bricolage-grotesque-latin-600-normal.woff2', './fonts/bricolage-grotesque-latin-800-normal.woff2', './fonts/figtree-latin-400-normal.woff2', './fonts/figtree-latin-500-normal.woff2', './fonts/figtree-latin-600-normal.woff2', './fonts/figtree-latin-700-normal.woff2', './fonts/fonts.css', './fonts/onest-cyrillic-400-normal.woff2', './fonts/onest-cyrillic-500-normal.woff2', './fonts/onest-cyrillic-600-normal.woff2', './fonts/onest-cyrillic-700-normal.woff2', './fonts/onest-cyrillic-800-normal.woff2', './fonts/onest-latin-400-normal.woff2', './fonts/onest-latin-600-normal.woff2', './fonts/onest-latin-700-normal.woff2', './fonts/onest-latin-800-normal.woff2'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Static libraries and fonts: cache first. Everything else: network first (fresh updates), cache when offline or slow.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const stat = /\/(vendor|fonts)\//.test(url.pathname);
  if (stat) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { const c = res.clone(); caches.open(CACHE).then(ch => ch.put(req, c)); return res; })));
    return;
  }
  e.respondWith(
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => caches.match(req, { ignoreSearch: true }).then(h => h && resolve(h)), 2500);
      fetch(req).then(res => {
        clearTimeout(timer);
        if (res && res.ok) { const c = res.clone(); caches.open(CACHE).then(ch => ch.put(req, c)); }
        resolve(res);
      }).catch(() => {
        clearTimeout(timer);
        caches.match(req, { ignoreSearch: true }).then(h => h || (req.mode === 'navigate' ? caches.match('./index.html') : null)).then(h => h ? resolve(h) : reject(new Error('offline')));
      });
    })
  );
});

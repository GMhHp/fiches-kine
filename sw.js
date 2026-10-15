/* Service worker — Fiches Kiné : utilisation hors ligne.
   La page est chargée depuis le réseau quand il est disponible (mises à jour immédiates),
   sinon depuis le cache. Icônes et manifeste : cache d'abord. Polices : cache puis mise à jour. */
const VERSION = 'fiches-kine-2026-10-15-2ae2266f';
const FONTS = 'fiches-kine-fonts';
const CORE = ['index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'];
const SCOPE_PATH = new URL(self.registration.scope).pathname;
const PAGE = new URL('index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('fiches-kine-') && k !== VERSION && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') {
      if (url.pathname !== SCOPE_PATH && url.pathname !== SCOPE_PATH + 'index.html') return;
      // Réseau lancé tout de suite ; la copie en cache est terminée avant la fin de vie de l'événement
      let done = () => {};
      event.waitUntil(new Promise(resolve => { done = resolve; }));
      const network = fetch(req).then(res => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(PAGE, copy)).then(done, done);
        } else done();
        return res;
      }, err => { done(); throw err; });
      event.respondWith(appPage(network));
      return;
    }
    event.respondWith(cacheFirst(req));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') event.respondWith(fonts(req));
});

// Page : réseau d'abord ; cache si hors ligne, erreur serveur, ou réseau plus lent que 3,5 s
async function appPage(network) {
  const cached = await caches.match(PAGE);
  if (!cached) return network;
  const fresh = network.then(res => (res && res.ok ? res : cached), () => cached);
  const slow = new Promise(resolve => setTimeout(() => resolve(cached), 3500));
  return Promise.race([fresh, slow]);
}

async function cacheFirst(req) {
  const cached = await caches.match(req, { ignoreSearch: true });
  if (cached) return cached;
  const res = await fetch(req);
  if (res && res.ok) { const cache = await caches.open(VERSION); cache.put(req, res.clone()); }
  return res;
}

async function fonts(req) {
  const cache = await caches.open(FONTS);
  const cached = await cache.match(req);
  const network = fetch(req).then(res => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
    return res;
  });
  if (cached) { network.catch(() => {}); return cached; }
  return network;
}

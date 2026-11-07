/* Service worker — Fiches Kiné : utilisation hors ligne.
   Tous les fichiers de l'app sont gardés ensemble, sous un même numéro de VERSION :
   l'app s'ouvre toujours tout de suite, avec des fichiers qui vont ensemble.
   À chaque modification de l'app : changer VERSION ici ET <meta name="app-version"> dans index.html
   (même valeur ; « node tools/check.js » vérifie). Le navigateur installe alors la nouvelle version
   en arrière-plan et la page affiche le bandeau « Nouvelle version disponible ». */
const VERSION = 'fiches-kine-2026-11-07-v2e3';
const FONTS = 'fiches-kine-fonts';
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'data/fiches.js', 'data/cas.js',
  'js/core.js', 'js/quiz-cartes.js', 'js/recherche.js', 'js/tests.js', 'js/vues.js', 'js/apprentissage.js', 'js/progression.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'
];
const PAGE = new URL('index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  // cache: 'reload' : on ignore le cache HTTP pour être sûr d'avoir les fichiers de cette version
  event.waitUntil(caches.open(VERSION)
    .then(cache => cache.addAll(CORE.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
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
    // Page (avec ou sans #/adresse) : copie en cache, sinon réseau
    if (req.mode === 'navigate') { event.respondWith(caches.match(PAGE).then(c => c || fetch(req))); return; }
    event.respondWith(cacheFirst(req));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') event.respondWith(fonts(req));
});

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

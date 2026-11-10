/**
 * Service worker — po prvom načítaní funguje aplikácia offline.
 * POZOR: pri zmene ktoréhokoľvek súboru zvýš CACHE, inak telefón drží starú verziu.
 */

const CACHE = 'edv-v1.2.0';

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/app.js',
  './js/store.js',
  './js/share.js',
  './js/data/norms.js',
  './js/data/cables.js',
  './js/data/reference.js',
  './js/data/glossary.js',
  './js/calc/core.js',
  './js/calc/voltdrop.js',
  './js/calc/ampacity.js',
  './js/calc/protection.js',
  './js/calc/design.js',
  './js/calc/motor.js',
  './js/calc/pv.js',
  './js/calc/wallbox.js',
  './js/ui/dom.js',
  './js/ui/result.js',
  './js/ui/methodIcons.js',
  './js/ui/calculator.js',
  './js/ui/motorView.js',
  './js/ui/pvView.js',
  './js/ui/wallboxView.js',
  './js/ui/tablesView.js',
  './js/ui/glossaryView.js',
  './js/ui/dataView.js',
  './js/ui/savedView.js',
  './js/ui/searchView.js',
  './js/ui/moreView.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) {
        // na pozadí skús obnoviť kópiu, ale vždy vráť to, čo je v cache (rýchle a offline)
        fetch(req).then((res) => {
          if (res && res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
        }).catch(() => {});
        return hit;
      }
      return fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    }),
  );
});

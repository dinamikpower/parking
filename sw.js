// Απλό cache του κελύφους ώστε η εφαρμογή να ανοίγει γρήγορα και χωρίς σήμα.
const C = 'parking-shell-v25';
const SHELL = ['./', './index.html', './map.js?v=24', './alpr.js?v=1', './manifest.json', './icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return; // Firebase/CDN: δικό τους δίκτυο
  e.respondWith(fetch(e.request, { cache:'no-cache' }).then(r => { caches.open(C).then(c => c.put(e.request, r.clone())); return r; }).catch(() => caches.match(e.request)));
});

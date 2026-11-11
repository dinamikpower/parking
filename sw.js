// Απλό cache του κελύφους ώστε η εφαρμογή να ανοίγει γρήγορα και χωρίς σήμα.
const C = 'parking-shell-v130', T = 'parking-tiles-v1', A = 'parking-ai-v1', F = 'parking-fb-v1';
const SHELL = ['./', './index.html', './map.js?v=36', './alpr.js?v=1', './auth.js?v=10', './live.js?v=7', './vendor/leaflet/leaflet.js', './vendor/leaflet/leaflet.css', './manifest.json', './icon-192.png', './apple-touch-icon.png', './icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C && k !== T && k !== A && k !== F).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.hostname === 'server.arcgisonline.com'){            // πλακίδια δορυφορικού: πρώτα η μνήμη (άμεσο άνοιγμα, δουλεύει και με αδύναμο σήμα)
    e.respondWith(caches.open(T).then(async c => {
      const hit = await c.match(e.request); if (hit) return hit;
      const r = await fetch(e.request);
      if (r.ok && r.type !== 'opaque'){ c.put(e.request, r.clone()).then(() => c.keys()).then(ks => { if (ks.length > 900) ks.slice(0, ks.length - 800).forEach(k => c.delete(k)); }); }
      return r;
    }));
    return;
  }
  if (u.pathname.includes('/models/') || (u.hostname === 'cdn.jsdelivr.net' && u.pathname.includes('onnxruntime-web'))){   // μοντέλα αναγνώρισης + ONNX runtime: κατεβαίνουν μία φορά και μένουν στη συσκευή
    e.respondWith(caches.open(A).then(async c => {
      const hit = await c.match(e.request); if (hit) return hit;
      const r = await fetch(e.request);
      if (r.ok || r.type === 'opaque') c.put(e.request, r.clone());
      return r;
    }));
    return;
  }
  if (u.hostname === 'www.gstatic.com' && u.pathname.includes('/firebasejs/10.14.1/')){   // βιβλιοθήκες Firebase (με έκδοση στη διεύθυνση, δεν αλλάζουν): πρώτα η μνήμη
    e.respondWith(caches.open(F).then(async c => {
      const hit = await c.match(e.request); if (hit) return hit;
      const r = await fetch(e.request);
      if (r.ok) c.put(e.request, r.clone());
      return r;
    }));
    return;
  }
  if (u.origin !== location.origin) return; // Firebase/CDN: δικό τους δίκτυο
  if (e.request.method === 'GET'){   // κέλυφος εφαρμογής: πρώτα η μνήμη (άνοιγμα αμέσως)· ανανεώνεται σε κάθε νέα έκδοση
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request, { cache:'no-cache' }).then(r => { if (r.ok) caches.open(C).then(c => c.put(e.request, r.clone())); return r; })).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(fetch(e.request, { cache:'no-cache' }).then(r => { caches.open(C).then(c => c.put(e.request, r.clone())); return r; }).catch(() => caches.match(e.request)));
});

// Push ειδοποιήσεις (FCM data message)
self.addEventListener('push', e => {
  let j = {}; try { j = e.data ? e.data.json() : {}; } catch {}
  const d = j.data || j.notification || j;
  e.waitUntil(self.registration.showNotification(d.title || '🔔 Ζητείται όχημα', { body: d.body || '', tag: d.tag || 'req', renotify: true, icon: './icon-192.png', badge: './icon-192.png', data: { vehicleId: d.vehicleId || '' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});

// Service worker de Nexo — funciona igual en vyntra-agency.github.io/nexo/ y en localhost:3001
const CACHE = 'nexo-v3';
const ASSETS = ['manifest.json', 'icon-192.png', 'icon-512.png', 'badge-96.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Solo íconos/manifest desde caché. La página, api.json y la API siempre de la red.
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (!ASSETS.some(a => url.pathname.endsWith('/' + a))) return;
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request)));
});

// ── Notificaciones push ──
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data?.json() || {}; } catch { data = { body: e.data?.text() }; }
  e.waitUntil(self.registration.showNotification(data.title || '◆ Nexo', {
    body: data.body || 'Tienes algo nuevo',
    icon: 'icon-192.png',
    badge: 'badge-96.png',
    vibrate: [180, 80, 180],
    tag: data.tag,
    renotify: !!data.tag,
    data: { url: new URL(data.url || './', self.registration.scope).href }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || self.registration.scope;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      const abierta = wins.find(w => w.url.startsWith(self.registration.scope));
      if (abierta) return abierta.focus().then(w => w.navigate(url));
      return clients.openWindow(url);
    })
  );
});

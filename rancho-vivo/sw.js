// Guarda la app en el teléfono para que abra sin señal.
// Al publicar una versión nueva, cambiar VERSION.
var VERSION = 'rv-2.4.0';
var ARCHIVOS = ['./', 'index.html', 'app.css', 'app.js', 'config.js', 'vendor/supabase.js', 'vendor/inter.woff2', 'manifest.webmanifest', 'icons/marca.svg', 'icons/curvas.svg', 'icons/topo.svg', 'icons/lomas.svg', 'vendor/cinzel.woff2', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', function (ev) {
  ev.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (ev) {
  ev.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (ev) {
  var r = ev.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  ev.respondWith(caches.open(VERSION).then(function (c) {
    return c.match(r, { ignoreSearch: true }).then(function (guardado) {
      var red = fetch(r).then(function (resp) { if (resp.ok) c.put(r, resp.clone()); return resp; }).catch(function () { return guardado || c.match('index.html'); });
      return guardado || red;
    });
  }));
});

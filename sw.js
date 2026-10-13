/* Cascarón de la PWA en caché: la app abre aunque no haya red.
   La app vive en Apps Script; aquí solo se guarda lo de este origen. */
var CACHE = 'ch-shell-v8';
var SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-192-maskable.png', './icon-512-maskable.png', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// Red primero y caché como respaldo, solo para este origen.
// GitHub Pages manda los archivos con diez minutos de caché del navegador, así que al publicar una
// versión nueva el cascarón seguía saliendo viejo un rato. Para la página principal se pide sin caché.
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  var esPagina = e.request.mode === 'navigate' || /(^|\/)(index\.html)?$/.test(url.pathname);
  e.respondWith(
    (esPagina ? fetch(e.request.url, { cache: 'reload' }) : fetch(e.request)).then(function (resp) {
      var copia = resp.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copia); });
      return resp;
    }).catch(function () {
      return caches.match(e.request).then(function (r) { return r || caches.match('./index.html'); });
    })
  );
});

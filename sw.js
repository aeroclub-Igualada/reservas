// Service worker: permite instalar la app y abrirla sin conexión.
// Primero intenta la red (así siempre se carga la última versión publicada);
// si no hay conexión, usa la última copia guardada.
const V = 'aeroclub-v5';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const propio = u.origin === self.location.origin;
  const libs = u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/');
  const fuentes = u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if (!propio && !libs && !fuentes) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); }
      return res;
    }).catch(() => caches.match(r, { ignoreSearch: true }).then(h => h || (r.mode === 'navigate' ? caches.match('index.html') : undefined)))
  );
});

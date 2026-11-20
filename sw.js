// Service worker: permite instalar la app y abrirla sin conexión.
// Primero intenta la red (así siempre se carga la última versión publicada).
// Si la red tarda más de 4 segundos (poca cobertura en el campo) o no hay conexión,
// usa la última copia guardada en el móvil.
const V = 'aeroclub-v11';
const BASE = ['./', 'index.html', 'logbook.html', 'escuela.html', 'manifest.webmanifest', 'icon-192.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => {
  self.skipWaiting();
  // guarda las tres partes desde el principio, aunque aún no se hayan abierto
  e.waitUntil(caches.open(V).then(c => Promise.all(BASE.map(u => c.add(u).catch(() => {})))));
});
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
  const guardada = () => caches.match(r, { ignoreSearch: true });
  e.respondWith(new Promise(resolve => {
    let hecho = false;
    const dar = x => { if (!hecho && x) { hecho = true; resolve(x); } };
    // pasados 4 s sin respuesta de la red, si hay copia guardada se usa ya
    const t = setTimeout(() => guardada().then(dar), 4000);
    fetch(r).then(res => {
      clearTimeout(t);
      if (res && (res.ok || res.type === 'opaque')) { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); }
      dar(res);
    }).catch(() => {
      clearTimeout(t);
      guardada().then(h => {
        if (h) return dar(h);
        if (r.mode === 'navigate') return caches.match('index.html').then(x => dar(x || Response.error()));
        dar(Response.error());
      });
    });
  }));
});

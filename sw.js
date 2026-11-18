// Service worker mínimo: permite instalar la app en el móvil.
// No guarda datos en caché: siempre carga la versión publicada.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});

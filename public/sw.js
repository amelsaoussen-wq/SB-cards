/* Service worker minimal : rend l'app installable (PWA) sans cache agressif. */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Réseau d'abord (pas de cache obsolète) ; requis pour l'installabilité.
  event.respondWith(fetch(event.request));
});

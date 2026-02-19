self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Required for PWA to be installable, but we don't need to cache anything specifically for now
  event.respondWith(fetch(event.request));
});

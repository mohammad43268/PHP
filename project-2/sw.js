// DevForge AI – Service Worker
// Caches static assets for offline support

const CACHE_NAME = 'devforge-v1.0.0';
const STATIC_ASSETS = [
  '/PHP/project-2/',
  '/PHP/project-2/index.php',
  '/PHP/project-2/frontend/assets/css/main.css',
  '/PHP/project-2/frontend/assets/css/animations.css',
  '/PHP/project-2/frontend/assets/css/components.css',
  '/PHP/project-2/frontend/assets/js/app.js',
  '/PHP/project-2/frontend/assets/js/api.js',
  '/PHP/project-2/frontend/assets/js/ui.js',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and API requests (always fresh)
  if (event.request.method !== 'GET') return;
  if (url.pathname.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

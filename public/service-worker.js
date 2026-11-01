/**
 * Flag Battle Arena - Offline Service Worker
 * Ensures 100% offline gameplay functionality with robust scope & cache management
 */

const CACHE_NAME = 'flag-battle-arena-v1.1.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      const urls = PRECACHE_ASSETS.map((asset) => new URL(asset, self.registration.scope).href);
      return cache.addAll(urls).catch((err) => {
        console.warn('Some core assets failed to precache during install:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('Purging outdated service worker cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') return;

  // Ignore browser extensions or other protocols
  if (!event.request.url.startsWith('http')) return;

  // 1. Navigation requests (HTML pages): Network-First to prevent stale/broken HTML caching
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return caches.match(new URL('index.html', self.registration.scope).href).then((fallback) => {
              return fallback || caches.match(self.registration.scope);
            });
          });
        })
    );
    return;
  }

  // 2. Subresources (CSS, JS, images, audio, etc.): Cache-first with network fallback & runtime caching
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Revalidate in background for non-hashed resources
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {
          // Offline, cached version returned
        });
        return cachedResponse;
      }

      // Fetch from network and store in cache
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});

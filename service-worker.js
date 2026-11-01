/**
 * Flag Battle Arena - Offline Service Worker
 * Ensures 100% offline gameplay functionality
 */

const CACHE_NAME = 'flag-battle-arena-v1.0.0';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon.svg',
  '/css/style.css',
  '/css/menu.css',
  '/css/game.css',
  '/css/responsive.css',
  '/js/app.js',
  '/js/navigation.js',
  '/js/countries.js',
  '/js/flag-selector.js',
  '/js/game-engine.js',
  '/js/physics-engine.js',
  '/js/flag-character.js',
  '/js/ai-controller.js',
  '/js/camera-controller.js',
  '/js/competition-manager.js',
  '/js/tournament-manager.js',
  '/js/audio-manager.js',
  '/js/storage-manager.js',
  '/competitions/sumo.js',
  '/competitions/obstacle-race.js',
  '/competitions/last-survivor.js',
  '/competitions/tug-of-war.js',
  '/competitions/rising-lava.js',
  '/competitions/bowling.js',
  '/competitions/jump-challenge.js',
  '/competitions/downhill-race.js',
  '/competitions/glass-bridge.js',
  '/competitions/spin-battle.js',
  '/competitions/tower-climb.js',
  '/competitions/football-battle.js',
  '/libraries/three.module.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Some assets failed to precache during install:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
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

  const url = new URL(event.request.url);

  // Cache-first strategy for local assets, fallback to network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch and update cache in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {
          // Offline, cached version already returned
        });
        return cachedResponse;
      }

      // If not in cache, fetch from network and store
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

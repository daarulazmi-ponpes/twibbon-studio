/* ============================================
   DAARUL AZMI TWIBBON STUDIO - Service Worker
   ============================================ */

const CACHE_NAME = 'twibbon-studio-v13';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './kampanye.html',
  './frame.html',
  './editor.html',
  './panduan.html',
  './login.html',
  './admin.html',
  './css/global.css',
  './css/layout.css',
  './css/mobile.css',
  './css/editor.css',
  './js/app.js',
  './js/campaigns.js',
  './js/canvas-engine.js',
  './js/editor.js',
  './js/admin.js',
  './js/download.js',
  './data/campaigns.json',
  './manifest.json',
  './assets/logo/logo.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((error) => {
        console.log('Cache install failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request).then((networkResponse) => {
          // Cache new requests
          if (networkResponse && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          return networkResponse;
        }).catch(() => {
          // Return offline page if available
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

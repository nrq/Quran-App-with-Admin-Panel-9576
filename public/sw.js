// Service Worker for Offline Quran App
const STATIC_CACHE_VERSION = 'v2';
const AUDIO_CACHE_VERSION = 'v1';
const STATIC_CACHE_NAME = `quran-app-static-${STATIC_CACHE_VERSION}`;
const AUDIO_CACHE_NAME = `quran-audio-${AUDIO_CACHE_VERSION}`;
const STATIC_CACHE_URLS = [
  '/',
  '/data/quran-verses.json',
  // Add other static assets as needed
];
const KNOWN_CACHES = new Set([STATIC_CACHE_NAME, AUDIO_CACHE_NAME]);

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
  caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service worker installed and caching complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!KNOWN_CACHES.has(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const { request } = event;
  const requestUrl = new URL(request.url);

  const isAudioRequest =
    request.destination === 'audio' ||
    requestUrl.pathname.endsWith('.mp3') ||
    request.headers.get('Accept')?.includes('audio/');

  if (isAudioRequest) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          return cachedResponse || Response.error();
        }
      })
    );
    return;
  }

  // Handle Quran data requests
  if (request.url.includes('/data/quran-verses.json')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            console.log('Serving Quran data from cache');
            return response;
          }
          
          // If not in cache, fetch and cache
          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            });
        })
        .catch(() => {
          console.log('Network failed, serving from cache');
          return caches.match(event.request);
        })
    );
    return;
  }

  // Handle other requests with network-first strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache when network fails
        return caches.match(request);
      })
  );
});
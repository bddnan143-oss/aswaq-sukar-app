// Service Worker for «أسواق قلعة سكر» (Aswaq Qalat Sukkar PWA)
const CACHE_NAME = 'aswaq-sukkar-cache-v1';
const OFFLINE_FALLBACK_URL = '/';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Tajawal:wght@400;500;700;800&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
];

// 1. INSTALLATION: Precache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Some precache assets could not be cached immediately:', err);
      });
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 2. ACTIVATION: Clean up outdated caches & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. FETCH: Strategy Router
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // A. Navigation Requests (HTML Page load / reload)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // If offline, serve cached page or fallback
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallback = await caches.match(OFFLINE_FALLBACK_URL);
          if (fallback) return fallback;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // B. API calls: Network-first, fallback to cache if available
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful GET API responses as backup
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return empty structured JSON if no cache
          return new Response(JSON.stringify({ offline: true, error: 'غير متصل بالإنترنت، يتم الاعتماد على البيانات المحلية.' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503,
            statusText: 'Service Unavailable (Offline)'
          });
        })
    );
    return;
  }

  // C. Static Assets & Images: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. MESSAGE: Allow skip waiting from client app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

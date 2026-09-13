// PAYAL Service Worker - Background Audio & Voice Assistant Keep-Alive
const CACHE_NAME = 'payal-assistant-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// 1. Install & Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('SW Precache note:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate & Claim Clients Immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Keep-Alive Message Bus for Background Audio & Voice Processing
let backgroundHeartbeatInterval = null;

function ensureHeartbeat() {
  if (backgroundHeartbeatInterval) return;
  backgroundHeartbeatInterval = setInterval(async () => {
    try {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        client.postMessage({
          type: 'SW_BACKGROUND_HEARTBEAT',
          timestamp: Date.now(),
        });
      }
    } catch (_err) {}
  }, 1000); // 1-second background pulse keeps the window thread informed
}

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'START_BACKGROUND_LISTENING') {
    ensureHeartbeat();
    event.source?.postMessage({
      type: 'BACKGROUND_LISTENING_CONFIRMED',
      status: 'active',
      timestamp: Date.now(),
    });
  } else if (data.type === 'STOP_BACKGROUND_LISTENING') {
    if (backgroundHeartbeatInterval) {
      clearInterval(backgroundHeartbeatInterval);
      backgroundHeartbeatInterval = null;
    }
    event.source?.postMessage({
      type: 'BACKGROUND_LISTENING_CONFIRMED',
      status: 'idle',
      timestamp: Date.now(),
    });
  } else if (data.type === 'KEEP_ALIVE_PING') {
    ensureHeartbeat();
    event.source?.postMessage({
      type: 'KEEP_ALIVE_PONG',
      timestamp: Date.now(),
    });
  }
});

// 4. Fetch Strategy (Network first with cache fallback, bypass API routes)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API routes or dynamic server calls
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Navigation requests: network first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Static assets: cache first, update in background
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Refresh cache in background
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});

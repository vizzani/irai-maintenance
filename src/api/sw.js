const CACHE_NAME = 'irai-offline-v1';
const API_CACHE = 'irai-api-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((response) => {
        return response || fetch(request);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});

async function handleApiRequest(request) {
  const url = new URL(request.url);

  if (!navigator.onLine) {
    const cached = await caches.match(request);
    if (cached) return cached;
  }

  try {
    const response = await fetch(request);
    const cloned = response.clone();
    
    if (url.pathname.includes('/verifiche/save') || url.pathname.includes('/verbali')) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, cloned);
    }
    
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-verifiche') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  const db = await openIDB();
  const tx = db.transaction('pending_sync', 'readonly');
  const store = tx.objectStore('pending_sync');
  const pending = await store.getAll();

  for (const item of pending) {
    try {
      const response = await fetch('/api/verifiche/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });

      if (response.ok) {
        const delTx = db.transaction('pending_sync', 'readwrite');
        await delTx.objectStore('pending_sync').delete(item.id);
      }
    } catch (err) {
      console.error('Sync failed:', err);
    }
  }
}

function openIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('IRAI_DB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending_sync')) {
        db.createObjectStore('pending_sync', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('dispositivi')) {
        db.createObjectStore('dispositivi', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('verifiche_cache')) {
        db.createObjectStore('verifiche_cache', { keyPath: 'id' });
      }
    };
  });
}

self.addEventListener('message', (event) => {
  if (event.data.type === 'SAVE_OFFLINE') {
    saveOfflineData(event.data.payload);
  }
});

async function saveOfflineData(payload) {
  const db = await openIDB();
  const tx = db.transaction('pending_sync', 'readwrite');
  tx.objectStore('pending_sync').add({
    payload,
    timestamp: Date.now(),
  });
}

self.clients.matchAll().then((clients) => {
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_COMPLETE' });
  });
});
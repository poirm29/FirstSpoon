const CACHE_NAME = 'firstspoon-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // HTML 탐색 요청은 항상 네트워크 우선 (배포 후 구 버전 캐시 방지)
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request));
    return;
  }

  // API 요청은 캐시하지 않음
  if (url.pathname.startsWith('/api/') || url.hostname.includes('googleapis.com')) return;

  // 해시된 정적 자산(JS/CSS)만 캐시
  if (url.pathname.match(/\/assets\/.+\.(js|css)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200) return response;
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        });
      })
    );
  }
});

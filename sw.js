/**
 * Quant-FX Research - Progressive Web App Service Worker (sw.js)
 * 遵循 W3C PWA / Service Worker 现代标准规范
 * 缓存策略:
 *  - HTML 页面导航: Network-First (确保每次发布后用户立即获取最新页面，杜绝陈旧 HTML 劫持)
 *  - 动态 JSON 数据切片: Network-First + 归一化无 Query 缓存 Key (防止 ?v= 时间戳导致 Cache 膨胀与离线失配)
 *  - 静态 CSS/JS/图标资产: Stale-While-Revalidate (保证秒开 + 异步后台刷新)
 */

const CACHE_VERSION = 'v4.2.202611130225';
const STATIC_CACHE_NAME = `quant-fx-static-${CACHE_VERSION}`;
const DATA_CACHE_NAME = `quant-fx-data-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './transactions.html',
  './base-data-transactions.html',
  './model-transactions.html',
  './trade-transactions.html',
  './manifest.json',
  './assets/favicon.svg',
  './assets/css/style.css?v=20261113_v5',
  './assets/css/components.css?v=20261113_v5',
  './assets/css/responsive.css?v=20261113_v5',
  './assets/js/utils.js',
  './assets/js/pwa.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable.png',
  './assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // 策略 A: 针对 assets/data/ 动态 JSON 切片采用 Network-First + 剥离 Query 参数归一化缓存键
  if (url.pathname.includes('/assets/data/')) {
    const cleanDataUrl = url.origin + url.pathname;
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => {
              cache.put(cleanDataUrl, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(cleanDataUrl);
          if (cachedResponse) return cachedResponse;
          return new Response(JSON.stringify({ status: 'offline', message: '当前处于离线模式' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // 策略 B: 针对 HTML 页面导航采用 Network-First (彻底杜绝陈旧 HTML 缓存劫持)
  if (request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          return (await caches.match(request)) || (await caches.match('./index.html')) || (await caches.match('./'));
        })
    );
    return;
  }

  // 策略 C: 针对 CSS/JS/图标静态资源采用 Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
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

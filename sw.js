/**
 * Quant-FX Research - Progressive Web App Service Worker (sw.js)
 * 遵循 W3C PWA / Service Worker 现代标准规范
 * 缓存策略:
 *  - 静态 App Shell: Stale-While-Revalidate (保证秒开 + 异步后台刷新)
 *  - 动态 JSON 数据切片: Network-First with Cache Fallback (优先保证最新行情，离线平滑降级)
 */

const CACHE_VERSION = 'v1.0.1';
const STATIC_CACHE_NAME = `quant-fx-static-${CACHE_VERSION}`;
const DATA_CACHE_NAME = `quant-fx-data-${CACHE_VERSION}`;

// 核心 App Shell 离线预缓存清单
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './transactions.html',
  './base-data-transactions.html',
  './manifest.json',
  './assets/favicon.svg',
  './assets/css/style.css?v=20261011_v2',
  './assets/css/components.css?v=20261011_v2',
  './assets/css/responsive.css?v=20261011_v2',
  './assets/js/utils.js',
  './assets/js/pwa.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable.png',
  './assets/icons/apple-touch-icon.png'
];

// 1. 安装生命周期 (Install)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] 正在预缓存核心 App Shell 资源...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. 激活生命周期 (Activate): 清除过时版本缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[Service Worker] 清理过期旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 网络请求拦截与分层缓存策略 (Fetch)
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 忽略非 GET 请求
  if (request.method !== 'GET') return;

  // 忽略第三方外链或非 HTTP(S) 请求
  if (!url.protocol.startsWith('http')) return;

  // 策略 A: 针对 assets/data/ 动态切片采用 Network-First with Cache Fallback
  if (url.pathname.includes('/assets/data/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 仅缓存成功的 200 响应
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // 网络不可用时，平滑降级读取本地缓存切片
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            console.log('[Service Worker] 网络离线，自本地缓存加载数据切片:', url.pathname);
            return cachedResponse;
          }
          // 若连缓存都没有，返回标准脱机空 JSON
          return new Response(JSON.stringify({ status: 'offline', message: '当前处于离线模式' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // 策略 B: 针对页面与静态资产采用 Stale-While-Revalidate
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
        .catch(() => {
          // 若脱网且为页面导航请求，优雅回退到 index.html
          if (request.mode === 'navigate') {
            return caches.match('./index.html') || caches.match('./');
          }
        });

      // 缓存命中则优先立即返回，同时后台拉取最新；若未命中则等待网络返回
      return cachedResponse || fetchPromise;
    })
  );
});

// 九四班官网 Service Worker
// 离线缓存策略：
// - 静态资源（_next/static, 图片, css, js）：Cache First + 后台更新
// - API 请求（GET）：Network First，失败回退缓存
// - HTML 页面：Network First，失败回退 offline.html
// - POST/PUT/DELETE：不缓存，直接放行

const SW_VERSION = 'gw94-v1.0.0-2026'
const STATIC_CACHE = `${SW_VERSION}-static`
const API_CACHE = `${SW_VERSION}-api`
const PAGE_CACHE = `${SW_VERSION}-pages`

// 预缓存的核心资源（install 时缓存）
const PRECACHE_URLS = [
  '/',
  '/favicon.svg',
  '/manifest.webmanifest',
  '/offline.html',
]

// ========== Install：预缓存 + 激活 ==========
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(SW_VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

// ========== Fetch 拦截 ==========
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 只处理同源 GET
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) {
    // 外链（如 picsum.photos）走 cache-first 但不阻塞
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request)
            .then((res) => {
              if (res.ok) {
                const clone = res.clone()
                caches.open(STATIC_CACHE).then((c) => c.put(request, clone))
              }
              return res
            })
            .catch(() => cached),
      ),
    )
    return
  }

  // API 请求：Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(API_CACHE).then((c) => c.put(request, clone))
          }
          return res
        })
        .catch(() => caches.match(request).then((r) => r || new Response('{"error":"offline"}', { status: 503, headers: { 'Content-Type': 'application/json' } }))),
    )
    return
  }

  // HTML 页面：Network First + 离线回退
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(PAGE_CACHE).then((c) => c.put(request, clone))
          }
          return res
        })
        .catch(() =>
          caches.match(request).then((r) => r || caches.match('/offline.html')),
        ),
    )
    return
  }

  // 静态资源：Cache First + 后台更新（stale-while-revalidate）
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(STATIC_CACHE).then((c) => c.put(request, clone))
          }
          return res
        })
        .catch(() => cached)
      return cached || fetchPromise
    }),
  )
})

// ========== 消息通信：手动更新 ==========
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

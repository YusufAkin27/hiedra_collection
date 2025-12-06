const CACHE_NAME = 'hiedra-offline-v2'
const OFFLINE_URL = '/offline.html'
const APP_SHELL = ['/', '/index.html', OFFLINE_URL, '/logo.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((staleKey) => caches.delete(staleKey))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const requestURL = new URL(request.url)

  if (request.method !== 'GET') {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Başarılı response döndür
          if (response && response.status === 200) {
            return response
          }
          // 404 veya başka hata durumunda index.html döndür
          return caches.match('/index.html').then((cached) => {
            return cached || fetch('/index.html')
          })
        })
        .catch(async () => {
          // Network hatası durumunda önce index.html'i dene
          const cache = await caches.open(CACHE_NAME)
          const cachedIndex = await cache.match('/index.html')
          if (cachedIndex) {
            return cachedIndex
          }
          // Yoksa offline sayfasını döndür
          return cache.match(OFFLINE_URL) || cache.match('/')
        })
    )
    return
  }

  if (requestURL.origin !== self.location.origin) {
    return
  }

  const cacheableDestinations = [
    'style',
    'script',
    'worker',
    'image',
    'font',
    'document'
  ]

  if (!cacheableDestinations.includes(request.destination)) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse
          }

          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })

          return networkResponse
        })
        .catch(() => {
          if (request.destination === 'image') {
            return caches.match('/logo.png')
          }
          return cachedResponse
        })
    })
  )
})


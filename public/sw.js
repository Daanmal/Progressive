/* Hand-written service worker for the progressive sign.
   Registered from src/main.tsx in production builds as /sw.js?v=<build id>,
   so every build gets a fresh cache namespace. */

const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev'
const CACHE = `progressive-${VERSION}`
const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/fonts/playfair-display-800-italic.woff2',
  '/fonts/oswald.woff2',
  '/fonts/source-sans-3.woff2',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navigations: network first so a new build is picked up, cached shell otherwise.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request)
          if (response.ok) {
            const cache = await caches.open(CACHE)
            await cache.put('/index.html', response.clone())
          }
          return response
        } catch {
          const cache = await caches.open(CACHE)
          return (
            (await cache.match('/index.html')) ||
            (await cache.match('/')) ||
            new Response('Offline', { status: 503, statusText: 'Offline' })
          )
        }
      })(),
    )
    return
  }

  // Hashed build output and fonts: cache first.
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/fonts/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE)
        const cached = await cache.match(request)
        if (cached) return cached
        const response = await fetch(request)
        if (response.ok) await cache.put(request, response.clone())
        return response
      })(),
    )
  }
})

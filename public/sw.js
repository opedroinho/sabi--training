const CACHE = 'ws-treinos-v1'

// App shell — pages and assets to pre-cache on install
const PRECACHE = [
  '/',
  '/student',
  '/trainer',
  '/login',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  // Remove old caches from previous versions
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GET requests — skip Supabase API calls
  if (request.method !== 'GET' || !url.origin === location.origin) return
  if (url.pathname.startsWith('/api/')) return
  if (url.hostname.includes('supabase')) return

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses (not opaque/error)
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE).then(cache => cache.put(request, clone))
        }
        return response
      })
      .catch(() => {
        // Network failed — serve from cache
        return caches.match(request).then(cached => {
          if (cached) return cached
          // Offline fallback for navigation requests
          if (request.mode === 'navigate') return caches.match('/')
          return new Response('Offline', { status: 503 })
        })
      })
  )
})

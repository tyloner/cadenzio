const CACHE = "cadenz-v2"

// App shell routes to pre-cache on install
const PRECACHE = ["/", "/dashboard", "/record", "/map", "/manifest.json"]

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return
  const url = new URL(e.request.url)

  // Never intercept API or auth routes — always go to network
  if (url.pathname.startsWith("/api/")) return

  // Static assets (_next/static): cache-first, they're already content-hashed by Next.js
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached
        return fetch(e.request).then((res) => {
          if (res.status === 200) {
            const clone = res.clone()
            caches.open(CACHE).then((c) => c.put(e.request, clone))
          }
          return res
        })
      })
    )
    return
  }

  // Navigation and page routes: stale-while-revalidate
  // Respond immediately from cache (fast), then fetch fresh copy in the background
  e.respondWith(
    caches.open(CACHE).then((cache) => {
      return cache.match(e.request).then((cached) => {
        const fetchPromise = fetch(e.request)
          .then((res) => {
            if (res.status === 200 && url.origin === location.origin) {
              cache.put(e.request, res.clone())
            }
            return res
          })
          .catch(() => cached) // offline fallback

        // Return cached version immediately if available, otherwise wait for network
        return cached ?? fetchPromise
      })
    })
  )
})

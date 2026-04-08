const CACHE = "cadenz-v3"

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

// Push notifications
self.addEventListener("push", (e) => {
  if (!e.data) return
  let payload
  try { payload = e.data.json() } catch { return }
  e.waitUntil(
    self.registration.showNotification(payload.title ?? "Cadenzio", {
      body: payload.body,
      icon: "/api/icon/192",
      badge: "/api/icon/96",
      data: { url: payload.url ?? "/dashboard" },
      tag: "cadenzio-notification",
      renotify: true,
    })
  )
})

self.addEventListener("notificationclick", (e) => {
  e.notification.close()
  const url = e.notification.data?.url ?? "/dashboard"
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin))
      if (existing) { existing.focus(); existing.navigate(url) }
      else self.clients.openWindow(url)
    })
  )
})

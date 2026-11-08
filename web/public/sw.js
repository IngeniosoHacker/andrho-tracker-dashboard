// AndRho's service worker: only Web Push. andrho-api (internal/notify)
// sends {title, body, url, tag} when something AndRho was preparing is
// ready (the ERP after signup); a click opens (or focuses) the panel.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'AndRho', {
      body: data.body || '',
      tag: data.tag || 'andrho',
      icon: '/images/logo/andrho-mark.png',
      badge: '/images/logo/andrho-mark.png',
      data: { url: data.url || '/dashboard/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/dashboard/', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => c.url.startsWith(self.location.origin + '/dashboard'))
      if (open) return open.focus().then((c) => c.navigate(url))
      return self.clients.openWindow(url)
    }),
  )
})

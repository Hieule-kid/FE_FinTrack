// Kill-switch for the Serwist service worker that shipped before the PWA
// revert (commit 2ca3199). Browsers that installed that worker still have it
// registered at scope "/" and will fetch this exact URL on their next
// spec-mandated update check (bypasses HTTP cache), even though the app no
// longer registers a service worker at all. That stale worker is what emits
// "navigation preload request was cancelled" — its NetworkFirst navigation
// handler had navigationPreload enabled but the app's client-side route
// transitions routinely abort the underlying navigation before preload
// settles. This file replaces it byte-for-byte differently, wins the update,
// wipes its caches, and unregisters — a one-time self-destruct, not new PWA
// functionality. Safe to leave in place indefinitely: nothing in the current
// app calls navigator.serviceWorker.register(), so browsers that never had
// the old worker will never fetch this file.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));

      await self.registration.unregister();

      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })(),
  );
});

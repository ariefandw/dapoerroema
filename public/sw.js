// Dapoer Roema Service Worker — basic cache-first strategy for offline support
const CACHE_NAME = "dapoer-roema-v1";

// Static assets to pre-cache on install
const PRECACHE_URLS = [
    "/",
    "/manifest.json",
    "/icon-192.png",
    "/icon-512.png",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    // Only cache GET requests, skip API and auth routes
    if (event.request.method !== "GET") return;
    const url = new URL(event.request.url);
    if (url.pathname.startsWith("/api/")) return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            // Network-first for HTML pages, cache-first for assets
            const isNavigation = event.request.mode === "navigate";
            if (isNavigation) {
                return fetch(event.request)
                    .then((response) => {
                        if (response.ok) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
                        }
                        return response;
                    })
                    .catch(() => cached || caches.match("/"));
            }
            return (
                cached ||
                fetch(event.request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
                    }
                    return response;
                })
            );
        })
    );
});

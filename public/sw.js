/* Spotlight Learning service worker.
 * Strategy:
 *   - App shell (start_url, offline fallback, static assets): cache-first.
 *   - Next.js chunked JS/CSS (/_next/static/...): cache-first, immutable.
 *   - Navigation HTML: network-first with offline fallback.
 *   - GET API calls: stale-while-revalidate with short TTL.
 *   - Non-GET: pass-through (never cache).
 */
const VERSION = "sl-v2";
const SHELL_CACHE = `${VERSION}-shell`;
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE = `${VERSION}-pages`;
const API_CACHE = `${VERSION}-api`;

const OFFLINE_URL = "/offline.html";
const SHELL_URLS = [OFFLINE_URL, "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(SHELL_URLS).catch(() => {});
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/icon.svg" ||
    url.pathname === "/icon-maskable.svg" ||
    url.pathname === "/favicon.ico" ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/images/")
  );
}

function isGetApi(request, url) {
  if (request.method !== "GET") return false;
  if (!url.pathname.startsWith("/api/")) return false;
  // Don't cache auth / realtime / write-heavy endpoints.
  if (url.pathname.startsWith("/api/auth")) return false;
  if (url.pathname.startsWith("/api/tts")) return false;
  if (url.pathname.startsWith("/api/speech/")) return false;
  if (url.pathname.startsWith("/api/ai/")) return false;
  return true;
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const resp = await fetch(request);
  if (resp && resp.ok) cache.put(request, resp.clone()).catch(() => {});
  return resp;
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      cache.put(request, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response("Offline", { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((resp) => {
      if (resp && resp.ok) cache.put(request, resp.clone()).catch(() => {});
      return resp;
    })
    .catch(() => null);
  return cached || (await fetchPromise) || new Response("Offline", { status: 503 });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle same-origin GETs otherwise.
  if (url.origin !== self.location.origin) return;

  // Navigations → network-first + offline fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  // Static: cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // GET APIs → SWR
  if (isGetApi(request, url)) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // Everything else — pass through.
});

// Push notifications
self.addEventListener("push", (event) => {
  let payload = { title: "Spotlight", body: "Новое уведомление", url: "/" };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch (_) {
      payload.body = event.data.text() || payload.body;
    }
  }
  const options = {
    body: payload.body,
    icon: payload.icon || "/icon.svg",
    badge: "/icon.svg",
    tag: payload.tag,
    data: { url: payload.url || "/" },
    renotify: Boolean(payload.tag),
  };
  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) {
        if (c.url.includes(self.location.origin)) {
          c.focus();
          c.navigate(url).catch(() => {});
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});

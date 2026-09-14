/* global importScripts */
/* Shell only. Audio is explicitly downloaded into verified private files. */
importScripts("/precache-manifest.js");
const manifest = self.APP_RELAX_PRECACHE;
if (!manifest || !/^[a-f0-9]{64}$/.test(manifest.revision))
  throw new Error("PWA shell was not finalized.");
const SHELL_CACHE = `ritual-audio-shell-${manifest.revision}`;

function isAudioRequest(request, url) {
  const accept = request.headers.get("accept") || "";
  return (
    request.headers.has("range") ||
    request.destination === "audio" ||
    accept.includes("audio/") ||
    url.pathname.startsWith("/audio-catalog/") ||
    /\.(?:flac|wav)$/i.test(url.pathname)
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      try {
        // Sequential full-shell precache: JS, fonts, artwork and consumer routes.
        for (const url of manifest.urls) {
          const response = await fetch(
            new Request(url, {
              cache: "reload",
              credentials: "same-origin",
              redirect: "error",
            }),
          );
          if (!response.ok || response.type !== "basic")
            throw new Error(`Shell asset unavailable: ${url}`);
          await cache.put(url, response);
        }
      } catch (error) {
        await caches.delete(SHELL_CACHE);
        throw error;
      }
    })(),
  );
  // Updates wait for old clients to close; never interrupt an active session.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("ritual-audio-shell-") && key !== SHELL_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      ),
  );
});

// An OPFS download alone does not prove that a future offline page can open.
self.addEventListener("message", (event) => {
  // Explicit recovery from a stale installed shell; never interrupt another client.
  if (
    event.origin === self.location.origin &&
    event.data?.type === "APP_RELAX_APPLY_UPDATE" &&
    event.ports?.[0]
  ) {
    event.waitUntil(
      (async () => {
        const sender = event.source?.url ? new URL(event.source.url) : null;
        if (
          sender?.origin !== self.location.origin ||
          sender.pathname !== "/update.html"
        )
          return;
        const clients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        const otherApp = clients.some((client) => {
          const url = new URL(client.url);
          return (
            url.origin === self.location.origin &&
            url.pathname !== "/update.html"
          );
        });
        if (otherApp) {
          event.ports[0].postMessage({ type: "APP_RELAX_UPDATE_BLOCKED" });
          return;
        }
        await self.skipWaiting();
        event.ports[0].postMessage({ type: "APP_RELAX_UPDATE_ACCEPTED" });
      })(),
    );
    return;
  }
  if (
    event.origin !== self.location.origin ||
    event.data?.type !== "APP_RELAX_CHECK_SHELL" ||
    !event.ports?.[0]
  )
    return;
  event.waitUntil(
    (async () => {
      let complete = false;
      try {
        const cache = await caches.open(SHELL_CACHE);
        complete = true;
        for (const url of manifest.urls) {
          if (!(await cache.match(url))) {
            complete = false;
            break;
          }
        }
      } catch {
        complete = false;
      }
      event.ports[0].postMessage({
        type: "APP_RELAX_SHELL_STATUS",
        revision: manifest.revision,
        complete,
      });
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    isAudioRequest(request, url) ||
    url.pathname === "/update.html" ||
    url.pathname === "/pwa-update.js"
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      const path = url.pathname;
      const canonical =
        request.mode === "navigate" &&
        path !== "/" &&
        !/\.[a-z0-9]+$/i.test(path)
          ? `${path.replace(/\/$/, "")}.html`
          : path;
      const cached = await cache.match(canonical);
      if (cached) return cached;
      try {
        return await fetch(request);
      } catch {
        return request.mode === "navigate"
          ? (await cache.match("/offline.html")) || Response.error()
          : Response.error();
      }
    })(),
  );
});

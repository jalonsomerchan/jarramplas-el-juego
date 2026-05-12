importScripts("./pwa-assets.js");

const {
  CACHE_VERSION,
  CORE_ASSETS,
  GAMEPLAY_ASSETS,
} = self.JARRAMPLAS_PWA_ASSETS;

const CORE_CACHE = `${CACHE_VERSION}-core`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const CACHE_PREFIX = "jarramplas-v";

async function addAllSettled(cacheName, assets) {
  const cache = await caches.open(cacheName);
  const results = await Promise.allSettled(
    assets.map(async (asset) => {
      const request = new Request(asset, { cache: "reload" });
      const response = await fetch(request);
      if (!response || !response.ok) {
        throw new Error(`No se pudo cachear ${asset}: ${response?.status || "sin respuesta"}`);
      }
      await cache.put(asset, response);
      return asset;
    })
  );

  const failed = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason?.message || String(result.reason));

  if (failed.length) {
    console.warn("[Jarramplas SW] Algunos assets no se pudieron cachear.", failed);
  }

  return { ok: results.length - failed.length, failed };
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  clients.forEach((client) => client.postMessage(message));
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    await addAllSettled(CORE_CACHE, CORE_ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && !key.startsWith(CACHE_VERSION))
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
    notifyClients({ type: "JARRAMPLAS_SW_READY", version: CACHE_VERSION });
    event.waitUntil(addAllSettled(ASSET_CACHE, GAMEPLAY_ASSETS));
  })());
});

function isLocalRequest(request) {
  return new URL(request.url).origin === self.location.origin;
}

function cleanRequest(request) {
  const url = new URL(request.url);
  url.search = "";
  return new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    mode: request.mode === "navigate" ? "same-origin" : request.mode,
    credentials: request.credentials,
    redirect: request.redirect,
    referrer: request.referrer,
  });
}

function requestPathname(request) {
  return new URL(request.url).pathname;
}

function isStaticAsset(request) {
  const pathname = requestPathname(request);
  return pathname.endsWith(".js")
    || pathname.endsWith(".css")
    || pathname.endsWith(".webmanifest");
}

function isRuntimeAsset(request) {
  const pathname = requestPathname(request);
  return pathname.endsWith(".png")
    || pathname.endsWith(".jpg")
    || pathname.endsWith(".jpeg")
    || pathname.endsWith(".webp")
    || pathname.endsWith(".gif")
    || pathname.endsWith(".svg");
}

async function putIfOk(cacheName, request, response) {
  if (!response || !response.ok) return;
  const cache = await caches.open(cacheName);
  await cache.put(cleanRequest(request), response.clone());
}

async function matchAny(request) {
  const clean = cleanRequest(request);
  return caches.match(clean, { ignoreSearch: true })
    || caches.match(request, { ignoreSearch: true });
}

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    await putIfOk(CORE_CACHE, "./index.html", response);
    return response;
  } catch {
    return matchAny("./index.html");
  }
}

async function networkFirstStaticAsset(request) {
  try {
    const clean = cleanRequest(request);
    const response = await fetch(clean, { cache: "no-cache" });
    await putIfOk(CORE_CACHE, request, response);
    return response;
  } catch {
    return matchAny(request);
  }
}

async function staleWhileRevalidateAsset(request) {
  const cached = await matchAny(request);
  const refresh = fetch(cleanRequest(request))
    .then(async (response) => {
      await putIfOk(ASSET_CACHE, request, response);
      return response;
    })
    .catch(() => null);

  return cached || refresh || fetch(request);
}

async function cacheFirstRuntime(request) {
  const cached = await matchAny(request);
  if (cached) return cached;

  const response = await fetch(cleanRequest(request));
  await putIfOk(RUNTIME_CACHE, request, response);
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !isLocalRequest(request)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (isStaticAsset(request)) {
    event.respondWith(networkFirstStaticAsset(request));
    return;
  }

  if (isRuntimeAsset(request)) {
    event.respondWith(staleWhileRevalidateAsset(request));
    return;
  }

  event.respondWith(cacheFirstRuntime(request));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "JARRAMPLAS_SKIP_WAITING") {
    self.skipWaiting();
  }
});

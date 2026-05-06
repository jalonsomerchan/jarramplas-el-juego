const CACHE_VERSION = "jarramplas-v20260506-4";
const CORE_CACHE = `${CACHE_VERSION}-core`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./game.js",
  "./config.js",
  "./storage.js",
  "./analytics.js",
  "./manifest.webmanifest",
  "./assets/portada.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/jarramplas/snes_tamboril_front_8f_hd/frame_001.png",
  "./assets/jarramplas/snes_tamboril_front_8f_hd/frame_002.png",
  "./assets/jarramplas/snes_tamboril_front_8f_hd/frame_003.png",
  "./assets/jarramplas/snes_tamboril_front_8f_hd/frame_004.png",
  "./assets/jarramplas/snes_tamboril_front_8f_hd/frame_005.png",
  "./assets/jarramplas/snes_tamboril_front_8f_hd/frame_006.png",
  "./assets/jarramplas/snes_tamboril_front_8f_hd/frame_007.png",
  "./assets/jarramplas/snes_tamboril_front_8f_hd/frame_008.png",
  "./assets/personajes/frames/persona1/1.png",
  "./assets/personajes/frames/persona1/2.png",
  "./assets/personajes/frames/persona1/3.png",
  "./assets/personajes/frames/persona1/4.png",
  "./assets/personajes/frames/persona1/5.png",
  "./assets/personajes/frames/persona1/6.png",
  "./assets/fondos/ayuntamiento.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("jarramplas-") && !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isLocalRequest(request) {
  return new URL(request.url).origin === self.location.origin;
}

function shouldRuntimeCache(request) {
  const { pathname } = new URL(request.url);
  return pathname.endsWith(".png")
    || pathname.endsWith(".css")
    || pathname.endsWith(".js")
    || pathname.endsWith(".webmanifest");
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(ASSET_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CORE_CACHE);
      cache.put("./index.html", response.clone());
    }
    return response;
  } catch {
    return caches.match("./index.html");
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !isLocalRequest(request)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (shouldRuntimeCache(request)) {
    event.respondWith(cacheFirst(request));
  }
});

const FALLBACK_MARK = "jarramplasAssetFallback";
const DEBUG_ENABLED = new URLSearchParams(window.location.search).has("debug")
  || new URLSearchParams(window.location.search).has("assetDebug")
  || localStorage.getItem("jarramplas.debug") === "1";

window.JARRAMPLAS_ASSET_DIAGNOSTICS = window.JARRAMPLAS_ASSET_DIAGNOSTICS || {
  startedAt: Date.now(),
  fallbackCount: 0,
  failed: [],
  listFailedAssets() {
    return [...this.failed];
  },
};

const diagnostics = window.JARRAMPLAS_ASSET_DIAGNOSTICS;

function debugLog(message, details = null) {
  if (!DEBUG_ENABLED) return;
  if (details) {
    console.warn(`[Jarramplas assets] ${message}`, details);
    return;
  }
  console.warn(`[Jarramplas assets] ${message}`);
}

function updateLoadingFallbackMessage() {
  const loadingMessage = document.querySelector(".loading-message");
  if (!loadingMessage) return;
  loadingMessage.textContent = "Cargando recursos alternativos...";
}

function classifyAsset(src) {
  const cleanSrc = String(src || "").split("?")[0].toLowerCase();
  if (cleanSrc.includes("/fondos/") || cleanSrc.includes("background")) return "background";
  if (cleanSrc.includes("/jarramplas/")) return "jarramplas";
  if (cleanSrc.includes("/personajes/") || cleanSrc.includes("persona")) return "person";
  if (cleanSrc.includes("nabo") || cleanSrc.includes("turnip")) return "turnip";
  if (cleanSrc.includes("icon")) return "icon";
  return "generic";
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgToDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function fallbackSvgFor(src) {
  const type = classifyAsset(src);
  const label = escapeXml(type === "background" ? "Fondo alternativo" : "Sprite alternativo");

  if (type === "background") {
    return svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" width="960" height="1440" viewBox="0 0 960 1440">
        <defs>
          <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="#556d7a"/>
            <stop offset="0.45" stop-color="#293b3d"/>
            <stop offset="1" stop-color="#151917"/>
          </linearGradient>
          <linearGradient id="ground" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="#455c46"/>
            <stop offset="1" stop-color="#243027"/>
          </linearGradient>
        </defs>
        <rect width="960" height="1440" fill="url(#sky)"/>
        <circle cx="760" cy="160" r="74" fill="#f2bb3d" opacity="0.75"/>
        <path d="M0 410 C150 350 250 390 380 340 C520 288 690 340 960 270 L960 760 L0 760 Z" fill="#1b2422" opacity="0.96"/>
        <path d="M0 640 C160 594 330 650 520 594 C700 540 820 600 960 556 L960 1440 L0 1440 Z" fill="url(#ground)"/>
        <text x="480" y="920" text-anchor="middle" font-family="system-ui, sans-serif" font-size="42" font-weight="800" fill="#fff6df" opacity="0.62">${label}</text>
      </svg>
    `);
  }

  if (type === "person") {
    return svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" width="128" height="192" viewBox="0 0 128 192">
        <rect width="128" height="192" fill="none"/>
        <circle cx="64" cy="36" r="22" fill="#efe1c1"/>
        <path d="M36 72 Q64 52 92 72 L82 136 Q64 150 46 136 Z" fill="#2f6c68"/>
        <path d="M42 82 L16 116" stroke="#efe1c1" stroke-width="12" stroke-linecap="round"/>
        <path d="M86 82 L112 116" stroke="#efe1c1" stroke-width="12" stroke-linecap="round"/>
        <path d="M52 136 L42 178" stroke="#343936" stroke-width="13" stroke-linecap="round"/>
        <path d="M76 136 L88 178" stroke="#343936" stroke-width="13" stroke-linecap="round"/>
      </svg>
    `);
  }

  if (type === "turnip") {
    return svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
        <rect width="96" height="96" fill="none"/>
        <path d="M48 8 C58 22 62 36 56 48 C72 52 78 66 70 78 C62 92 34 92 26 78 C18 64 25 52 40 48 C34 35 38 21 48 8 Z" fill="#efe1c1" stroke="#cbbf9f" stroke-width="4"/>
        <path d="M48 8 C40 10 32 15 26 24" stroke="#5dbb63" stroke-width="7" stroke-linecap="round"/>
        <path d="M48 8 C56 10 65 16 72 24" stroke="#5dbb63" stroke-width="7" stroke-linecap="round"/>
      </svg>
    `);
  }

  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="220" viewBox="0 0 160 220">
      <rect width="160" height="220" fill="none"/>
      <path d="M80 16 C112 26 138 70 130 118 C122 170 102 204 80 204 C58 204 38 170 30 118 C22 70 48 26 80 16 Z" fill="#d93c2f" stroke="#fff6df" stroke-width="6"/>
      <path d="M44 74 C64 58 96 58 116 74" stroke="#f2bb3d" stroke-width="8" fill="none" stroke-linecap="round"/>
      <circle cx="58" cy="104" r="7" fill="#151313"/>
      <circle cx="102" cy="104" r="7" fill="#151313"/>
      <path d="M58 142 Q80 154 102 142" stroke="#151313" stroke-width="6" fill="none" stroke-linecap="round"/>
      <text x="80" y="214" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#fff6df" opacity="0.8">fallback</text>
    </svg>
  `);
}

function shouldFallback(src) {
  if (!src || src.startsWith("data:image/")) return false;
  return true;
}

function recordFailedAsset(src) {
  const entry = {
    src,
    type: classifyAsset(src),
    failedAt: new Date().toISOString(),
  };
  diagnostics.failed.push(entry);
  diagnostics.fallbackCount += 1;
  window.dispatchEvent(new CustomEvent("jarramplas:asset-fallback", { detail: entry }));
  updateLoadingFallbackMessage();
  debugLog("Usando fallback visual para asset roto", entry);
}

function installImageFallbacks() {
  if (window.__JARRAMPLAS_ASSET_FALLBACKS_INSTALLED__) return;
  window.__JARRAMPLAS_ASSET_FALLBACKS_INSTALLED__ = true;

  const NativeImage = window.Image;

  function SafeImage(width, height) {
    const image = new NativeImage(width, height);

    image.addEventListener("error", (event) => {
      const failedSrc = image.currentSrc || image.src || "";
      if (image[FALLBACK_MARK] || !shouldFallback(failedSrc)) return;

      image[FALLBACK_MARK] = true;
      event.preventDefault();
      event.stopImmediatePropagation();
      recordFailedAsset(failedSrc);

      queueMicrotask(() => {
        image.src = fallbackSvgFor(failedSrc);
      });
    }, true);

    return image;
  }

  SafeImage.prototype = NativeImage.prototype;
  Object.setPrototypeOf(SafeImage, NativeImage);
  window.Image = SafeImage;
  debugLog("Fallback visual de assets instalado");
}

installImageFallbacks();

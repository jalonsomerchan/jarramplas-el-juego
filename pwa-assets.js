/*
 * Shared asset manifest for the PWA service worker.
 * Keep this file dependency-free so it can run both in the page and inside the service worker via importScripts().
 */
(function registerPwaAssets(globalScope) {
  const APP_BUILD = "20260512-2";

  const staticCoreAssets = [
    "./",
    "./index.html",
    "./styles.css",
    "./asset-fallbacks.js",
    "./game.js",
    "./config.js",
    "./storage.js",
    "./leaderboard.js",
    "./firebase-config.js",
    "./analytics.js",
    "./manifest.webmanifest",
    "./assets/portada.png",
    "./assets/icons/apple-touch-icon.png",
    "./assets/icons/icon-192.png",
    "./assets/icons/icon-512.png",
  ];

  const scenarios = [
    "assets/fondos/ayuntamiento.png",
    "assets/fondos/casa_cultura.png",
    "assets/fondos/campo_de_futbol.png",
    "assets/fondos/estatua_jarramplas.png",
    "assets/fondos/fondo2.png",
    "assets/fondos/iglesia2.png",
    "assets/fondos/mirador.png",
    "assets/fondos/plaza_de_toros.png",
    "assets/fondos/parada.png",
    "assets/fondos/fachada_jarramplas.png",
    "assets/fondos/nieve.png",
  ];

  const jarramplasRoots = [
    "assets/jarramplas/snes_tamboril_front_8f_hd",
    "assets/jarramplas/modelo_izquierda_front_8f_hd",
    "assets/jarramplas/modelo_centro_front_8f_hd",
    "assets/jarramplas/modelo_derecha_front_8f_hd",
    "assets/jarramplas/modelo_rojo_verde_front_8f_hd",
    "assets/jarramplas/modelo_leon_front_8f_hd",
    "assets/jarramplas/modelo_buho_azul_front_8f_hd",
    "assets/jarramplas/modelo_negro_dorado_front_8f_hd",
  ];

  const personIds = [1, 2, 3, 4, 5, 6];
  const personFrameIds = [1, 2, 3, 4, 5, 6];

  function withDot(path) {
    return path.startsWith("./") ? path : `./${path}`;
  }

  function makeJarramplasFrames(root, frameCount = 8) {
    return Array.from(
      { length: frameCount },
      (_, index) => `${root}/frame_${String(index + 1).padStart(3, "0")}.png`
    );
  }

  function makePersonFrames() {
    return personIds.flatMap((personId) => (
      personFrameIds.map((frameId) => `assets/personajes/frames/persona${personId}/${frameId}.png`)
    ));
  }

  function unique(paths) {
    return [...new Set(paths.map(withDot))];
  }

  const gameplayAssets = unique([
    ...scenarios,
    ...jarramplasRoots.flatMap((root) => makeJarramplasFrames(root)),
    ...makePersonFrames(),
  ]);

  globalScope.JARRAMPLAS_PWA_ASSETS = {
    APP_BUILD,
    CACHE_VERSION: `jarramplas-v${APP_BUILD}`,
    CORE_ASSETS: unique(staticCoreAssets),
    GAMEPLAY_ASSETS: gameplayAssets,
    ALL_ASSETS: unique([...staticCoreAssets, ...gameplayAssets]),
  };
})(typeof self !== "undefined" ? self : window);

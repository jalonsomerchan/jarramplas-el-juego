export const difficultyConfig = {
  day18Evening: { label: "18 por la tarde", shareLabel: "18 de Enero por la tarde", meta: "Sin gente", people: 0, crowdThrow: 1.8, speed: 0.8 },
  day19Morning: { label: "19 por la mañana", shareLabel: "19 de Enero por la mañana", meta: "Fácil", people: 4, crowdThrow: 1.45, speed: 0.86 },
  day19Evening: { label: "19 por la tarde", shareLabel: "19 de Enero por la tarde", meta: "Medio", people: 6, crowdThrow: 1.12, speed: 1 },
  day20Morning: { label: "20 por la mañana", shareLabel: "20 de Enero por la mañana", meta: "Difícil", people: 9, crowdThrow: 0.84, speed: 1.16 },
  day20Evening: { label: "20 por la tarde", shareLabel: "20 de Enero por la tarde", meta: "Extremo", people: 12, crowdThrow: 0.62, speed: 1.32 },
};

export const gameTypeConfig = {
  timed: { label: "Por tiempo", shortLabel: "60 segundos", duration: 60 },
  survival: { label: "Hasta que Jarramplas aguante", shortLabel: "Por Vida", health: 100 },
  limitedTurnips: { label: "Hasta que me quede sin nabos", shortLabel: "Tienes 20 nabos", turnips: 20 },
  eviction: { label: "Hasta que me echen", shortLabel: "3 avisos", maxPeopleHits: 3, requiresPeople: true },
};

export const jarramplasMovementConfig = {
  minYRatio: 0.12,
  maxYRatio: 0.25,
};

export const impactEffectConfig = {
  particleCount: 18,
  sparkColors: ["#fff6df", "#f2bb3d", "#efe1c1", "#5eb356"],
  playerBurstColor: "#f2bb3d",
  crowdBurstColor: "#efe1c1",
  duration: 0.46,
};

export const shareTextConfig = {
  gameTitle: "Juego de Jarramplas",
  gameShareText: "Juega al Juego de Jarramplas",
  resultTemplate: "He conseguido {points} puntos en el nivel {level} del tipo {type} del Juego de Jarramplas",
};

export const scenarios = [
  { name: "Ayuntamiento", path: "assets/fondos/ayuntamiento.png" },
  { name: "Casa de Cultura", path: "assets/fondos/casa_cultura.png" },
  { name: "Campo de fútbol", path: "assets/fondos/campo_de_futbol.png" },
  { name: "Estatua de Jarramplas", path: "assets/fondos/estatua_jarramplas.png" },
  { name: "Plaza de las Eras", path: "assets/fondos/fondo2.png" },
  { name: "Iglesia", path: "assets/fondos/iglesia2.png" },
  { name: "Mirador", path: "assets/fondos/mirador.png" },
  { name: "Plaza de toros", path: "assets/fondos/plaza_de_toros.png" },
  { name: "Parada", path: "assets/fondos/parada.png" },
  { name: "Fachada de Jarramplas", path: "assets/fondos/fachada_jarramplas.png" },
  { name: "Nieve", path: "assets/fondos/nieve.png" },
];

export const STORAGE_KEYS = {
  records: "jarramplas.records.v1",
  stats: "jarramplas.stats.v1",
  tutorial: "jarramplas.tutorialSeen.v2",
};

const makeJarramplasFramePaths = (root, frameCount) => Array.from(
  { length: frameCount },
  (_, index) => `${root}/frame_${String(index + 1).padStart(3, "0")}.png`
);

// Para añadir otro Jarramplas, crea assets/jarramplas/frames4 y añade otra entrada aquí.
export const jarramplasVariants = [
  { name: "Jarramplas 1", root: "assets/jarramplas/frames", frameCount: 16 },
  { name: "Jarramplas 2", root: "assets/jarramplas/frames2", frameCount: 12 },
  { name: "Jarramplas 3", root: "assets/jarramplas/frames3", frameCount: 12 },
].map((variant) => ({
  ...variant,
  frames: makeJarramplasFramePaths(variant.root, variant.frameCount),
}));

export const personIds = [1, 2, 3, 4, 5, 6];
export const personFrameRoots = ["assets/personas/frames", "assets/personajes/frames"];
export const loadingAssetEstimate = jarramplasVariants.reduce((total, variant) => total + variant.frames.length, 0) + personFrameRoots.length + (personIds.length * 6) + scenarios.length;

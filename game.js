const app = document.getElementById("app");
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hud = document.getElementById("hud");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const recordEl = document.getElementById("record");
const loadingScreen = document.getElementById("loading");
const loadingBar = document.getElementById("loadingBar");
const loadingProgress = loadingScreen?.querySelector(".loading-bar");
const playButton = document.getElementById("playButton");
const jarramplasCountdownEl = document.getElementById("jarramplasCountdown");
const scenarioOptions = document.getElementById("scenarioOptions");
const screens = {
  start: document.getElementById("start"),
  type: document.getElementById("type"),
  select: document.getElementById("select"),
  scenario: document.getElementById("scenario"),
  tutorial: document.getElementById("tutorial"),
  about: document.getElementById("about"),
  pause: document.getElementById("pause"),
  result: document.getElementById("result"),
};

const DPR = Math.min(window.devicePixelRatio || 1, 2);
const difficultyConfig = {
  day18Evening: { label: "18 por la tarde", shareLabel: "18 por la tarde", meta: "Sin gente", people: 0, crowdThrow: 1.8, speed: 0.8 },
  day19Morning: { label: "19 por la mañana", shareLabel: "19 por la mañana", meta: "Fácil", people: 4, crowdThrow: 1.45, speed: 0.86 },
  day19Evening: { label: "19 por la tarde", shareLabel: "19 por la tarde", meta: "Medio", people: 6, crowdThrow: 1.12, speed: 1 },
  day20Morning: { label: "20 por la mañana", shareLabel: "20 por la mañana", meta: "Difícil", people: 9, crowdThrow: 0.84, speed: 1.16 },
  day20Evening: { label: "20 por la tarde", shareLabel: "20 por la tarde", meta: "Extremo", people: 12, crowdThrow: 0.62, speed: 1.32 },
};

const gameTypeConfig = {
  timed: { label: "Por tiempo", shortLabel: "Tiempo", duration: 60 },
  survival: { label: "Hasta que Jarramplas aguante", shortLabel: "Vida", health: 100 },
  limitedTurnips: { label: "Hasta que me quede sin nabos", shortLabel: "20 nabos", turnips: 20 },
  eviction: { label: "Hasta que me echen", shortLabel: "3 avisos", maxPeopleHits: 3, requiresPeople: true },
};

const jarramplasMovementConfig = {
  minYRatio: 0.12,
  maxYRatio: 0.25,
};

const impactEffectConfig = {
  particleCount: 18,
  sparkColors: ["#fff6df", "#f2bb3d", "#efe1c1", "#5eb356"],
  playerBurstColor: "#f2bb3d",
  crowdBurstColor: "#efe1c1",
  duration: 0.46,
};

const shareTextConfig = {
  gameTitle: "Juego de Jarramplas",
  gameShareText: "Juega al Juego de Jarramplas",
  resultTemplate: "He conseguido {points} puntos en el nivel {level} del tipo {type} del Juego de Jarramplas",
};

const scenarios = [
  { name: "Ayuntamiento", path: "assets/fondos/ayuntamiento.png" },
  { name: "Casa de Cultura", path: "assets/fondos/casa_cultura.png" },
  { name: "Campo de fútbol", path: "assets/fondos/campo_de_futbol.png" },
  { name: "Estatua de Jarramplas", path: "assets/fondos/estatua_jarramplas.png" },
  { name: "Calle", path: "assets/fondos/fondo2.png" },
  { name: "Iglesia", path: "assets/fondos/iglesia2.png" },
  { name: "Mirador", path: "assets/fondos/mirador.png" },
  { name: "Plaza de toros", path: "assets/fondos/plaza_de_toros.png" },
  { name: "Parada", path: "assets/fondos/parada.png" },
  { name: "Fachada de Jarramplas", path: "assets/fondos/fachada_jarramplas.png" },
  { name: "Nieve", path: "assets/fondos/nieve.png" },
];

const STORAGE_KEYS = {
  records: "jarramplas.records.v1",
  tutorial: "jarramplas.tutorialSeen.v2",
};

const assets = {
  ready: false,
  jarramplas: [],
  people: { side: [], front: [], back: [] },
  turnips: [],
  backgrounds: [],
  background: null,
};

const jarramplasFramePaths = Array.from(
  { length: 11 },
  (_, index) => `assets/jarramplas/frames/frame_${String(index + 1).padStart(3, "0")}.png`
);

const personIds = [1, 2, 3, 4, 5, 6];
const personFrameRoots = ["assets/personas/frames", "assets/personajes/frames"];
const loadingAssetEstimate = jarramplasFramePaths.length + personFrameRoots.length + (personIds.length * 6) + scenarios.length;

const loadingState = {
  loaded: 0,
  total: loadingAssetEstimate,
};

const state = {
  mode: "menu",
  gameType: "timed",
  pendingGameType: "timed",
  difficulty: "day19Morning",
  pendingDifficulty: "day19Morning",
  w: 0,
  h: 0,
  score: 0,
  jarramplasHits: 0,
  peopleHits: 0,
  timeLeft: 60,
  elapsed: 0,
  totalPaused: 0,
  pausedAt: 0,
  turnipsLeft: 20,
  jarramplasHealth: 100,
  endReason: "",
  startedAt: 0,
  last: 0,
  jarramplas: { x: 0, y: 0, w: 112, h: 150, vx: 76, vy: 0, targetX: 0, targetY: 0, walkFrame: 0, flash: 0, nextMoveAt: 0 },
  people: [],
  turnips: [],
  floaters: [],
  particles: [],
  drag: null,
  nextPersonId: 0,
  nextPersonAt: 0,
  scenarioIndex: 0,
  tutorialNextScreen: "type",
};

function updateLoadingBar(forcePercent = null) {
  const percent = forcePercent ?? Math.min(99, Math.round((loadingState.loaded / loadingState.total) * 100));
  if (loadingBar) loadingBar.style.width = `${percent}%`;
  if (loadingProgress) loadingProgress.setAttribute("aria-valuenow", String(percent));
}

function markAssetLoaded() {
  loadingState.loaded += 1;
  updateLoadingBar();
}

function loadImageFrame(path, label = null) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({
      img,
      w: img.naturalWidth,
      h: img.naturalHeight,
      path,
      name: label || fileLabel(path),
    });
    img.onerror = () => reject(new Error(`No se pudo cargar ${path}`));
    img.onload = ((onload) => () => {
      markAssetLoaded();
      onload();
    })(img.onload);
    img.onerror = ((onerror) => () => {
      markAssetLoaded();
      onerror();
    })(img.onerror);
    img.src = path;
  });
}

function fileLabel(path) {
  const fileName = decodeURIComponent(path.split("/").pop() || path);
  return fileName.replace(/\.[^.]+$/, "").replace(/_/g, " ");
}

function loadImageFrames(paths) {
  return Promise.all(paths.map(loadImageFrame));
}

async function loadOptionalImage(path, label = null) {
  try {
    return await loadImageFrame(path, label);
  } catch {
    return null;
  }
}

async function loadBackgrounds() {
  const attempts = scenarios.map((scenario) => loadOptionalImage(scenario.path, scenario.name));
  return (await Promise.all(attempts)).filter(Boolean);
}

async function findPersonFrameRoot() {
  for (const root of personFrameRoots) {
    const testFrame = await loadOptionalImage(`${root}/persona1/1.png`);
    if (testFrame) return root;
  }
  return personFrameRoots[0];
}

async function loadPersonGroups() {
  const personFrameRoot = await findPersonFrameRoot();
  const groups = await Promise.all(personIds.map(async (id) => {
    const frame = (frameId) => loadImageFrame(`${personFrameRoot}/persona${id}/${frameId}.png`, `persona ${id} frame ${frameId}`);
    const [walkOne, walkTwo, walkThree, throwOne, throwTwo, throwThree] = await Promise.all([
      frame(1),
      frame(2),
      frame(3),
      frame(4),
      frame(5),
      frame(6),
    ]);
    return {
      walk: [walkOne, walkTwo, walkThree],
      throw: [throwOne, throwTwo, throwThree],
      turnips: [],
    };
  }));
  return groups;
}

async function loadAssets() {
  playButton.disabled = true;
  playButton.textContent = "Cargando";
  updateLoadingBar(0);
  const [jarramplas, people, backgrounds] = await Promise.all([
    loadImageFrames(jarramplasFramePaths),
    loadPersonGroups(),
    loadBackgrounds(),
  ]);
  assets.jarramplas = jarramplas;
  assets.people.side = people;
  assets.people.front = people;
  assets.people.back = people;
  assets.turnips = [];
  assets.backgrounds = backgrounds;
  assets.background = backgrounds[Math.floor(Math.random() * backgrounds.length)] || null;
  buildScenarioButtons();
  assets.ready = true;
  updateLoadingBar(100);
  playButton.disabled = false;
  playButton.textContent = "Jugar";
  loadingScreen.classList.remove("is-visible");
  state.mode = "menu";
  showScreen("start");
}

function buildScenarioButtons() {
  scenarioOptions.innerHTML = "";
  const backgrounds = assets.backgrounds.length ? assets.backgrounds : [{ name: "Sin fondo", path: "" }];
  backgrounds.forEach((background, index) => {
    const button = document.createElement("button");
    const label = document.createElement("span");
    const meta = document.createElement("span");
    button.type = "button";
    button.dataset.scenario = String(index);
    label.textContent = background.name;
    meta.textContent = "";
    button.append(label, meta);
    button.addEventListener("click", () => startGame(state.pendingDifficulty, index));
    scenarioOptions.appendChild(button);
  });
}

function applyLevelLabels() {
  document.querySelectorAll("[data-level]").forEach((button) => {
    const config = difficultyConfig[button.dataset.level];
    if (!config) return;
    const meta = button.querySelector("span");
    button.firstChild.textContent = `${config.label} `;
    if (meta) {
      meta.textContent = config.meta;
      meta.dataset.label = config.meta;
    }
  });
}

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.records) || "{}");
  } catch {
    return {};
  }
}

function recordKey(gameType, difficulty) {
  return `${gameType}:${difficulty}`;
}

function getRecord(gameType, difficulty) {
  const records = getRecords();
  return Number(records[recordKey(gameType, difficulty)] || 0);
}

function saveRecord(gameType, difficulty, score) {
  const records = getRecords();
  const key = recordKey(gameType, difficulty);
  const best = Math.max(Number(records[key] || 0), score);
  records[key] = best;
  localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records));
  return best;
}

function hasSeenTutorial() {
  return localStorage.getItem(STORAGE_KEYS.tutorial) === "1";
}

function markTutorialSeen() {
  localStorage.setItem(STORAGE_KEYS.tutorial, "1");
}

function updateJarramplasCountdown() {
  const now = new Date();
  let nextJarramplas = new Date(now.getFullYear(), 0, 19);
  if (now >= nextJarramplas) {
    nextJarramplas = new Date(now.getFullYear() + 1, 0, 19);
  }
  const oneDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.ceil((nextJarramplas - now) / oneDay);
  jarramplasCountdownEl.textContent = `Quedan ${daysLeft} días para Jarramplas`;
}

function resize() {
  const rect = app.getBoundingClientRect();
  state.w = rect.width;
  state.h = rect.height;
  canvas.width = Math.floor(state.w * DPR);
  canvas.height = Math.floor(state.h * DPR);
  canvas.style.width = `${state.w}px`;
  canvas.style.height = `${state.h}px`;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  layoutJarramplas();
  layoutCrowd();
}

function layoutJarramplas() {
  const size = Math.min(state.w * 0.28, state.h * 0.18, 124);
  state.jarramplas.w = size;
  state.jarramplas.h = size * 1.72;
  state.jarramplas.x = Math.max(size, Math.min(state.w - size, state.jarramplas.x || state.w / 2));
  state.jarramplas.y = Math.max(state.h * jarramplasMovementConfig.minYRatio, Math.min(state.h * jarramplasMovementConfig.maxYRatio, state.jarramplas.y || state.h * jarramplasMovementConfig.minYRatio));
  state.jarramplas.targetY = state.jarramplas.y;
}

function layoutCrowd() {
  for (const person of state.people) updatePersonFacing(person);
}

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("is-visible"));
  if (name) screens[name].classList.add("is-visible");
  hud.classList.toggle("is-visible", state.mode === "playing" || state.mode === "paused");
}

function chooseGameType(gameType) {
  if (!assets.ready) return;
  state.pendingGameType = gameType;
  state.mode = "select";
  refreshLevelOptions();
  showScreen("select");
}

function refreshLevelOptions() {
  const type = gameTypeConfig[state.pendingGameType];
  document.querySelectorAll("[data-level]").forEach((button) => {
    const level = button.dataset.level;
    const config = difficultyConfig[level];
    const disabled = Boolean(type.requiresPeople && config.people === 0);
    const record = getRecord(state.pendingGameType, level);
    button.disabled = disabled;
    button.hidden = disabled;
    const meta = button.querySelector("span");
    if (meta) meta.textContent = record > 0 ? `Récord ${record}` : meta.dataset.label || meta.textContent;
  });
}

function chooseLevel(difficulty) {
  if (!assets.ready) return;
  const type = gameTypeConfig[state.pendingGameType];
  if (type.requiresPeople && difficultyConfig[difficulty].people === 0) return;
  state.pendingDifficulty = difficulty;
  state.mode = "scenario";
  showScreen("scenario");
}

function startGame(difficulty, backgroundIndex = 0) {
  if (!assets.ready) return;
  const config = difficultyConfig[difficulty];
  const type = gameTypeConfig[state.pendingGameType];
  assets.background = assets.backgrounds[backgroundIndex] || null;
  state.scenarioIndex = backgroundIndex;
  state.mode = "playing";
  state.gameType = state.pendingGameType;
  state.difficulty = difficulty;
  state.score = 0;
  state.jarramplasHits = 0;
  state.peopleHits = 0;
  state.timeLeft = type.duration || 0;
  state.elapsed = 0;
  state.totalPaused = 0;
  state.pausedAt = 0;
  state.turnipsLeft = type.turnips || Infinity;
  state.jarramplasHealth = type.health || 0;
  state.endReason = "";
  state.startedAt = performance.now();
  state.last = state.startedAt;
  state.people = [];
  state.turnips = [];
  state.floaters = [];
  state.particles = [];
  state.drag = null;
  state.nextPersonId = 0;
  state.nextPersonAt = performance.now() + 700;
  state.jarramplas.x = state.w / 2;
  state.jarramplas.y = state.h * jarramplasMovementConfig.minYRatio;
  state.jarramplas.targetX = state.w / 2;
  state.jarramplas.targetY = state.jarramplas.y;
  state.jarramplas.vx = 0;
  state.jarramplas.vy = 0;
  state.jarramplas.nextMoveAt = 0;
  state.jarramplas.flash = 0;
  updateHud();
  for (let i = 0; i < config.people; i += 1) spawnPerson(true);
  showScreen(null);
  hud.classList.add("is-visible");
}

function endGame() {
  if (state.mode !== "playing") return;
  if (state.gameType === "survival") {
    state.score = Math.max(0, Math.round(1200 - state.elapsed * 10 + state.jarramplasHits * 12 - state.peopleHits * 30));
  }
  const best = saveRecord(state.gameType, state.difficulty, state.score);
  const type = gameTypeConfig[state.gameType];
  const difficulty = difficultyConfig[state.difficulty];
  state.mode = "result";
  hud.classList.remove("is-visible");
  document.getElementById("finalScore").textContent = `${state.score} pts`;
  document.getElementById("finalHits").textContent = `${type.label} · ${difficulty.label} · Jarramplas: ${state.jarramplasHits} impactos · Gente: ${state.peopleHits} impactos`;
  document.getElementById("finalRecord").textContent = `Récord en este modo: ${best} pts`;
  showScreen("result");
}

function pauseGame() {
  if (state.mode !== "playing") return;
  state.mode = "paused";
  state.pausedAt = performance.now();
  state.drag = null;
  showScreen("pause");
}

function resumeGame() {
  if (state.mode !== "paused") return;
  const now = performance.now();
  state.totalPaused += now - state.pausedAt;
  state.pausedAt = 0;
  state.last = now;
  state.mode = "playing";
  showScreen(null);
  hud.classList.add("is-visible");
}

function restartGame() {
  const difficulty = state.difficulty;
  const gameType = state.gameType;
  const scenarioIndex = state.scenarioIndex;
  state.pendingGameType = gameType;
  startGame(difficulty, scenarioIndex);
}

function goHome() {
  state.mode = "menu";
  state.drag = null;
  state.turnips = [];
  state.floaters = [];
  state.particles = [];
  hud.classList.remove("is-visible");
  showScreen("start");
}

function spawnPerson(initial = false) {
  const config = difficultyConfig[state.difficulty];
  const id = state.nextPersonId;
  state.nextPersonId += 1;
  const fromLeft = Math.random() < 0.5;
  const lane = state.h * (0.53 + Math.random() * 0.13);
  const speed = (36 + Math.random() * 34) * config.speed;
  const size = Math.min(state.w * 0.18, state.h * 0.105, 80) * (0.9 + (id % 3) * 0.05);
  const person = {
    index: id,
    groupId: id,
    x: initial ? Math.random() * state.w : (fromLeft ? -size : state.w + size),
    y: lane,
    vx: fromLeft ? speed : -speed,
    targetY: lane + (Math.random() - 0.5) * state.h * 0.08,
    w: size * 0.62,
    h: size,
    facing: "side",
    flip: false,
    animT: Math.random() * 4,
    throwTimer: 0.5 + Math.random() * 1.2,
    throwAnim: 0,
    throwT: 0,
  };
  updatePersonFacing(person);
  state.people.push(person);
}

function updatePersonFacing(person) {
  const j = state.jarramplas;
  const dx = j.x - person.x;
  const dy = j.y + j.h * 0.42 - person.y;
  if (Math.abs(dx) > Math.abs(dy) * 1.25) {
    person.facing = "side";
    person.flip = dx < 0;
  } else {
    person.facing = dy < 0 ? "back" : "front";
    person.flip = false;
  }
}

function addFloater(text, x, y, color) {
  state.floaters.push({ text, x, y, color, life: 0.82, vy: -58 });
}

function addJarramplasImpact(x, y, owner) {
  const baseColor = owner === "player" ? impactEffectConfig.playerBurstColor : impactEffectConfig.crowdBurstColor;
  for (let i = 0; i < impactEffectConfig.particleCount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 70 + Math.random() * 210;
    const color = impactEffectConfig.sparkColors[i % impactEffectConfig.sparkColors.length];
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 25,
      r: 2.5 + Math.random() * 4,
      color,
      life: impactEffectConfig.duration * (0.72 + Math.random() * 0.55),
      maxLife: impactEffectConfig.duration,
    });
  }
}

function formatTime(seconds) {
  const total = Math.ceil(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function launchOrigin() {
  return {
    x: state.w / 2,
    y: state.h - Math.max(54, state.h * 0.08),
  };
}

function formatHudValue() {
  if (state.gameType === "timed") return formatTime(state.timeLeft);
  if (state.gameType === "survival") return `${Math.max(0, Math.ceil(state.jarramplasHealth))}%`;
  if (state.gameType === "limitedTurnips") return `${Math.max(0, state.turnipsLeft)} nabos`;
  return `${Math.max(0, gameTypeConfig.eviction.maxPeopleHits - state.peopleHits)} avisos`;
}

function updateHud() {
  const type = gameTypeConfig[state.gameType];
  scoreEl.textContent = `${state.score} pts`;
  timeEl.innerHTML = `${formatHudValue()}<small>${type.shortLabel}</small>`;
  recordEl.innerHTML = `${getRecord(state.gameType, state.difficulty)} pts<small>Récord</small>`;
}

function shareText(text) {
  const url = window.location.href.split("#")[0];
  const fullText = `${text} ${url}`;
  if (navigator.share) {
    navigator.share({ title: shareTextConfig.gameTitle, text: fullText, url }).catch(() => {});
    return;
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(fullText).catch(() => {});
  }
}

function shareGame() {
  shareText(shareTextConfig.gameShareText);
}

function shareResult() {
  const type = gameTypeConfig[state.gameType];
  const difficulty = difficultyConfig[state.difficulty];
  shareText(
    shareTextConfig.resultTemplate
      .replace("{points}", state.score)
      .replace("{level}", difficulty.shareLabel)
      .replace("{type}", type.label)
  );
}

function pickJarramplasTarget(now) {
  const j = state.jarramplas;
  const config = difficultyConfig[state.difficulty];
  const margin = j.w * 0.76;
  j.targetX = margin + Math.random() * Math.max(1, state.w - margin * 2);
  j.targetY = state.h * (jarramplasMovementConfig.minYRatio + Math.random() * (jarramplasMovementConfig.maxYRatio - jarramplasMovementConfig.minYRatio));
  j.nextMoveAt = now + 520 + Math.random() * (1150 / config.speed);
}

function updateJarramplasMotion(now, dt) {
  const j = state.jarramplas;
  const config = difficultyConfig[state.difficulty];
  if (!j.nextMoveAt || now > j.nextMoveAt || Math.hypot(j.targetX - j.x, j.targetY - j.y) < 10) {
    pickJarramplasTarget(now);
  }
  const dx = j.targetX - j.x;
  const dy = j.targetY - j.y;
  const accel = 4.8 + config.speed * 1.8;
  j.vx += dx * accel * dt;
  j.vy += dy * accel * dt;
  const damping = Math.pow(0.08, dt);
  j.vx *= damping;
  j.vy *= damping;
  const maxSpeed = 118 + config.speed * 42;
  const speed = Math.hypot(j.vx, j.vy);
  if (speed > maxSpeed) {
    j.vx = (j.vx / speed) * maxSpeed;
    j.vy = (j.vy / speed) * maxSpeed;
  }
  j.x += j.vx * dt;
  j.y += j.vy * dt;
  j.x = Math.max(j.w * 0.72, Math.min(state.w - j.w * 0.72, j.x));
  j.y = Math.max(state.h * jarramplasMovementConfig.minYRatio, Math.min(state.h * jarramplasMovementConfig.maxYRatio, j.y));
  j.walkFrame = Math.floor(now / 120) % 16;
  j.flash = Math.max(0, (j.flash || 0) - dt);
}

function launchTurnip(from, to, owner) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const power = Math.min(Math.hypot(dx, dy), Math.min(state.w, state.h) * 0.62);
  if (power < 20) return;
  if (owner === "player" && state.gameType === "limitedTurnips") {
    if (state.turnipsLeft <= 0) return;
    state.turnipsLeft -= 1;
  }
  const speed = owner === "player" ? 760 : 365 + Math.random() * 70;
  const angle = Math.atan2(dy, dx);
  state.turnips.push({
    x: from.x,
    y: from.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: Math.max(13, Math.min(state.w, state.h) * 0.03),
    spin: Math.random() * 6.28,
    owner,
    hit: false,
  });
  updateHud();
}

function rectCircleHit(rect, circle) {
  const rx = rect.x - rect.w / 2;
  const ry = rect.y - rect.h;
  const cx = Math.max(rx, Math.min(circle.x, rx + rect.w));
  const cy = Math.max(ry, Math.min(circle.y, ry + rect.h));
  return Math.hypot(circle.x - cx, circle.y - cy) < circle.r * 0.8;
}

function update(now) {
  const dt = Math.min((now - state.last) / 1000, 0.033);
  state.last = now;

  if (state.mode === "playing") {
    const type = gameTypeConfig[state.gameType];
    state.elapsed = (now - state.startedAt - state.totalPaused) / 1000;
    if (state.gameType === "timed") {
      state.timeLeft = Math.max(0, type.duration - state.elapsed);
      if (state.timeLeft <= 0) endGame();
    }
    if (state.mode !== "playing") return;
    updateHud();

    const j = state.jarramplas;
    updateJarramplasMotion(now, dt);
    const config = difficultyConfig[state.difficulty];
    if (state.people.length < config.people && now > state.nextPersonAt) {
      spawnPerson(false);
      state.nextPersonAt = now + 360 + Math.random() * 520;
    }

    for (const person of state.people) {
      person.animT += dt * 8;
      person.throwTimer -= dt;
      person.throwAnim = Math.max(0, person.throwAnim - dt);
      person.throwT = person.throwAnim > 0 ? person.throwT + dt * 10 : 0;
      person.x += person.vx * dt;
      person.y += (person.targetY - person.y) * dt * 0.55;
      updatePersonFacing(person);
      if (person.throwTimer <= 0) {
        person.throwTimer = config.crowdThrow + Math.random() * 1.35;
        person.throwAnim = 0.42;
        person.throwT = 0;
        launchTurnip(
          { x: person.x, y: person.y - person.h * 0.55 },
          { x: j.x + (Math.random() - 0.5) * j.w * 0.45, y: j.y + j.h * 0.38 },
          "crowd"
        );
      }
    }
    state.people = state.people.filter((person) => person.x > -person.w * 2.6 && person.x < state.w + person.w * 2.6);

    for (const turnip of state.turnips) {
      turnip.x += turnip.vx * dt;
      turnip.y += turnip.vy * dt;
      turnip.vy += turnip.owner === "player" ? 290 * dt : 120 * dt;
      turnip.spin += dt * 10;
      if (turnip.hit) continue;

      if (turnip.owner === "player") {
        for (const person of state.people) {
          const hitBox = { x: person.x, y: person.y, w: person.w * 0.92, h: person.h * 0.86 };
          if (rectCircleHit(hitBox, turnip)) {
            turnip.hit = true;
            state.peopleHits += 1;
            state.score = Math.max(0, state.score - 5);
            addFloater("-5", person.x, person.y - person.h * 0.72, "#ff8f77");
            if (state.gameType === "eviction" && state.peopleHits >= type.maxPeopleHits) {
              state.endReason = "expulsado";
              endGame();
            }
            break;
          }
        }
      }

      const jBox = { x: j.x, y: j.y + j.h * 0.78, w: j.w * 0.68, h: j.h * 0.78 };
      if (!turnip.hit && rectCircleHit(jBox, turnip)) {
        turnip.hit = true;
        addJarramplasImpact(turnip.x, turnip.y, turnip.owner);
        if (turnip.owner === "player") {
          state.jarramplasHits += 1;
          j.flash = 0.22;
          if (state.gameType === "survival") {
            state.jarramplasHealth = Math.max(0, state.jarramplasHealth - 10);
            const gain = Math.max(1, Math.round(40 - state.elapsed * 0.35));
            state.score += gain;
            addFloater(`+${gain}`, j.x, j.y + j.h * 0.18, "#f2df70");
            if (state.jarramplasHealth <= 0) {
              state.endReason = "jarramplas";
              endGame();
            }
          } else {
            state.score += 10;
            addFloater("+10", j.x, j.y + j.h * 0.18, "#f2df70");
          }
        }
      }
    }
    state.turnips = state.turnips.filter((t) => !t.hit && t.x > -90 && t.x < state.w + 90 && t.y > -120 && t.y < state.h + 120);
    if (state.gameType === "limitedTurnips" && state.turnipsLeft <= 0 && !state.turnips.some((t) => t.owner === "player")) {
      state.endReason = "sin nabos";
      endGame();
    }
  }

  for (const floater of state.floaters) {
    floater.life -= dt;
    floater.y += floater.vy * dt;
  }
  state.floaters = state.floaters.filter((f) => f.life > 0);

  for (const particle of state.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 310 * dt;
    particle.vx *= Math.pow(0.12, dt);
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);
}

function drawSprite(frame, x, y, h, flip = false, alpha = 1) {
  if (!frame || !frame.img.complete) return;
  const w = h * (frame.w / frame.h);
  ctx.save();
  ctx.globalAlpha = alpha;
  if (flip) {
    ctx.translate(x, 0);
    ctx.scale(-1, 1);
    x = 0;
  }
  ctx.drawImage(frame.img, x - w / 2, y - h, w, h);
  ctx.restore();
}

function drawTurnip(x, y, size, spin = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.fillStyle = "#efe1c1";
  ctx.strokeStyle = "rgba(84, 58, 35, 0.5)";
  ctx.lineWidth = Math.max(1, size * 0.06);
  ctx.beginPath();
  ctx.ellipse(-size * 0.06, 0, size * 0.42, size * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#5eb356";
  ctx.beginPath();
  ctx.moveTo(size * 0.26, -size * 0.04);
  ctx.lineTo(size * 0.58, -size * 0.24);
  ctx.lineTo(size * 0.5, size * 0.04);
  ctx.lineTo(size * 0.66, size * 0.18);
  ctx.lineTo(size * 0.28, size * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBackground() {
  ctx.clearRect(0, 0, state.w, state.h);
  if (assets.background) {
    const bg = assets.background;
    const scale = Math.max(state.w / bg.w, state.h / bg.h);
    const w = bg.w * scale;
    const h = bg.h * scale;
    ctx.drawImage(bg.img, (state.w - w) / 2, (state.h - h) / 2, w, h);
    ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
    ctx.fillRect(0, 0, state.w, state.h);
    return;
  }
  const sky = ctx.createLinearGradient(0, 0, 0, state.h);
  sky.addColorStop(0, "#202624");
  sky.addColorStop(0.46, "#33342d");
  sky.addColorStop(1, "#211d18");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, state.w, state.h);
  ctx.fillStyle = "#4d4740";
  for (let i = 0; i < 26; i += 1) {
    ctx.fillRect(((i * 83) % (state.w + 80)) - 40, state.h * 0.36 + ((i * 31) % 44), 52, 3);
  }
  ctx.fillStyle = "#171511";
  ctx.fillRect(0, state.h * 0.72, state.w, state.h * 0.28);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let i = 0; i < 18; i += 1) {
    ctx.fillRect((i * 97) % state.w, state.h * (0.75 + (i % 4) * 0.05), 46, 2);
  }
}

function drawPerson(person) {
  const groups = assets.people[person.facing];
  const group = groups[person.groupId % Math.max(1, groups.length)];
  if (!group) return;
  const anim = person.throwAnim > 0 ? group.throw : group.walk;
  const frameT = person.throwAnim > 0 ? person.throwT : person.animT;
  const frame = anim[Math.floor(frameT) % anim.length];
  const y = person.y + Math.sin(person.animT * 0.7) * 2;
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.beginPath();
  ctx.ellipse(person.x, y + 2, person.w * 0.48, person.w * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  drawSprite(frame, person.x, y, person.h, person.flip);
}

function drawJarramplas() {
  const j = state.jarramplas;
  const walkFrames = assets.jarramplas.slice(0, 16);
  const frame = walkFrames[j.walkFrame % Math.max(1, walkFrames.length)];
  drawSprite(frame, j.x, j.y + j.h, j.h);
  if (j.flash > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    drawSprite(frame, j.x, j.y + j.h, j.h, false, Math.min(0.75, j.flash * 3.4));
    ctx.restore();
  }
  if (state.mode === "playing" && state.gameType === "survival") {
    const w = j.w * 0.9;
    const h = 9;
    const x = j.x - w / 2;
    const y = j.y + 8;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, w, h);
    ctx.stroke();
    ctx.fillStyle = state.jarramplasHealth > 35 ? "#5dbb63" : "#d93c2f";
    ctx.fillRect(x + 1, y + 1, (w - 2) * Math.max(0, state.jarramplasHealth / 100), h - 2);
    ctx.restore();
  }
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, particle.life / particle.maxLife));
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawTimedCountdown() {
  if (state.mode !== "playing" || state.gameType !== "timed" || state.timeLeft > 10) return;
  const value = Math.max(0, Math.ceil(state.timeLeft));
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#fff6df";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.75)";
  ctx.lineWidth = Math.max(5, state.w * 0.025);
  ctx.font = `950 ${Math.min(state.w * 0.48, state.h * 0.28)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText(String(value), state.w / 2, state.h / 2);
  ctx.fillText(String(value), state.w / 2, state.h / 2);
  ctx.restore();
}

function render() {
  drawBackground();
  const drawables = [
    ...state.people.map((person) => ({ y: person.y, draw: () => drawPerson(person) })),
    { y: state.jarramplas.y + state.jarramplas.h * 0.52, draw: drawJarramplas },
  ].sort((a, b) => a.y - b.y);
  for (const item of drawables) item.draw();
  for (const turnip of state.turnips) drawTurnip(turnip.x, turnip.y, turnip.r * 2, turnip.spin);
  drawParticles();
  drawTimedCountdown();

  if (state.mode === "playing") {
    const origin = launchOrigin();
    const size = Math.max(34, Math.min(state.w, state.h) * 0.085);
    ctx.save();
    ctx.globalAlpha = state.gameType === "limitedTurnips" && state.turnipsLeft <= 0 ? 0.38 : 1;
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.beginPath();
    ctx.ellipse(origin.x, origin.y + size * 0.28, size * 0.48, size * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    drawTurnip(origin.x, origin.y, size, 0);
    ctx.restore();
  }

  if (state.drag) {
    ctx.strokeStyle = "rgba(255, 246, 223, 0.74)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(state.drag.start.x, state.drag.start.y);
    ctx.lineTo(state.drag.current.x, state.drag.current.y);
    ctx.stroke();
    drawTurnip(state.drag.start.x, state.drag.start.y, Math.max(30, state.w * 0.075), 0);
  }

  for (const floater of state.floaters) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, floater.life / 0.45));
    ctx.fillStyle = floater.color;
    ctx.font = "900 28px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.strokeText(floater.text, floater.x, floater.y);
    ctx.fillText(floater.text, floater.x, floater.y);
    ctx.restore();
  }

  if (state.mode !== "playing") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(0, 0, state.w, state.h);
  }
}

function loop(now) {
  update(now);
  render();
  requestAnimationFrame(loop);
}

function pointerPos(event) {
  const point = event.touches ? event.touches[0] : event;
  const rect = canvas.getBoundingClientRect();
  return {
    x: point.clientX - rect.left,
    y: point.clientY - rect.top,
  };
}

function launchStartFor(point) {
  return launchOrigin();
}

function onPointerStart(event) {
  if (state.mode !== "playing") return;
  const p = pointerPos(event);
  const origin = launchOrigin();
  const grabRadius = Math.max(56, Math.min(state.w, state.h) * 0.16);
  if (Math.hypot(p.x - origin.x, p.y - origin.y) > grabRadius) return;
  if (state.gameType === "limitedTurnips" && state.turnipsLeft <= 0) return;
  event.preventDefault();
  state.drag = { start: launchStartFor(p), current: p };
}

function onPointerMove(event) {
  if (!state.drag || state.mode !== "playing") return;
  event.preventDefault();
  state.drag.current = pointerPos(event);
}

function onPointerEnd(event) {
  if (!state.drag || state.mode !== "playing") return;
  event.preventDefault();
  const drag = state.drag;
  state.drag = null;
  launchTurnip(drag.start, drag.current, "player");
}

applyLevelLabels();

playButton.addEventListener("click", () => {
  if (!hasSeenTutorial()) {
    state.tutorialNextScreen = "type";
    state.mode = "tutorial";
    showScreen("tutorial");
    return;
  }
  state.mode = "type";
  showScreen("type");
});
document.getElementById("howToButton").addEventListener("click", () => {
  state.tutorialNextScreen = "start";
  state.mode = "tutorial";
  showScreen("tutorial");
});
document.getElementById("aboutButton").addEventListener("click", () => {
  state.mode = "about";
  showScreen("about");
});
document.getElementById("aboutBackButton").addEventListener("click", () => {
  state.mode = "menu";
  showScreen("start");
});
document.getElementById("shareButton").addEventListener("click", shareGame);
document.getElementById("tutorialButton").addEventListener("click", () => {
  markTutorialSeen();
  if (state.tutorialNextScreen === "start") {
    state.mode = "menu";
    showScreen("start");
    return;
  }
  state.mode = "type";
  showScreen("type");
});
document.getElementById("typeBackButton").addEventListener("click", () => {
  state.mode = "menu";
  showScreen("start");
});
document.getElementById("backButton").addEventListener("click", () => {
  state.mode = "type";
  showScreen("type");
});
document.getElementById("levelBackButton").addEventListener("click", () => {
  state.mode = "select";
  showScreen("select");
});
document.getElementById("againButton").addEventListener("click", () => {
  state.mode = "type";
  showScreen("type");
});
document.getElementById("shareResultButton").addEventListener("click", shareResult);
document.getElementById("pauseButton").addEventListener("click", pauseGame);
document.getElementById("resumeButton").addEventListener("click", resumeGame);
document.getElementById("restartButton").addEventListener("click", restartGame);
document.getElementById("homeButton").addEventListener("click", goHome);
document.querySelectorAll("[data-game-type]").forEach((button) => {
  button.addEventListener("click", () => chooseGameType(button.dataset.gameType));
});
document.querySelectorAll("[data-level]").forEach((button) => {
  button.addEventListener("click", () => chooseLevel(button.dataset.level));
});

canvas.addEventListener("touchstart", onPointerStart, { passive: false });
canvas.addEventListener("touchmove", onPointerMove, { passive: false });
canvas.addEventListener("touchend", onPointerEnd, { passive: false });
canvas.addEventListener("mousedown", onPointerStart);
window.addEventListener("mousemove", onPointerMove);
window.addEventListener("mouseup", onPointerEnd);
window.addEventListener("resize", resize);

updateJarramplasCountdown();
resize();
loadAssets().catch((error) => {
  console.error(error);
  playButton.textContent = "Error";
});
requestAnimationFrame(loop);

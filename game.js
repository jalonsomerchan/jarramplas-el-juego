import { createEventTracker, initAnalytics } from "./analytics.js";
import {
  APP_VERSION,
  difficultyConfig,
  gameTypeConfig,
  impactEffectConfig,
  jarramplasMovementConfig,
  jarramplasVariants,
  loadingAssetEstimate,
  personFrameRoots,
  personIds,
  scenarios,
  shareTextConfig,
} from "./config.js";
import {
  createImageFrameLoader,
  emptyJarramplasFrames,
  loadJarramplasFrameSet as loadJarramplasFrameSetWith,
  loadOptionalImage as loadOptionalImageWith,
} from "./src/core/assets.js";
import { vibrateImpact } from "./src/core/haptics.js";
import { clamp, easeOutQuad, finiteNumber, lerp } from "./src/core/math.js";
import { createScreenManager } from "./src/core/screens.js";
import { rectCircleHit } from "./src/game/collision.js";
import { createEffects } from "./src/game/effects.js";
import { createJarramplasMotion } from "./src/game/jarramplas-motion.js";
import { createMenuDemo } from "./src/game/menu-demo.js";
import { createPeopleController } from "./src/game/people.js";
import { createRenderer } from "./src/game/rendering.js";
import { createRuntimeLimiter, trimRuntimeArray } from "./src/game/runtime.js";
import { createTurnipMotion } from "./src/game/turnip-motion.js";
import { createPointerHandlers } from "./src/input/pointer.js";
import { createHud } from "./src/ui/hud.js";
import { createLeaderboardUi } from "./src/ui/leaderboard-ui.js";
import { createStatsScreen, detailRow } from "./src/ui/stats-ui.js";
import {
  formatNumber,
  formatPercent,
  getLocalLeaderboard,
  getPlayerName,
  getRecord,
  getStats,
  hasSeenTutorial,
  markTutorialSeen,
  recordGameFinishStats,
  recordGameStartStats,
  saveLocalLeaderboardScore,
  savePlayerName,
  saveRecord,
} from "./storage.js";
import {
  fetchGlobalLeaderboard,
  firebaseErrorMessage,
  isGlobalLeaderboardConfigured,
  submitGlobalScore,
} from "./leaderboard.js";

const app = document.getElementById("app");
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hud = document.getElementById("hud");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const comboEl = document.getElementById("combo");
const recordEl = document.getElementById("record");
const statsLeaderboardTypeEl = document.getElementById("statsLeaderboardType");
const statsLeaderboardDifficultyEl = document.getElementById("statsLeaderboardDifficulty");
const loadingScreen = document.getElementById("loading");
const loadingBar = document.getElementById("loadingBar");
const loadingProgress = loadingScreen?.querySelector(".loading-bar");
const playButton = document.getElementById("playButton");
const playerNameInput = document.getElementById("playerNameInput");
const jarramplasCountdownEl = document.getElementById("jarramplasCountdown");
const gameVersionEl = document.getElementById("gameVersion");
const scenarioOptions = document.getElementById("scenarioOptions");
const jarramplasOptions = document.getElementById("jarramplasOptions");
const screens = {
  start: document.getElementById("start"),
  type: document.getElementById("type"),
  select: document.getElementById("select"),
  scenario: document.getElementById("scenario"),
  jarramplasSelect: document.getElementById("jarramplasSelect"),
  tutorial: document.getElementById("tutorial"),
  stats: document.getElementById("stats"),
  about: document.getElementById("about"),
  pause: document.getElementById("pause"),
  result: document.getElementById("result"),
};

const DPR = Math.min(window.devicePixelRatio || 1, 2);
const MAX_ACTIVE_PEOPLE = 16;
const MAX_ACTIVE_TURNIPS = 42;
const MAX_ACTIVE_FLOATERS = 24;
const MAX_ACTIVE_PARTICLES = 180;
const PLAYER_MIN_LAUNCH_SPEED = 500;
const PLAYER_MAX_LAUNCH_SPEED = 920;
const PLAYER_MIN_GRAVITY = 330;
const PLAYER_MAX_GRAVITY = 560;
const CROWD_TURNIP_GRAVITY = 120;
const runtimeLimits = {
  people: MAX_ACTIVE_PEOPLE,
  turnips: MAX_ACTIVE_TURNIPS,
  floaters: MAX_ACTIVE_FLOATERS,
  particles: MAX_ACTIVE_PARTICLES,
};
const assets = {
  ready: false,
  jarramplas: { down: [], left: [], right: [], up: [] },
  jarramplasVariants: [],
  people: { side: [], front: [], back: [] },
  turnips: [],
  backgrounds: [],
  background: null,
};

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
  pendingScenarioIndex: 0,
  pendingJarramplasIndex: null,
  w: 0,
  h: 0,
  score: 0,
  jarramplasHits: 0,
  peopleHits: 0,
  playerTurnipsThrown: 0,
  crowdTurnipsThrown: 0,
  scoreFromHits: 0,
  peoplePenalty: 0,
  comboCount: 0,
  comboMultiplier: 1,
  timeLeft: 60,
  elapsed: 0,
  totalPaused: 0,
  pausedAt: 0,
  turnipsLeft: 20,
  jarramplasHealth: 100,
  endReason: "",
  startedAt: 0,
  last: 0,
  jarramplas: { x: 0, y: 0, w: 112, h: 150, vx: 76, vy: 0, targetX: 0, targetY: 0, direction: "down", walkFrame: 0, flash: 0, nextMoveAt: 0 },
  people: [],
  turnips: [],
  floaters: [],
  particles: [],
  drag: null,
  hudScore: 0,
  hudLastScore: null,
  hudLastCombo: null,
  hudLastTimeValue: "",
  menuDemoReady: false,
  menuDemoNextThrowAt: 0,
  hasPressedGameWindow: false,
  nextPersonId: 0,
  nextPersonAt: 0,
  scenarioIndex: 0,
  jarramplasIndex: null,
  tutorialNextScreen: "type",
};

const enforceRuntimeLimits = createRuntimeLimiter({ state, limits: runtimeLimits });

const trackEvent = createEventTracker({
  getState: () => state,
  getAssets: () => assets,
  gameTypeConfig,
  difficultyConfig,
});

function maxPeopleHits() {
  return finiteNumber(gameTypeConfig.eviction?.maxPeopleHits);
}

function updateLoadingBar(forcePercent = null) {
  const percent = forcePercent ?? Math.min(99, Math.round((loadingState.loaded / loadingState.total) * 100));
  if (loadingBar) loadingBar.style.width = `${percent}%`;
  if (loadingProgress) loadingProgress.setAttribute("aria-valuenow", String(percent));
}

function markAssetLoaded() {
  loadingState.loaded += 1;
  updateLoadingBar();
}

const loadImageFrame = createImageFrameLoader({ onProgress: markAssetLoaded });
const loadOptionalImage = (path, label = null) => loadOptionalImageWith(path, loadImageFrame, label);
const loadJarramplasFrameSet = (framePaths) => loadJarramplasFrameSetWith(framePaths, loadImageFrame);

async function loadJarramplasVariants() {
  return Promise.all(jarramplasVariants.map(async (variant) => ({
    ...variant,
    frames: await loadJarramplasFrameSet(variant.frames),
  })));
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
  const [jarramplasVariantFrames, people, backgrounds] = await Promise.all([
    loadJarramplasVariants(),
    loadPersonGroups(),
    loadBackgrounds(),
  ]);
  assets.jarramplasVariants = jarramplasVariantFrames;
  assets.jarramplas = jarramplasVariantFrames[0]?.frames || emptyJarramplasFrames();
  assets.people.side = people;
  assets.people.front = people;
  assets.people.back = people;
  assets.turnips = [];
  assets.backgrounds = backgrounds;
  assets.background = backgrounds[Math.floor(Math.random() * backgrounds.length)] || null;
  buildScenarioButtons();
  buildJarramplasButtons();
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
    button.addEventListener("click", () => {
      trackEvent("scenario_selected", { selected_scenario: background.name });
      state.pendingScenarioIndex = index;
      state.pendingJarramplasIndex = null;
      state.mode = "jarramplasSelect";
      showScreen("jarramplasSelect");
    });
    scenarioOptions.appendChild(button);
  });
}

function jarramplasPreviewPath(variant) {
  const frames = variant.frames?.down || [];
  return frames[0]?.path || "";
}

function addJarramplasTile(label, imagePath, onClick) {
  const button = document.createElement("button");
  const preview = document.createElement("img");
  button.type = "button";
  button.setAttribute("aria-label", label);
  preview.alt = "";
  preview.src = imagePath;
  button.append(preview);
  button.addEventListener("click", onClick);
  jarramplasOptions.appendChild(button);
}

function addRandomJarramplasTile(onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "random-jarramplas";
  button.setAttribute("aria-label", "Aleatorio");
  assets.jarramplasVariants.slice(0, 4).forEach((variant) => {
    const preview = document.createElement("img");
    preview.alt = "";
    preview.src = jarramplasPreviewPath(variant);
    button.append(preview);
  });
  button.addEventListener("click", onClick);
  jarramplasOptions.appendChild(button);
}

function buildJarramplasButtons() {
  jarramplasOptions.innerHTML = "";
  addRandomJarramplasTile(() => {
    state.pendingJarramplasIndex = null;
    trackEvent("jarramplas_selected", { selected_jarramplas: "Aleatorio" });
    startGame(state.pendingDifficulty, state.pendingScenarioIndex, null);
  });
  assets.jarramplasVariants.forEach((variant, index) => {
    addJarramplasTile(variant.name, jarramplasPreviewPath(variant), () => {
      state.pendingJarramplasIndex = index;
      trackEvent("jarramplas_selected", { selected_jarramplas: variant.name });
      startGame(state.pendingDifficulty, state.pendingScenarioIndex, index);
    });
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

function updateJarramplasCountdown() {
  const now = new Date();
  let nextJarramplas = new Date(now.getFullYear(), 0, 19);
  if (now >= nextJarramplas) {
    nextJarramplas = new Date(now.getFullYear() + 1, 0, 19);
  }
  const remaining = Math.max(0, nextJarramplas - now);
  const totalSeconds = Math.floor(remaining / 1000);
  const daysLeft = Math.floor(totalSeconds / 86400);
  const hoursLeft = Math.floor((totalSeconds % 86400) / 3600);
  const minutesLeft = Math.floor((totalSeconds % 3600) / 60);
  const secondsLeft = totalSeconds % 60;
  const clock = [hoursLeft, minutesLeft, secondsLeft]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
  jarramplasCountdownEl.textContent = `${daysLeft} días · ${clock}`;
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

const { layoutCrowd, spawnPerson, updatePersonFacing } = createPeopleController({
  state,
  difficultyConfig,
  limits: runtimeLimits,
});

const { showScreen } = createScreenManager({ screens, hud, getMode: () => state.mode });

const {
  populateLeaderboardFilters,
  refreshStatsLeaderboard,
  syncPlayerNameInput,
  updatePlayerName,
  submitResultToLeaderboard,
} = createLeaderboardUi({
  state,
  playerNameInput,
  statsLeaderboardTypeEl,
  statsLeaderboardDifficultyEl,
  gameTypeConfig,
  difficultyConfig,
  formatNumber,
  getLocalLeaderboard,
  getPlayerName,
  saveLocalLeaderboardScore,
  savePlayerName,
  fetchGlobalLeaderboard,
  firebaseErrorMessage,
  isGlobalLeaderboardConfigured,
  submitGlobalScore,
});

const renderStatsScreen = createStatsScreen({
  state,
  statsLeaderboardTypeEl,
  statsLeaderboardDifficultyEl,
  getStats,
  gameTypeConfig,
  difficultyConfig,
  formatNumber,
  formatPercent,
  refreshStatsLeaderboard,
});

function chooseGameType(gameType) {
  if (!assets.ready) return;
  state.pendingGameType = gameType;
  state.mode = "select";
  refreshLevelOptions();
  trackEvent("game_type_selected", { selected_game_type: gameType, selected_game_type_label: gameTypeConfig[gameType]?.label || "" });
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
  trackEvent("difficulty_selected", { selected_difficulty: difficulty, selected_difficulty_label: difficultyConfig[difficulty]?.label || "" });
  showScreen("scenario");
}

function startGame(difficulty, backgroundIndex = 0, jarramplasIndex = null) {
  if (!assets.ready) return;
  const config = difficultyConfig[difficulty];
  const type = gameTypeConfig[state.pendingGameType];
  const selectedJarramplasIndex = Number.isInteger(jarramplasIndex)
    ? jarramplasIndex
    : Math.floor(Math.random() * assets.jarramplasVariants.length);
  const jarramplasVariant = assets.jarramplasVariants[selectedJarramplasIndex];
  assets.jarramplas = jarramplasVariant?.frames || emptyJarramplasFrames();
  assets.background = assets.backgrounds[backgroundIndex] || null;
  state.scenarioIndex = backgroundIndex;
  state.jarramplasIndex = jarramplasIndex;
  state.mode = "playing";
  state.gameType = state.pendingGameType;
  state.difficulty = difficulty;
  state.score = 0;
  state.jarramplasHits = 0;
  state.peopleHits = 0;
  state.playerTurnipsThrown = 0;
  state.crowdTurnipsThrown = 0;
  state.scoreFromHits = 0;
  state.peoplePenalty = 0;
  state.comboCount = 0;
  state.comboMultiplier = 1;
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
  state.menuDemoReady = false;
  state.hudScore = 0;
  state.hudLastScore = null;
  state.hudLastCombo = null;
  state.hudLastTimeValue = "";
  state.hasPressedGameWindow = false;
  state.nextPersonId = 0;
  state.nextPersonAt = performance.now() + 700;
  layoutJarramplas();
  state.jarramplas.x = state.w / 2;
  state.jarramplas.y = state.h * jarramplasMovementConfig.minYRatio;
  state.jarramplas.targetX = state.w / 2;
  state.jarramplas.targetY = state.jarramplas.y;
  state.jarramplas.vx = 0;
  state.jarramplas.vy = 0;
  state.jarramplas.direction = "down";
  state.jarramplas.nextMoveAt = 0;
  state.jarramplas.flash = 0;
  updateHud();
  for (let i = 0; i < config.people; i += 1) spawnPerson(true);
  recordGameStartStats(state.gameType, state.difficulty);
  trackEvent("game_started", {
    people_count: config.people,
    record_score: getRecord(state.gameType, state.difficulty),
    selected_jarramplas: jarramplasIndex === null ? "Aleatorio" : jarramplasVariant?.name || "",
  });
  showScreen(null);
  hud.classList.add("is-visible");
}

function endGame() {
  if (state.mode !== "playing") return;
  const previousBest = getRecord(state.gameType, state.difficulty);
  if (state.gameType === "survival") {
    state.score = Math.max(0, Math.round(
      1200
      - finiteNumber(state.elapsed) * 10
      + finiteNumber(state.jarramplasHits) * 12
      - finiteNumber(state.peopleHits) * 30
    ));
  }
  const best = saveRecord(state.gameType, state.difficulty, state.score);
  const type = gameTypeConfig[state.gameType];
  const difficulty = difficultyConfig[state.difficulty];
  const scenario = assets.backgrounds[state.scenarioIndex];
  const improvedRecord = state.score > previousBest;
  const match = {
    score: state.score,
    gameType: state.gameType,
    difficulty: state.difficulty,
    scenario: scenario?.name || "",
    elapsed: Math.round(state.elapsed),
    turnipsThrown: state.playerTurnipsThrown,
    turnipsHit: state.jarramplasHits,
    peopleHits: state.peopleHits,
  };
  recordGameFinishStats(match);
  state.mode = "result";
  hud.classList.remove("is-visible");
  renderResultScreen({ best, previousBest, improvedRecord });
  trackEvent("game_finished", {
    end_reason: state.endReason || "completed",
    final_score: state.score,
    previous_record: previousBest,
    record_score: best,
    improved_record: improvedRecord,
    turnips_thrown: state.playerTurnipsThrown,
    turnips_hit: state.jarramplasHits,
    people_hits: state.peopleHits,
    crowd_turnips: state.crowdTurnipsThrown,
  });
  showScreen("result");
  submitResultToLeaderboard(match);
}

function endReasonLabel() {
  if (state.endReason === "expulsado") return "Expulsión por avisos";
  if (state.endReason === "jarramplas") return "Jarramplas agotado";
  if (state.endReason === "sin nabos") return "Sin nabos";
  if (state.gameType === "timed") return "Tiempo agotado";
  return "Partida completada";
}

function renderResultScreen({ best, previousBest, improvedRecord }) {
  const type = gameTypeConfig[state.gameType];
  const difficulty = difficultyConfig[state.difficulty];
  const recordEl = document.getElementById("finalRecord");
  const detail = document.getElementById("finalScoreDetail");
  const elapsed = Math.round(state.elapsed);
  const accuracy = formatPercent(state.jarramplasHits, state.playerTurnipsThrown);
  document.getElementById("finalScore").textContent = `${formatNumber(state.score)} pts`;
  document.getElementById("finalMode").textContent = `${type.label} · ${difficulty.label} · ${endReasonLabel()}`;
  document.getElementById("finalTurnipsThrown").textContent = formatNumber(state.playerTurnipsThrown);
  document.getElementById("finalTurnipsHit").textContent = formatNumber(state.jarramplasHits);
  document.getElementById("finalPeopleHits").textContent = formatNumber(state.peopleHits);
  document.getElementById("finalAccuracy").textContent = accuracy;
  recordEl.classList.toggle("is-muted", !improvedRecord);
  recordEl.textContent = improvedRecord
    ? `Nuevo récord: ${formatNumber(best)} pts (antes ${formatNumber(previousBest)} pts)`
    : `Récord de este modo: ${formatNumber(best)} pts`;
  detail.innerHTML = "";
  if (state.gameType === "survival") {
    const timePenalty = Math.round(state.elapsed * 10);
    detail.append(
      detailRow("Base de resistencia", "+1.200 pts"),
      detailRow("Bonus por impactos", `+${formatNumber(state.jarramplasHits * 12)} pts`),
      detailRow("Penalización por tiempo", `-${formatNumber(timePenalty)} pts`),
      detailRow("Penalización por personas", `-${formatNumber(state.peopleHits * 30)} pts`)
    );
  } else {
    detail.append(
      detailRow("Impactos a Jarramplas", `+${formatNumber(state.scoreFromHits)} pts`),
      detailRow("Personas dadas", `-${formatNumber(state.peoplePenalty)} pts`)
    );
  }
  detail.append(
    detailRow("Duración", `${formatNumber(elapsed)} s`),
    detailRow("Nabos de la gente", formatNumber(state.crowdTurnipsThrown))
  );
}

function pauseGame() {
  if (state.mode !== "playing") return;
  state.mode = "paused";
  state.pausedAt = performance.now();
  state.drag = null;
  trackEvent("game_paused");
  showScreen("pause");
}

function resumeGame() {
  if (state.mode !== "paused") return;
  const now = performance.now();
  state.totalPaused += now - state.pausedAt;
  state.pausedAt = 0;
  state.last = now;
  state.mode = "playing";
  trackEvent("game_resumed");
  showScreen(null);
  hud.classList.add("is-visible");
}

function restartGame() {
  const difficulty = state.difficulty;
  const gameType = state.gameType;
  const scenarioIndex = state.scenarioIndex;
  const jarramplasIndex = state.jarramplasIndex;
  state.pendingGameType = gameType;
  trackEvent("game_restarted", { restart_from: state.mode });
  startGame(difficulty, scenarioIndex, jarramplasIndex);
}

function goHome() {
  trackEvent("home_opened", { from_mode: state.mode });
  state.mode = "menu";
  resetMenuDemo();
  hud.classList.remove("is-visible");
  showScreen("start");
}

const { addFloater, addJarramplasImpact, updateEffects } = createEffects({
  state,
  impactEffectConfig,
  limits: runtimeLimits,
});

function launchOrigin() {
  return {
    x: state.w / 2,
    y: state.h - Math.max(54, state.h * 0.08),
  };
}

const { updateHud, advanceCombo, resetCombo } = createHud({
  scoreEl,
  timeEl,
  comboEl,
  recordEl,
  state,
  getRecord,
  formatNumber,
  finiteNumber,
  maxPeopleHits,
});

function showShareFeedback(button, message) {
  if (!button) {
    window.alert(message);
    return;
  }
  const originalText = button.textContent;
  button.textContent = message;
  button.disabled = true;
  window.setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
  }, 1600);
}

function copyWithLegacyFallback(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  textarea.remove();
  return copied;
}

async function copyShareText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy path for older Safari and locked-down contexts.
    }
  }
  return copyWithLegacyFallback(text);
}

async function shareText(text, button = null) {
  const url = window.location.href.split("#")[0];
  const fullText = `${text} ${url}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: shareTextConfig.gameTitle, text: fullText, url });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }

  if (await copyShareText(fullText)) {
    showShareFeedback(button, "Enlace copiado");
    return;
  }

  window.prompt("Copia el enlace", fullText);
  showShareFeedback(button, "Copiar enlace");
}

function shareGame(event) {
  trackEvent("share_game");
  shareText(shareTextConfig.gameShareText, event?.currentTarget);
}

function shareResult(event) {
  const type = gameTypeConfig[state.gameType];
  const difficulty = difficultyConfig[state.difficulty];
  trackEvent("share_result", { final_score: state.score });
  shareText(
    shareTextConfig.resultTemplate
      .replace("{points}", state.score)
      .replace("{level}", difficulty.shareLabel)
      .replace("{type}", type.label),
    event?.currentTarget
  );
}

const { updateJarramplasMotion } = createJarramplasMotion({
  state,
  difficultyConfig,
  jarramplasMovementConfig,
});

const { launchMotion, updateTurnipMotion } = createTurnipMotion({
  state,
  clamp,
  easeOutQuad,
  lerp,
  playerMinLaunchSpeed: PLAYER_MIN_LAUNCH_SPEED,
  playerMaxLaunchSpeed: PLAYER_MAX_LAUNCH_SPEED,
  playerMinGravity: PLAYER_MIN_GRAVITY,
  playerMaxGravity: PLAYER_MAX_GRAVITY,
  crowdTurnipGravity: CROWD_TURNIP_GRAVITY,
});

function launchTurnip(from, to, owner) {
  const motion = launchMotion(from, to, owner);
  if (motion.power < 20) return;
  if (owner === "player" && state.gameType === "limitedTurnips") {
    if (state.turnipsLeft <= 0) return;
    state.turnipsLeft -= 1;
  }
  if (owner === "player") {
    state.playerTurnipsThrown += 1;
    trackEvent("turnip_thrown", {
      turnip_owner: owner,
      turnips_thrown: state.playerTurnipsThrown,
      launch_power: Math.round(motion.power),
      launch_pull: Math.round(motion.pull * 100),
    });
  } else {
    state.crowdTurnipsThrown += 1;
  }
  state.turnips.push({
    x: from.x,
    y: from.y,
    vx: motion.vx,
    vy: motion.vy,
    gravity: motion.gravity,
    r: Math.max(13, Math.min(state.w, state.h) * 0.03),
    spin: Math.random() * 6.28,
    owner,
    hit: false,
  });
  trimRuntimeArray(state.turnips, MAX_ACTIVE_TURNIPS);
  updateHud();
}

const { resetMenuDemo, updateMenuDemo } = createMenuDemo({
  state,
  assets,
  emptyJarramplasFrames,
  updateTurnipMotion,
  rectCircleHit,
  addJarramplasImpact,
  limits: runtimeLimits,
});

function update(now) {
  const dt = Math.min((now - state.last) / 1000, 0.033);
  state.last = now;

  if (state.mode === "menu") {
    updateMenuDemo(now, dt);
  }

  if (state.mode === "playing") {
    const type = gameTypeConfig[state.gameType];
    state.elapsed = (now - state.startedAt - state.totalPaused) / 1000;
    if (state.gameType === "timed") {
      state.timeLeft = Math.max(0, type.duration - state.elapsed);
      if (state.timeLeft <= 0) endGame();
    }
    if (state.mode !== "playing") return;
    updateHud();

    if (state.drag) {
      const follow = 1 - Math.pow(0.0001, dt);
      state.drag.current.x += (state.drag.target.x - state.drag.current.x) * follow;
      state.drag.current.y += (state.drag.target.y - state.drag.current.y) * follow;
    }

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
      updateTurnipMotion(turnip, dt);
      turnip.spin += dt * 10;
      if (turnip.hit) continue;

      if (turnip.owner === "player") {
        for (const person of state.people) {
          const hitBox = { x: person.x, y: person.y, w: person.w * 0.92, h: person.h * 0.86 };
          if (rectCircleHit(hitBox, turnip)) {
            turnip.hit = true;
            vibrateImpact();
            resetCombo();
            state.peopleHits += 1;
            state.peoplePenalty += 5;
            state.score = Math.max(0, state.score - 5);
            addFloater("-5", person.x, person.y - person.h * 0.72, "#ff8f77");
            trackEvent("person_hit", {
              people_hits: state.peopleHits,
              score_after_hit: state.score,
            });
            if (state.gameType === "eviction" && finiteNumber(state.peopleHits) >= finiteNumber(type.maxPeopleHits)) {
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
          vibrateImpact();
          state.jarramplasHits += 1;
          j.flash = 0.22;
          const multiplier = advanceCombo();
          if (state.gameType === "survival") {
            state.jarramplasHealth = Math.max(0, state.jarramplasHealth - 10);
            const baseGain = Math.max(1, Math.round(40 - state.elapsed * 0.35));
            const gain = baseGain * multiplier;
            state.score += gain;
            state.scoreFromHits += gain;
            addFloater(`+${gain} x${multiplier}`, j.x, j.y + j.h * 0.18, "#f2df70");
            trackEvent("jarramplas_hit", {
              hit_points: gain,
              combo_count: state.comboCount,
              combo_multiplier: multiplier,
              jarramplas_hits: state.jarramplasHits,
              score_after_hit: state.score,
            });
            if (state.jarramplasHealth <= 0) {
              state.endReason = "jarramplas";
              endGame();
            }
          } else {
            const gain = 10 * multiplier;
            state.score += gain;
            state.scoreFromHits += gain;
            addFloater(`+${gain} x${multiplier}`, j.x, j.y + j.h * 0.18, "#f2df70");
            trackEvent("jarramplas_hit", {
              hit_points: gain,
              combo_count: state.comboCount,
              combo_multiplier: multiplier,
              jarramplas_hits: state.jarramplasHits,
              score_after_hit: state.score,
            });
          }
        }
      }
    }
    state.turnips = state.turnips.filter((t) => {
      const inBounds = t.x > -90 && t.x < state.w + 90 && t.y > -120 && t.y < state.h + 120;
      if (!t.hit && !inBounds && t.owner === "player") resetCombo();
      return !t.hit && inBounds;
    });
    enforceRuntimeLimits();
    if (state.gameType === "limitedTurnips" && state.turnipsLeft <= 0 && !state.turnips.some((t) => t.owner === "player")) {
      state.endReason = "sin nabos";
      endGame();
    }
  }

  updateEffects(dt);
  enforceRuntimeLimits();
}

const { render } = createRenderer({
  ctx,
  state,
  assets,
  launchOrigin,
  launchMotion,
  lerp,
});

function loop(now) {
  update(now);
  render();
  requestAnimationFrame(loop);
}

const { onPointerStart, onPointerMove, onPointerEnd } = createPointerHandlers({
  canvas,
  state,
  launchOrigin,
  launchTurnip,
});

applyLevelLabels();
populateLeaderboardFilters();
initAnalytics();
trackEvent("app_loaded");

playButton.addEventListener("click", () => {
  updatePlayerName(playerNameInput?.value || getPlayerName());
  trackEvent("menu_play_clicked");
  if (!hasSeenTutorial()) {
    state.tutorialNextScreen = "type";
    state.mode = "tutorial";
    showScreen("tutorial");
    return;
  }
  state.mode = "type";
  showScreen("type");
});
playerNameInput?.addEventListener("change", () => {
  updatePlayerName(playerNameInput.value);
});
playerNameInput?.addEventListener("input", () => {
  if (playerNameInput.value.trim()) savePlayerName(playerNameInput.value);
});
playerNameInput?.addEventListener("blur", () => {
  updatePlayerName(playerNameInput.value);
});
document.getElementById("statsButton").addEventListener("click", () => {
  renderStatsScreen();
  state.mode = "stats";
  trackEvent("stats_opened");
  showScreen("stats");
});
document.getElementById("statsBackButton").addEventListener("click", () => {
  state.mode = "menu";
  showScreen("start");
});
document.getElementById("howToButton").addEventListener("click", () => {
  state.tutorialNextScreen = "start";
  state.mode = "tutorial";
  trackEvent("tutorial_opened");
  showScreen("tutorial");
});
document.getElementById("aboutButton").addEventListener("click", () => {
  state.mode = "about";
  trackEvent("about_opened");
  showScreen("about");
});
document.getElementById("aboutBackButton").addEventListener("click", () => {
  state.mode = "menu";
  showScreen("start");
});
document.getElementById("shareButton").addEventListener("click", shareGame);
document.getElementById("tutorialButton").addEventListener("click", () => {
  markTutorialSeen();
  trackEvent("tutorial_completed");
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
document.getElementById("jarramplasBackButton").addEventListener("click", () => {
  state.mode = "scenario";
  showScreen("scenario");
});
document.getElementById("playAgainButton").addEventListener("click", restartGame);
document.getElementById("againButton").addEventListener("click", () => {
  trackEvent("new_game_flow_opened");
  state.mode = "type";
  showScreen("type");
});
document.getElementById("shareResultButton").addEventListener("click", shareResult);
document.getElementById("pauseButton").addEventListener("click", pauseGame);
document.getElementById("resumeButton").addEventListener("click", resumeGame);
document.getElementById("restartButton").addEventListener("click", restartGame);
document.getElementById("homeButton").addEventListener("click", goHome);
statsLeaderboardTypeEl?.addEventListener("change", refreshStatsLeaderboard);
statsLeaderboardDifficultyEl?.addEventListener("change", refreshStatsLeaderboard);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseGame();
});
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
setInterval(updateJarramplasCountdown, 1000);
syncPlayerNameInput();
if (gameVersionEl) gameVersionEl.textContent = `v${APP_VERSION}`;
resize();
loadAssets().catch((error) => {
  console.error(error);
  playButton.textContent = "Error";
});
requestAnimationFrame(loop);

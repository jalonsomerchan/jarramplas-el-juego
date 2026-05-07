import { firebaseConfig } from "./firebase-config.js";

const FIREBASE_APP_URL = "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
const FIRESTORE_URL = "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
const SCORE_LIMITS = {
  min: 0,
  max: 999999,
};

let firebaseState = null;

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function sanitizePlayerName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 18) || "Jugador";
}

function validKey(value, allowedKeys) {
  return Boolean(value && Object.prototype.hasOwnProperty.call(allowedKeys, value));
}

function sanitizeScoreEntry(entry, gameTypeConfig, difficultyConfig) {
  if (!validKey(entry.gameType, gameTypeConfig) || !validKey(entry.difficulty, difficultyConfig)) {
    throw new Error("Modo o dificultad no validos");
  }
  const score = Math.round(finiteNumber(entry.score, -1));
  if (score < SCORE_LIMITS.min || score > SCORE_LIMITS.max) {
    throw new Error("Puntuacion fuera de rango");
  }
  return {
    playerName: sanitizePlayerName(entry.playerName),
    score,
    gameType: entry.gameType,
    difficulty: entry.difficulty,
    accuracy: Math.max(0, Math.min(100, Math.round(finiteNumber(entry.accuracy)))),
    jarramplasHits: Math.max(0, Math.min(1000, Math.round(finiteNumber(entry.jarramplasHits)))),
    peopleHits: Math.max(0, Math.min(1000, Math.round(finiteNumber(entry.peopleHits)))),
    createdAt: Math.round(finiteNumber(entry.createdAt, Date.now())),
  };
}

function hasFirebaseConfig() {
  const config = firebaseConfig?.firebase || {};
  return Boolean(firebaseConfig?.enabled && config.apiKey && config.projectId && config.appId);
}

async function getFirebaseState() {
  if (!hasFirebaseConfig()) return null;
  if (firebaseState) return firebaseState;
  const [{ initializeApp }, firestore] = await Promise.all([
    import(FIREBASE_APP_URL),
    import(FIRESTORE_URL),
  ]);
  const app = initializeApp(firebaseConfig.firebase);
  const db = firestore.getFirestore(app);
  firebaseState = { db, firestore };
  return firebaseState;
}

export function isGlobalLeaderboardConfigured() {
  return hasFirebaseConfig();
}

export async function submitGlobalScore(entry, gameTypeConfig, difficultyConfig) {
  const state = await getFirebaseState();
  if (!state) return { ok: false, reason: "disabled" };
  const safeEntry = sanitizeScoreEntry(entry, gameTypeConfig, difficultyConfig);
  await state.firestore.addDoc(
    state.firestore.collection(state.db, firebaseConfig.collectionName || "scores"),
    safeEntry
  );
  return { ok: true };
}

export async function fetchGlobalLeaderboard(gameType, difficulty, gameTypeConfig, difficultyConfig) {
  const state = await getFirebaseState();
  if (!state) return { ok: false, reason: "disabled", entries: [] };
  if (!validKey(gameType, gameTypeConfig) || !validKey(difficulty, difficultyConfig)) {
    return { ok: false, reason: "invalid-filter", entries: [] };
  }
  const scoresRef = state.firestore.collection(state.db, firebaseConfig.collectionName || "scores");
  const scoresQuery = state.firestore.query(
    scoresRef,
    state.firestore.where("gameType", "==", gameType),
    state.firestore.where("difficulty", "==", difficulty),
    state.firestore.orderBy("score", "desc"),
    state.firestore.limit(10)
  );
  const snapshot = await state.firestore.getDocs(scoresQuery);
  return {
    ok: true,
    entries: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
  };
}

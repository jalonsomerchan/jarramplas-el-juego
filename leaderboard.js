import { firebaseConfig } from "./firebase-config.js";

const SCORE_LIMITS = {
  min: 0,
  max: 999999,
};
const AUTH_STORAGE_KEY = "jarramplas.firebaseAuth.v1";
const TOKEN_REFRESH_MARGIN_MS = 60 * 1000;
const DEVICE_TEXT_LIMIT = 160;

let anonymousAuthPromise = null;

export function firebaseErrorMessage(error) {
  if (error?.code === "auth-disabled") return "Activa la autenticación anónima en Firebase Authentication.";
  if (error?.code === "auth-error") return "No se pudo iniciar sesión anónima en Firebase.";
  if (error?.code === "permission-denied") return "Firebase denegó permisos. Revisa las reglas de Firestore.";
  if (error?.code === "failed-precondition") return "Firebase necesita crear un índice para esta consulta.";
  if (error?.code === "unavailable") return "Firebase no está disponible ahora mismo.";
  if (error?.code === "not-found") return "Firebase no encuentra la base de datos o la colección configurada.";
  return error?.message || "Error desconocido de Firebase.";
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function sanitizeText(value, fallback = "") {
  return String(value || fallback)
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, DEVICE_TEXT_LIMIT);
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

function userAgentIncludes(userAgent, value) {
  return userAgent.toLowerCase().includes(value.toLowerCase());
}

function detectBrowser(userAgent, userAgentData = null) {
  const brands = userAgentData?.brands || userAgentData?.fullVersionList || [];
  const brand = brands.find((item) => !/not.?a.?brand/i.test(item.brand || ""))?.brand || "";
  if (/edg/i.test(brand) || /edg\//i.test(userAgent)) return "Edge";
  if (/samsung/i.test(brand) || /SamsungBrowser/i.test(userAgent)) return "Samsung Internet";
  if (/opera|opr/i.test(brand) || /OPR\//i.test(userAgent)) return "Opera";
  if (/firefox/i.test(brand) || /Firefox\//i.test(userAgent)) return "Firefox";
  if (/chrome|chromium/i.test(brand) || /Chrome\//i.test(userAgent)) return "Chrome";
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return "Safari";
  return brand || "Desconocido";
}

function detectOS(userAgent, platform = "") {
  if (/iPad|iPhone|iPod/i.test(userAgent)) return "iOS";
  if (/Macintosh/i.test(userAgent) && userAgentIncludes(userAgent, "Mobile")) return "iPadOS";
  if (/Android/i.test(userAgent)) return "Android";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Mac OS X|Macintosh/i.test(userAgent) || /Mac/i.test(platform)) return "macOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return platform || "Desconocido";
}

function detectDeviceType(userAgent, userAgentData = null) {
  if (userAgentData?.mobile === true) return "mobile";
  if (/iPad|Tablet/i.test(userAgent)) return "tablet";
  if (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent)) return "tablet";
  if (/Mobi|iPhone|iPod|Android/i.test(userAgent)) return "mobile";
  return "desktop";
}

function detectModel(userAgent, userAgentData = null) {
  const model = sanitizeText(userAgentData?.model || "");
  if (model) return model;
  if (/iPad/i.test(userAgent) || (/Macintosh/i.test(userAgent) && userAgentIncludes(userAgent, "Mobile"))) return "iPad";
  if (/iPhone/i.test(userAgent)) return "iPhone";
  if (/iPod/i.test(userAgent)) return "iPod";
  const androidModel = userAgent.match(/Android[^;]*;\s*([^;)]+)(?:\)|;)/i)?.[1];
  if (androidModel) return sanitizeText(androidModel.replace(/Build\/.*/i, ""));
  return "";
}

function sanitizeBrandList(brands = []) {
  return brands
    .map((item) => ({
      brand: sanitizeText(item?.brand || ""),
      version: sanitizeText(item?.version || ""),
    }))
    .filter((item) => item.brand)
    .slice(0, 8);
}

async function collectDeviceInfo() {
  try {
    const userAgentData = navigator.userAgentData || null;
    let highEntropy = {};
    if (userAgentData?.getHighEntropyValues) {
      highEntropy = await userAgentData.getHighEntropyValues([
        "architecture",
        "bitness",
        "fullVersionList",
        "model",
        "mobile",
        "platform",
        "platformVersion",
        "uaFullVersion",
      ]).catch(() => ({}));
    }
    const mergedUserAgentData = { ...userAgentData, ...highEntropy };
    const userAgent = sanitizeText(navigator.userAgent || "", "");
    const platform = sanitizeText(mergedUserAgentData.platform || navigator.platform || "");
    const screenInfo = window.screen || {};
    return {
      os: detectOS(userAgent, platform),
      platform,
      platformVersion: sanitizeText(mergedUserAgentData.platformVersion || ""),
      deviceType: detectDeviceType(userAgent, mergedUserAgentData),
      model: detectModel(userAgent, mergedUserAgentData),
      browser: detectBrowser(userAgent, mergedUserAgentData),
      browserVersion: sanitizeText(mergedUserAgentData.uaFullVersion || ""),
      language: sanitizeText(navigator.language || ""),
      languages: Array.isArray(navigator.languages) ? navigator.languages.map((language) => sanitizeText(language)).filter(Boolean).slice(0, 8) : [],
      timezone: sanitizeText(Intl.DateTimeFormat().resolvedOptions().timeZone || ""),
      screenWidth: Math.round(finiteNumber(screenInfo.width)),
      screenHeight: Math.round(finiteNumber(screenInfo.height)),
      viewportWidth: Math.round(finiteNumber(window.innerWidth)),
      viewportHeight: Math.round(finiteNumber(window.innerHeight)),
      devicePixelRatio: Math.round(finiteNumber(window.devicePixelRatio || 1) * 100) / 100,
      touchPoints: Math.round(finiteNumber(navigator.maxTouchPoints)),
      standalone: Boolean(window.matchMedia?.("(display-mode: standalone)")?.matches || navigator.standalone),
      brands: sanitizeBrandList(mergedUserAgentData.fullVersionList || mergedUserAgentData.brands || []),
      userAgent,
    };
  } catch {
    return {
      os: "Desconocido",
      deviceType: "unknown",
      browser: "Desconocido",
      language: "",
    };
  }
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

function identityToolkitUrl(path) {
  return `https://identitytoolkit.googleapis.com/v1/${path}?key=${encodeURIComponent(firebaseConfig.firebase.apiKey)}`;
}

function secureTokenUrl() {
  return `https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(firebaseConfig.firebase.apiKey)}`;
}

function firestoreBaseUrl() {
  const { projectId } = firebaseConfig.firebase;
  const database = encodeURIComponent("(default)");
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${database}/documents`;
}

function firestoreUrl(path = "") {
  const cleanPath = path.startsWith(":") ? path : (path ? `/${path.replace(/^\/+/, "")}` : "");
  return `${firestoreBaseUrl()}${cleanPath}?key=${encodeURIComponent(firebaseConfig.firebase.apiKey)}`;
}

function readStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function writeStoredAuth(auth) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } catch {
    // The token is an optimization; auth still works for the current request without storage.
  }
}

function hasValidToken(auth) {
  return Boolean(auth?.idToken && finiteNumber(auth.expiresAt) - TOKEN_REFRESH_MARGIN_MS > Date.now());
}

async function createAnonymousAuth() {
  const response = await fetch(identityToolkitUrl("accounts:signUp"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || "No se pudo iniciar sesión anónima en Firebase.");
    error.code = payload?.error?.message === "OPERATION_NOT_ALLOWED" ? "auth-disabled" : "auth-error";
    error.status = response.status;
    throw error;
  }
  const auth = {
    idToken: payload.idToken,
    refreshToken: payload.refreshToken,
    localId: payload.localId,
    expiresAt: Date.now() + finiteNumber(payload.expiresIn, 3600) * 1000,
  };
  writeStoredAuth(auth);
  return auth;
}

async function refreshAnonymousAuth(auth) {
  if (!auth?.refreshToken) return createAnonymousAuth();
  const response = await fetch(secureTokenUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: auth.refreshToken,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return createAnonymousAuth();
  const nextAuth = {
    idToken: payload.id_token,
    refreshToken: payload.refresh_token || auth.refreshToken,
    localId: payload.user_id || auth.localId,
    expiresAt: Date.now() + finiteNumber(payload.expires_in, 3600) * 1000,
  };
  writeStoredAuth(nextAuth);
  return nextAuth;
}

async function getAnonymousAuth() {
  const storedAuth = readStoredAuth();
  if (hasValidToken(storedAuth)) return storedAuth;
  if (!anonymousAuthPromise) {
    anonymousAuthPromise = refreshAnonymousAuth(storedAuth).finally(() => {
      anonymousAuthPromise = null;
    });
  }
  return anonymousAuthPromise;
}

function fieldValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(fieldValue) } };
  }
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value)
            .filter(([, nestedValue]) => nestedValue !== undefined)
            .map(([key, nestedValue]) => [key, fieldValue(nestedValue)])
        ),
      },
    };
  }
  return { stringValue: String(value) };
}

function documentFromScore(entry) {
  return {
    fields: Object.fromEntries(
      Object.entries(entry).map(([key, value]) => [key, fieldValue(value)])
    ),
  };
}

function valueFromField(field) {
  if (!field || typeof field !== "object") return "";
  if ("integerValue" in field) return Number(field.integerValue);
  if ("doubleValue" in field) return Number(field.doubleValue);
  if ("booleanValue" in field) return Boolean(field.booleanValue);
  if ("stringValue" in field) return field.stringValue;
  return "";
}

function scoreFromDocument(document) {
  const fields = document?.fields || {};
  const id = String(document?.name || "").split("/").pop();
  return {
    id,
    playerName: valueFromField(fields.playerName),
    score: finiteNumber(valueFromField(fields.score)),
    gameType: valueFromField(fields.gameType),
    difficulty: valueFromField(fields.difficulty),
    accuracy: finiteNumber(valueFromField(fields.accuracy)),
    jarramplasHits: finiteNumber(valueFromField(fields.jarramplasHits)),
    peopleHits: finiteNumber(valueFromField(fields.peopleHits)),
    createdAt: finiteNumber(valueFromField(fields.createdAt)),
  };
}

async function fetchFirestore(url, options = {}) {
  const auth = await getAnonymousAuth();
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.idToken}`,
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const firebaseError = Array.isArray(payload) ? payload[0]?.error : payload?.error;
    const error = new Error(firebaseError?.message || "Error de Firebase");
    error.code = firebaseError?.status === "PERMISSION_DENIED"
      ? "permission-denied"
      : firebaseError?.status?.toLowerCase().replace(/_/g, "-");
    error.status = response.status;
    throw error;
  }
  return payload;
}

export function isGlobalLeaderboardConfigured() {
  return hasFirebaseConfig();
}

export async function submitGlobalScore(entry, gameTypeConfig, difficultyConfig) {
  if (!hasFirebaseConfig()) return { ok: false, reason: "disabled" };
  const safeEntry = sanitizeScoreEntry(entry, gameTypeConfig, difficultyConfig);
  const device = await collectDeviceInfo();
  await fetchFirestore(firestoreUrl(firebaseConfig.collectionName || "scores"), {
    method: "POST",
    body: JSON.stringify(documentFromScore({ ...safeEntry, device })),
  });
  return { ok: true };
}

export async function fetchGlobalLeaderboard(gameType, difficulty, gameTypeConfig, difficultyConfig) {
  if (!hasFirebaseConfig()) return { ok: false, reason: "disabled", entries: [] };
  if (!validKey(gameType, gameTypeConfig) || !validKey(difficulty, difficultyConfig)) {
    return { ok: false, reason: "invalid-filter", entries: [] };
  }
  const collectionName = firebaseConfig.collectionName || "scores";
  let result;
  try {
    result = await fetchFirestore(firestoreUrl(":runQuery"), {
      method: "POST",
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: collectionName }],
          where: {
            compositeFilter: {
              op: "AND",
              filters: [
                { fieldFilter: { field: { fieldPath: "gameType" }, op: "EQUAL", value: { stringValue: gameType } } },
                { fieldFilter: { field: { fieldPath: "difficulty" }, op: "EQUAL", value: { stringValue: difficulty } } },
              ],
            },
          },
          orderBy: [{ field: { fieldPath: "score" }, direction: "DESCENDING" }],
          limit: 10,
        },
      }),
    });
  } catch (error) {
    if (error?.code !== "failed-precondition") throw error;
    result = await fetchFirestore(firestoreUrl(":runQuery"), {
      method: "POST",
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: collectionName }],
          where: {
            fieldFilter: {
              field: { fieldPath: "gameType" },
              op: "EQUAL",
              value: { stringValue: gameType },
            },
          },
        },
      }),
    });
  }
  const entries = result
    .map((item) => scoreFromDocument(item.document))
    .filter((entry) => entry.gameType === gameType && entry.difficulty === difficulty)
    .sort((a, b) => finiteNumber(b.score) - finiteNumber(a.score))
    .slice(0, 10);
  return {
    ok: true,
    entries,
  };
}

import { STORAGE_KEYS } from "./config.js";

export function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.records) || "{}");
  } catch {
    return {};
  }
}

function recordKey(gameType, difficulty) {
  return `${gameType}:${difficulty}`;
}

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

export function getRecord(gameType, difficulty) {
  const records = getRecords();
  return finiteNumber(records[recordKey(gameType, difficulty)]);
}

export function saveRecord(gameType, difficulty, score) {
  const records = getRecords();
  const key = recordKey(gameType, difficulty);
  const best = Math.max(finiteNumber(records[key]), finiteNumber(score));
  records[key] = best;
  localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records));
  return best;
}

export function getPlayerName() {
  try {
    return sanitizePlayerName(localStorage.getItem(STORAGE_KEYS.playerName));
  } catch {
    return "Jugador";
  }
}

export function savePlayerName(playerName) {
  const safeName = sanitizePlayerName(playerName);
  localStorage.setItem(STORAGE_KEYS.playerName, safeName);
  return safeName;
}

export function getLocalLeaderboard(gameType, difficulty) {
  try {
    const entries = JSON.parse(localStorage.getItem(STORAGE_KEYS.leaderboard) || "[]");
    return entries
      .filter((entry) => entry.gameType === gameType && entry.difficulty === difficulty)
      .sort((a, b) => finiteNumber(b.score) - finiteNumber(a.score))
      .slice(0, 10);
  } catch {
    return [];
  }
}

export function saveLocalLeaderboardScore(scoreEntry) {
  let entries = [];
  try {
    entries = JSON.parse(localStorage.getItem(STORAGE_KEYS.leaderboard) || "[]");
  } catch {
    entries = [];
  }
  const entry = {
    playerName: sanitizePlayerName(scoreEntry.playerName),
    score: Math.max(0, Math.min(999999, Math.round(finiteNumber(scoreEntry.score)))),
    gameType: scoreEntry.gameType,
    difficulty: scoreEntry.difficulty,
    accuracy: Math.max(0, Math.min(100, Math.round(finiteNumber(scoreEntry.accuracy)))),
    jarramplasHits: Math.max(0, Math.round(finiteNumber(scoreEntry.jarramplasHits))),
    peopleHits: Math.max(0, Math.round(finiteNumber(scoreEntry.peopleHits))),
    createdAt: finiteNumber(scoreEntry.createdAt, Date.now()),
  };
  entries = [entry, ...entries]
    .filter((item) => item.gameType && item.difficulty)
    .sort((a, b) => finiteNumber(b.score) - finiteNumber(a.score))
    .filter((item, index, list) => (
      list.filter((other, otherIndex) => (
        otherIndex <= index
        && other.gameType === item.gameType
        && other.difficulty === item.difficulty
      )).length <= 10
    ));
  localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify(entries));
  return entry;
}

export function defaultStats() {
  return {
    gamesStarted: 0,
    gamesFinished: 0,
    turnipsThrown: 0,
    turnipsHit: 0,
    peopleHits: 0,
    totalScore: 0,
    bestScore: 0,
    totalElapsed: 0,
    byType: {},
    byDifficulty: {},
    scores: [],
  };
}

export function getStats() {
  try {
    return { ...defaultStats(), ...JSON.parse(localStorage.getItem(STORAGE_KEYS.stats) || "{}") };
  } catch {
    return defaultStats();
  }
}

function saveStats(stats) {
  localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
}

function bumpStatsBucket(stats, bucket, key, values) {
  stats[bucket][key] = {
    gamesStarted: 0,
    gamesFinished: 0,
    turnipsThrown: 0,
    turnipsHit: 0,
    peopleHits: 0,
    totalScore: 0,
    bestScore: 0,
    ...stats[bucket][key],
  };
  Object.entries(values).forEach(([name, value]) => {
    if (name === "bestScore") {
      stats[bucket][key][name] = Math.max(finiteNumber(stats[bucket][key][name]), finiteNumber(value));
      return;
    }
    stats[bucket][key][name] = finiteNumber(stats[bucket][key][name]) + finiteNumber(value);
  });
}

export function recordGameStartStats(gameType, difficulty) {
  const stats = getStats();
  stats.gamesStarted += 1;
  bumpStatsBucket(stats, "byType", gameType, { gamesStarted: 1 });
  bumpStatsBucket(stats, "byDifficulty", difficulty, { gamesStarted: 1 });
  saveStats(stats);
}

export function recordGameFinishStats(match) {
  const stats = getStats();
  const values = {
    gamesFinished: 1,
    turnipsThrown: finiteNumber(match.turnipsThrown),
    turnipsHit: finiteNumber(match.turnipsHit),
    peopleHits: finiteNumber(match.peopleHits),
    totalScore: finiteNumber(match.score),
    bestScore: finiteNumber(match.score),
  };
  stats.gamesFinished += 1;
  stats.turnipsThrown = finiteNumber(stats.turnipsThrown) + values.turnipsThrown;
  stats.turnipsHit = finiteNumber(stats.turnipsHit) + values.turnipsHit;
  stats.peopleHits = finiteNumber(stats.peopleHits) + values.peopleHits;
  stats.totalScore = finiteNumber(stats.totalScore) + values.totalScore;
  stats.bestScore = Math.max(finiteNumber(stats.bestScore), values.bestScore);
  stats.totalElapsed = finiteNumber(stats.totalElapsed) + finiteNumber(match.elapsed);
  stats.scores = [
    {
      score: values.totalScore,
      gameType: match.gameType,
      difficulty: match.difficulty,
      scenario: match.scenario,
      playedAt: Date.now(),
    },
    ...(stats.scores || []),
  ].slice(0, 12);
  bumpStatsBucket(stats, "byType", match.gameType, values);
  bumpStatsBucket(stats, "byDifficulty", match.difficulty, values);
  saveStats(stats);
}

export function formatNumber(value) {
  return new Intl.NumberFormat("es-ES").format(Math.round(finiteNumber(value)));
}

export function formatPercent(value, total) {
  const number = Number(value);
  const totalNumber = Number(total);
  if (!Number.isFinite(number) || !Number.isFinite(totalNumber) || totalNumber <= 0) return "0%";
  return `${Math.round((number / totalNumber) * 100)}%`;
}

export function hasSeenTutorial() {
  return localStorage.getItem(STORAGE_KEYS.tutorial) === "1";
}

export function markTutorialSeen() {
  localStorage.setItem(STORAGE_KEYS.tutorial, "1");
}

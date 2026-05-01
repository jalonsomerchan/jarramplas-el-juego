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

export function getRecord(gameType, difficulty) {
  const records = getRecords();
  return Number(records[recordKey(gameType, difficulty)] || 0);
}

export function saveRecord(gameType, difficulty, score) {
  const records = getRecords();
  const key = recordKey(gameType, difficulty);
  const best = Math.max(Number(records[key] || 0), score);
  records[key] = best;
  localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records));
  return best;
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
      stats[bucket][key][name] = Math.max(stats[bucket][key][name] || 0, value);
      return;
    }
    stats[bucket][key][name] = (stats[bucket][key][name] || 0) + value;
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
    turnipsThrown: match.turnipsThrown,
    turnipsHit: match.turnipsHit,
    peopleHits: match.peopleHits,
    totalScore: match.score,
    bestScore: match.score,
  };
  stats.gamesFinished += 1;
  stats.turnipsThrown += match.turnipsThrown;
  stats.turnipsHit += match.turnipsHit;
  stats.peopleHits += match.peopleHits;
  stats.totalScore += match.score;
  stats.bestScore = Math.max(stats.bestScore || 0, match.score);
  stats.totalElapsed += match.elapsed;
  stats.scores = [
    {
      score: match.score,
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
  return new Intl.NumberFormat("es-ES").format(Math.round(Number(value) || 0));
}

export function formatPercent(value, total) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export function hasSeenTutorial() {
  return localStorage.getItem(STORAGE_KEYS.tutorial) === "1";
}

export function markTutorialSeen() {
  localStorage.setItem(STORAGE_KEYS.tutorial, "1");
}

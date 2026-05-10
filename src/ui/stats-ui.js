export function statBox(value, label) {
  const box = document.createElement("div");
  const strong = document.createElement("strong");
  const span = document.createElement("span");
  box.className = "stat-box";
  strong.textContent = value;
  span.textContent = label;
  box.append(strong, span);
  return box;
}

export function detailRow(label, value) {
  const row = document.createElement("div");
  const labelEl = document.createElement("span");
  const valueEl = document.createElement("strong");
  row.className = "detail-row";
  labelEl.textContent = label;
  valueEl.textContent = value;
  row.append(labelEl, valueEl);
  return row;
}

export function createStatsScreen({
  state,
  statsLeaderboardTypeEl,
  statsLeaderboardDifficultyEl,
  getStats,
  gameTypeConfig,
  difficultyConfig,
  formatNumber,
  formatPercent,
  refreshStatsLeaderboard,
}) {
  return function renderStatsScreen() {
    const stats = getStats();
    const grid = document.getElementById("statsGrid");
    const details = document.getElementById("statsDetails");
    const favoriteType = Object.entries(stats.byType || {}).sort((a, b) => (b[1].gamesFinished || 0) - (a[1].gamesFinished || 0))[0];
    const favoriteDifficulty = Object.entries(stats.byDifficulty || {}).sort((a, b) => (b[1].gamesFinished || 0) - (a[1].gamesFinished || 0))[0];
    const avgScore = stats.gamesFinished ? stats.totalScore / stats.gamesFinished : 0;
    grid.innerHTML = "";
    details.innerHTML = "";
    grid.append(
      statBox(formatNumber(stats.gamesStarted), "Partidas jugadas"),
      statBox(formatNumber(stats.gamesFinished), "Partidas acabadas"),
      statBox(formatNumber(stats.turnipsThrown), "Nabos tirados"),
      statBox(formatNumber(stats.turnipsHit), "Nabos acertados"),
      statBox(formatNumber(stats.peopleHits), "Personas dadas"),
      statBox(formatNumber(stats.bestScore), "Mejor puntuación")
    );
    details.append(
      detailRow("Acierto total", formatPercent(stats.turnipsHit, stats.turnipsThrown)),
      detailRow("Puntuación media", `${formatNumber(avgScore)} pts`),
      detailRow("Tipo más jugado", favoriteType ? (gameTypeConfig[favoriteType[0]]?.label || favoriteType[0]) : "Sin partidas"),
      detailRow("Nivel más jugado", favoriteDifficulty ? (difficultyConfig[favoriteDifficulty[0]]?.label || favoriteDifficulty[0]) : "Sin partidas")
    );
    (stats.scores || []).slice(0, 5).forEach((entry, index) => {
      const type = gameTypeConfig[entry.gameType]?.shortLabel || entry.gameType;
      const difficulty = difficultyConfig[entry.difficulty]?.shareLabel || entry.difficulty;
      details.append(detailRow(`Puntuación ${index + 1}: ${type} · ${difficulty}`, `${formatNumber(entry.score)} pts`));
    });
    if (statsLeaderboardTypeEl) statsLeaderboardTypeEl.value = state.gameType || state.pendingGameType;
    if (statsLeaderboardDifficultyEl) statsLeaderboardDifficultyEl.value = state.difficulty || state.pendingDifficulty;
    refreshStatsLeaderboard();
  };
}

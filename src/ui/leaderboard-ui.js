export function createLeaderboardUi({
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
}) {
  function leaderboardEntry(scoreEntry, index) {
    const item = document.createElement("li");
    const rank = document.createElement("span");
    const name = document.createElement("span");
    const score = document.createElement("strong");
    rank.className = "leaderboard-rank";
    name.className = "leaderboard-name";
    score.className = "leaderboard-score";
    rank.textContent = `#${index + 1}`;
    name.textContent = scoreEntry.playerName || "Jugador";
    score.textContent = `${formatNumber(scoreEntry.score)} pts`;
    item.append(rank, name, score);
    return item;
  }

  function renderLeaderboardList(listEl, entries) {
    listEl.innerHTML = "";
    entries.slice(0, 10).forEach((entry, index) => {
      listEl.append(leaderboardEntry(entry, index));
    });
  }

  function leaderboardFallbackMessage() {
    return isGlobalLeaderboardConfigured()
      ? "No se pudo cargar Firebase. Mostrando ranking local."
      : "Ranking local hasta configurar Firebase.";
  }

  function leaderboardUnavailableMessage(localEntries) {
    if (isGlobalLeaderboardConfigured()) return leaderboardFallbackMessage();
    return localEntries.length ? leaderboardFallbackMessage() : "Sin puntuaciones todavía.";
  }

  async function refreshLeaderboard({ gameType, difficulty, listId, statusId }) {
    const listEl = document.getElementById(listId);
    const statusEl = document.getElementById(statusId);
    if (!listEl || !statusEl) return;
    const localEntries = getLocalLeaderboard(gameType, difficulty);
    renderLeaderboardList(listEl, localEntries);
    statusEl.textContent = "Cargando ranking...";
    try {
      const result = await fetchGlobalLeaderboard(gameType, difficulty, gameTypeConfig, difficultyConfig);
      if (result.ok) {
        renderLeaderboardList(listEl, result.entries);
        statusEl.textContent = result.entries.length ? "Ranking global actualizado." : "Sin puntuaciones globales todavía.";
        return;
      }
      statusEl.textContent = leaderboardUnavailableMessage(localEntries);
    } catch (error) {
      console.warn("No se pudo cargar el ranking global de Firebase.", error);
      statusEl.textContent = isGlobalLeaderboardConfigured()
        ? firebaseErrorMessage(error)
        : leaderboardUnavailableMessage(localEntries);
    }
  }

  function populateLeaderboardFilters() {
    if (!statsLeaderboardTypeEl || !statsLeaderboardDifficultyEl) return;
    statsLeaderboardTypeEl.innerHTML = "";
    statsLeaderboardDifficultyEl.innerHTML = "";
    Object.entries(gameTypeConfig).forEach(([key, config]) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = config.shortLabel || config.label;
      statsLeaderboardTypeEl.append(option);
    });
    Object.entries(difficultyConfig).forEach(([key, config]) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = config.label;
      statsLeaderboardDifficultyEl.append(option);
    });
  }

  function refreshStatsLeaderboard() {
    refreshLeaderboard({
      gameType: statsLeaderboardTypeEl?.value || state.pendingGameType,
      difficulty: statsLeaderboardDifficultyEl?.value || state.pendingDifficulty,
      listId: "statsLeaderboard",
      statusId: "statsLeaderboardStatus",
    });
  }

  function syncPlayerNameInput() {
    if (!playerNameInput) return;
    playerNameInput.value = getPlayerName();
  }

  function updatePlayerName(value) {
    const safeName = savePlayerName(value);
    if (playerNameInput) playerNameInput.value = safeName;
    return safeName;
  }

  async function submitResultToLeaderboard(match) {
    const playerName = getPlayerName();
    const accuracy = state.playerTurnipsThrown ? (state.jarramplasHits / state.playerTurnipsThrown) * 100 : 0;
    const scoreEntry = saveLocalLeaderboardScore({
      playerName,
      score: match.score,
      gameType: match.gameType,
      difficulty: match.difficulty,
      accuracy,
      jarramplasHits: match.turnipsHit,
      peopleHits: match.peopleHits,
      createdAt: Date.now(),
    });
    const statusEl = document.getElementById("resultLeaderboardStatus");
    if (statusEl) statusEl.textContent = "Guardando puntuación...";
    try {
      const result = await submitGlobalScore(scoreEntry, gameTypeConfig, difficultyConfig);
      if (statusEl) {
        statusEl.textContent = result.ok ? "Puntuación subida al ranking global." : leaderboardFallbackMessage();
      }
    } catch (error) {
      console.warn("No se pudo subir la puntuación a Firebase.", error);
      if (statusEl) statusEl.textContent = firebaseErrorMessage(error);
    }
    refreshLeaderboard({
      gameType: match.gameType,
      difficulty: match.difficulty,
      listId: "resultLeaderboard",
      statusId: "resultLeaderboardStatus",
    });
  }

  return {
    populateLeaderboardFilters,
    refreshStatsLeaderboard,
    syncPlayerNameInput,
    updatePlayerName,
    submitResultToLeaderboard,
  };
}

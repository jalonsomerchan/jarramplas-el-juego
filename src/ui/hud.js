function formatTime(seconds) {
  const total = Math.ceil(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function createHud({
  scoreEl,
  timeEl,
  comboEl,
  recordEl,
  state,
  getRecord,
  formatNumber,
  finiteNumber,
  maxPeopleHits,
}) {
  function formatHudValue() {
    if (state.gameType === "timed") return formatTime(finiteNumber(state.timeLeft));
    if (state.gameType === "survival") return `${Math.max(0, Math.ceil(finiteNumber(state.jarramplasHealth)))}%`;
    if (state.gameType === "limitedTurnips") return `${Math.max(0, finiteNumber(state.turnipsLeft))}`;
    return `${Math.max(0, maxPeopleHits() - finiteNumber(state.peopleHits))}`;
  }

  function hudModeLabel() {
    if (state.gameType === "timed") return "Tiempo";
    if (state.gameType === "survival") return "Vida";
    if (state.gameType === "limitedTurnips") return "Nabos";
    return "Avisos";
  }

  function updateHud() {
    const previousScore = state.hudLastScore;
    const scoreDelta = previousScore === null ? 0 : state.score - previousScore;
    state.hudLastScore = state.score;
    state.hudScore += (state.score - state.hudScore) * 0.32;
    if (Math.abs(state.score - state.hudScore) < 0.5) state.hudScore = state.score;

    scoreEl.innerHTML = `<span class="hud-label">Puntos</span><strong>${formatNumber(Math.round(state.hudScore))}</strong><small>pts</small>`;
    if (scoreDelta !== 0) {
      scoreEl.dataset.delta = `${scoreDelta > 0 ? "+" : ""}${formatNumber(scoreDelta)}`;
      scoreEl.classList.remove("is-gain", "is-penalty");
      void scoreEl.offsetWidth;
      scoreEl.classList.add(scoreDelta > 0 ? "is-gain" : "is-penalty");
    }

    const hudValue = formatHudValue();
    timeEl.innerHTML = `<span class="hud-label">${hudModeLabel()}</span><strong>${hudValue}</strong>`;
    timeEl.classList.toggle("is-urgent", state.gameType === "timed" && state.timeLeft <= 10);
    if (state.hudLastTimeValue && state.hudLastTimeValue !== hudValue) {
      timeEl.classList.remove("is-tick");
      void timeEl.offsetWidth;
      timeEl.classList.add("is-tick");
    }
    state.hudLastTimeValue = hudValue;

    comboEl.innerHTML = `<span class="hud-label">Combo</span><strong>x${formatNumber(state.comboMultiplier)}</strong><small>${formatNumber(state.comboCount)}</small>`;
    comboEl.classList.toggle("is-hot", state.comboMultiplier > 1);
    if (state.hudLastCombo !== null && state.hudLastCombo !== state.comboMultiplier) {
      comboEl.classList.remove("is-pop");
      void comboEl.offsetWidth;
      comboEl.classList.add("is-pop");
    }
    state.hudLastCombo = state.comboMultiplier;

    recordEl.innerHTML = `<span class="hud-label">Récord</span><strong>${formatNumber(getRecord(state.gameType, state.difficulty))}</strong><small>pts</small>`;
  }

  function advanceCombo() {
    state.comboCount += 1;
    state.comboMultiplier = Math.min(5, Math.max(1, state.comboCount));
    return state.comboMultiplier;
  }

  function resetCombo() {
    state.comboCount = 0;
    state.comboMultiplier = 1;
  }

  return { updateHud, advanceCombo, resetCombo };
}

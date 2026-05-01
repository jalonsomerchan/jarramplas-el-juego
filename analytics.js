export function initAnalytics() {
  const measurementId = window.JARRAMPLAS_GA_ID;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  if (!measurementId) return;
  window.gtag("config", measurementId, {
    app_name: "Jarramplas Throw",
    send_page_view: true,
  });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

export function createEventTracker({ getState, getAssets, gameTypeConfig, difficultyConfig }) {
  return function trackEvent(name, params = {}) {
    const state = getState();
    const assets = getAssets();
    const type = gameTypeConfig[state.gameType] || gameTypeConfig[state.pendingGameType];
    const difficulty = difficultyConfig[state.difficulty] || difficultyConfig[state.pendingDifficulty];
    const scenario = assets.backgrounds[state.scenarioIndex];
    const payload = {
      game_type: state.gameType || state.pendingGameType,
      game_type_label: type?.label || "",
      difficulty: state.difficulty || state.pendingDifficulty,
      difficulty_label: difficulty?.label || "",
      scenario: scenario?.name || "",
      score: state.score,
      elapsed_seconds: Math.round(state.elapsed || 0),
      ...params,
    };
    if (window.gtag) window.gtag("event", name, payload);
  };
}

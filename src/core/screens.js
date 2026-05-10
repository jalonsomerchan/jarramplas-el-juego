export function createScreenManager({ screens, hud, getMode }) {
  function showScreen(name) {
    Object.values(screens).forEach((screen) => screen?.classList.remove("is-visible"));
    if (name && screens[name]) screens[name].classList.add("is-visible");
    const mode = getMode?.();
    hud?.classList.toggle("is-visible", mode === "playing" || mode === "paused");
  }

  return { showScreen };
}

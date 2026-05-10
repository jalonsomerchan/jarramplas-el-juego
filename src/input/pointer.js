export function createPointerHandlers({ canvas, state, launchOrigin, launchTurnip }) {
  function pointerPos(event) {
    const point = event.touches ? event.touches[0] : event;
    const rect = canvas.getBoundingClientRect();
    return {
      x: point.clientX - rect.left,
      y: point.clientY - rect.top,
    };
  }

  function launchStartFor() {
    return launchOrigin();
  }

  function onPointerStart(event) {
    if (state.mode !== "playing") return;
    state.hasPressedGameWindow = true;
    const p = pointerPos(event);
    const origin = launchOrigin();
    const grabRadius = Math.max(56, Math.min(state.w, state.h) * 0.16);
    if (Math.hypot(p.x - origin.x, p.y - origin.y) > grabRadius) return;
    if (state.gameType === "limitedTurnips" && state.turnipsLeft <= 0) return;
    event.preventDefault();
    state.drag = { start: launchStartFor(p), current: { ...p }, target: { ...p } };
  }

  function onPointerMove(event) {
    if (!state.drag || state.mode !== "playing") return;
    event.preventDefault();
    state.drag.target = pointerPos(event);
  }

  function onPointerEnd(event) {
    if (!state.drag || state.mode !== "playing") return;
    event.preventDefault();
    const drag = state.drag;
    state.drag = null;
    launchTurnip(drag.start, drag.target || drag.current, "player");
  }

  return { onPointerStart, onPointerMove, onPointerEnd };
}

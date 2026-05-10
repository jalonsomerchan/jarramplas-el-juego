import { trimRuntimeArray } from "./runtime.js";

export function createMenuDemo({
  state,
  assets,
  emptyJarramplasFrames,
  updateTurnipMotion,
  rectCircleHit,
  addJarramplasImpact,
  limits,
}) {
  function resetMenuDemo(now = performance.now()) {
    state.people = [];
    state.turnips = [];
    state.floaters = [];
    state.particles = [];
    state.drag = null;
    assets.jarramplas = assets.jarramplasVariants.length
      ? assets.jarramplasVariants[Math.floor(Math.random() * assets.jarramplasVariants.length)].frames
      : emptyJarramplasFrames();
    state.jarramplas.x = state.w * 0.5;
    state.jarramplas.y = state.h * (state.h < 700 ? 0.2 : 0.34);
    state.jarramplas.vx = 0;
    state.jarramplas.vy = 0;
    state.jarramplas.direction = "down";
    state.jarramplas.walkFrame = 0;
    state.jarramplas.flash = 0;
    state.menuDemoNextThrowAt = now + 450;
    state.menuDemoReady = true;
  }

  function addMenuDemoTurnip(now) {
    const fromLeft = Math.random() < 0.5;
    const from = {
      x: fromLeft ? -28 : state.w + 28,
      y: state.h * (0.58 + Math.random() * 0.14),
    };
    const target = {
      x: state.jarramplas.x + (Math.random() - 0.5) * state.jarramplas.w * 0.5,
      y: state.jarramplas.y + state.jarramplas.h * 0.28,
    };
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    const angle = Math.atan2(dy, dx);
    const speed = 430 + Math.random() * 90;
    state.turnips.push({
      x: from.x,
      y: from.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 25,
      gravity: 145,
      r: Math.max(12, Math.min(state.w, state.h) * 0.028),
      spin: Math.random() * 6.28,
      owner: "crowd",
      hit: false,
      menuDemo: true,
    });
    state.menuDemoNextThrowAt = now + 620 + Math.random() * 520;
    trimRuntimeArray(state.turnips, limits.turnips);
  }

  function updateMenuDemo(now, dt) {
    if (!assets.ready) return;
    if (!state.menuDemoReady) resetMenuDemo(now);

    const j = state.jarramplas;
    const menuSize = Math.min(state.w * 0.2, state.h * 0.12, 88);
    j.w = menuSize;
    j.h = menuSize * 1.72;
    const t = now / 1000;
    const targetX = state.w * 0.5 + Math.sin(t * 0.72) * state.w * 0.18;
    const targetYRatio = state.h < 700 ? 0.19 : 0.34;
    const targetY = state.h * targetYRatio + Math.sin(t * 1.1) * state.h * 0.018;
    j.vx += (targetX - j.x) * 10 * dt;
    j.vy += (targetY - j.y) * 10 * dt;
    j.vx *= Math.pow(0.05, dt);
    j.vy *= Math.pow(0.05, dt);
    j.x += j.vx * dt;
    j.y += j.vy * dt;
    j.direction = j.vx < -6 ? "left" : j.vx > 6 ? "right" : "down";
    j.walkFrame = Math.floor(now / 130) % 16;
    j.flash = Math.max(0, (j.flash || 0) - dt);

    if (now >= state.menuDemoNextThrowAt) addMenuDemoTurnip(now);

    const jBox = { x: j.x, y: j.y + j.h * 0.72, w: j.w * 0.75, h: j.h * 0.72 };
    for (const turnip of state.turnips) {
      updateTurnipMotion(turnip, dt);
      turnip.spin += dt * 10;
      if (!turnip.hit && rectCircleHit(jBox, turnip)) {
        turnip.hit = true;
        j.flash = 0.16;
        addJarramplasImpact(turnip.x, turnip.y, "crowd");
      }
    }
    state.turnips = state.turnips.filter((t) => {
      const inBounds = t.x > -90 && t.x < state.w + 90 && t.y > -120 && t.y < state.h + 120;
      return !t.hit && inBounds;
    });
  }

  return { resetMenuDemo, updateMenuDemo };
}

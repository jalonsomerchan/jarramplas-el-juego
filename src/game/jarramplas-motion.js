export function createJarramplasMotion({ state, difficultyConfig, jarramplasMovementConfig }) {
  function pickJarramplasTarget(now) {
    const j = state.jarramplas;
    const config = difficultyConfig[state.difficulty];
    const margin = j.w * 0.76;
    j.targetX = margin + Math.random() * Math.max(1, state.w - margin * 2);
    j.targetY = state.h * (jarramplasMovementConfig.minYRatio + Math.random() * (jarramplasMovementConfig.maxYRatio - jarramplasMovementConfig.minYRatio));
    j.nextMoveAt = now + 520 + Math.random() * (1150 / config.speed);
  }

  function updateJarramplasMotion(now, dt) {
    const j = state.jarramplas;
    const config = difficultyConfig[state.difficulty];
    if (!j.nextMoveAt || now > j.nextMoveAt || Math.hypot(j.targetX - j.x, j.targetY - j.y) < 10) {
      pickJarramplasTarget(now);
    }
    const dx = j.targetX - j.x;
    const dy = j.targetY - j.y;
    const accel = 4.8 + config.speed * 1.8;
    j.vx += dx * accel * dt;
    j.vy += dy * accel * dt;
    const damping = Math.pow(0.08, dt);
    j.vx *= damping;
    j.vy *= damping;
    const maxSpeed = 118 + config.speed * 42;
    const speed = Math.hypot(j.vx, j.vy);
    if (speed > maxSpeed) {
      j.vx = (j.vx / speed) * maxSpeed;
      j.vy = (j.vy / speed) * maxSpeed;
    }
    if (speed > 8) {
      j.direction = Math.abs(j.vx) > Math.abs(j.vy) * 1.15
        ? (j.vx < 0 ? "left" : "right")
        : (j.vy < 0 ? "up" : "down");
    }
    j.x += j.vx * dt;
    j.y += j.vy * dt;
    j.x = Math.max(j.w * 0.72, Math.min(state.w - j.w * 0.72, j.x));
    j.y = Math.max(state.h * jarramplasMovementConfig.minYRatio, Math.min(state.h * jarramplasMovementConfig.maxYRatio, j.y));
    j.walkFrame = Math.floor(now / 120) % 16;
    j.flash = Math.max(0, (j.flash || 0) - dt);
  }

  return { updateJarramplasMotion };
}

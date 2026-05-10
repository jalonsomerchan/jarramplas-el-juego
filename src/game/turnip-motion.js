export function createTurnipMotion({
  state,
  clamp,
  easeOutQuad,
  lerp,
  playerMinLaunchSpeed,
  playerMaxLaunchSpeed,
  playerMinGravity,
  playerMaxGravity,
  crowdTurnipGravity,
}) {
  function maxLaunchDrag() {
    return Math.min(state.w, state.h) * 0.62;
  }

  function launchMotion(from, to, owner) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    const power = Math.min(distance, maxLaunchDrag());
    const angle = Math.atan2(dy, dx);

    if (owner !== "player") {
      const speed = 365 + Math.random() * 70;
      return {
        power,
        pull: 1,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: crowdTurnipGravity,
      };
    }

    const pull = clamp(power / maxLaunchDrag(), 0, 1);
    const easedPull = easeOutQuad(pull);
    const speed = lerp(playerMinLaunchSpeed, playerMaxLaunchSpeed, easedPull);
    const gravity = lerp(playerMinGravity, playerMaxGravity, easedPull);
    const arcAngle = angle - lerp(0.02, 0.1, easedPull);

    return {
      power,
      pull,
      vx: Math.cos(arcAngle) * speed,
      vy: Math.sin(arcAngle) * speed,
      gravity,
    };
  }

  function updateTurnipMotion(turnip, dt) {
    const stepCount = Math.max(1, Math.ceil(dt / (1 / 120)));
    const stepDt = dt / stepCount;
    const gravity = turnip.gravity || crowdTurnipGravity;

    for (let i = 0; i < stepCount; i += 1) {
      turnip.x += turnip.vx * stepDt;
      turnip.y += turnip.vy * stepDt;
      turnip.vy += gravity * stepDt;
    }
  }

  return { launchMotion, updateTurnipMotion };
}

import { trimRuntimeArray } from "./runtime.js";

export function createEffects({ state, impactEffectConfig, limits }) {
  function addFloater(text, x, y, color) {
    state.floaters.push({ text, x, y, color, life: 0.82, vy: -58 });
    trimRuntimeArray(state.floaters, limits.floaters);
  }

  function addJarramplasImpact(x, y, owner) {
    for (let i = 0; i < impactEffectConfig.particleCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 210;
      const color = impactEffectConfig.sparkColors[i % impactEffectConfig.sparkColors.length];
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 25,
        r: 2.5 + Math.random() * 4,
        color,
        life: impactEffectConfig.duration * (0.72 + Math.random() * 0.55),
        maxLife: impactEffectConfig.duration,
      });
    }
    trimRuntimeArray(state.particles, limits.particles);
  }

  function updateEffects(dt) {
    for (const floater of state.floaters) {
      floater.life -= dt;
      floater.y += floater.vy * dt;
    }
    state.floaters = state.floaters.filter((f) => f.life > 0);

    for (const particle of state.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 310 * dt;
      particle.vx *= Math.pow(0.12, dt);
    }
    state.particles = state.particles.filter((particle) => particle.life > 0);
  }

  return { addFloater, addJarramplasImpact, updateEffects };
}

export function createRenderer({ ctx, state, assets, launchOrigin, launchMotion, lerp }) {
  function drawSprite(frame, x, y, h, flip = false, alpha = 1) {
    if (!frame || !frame.img.complete) return;
    const w = h * (frame.w / frame.h);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (flip) {
      ctx.translate(x, 0);
      ctx.scale(-1, 1);
      x = 0;
    }
    ctx.drawImage(frame.img, x - w / 2, y - h, w, h);
    ctx.restore();
  }

  function drawTurnip(x, y, size, spin = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.fillStyle = "#efe1c1";
    ctx.strokeStyle = "rgba(84, 58, 35, 0.5)";
    ctx.lineWidth = Math.max(1, size * 0.06);
    ctx.beginPath();
    ctx.ellipse(-size * 0.06, 0, size * 0.42, size * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#5eb356";
    ctx.beginPath();
    ctx.moveTo(size * 0.26, -size * 0.04);
    ctx.lineTo(size * 0.58, -size * 0.24);
    ctx.lineTo(size * 0.5, size * 0.04);
    ctx.lineTo(size * 0.66, size * 0.18);
    ctx.lineTo(size * 0.28, size * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawRoundedRect(x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawLaunchHint(origin, turnipSize) {
    const text = "Arrastra el nabo hacia adelante para lanzarlo";
    const maxWidth = Math.min(state.w - 32, 310);
    const fontSize = Math.max(15, Math.min(18, state.w * 0.042));
    const lineHeight = fontSize * 1.25;
    const words = text.split(" ");
    const lines = [];
    let line = "";

    ctx.save();
    ctx.font = `800 ${fontSize}px system-ui, sans-serif`;
    for (const word of words) {
      const nextLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(nextLine).width > maxWidth - 28 && line) {
        lines.push(line);
        line = word;
      } else {
        line = nextLine;
      }
    }
    if (line) lines.push(line);

    const boxW = Math.min(maxWidth, Math.max(...lines.map((item) => ctx.measureText(item).width)) + 28);
    const boxH = lines.length * lineHeight + 18;
    const x = Math.max(16, Math.min(state.w - boxW - 16, origin.x - boxW / 2));
    const y = Math.max(58, origin.y - turnipSize * 0.92 - boxH);
    const pointerX = origin.x;
    const pointerY = y + boxH + 9;

    ctx.fillStyle = "rgba(28, 22, 16, 0.82)";
    ctx.strokeStyle = "rgba(255, 246, 223, 0.78)";
    ctx.lineWidth = 1.5;
    drawRoundedRect(x, y, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pointerX - 9, y + boxH - 1);
    ctx.lineTo(pointerX + 9, y + boxH - 1);
    ctx.lineTo(pointerX, pointerY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fff6df";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    lines.forEach((item, index) => {
      ctx.fillText(item, x + boxW / 2, y + 12 + lineHeight * (index + 0.5));
    });
    ctx.restore();
  }

  function drawBackground() {
    ctx.clearRect(0, 0, state.w, state.h);
    if (assets.background) {
      const bg = assets.background;
      const scale = Math.max(state.w / bg.w, state.h / bg.h);
      const w = bg.w * scale;
      const h = bg.h * scale;
      ctx.drawImage(bg.img, (state.w - w) / 2, (state.h - h) / 2, w, h);
      ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
      ctx.fillRect(0, 0, state.w, state.h);
      return;
    }
    const sky = ctx.createLinearGradient(0, 0, 0, state.h);
    sky.addColorStop(0, "#202624");
    sky.addColorStop(0.46, "#33342d");
    sky.addColorStop(1, "#211d18");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, state.w, state.h);
    ctx.fillStyle = "#4d4740";
    for (let i = 0; i < 26; i += 1) {
      ctx.fillRect(((i * 83) % (state.w + 80)) - 40, state.h * 0.36 + ((i * 31) % 44), 52, 3);
    }
    ctx.fillStyle = "#171511";
    ctx.fillRect(0, state.h * 0.72, state.w, state.h * 0.28);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i < 18; i += 1) {
      ctx.fillRect((i * 97) % state.w, state.h * (0.75 + (i % 4) * 0.05), 46, 2);
    }
  }

  function drawPerson(person) {
    const groups = assets.people[person.facing];
    const group = groups[person.groupId % Math.max(1, groups.length)];
    if (!group) return;
    const anim = person.throwAnim > 0 ? group.throw : group.walk;
    const frameT = person.throwAnim > 0 ? person.throwT : person.animT;
    const frame = anim[Math.floor(frameT) % anim.length];
    const y = person.y + Math.sin(person.animT * 0.7) * 2;
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.beginPath();
    ctx.ellipse(person.x, y + 2, person.w * 0.48, person.w * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    drawSprite(frame, person.x, y, person.h, person.flip);
  }

  function drawJarramplas() {
    const j = state.jarramplas;
    const directionFrames = assets.jarramplas[j.direction] || [];
    const walkFrames = directionFrames.length ? directionFrames : (assets.jarramplas.down || []);
    const frame = walkFrames[j.walkFrame % Math.max(1, walkFrames.length)];
    drawSprite(frame, j.x, j.y + j.h, j.h);
    if (j.flash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      drawSprite(frame, j.x, j.y + j.h, j.h, false, Math.min(0.75, j.flash * 3.4));
      ctx.restore();
    }
    if (state.mode === "playing" && state.gameType === "survival") {
      const w = j.w * 0.9;
      const h = 9;
      const x = j.x - w / 2;
      const y = j.y + 8;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1;
      ctx.fillRect(x, y, w, h);
      ctx.stroke();
      ctx.fillStyle = state.jarramplasHealth > 35 ? "#5dbb63" : "#d93c2f";
      ctx.fillRect(x + 1, y + 1, (w - 2) * Math.max(0, state.jarramplasHealth / 100), h - 2);
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const particle of state.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, particle.life / particle.maxLife));
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawTimedCountdown() {
    if (state.mode !== "playing" || state.gameType !== "timed" || state.timeLeft > 10) return;
    const value = Math.max(0, Math.ceil(state.timeLeft));
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#fff6df";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.75)";
    ctx.lineWidth = Math.max(5, state.w * 0.025);
    ctx.font = `950 ${Math.min(state.w * 0.48, state.h * 0.28)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(String(value), state.w / 2, state.h / 2);
    ctx.fillText(String(value), state.w / 2, state.h / 2);
    ctx.restore();
  }

  function drawLaunchTrajectory(drag) {
    const motion = launchMotion(drag.start, drag.current, "player");
    if (motion.power < 20) return;

    const points = [];
    const steps = 19;
    const stepTime = 0.04;
    let x = drag.start.x;
    let y = drag.start.y;
    let vx = motion.vx;
    let vy = motion.vy;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(255, 246, 223, 0.34)";
    ctx.lineWidth = Math.max(2, Math.min(state.w, state.h) * 0.006);
    ctx.beginPath();
    ctx.moveTo(x, y);

    for (let i = 0; i < steps; i += 1) {
      x += vx * stepTime;
      y += vy * stepTime;
      vy += motion.gravity * stepTime;
      points.push({ x, y });
      ctx.lineTo(x, y);
      if (x < -40 || x > state.w + 40 || y < -80 || y > state.h + 80) break;
    }
    ctx.stroke();

    for (let i = 1; i < points.length; i += 3) {
      const point = points[i];
      const fade = 1 - i / points.length;
      ctx.globalAlpha = 0.28 + fade * 0.55;
      ctx.fillStyle = "#fff0bd";
      ctx.beginPath();
      ctx.arc(point.x, point.y, lerp(2.2, 4.8, motion.pull) * fade + 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = "rgba(55, 33, 12, 0.42)";
    ctx.lineWidth = Math.max(5, Math.min(state.w, state.h) * 0.012);
    ctx.beginPath();
    ctx.moveTo(drag.start.x, drag.start.y);
    ctx.lineTo(drag.current.x, drag.current.y);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 246, 223, 0.9)";
    ctx.lineWidth = Math.max(2, Math.min(state.w, state.h) * 0.006);
    ctx.beginPath();
    ctx.moveTo(drag.start.x, drag.start.y);
    ctx.lineTo(drag.current.x, drag.current.y);
    ctx.stroke();
    ctx.restore();
  }

  function render() {
    drawBackground();
    const drawables = [
      ...state.people.map((person) => ({ y: person.y, draw: () => drawPerson(person) })),
      { y: state.jarramplas.y + state.jarramplas.h * 0.52, draw: drawJarramplas },
    ].sort((a, b) => a.y - b.y);
    for (const item of drawables) item.draw();
    for (const turnip of state.turnips) drawTurnip(turnip.x, turnip.y, turnip.r * 2, turnip.spin);
    drawParticles();
    drawTimedCountdown();

    if (state.mode === "playing") {
      const origin = launchOrigin();
      const size = Math.max(34, Math.min(state.w, state.h) * 0.085);
      ctx.save();
      ctx.globalAlpha = state.gameType === "limitedTurnips" && state.turnipsLeft <= 0 ? 0.38 : 1;
      ctx.fillStyle = "rgba(0,0,0,0.34)";
      ctx.beginPath();
      ctx.ellipse(origin.x, origin.y + size * 0.28, size * 0.48, size * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();
      drawTurnip(origin.x, origin.y, size, 0);
      if (!state.hasPressedGameWindow) drawLaunchHint(origin, size);
      ctx.restore();
    }

    if (state.drag) {
      drawLaunchTrajectory(state.drag);
      drawTurnip(state.drag.start.x, state.drag.start.y, Math.max(30, state.w * 0.075), 0);
    }

    for (const floater of state.floaters) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, floater.life / 0.45));
      ctx.fillStyle = floater.color;
      ctx.font = "900 28px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.strokeText(floater.text, floater.x, floater.y);
      ctx.fillText(floater.text, floater.x, floater.y);
      ctx.restore();
    }

    if (state.mode !== "playing") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fillRect(0, 0, state.w, state.h);
    }
  }

  return { render };
}

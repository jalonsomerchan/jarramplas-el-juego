const app = document.getElementById("app");
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hud = document.getElementById("hud");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const difficultyLabel = document.getElementById("difficultyLabel");
const playButton = document.getElementById("playButton");
const scenarioOptions = document.getElementById("scenarioOptions");
const screens = {
  start: document.getElementById("start"),
  select: document.getElementById("select"),
  scenario: document.getElementById("scenario"),
  result: document.getElementById("result"),
};

const DPR = Math.min(window.devicePixelRatio || 1, 2);
const difficultyConfig = {
  day18Evening: { label: "18 tarde", people: 0, crowdThrow: 1.8, speed: 0.8 },
  day19Morning: { label: "19 mañana", people: 4, crowdThrow: 1.45, speed: 0.86 },
  day19Evening: { label: "19 tarde", people: 6, crowdThrow: 1.12, speed: 1 },
  day20Morning: { label: "20 mañana", people: 9, crowdThrow: 0.84, speed: 1.16 },
  day20Evening: { label: "20 tarde", people: 12, crowdThrow: 0.62, speed: 1.32 },
};

const assets = {
  ready: false,
  jarramplas: [],
  people: { side: [], front: [], back: [] },
  turnips: [],
  backgrounds: [],
  background: null,
};

const jarramplasFramePaths = Array.from(
  { length: 16 },
  (_, index) => `assets/jarramplas/frames/frame_${String(index + 1).padStart(3, "0")}.png`
);

const personIds = [1, 2, 3, 4, 5, 6, 7];
const backgroundSlots = Array.from({ length: 40 }, (_, index) => index + 1);
const backgroundExtensions = ["png", "jpg", "jpeg", "webp"];
const backgroundFilePattern = /\.(png|jpe?g|webp)$/i;

const state = {
  mode: "menu",
  difficulty: "day19Morning",
  pendingDifficulty: "day19Morning",
  w: 0,
  h: 0,
  score: 0,
  jarramplasHits: 0,
  peopleHits: 0,
  timeLeft: 60,
  startedAt: 0,
  last: 0,
  jarramplas: { x: 0, y: 0, w: 112, h: 150, vx: 76, walkFrame: 0, flash: 0 },
  people: [],
  turnips: [],
  floaters: [],
  drag: null,
  nextPersonId: 0,
  nextPersonAt: 0,
};

function loadImageFrame(path) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({
      img,
      w: img.naturalWidth,
      h: img.naturalHeight,
      path,
      name: fileLabel(path),
    });
    img.onerror = () => reject(new Error(`No se pudo cargar ${path}`));
    img.src = path;
  });
}

function fileLabel(path) {
  const fileName = decodeURIComponent(path.split("/").pop() || path);
  return fileName.replace(/\.[^.]+$/, "").replace(/_/g, " ");
}

function loadImageFrames(paths) {
  return Promise.all(paths.map(loadImageFrame));
}

async function loadOptionalImage(path) {
  try {
    return await loadImageFrame(path);
  } catch {
    return null;
  }
}

async function loadBackgrounds() {
  const paths = await listBackgroundPaths();
  const attempts = paths.map(loadOptionalImage);
  return (await Promise.all(attempts)).filter(Boolean);
}

async function listBackgroundPaths() {
  const found = new Set();
  try {
    const response = await fetch("assets/fondos/");
    const html = await response.text();
    if (response.ok) {
      for (const match of html.matchAll(/href=["']([^"']+)["']/gi)) {
        const href = decodeURIComponent(match[1]);
        if (backgroundFilePattern.test(href)) {
          found.add(`assets/fondos/${href.split("/").pop()}`);
        }
      }
    }
  } catch {
    // Some static servers do not expose directory listings; numbered files below keep adding backgrounds easy.
  }
  for (const slot of backgroundSlots) {
    for (const ext of backgroundExtensions) {
      found.add(`assets/fondos/fondo${slot}.${ext}`);
    }
  }
  return [...found];
}

async function loadPersonGroups() {
  const groups = await Promise.all(personIds.map(async (id) => {
    const [walk, idle, throwOne, throwTwo] = await loadImageFrames([
      `assets/personajes/frames/p${id}_andando.png`,
      `assets/personajes/frames/p${id}_parado.png`,
      `assets/personajes/frames/p${id}_tirando1.png`,
      `assets/personajes/frames/p${id}_tirando2.png`,
    ]);
    return {
      walk: [walk, idle],
      throw: [throwOne, throwTwo],
      turnips: [],
    };
  }));
  return groups;
}

async function loadAssets() {
  playButton.disabled = true;
  playButton.textContent = "Cargando";
  const [jarramplas, people, backgrounds] = await Promise.all([
    loadImageFrames(jarramplasFramePaths),
    loadPersonGroups(),
    loadBackgrounds(),
  ]);
  assets.jarramplas = jarramplas;
  assets.people.side = people;
  assets.people.front = people;
  assets.people.back = people;
  assets.turnips = [];
  assets.backgrounds = backgrounds.sort((a, b) => a.name.localeCompare(b.name, "es"));
  assets.background = backgrounds[Math.floor(Math.random() * backgrounds.length)] || null;
  buildScenarioButtons();
  assets.ready = true;
  playButton.disabled = false;
  playButton.textContent = "Jugar";
}

function buildScenarioButtons() {
  scenarioOptions.innerHTML = "";
  const backgrounds = assets.backgrounds.length ? assets.backgrounds : [{ name: "Sin fondo", path: "" }];
  backgrounds.forEach((background, index) => {
    const button = document.createElement("button");
    const label = document.createElement("span");
    const meta = document.createElement("span");
    button.type = "button";
    button.dataset.scenario = String(index);
    label.textContent = background.name;
    meta.textContent = "Escenario";
    button.append(label, meta);
    button.addEventListener("click", () => startGame(state.pendingDifficulty, index));
    scenarioOptions.appendChild(button);
  });
}

function resize() {
  const rect = app.getBoundingClientRect();
  state.w = rect.width;
  state.h = rect.height;
  canvas.width = Math.floor(state.w * DPR);
  canvas.height = Math.floor(state.h * DPR);
  canvas.style.width = `${state.w}px`;
  canvas.style.height = `${state.h}px`;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  layoutJarramplas();
  layoutCrowd();
}

function layoutJarramplas() {
  const size = Math.min(state.w * 0.28, state.h * 0.18, 124);
  state.jarramplas.w = size;
  state.jarramplas.h = size * 1.72;
  state.jarramplas.x = Math.max(size, Math.min(state.w - size, state.jarramplas.x || state.w / 2));
  state.jarramplas.y = state.h * 0.075;
}

function layoutCrowd() {
  for (const person of state.people) updatePersonFacing(person);
}

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("is-visible"));
  if (name) screens[name].classList.add("is-visible");
  hud.classList.toggle("is-visible", state.mode === "playing");
}

function chooseLevel(difficulty) {
  if (!assets.ready) return;
  state.pendingDifficulty = difficulty;
  state.mode = "scenario";
  showScreen("scenario");
}

function startGame(difficulty, backgroundIndex = 0) {
  if (!assets.ready) return;
  const config = difficultyConfig[difficulty];
  assets.background = assets.backgrounds[backgroundIndex] || null;
  state.mode = "playing";
  state.difficulty = difficulty;
  state.score = 0;
  state.jarramplasHits = 0;
  state.peopleHits = 0;
  state.timeLeft = 60;
  state.startedAt = performance.now();
  state.last = state.startedAt;
  state.people = [];
  state.turnips = [];
  state.floaters = [];
  state.drag = null;
  state.nextPersonId = 0;
  state.nextPersonAt = performance.now() + 700;
  state.jarramplas.x = state.w / 2;
  state.jarramplas.vx = 66 + config.speed * 20;
  state.jarramplas.flash = 0;
  scoreEl.textContent = "0 pts";
  timeEl.textContent = "1:00";
  difficultyLabel.textContent = config.label;
  for (let i = 0; i < config.people; i += 1) spawnPerson(true);
  showScreen(null);
  hud.classList.add("is-visible");
}

function endGame() {
  state.mode = "result";
  hud.classList.remove("is-visible");
  document.getElementById("finalScore").textContent = `${state.score} pts`;
  document.getElementById("finalHits").textContent = `Jarramplas: ${state.jarramplasHits} impactos · Gente: ${state.peopleHits} impactos`;
  showScreen("result");
}

function spawnPerson(initial = false) {
  const config = difficultyConfig[state.difficulty];
  const id = state.nextPersonId;
  state.nextPersonId += 1;
  const fromLeft = Math.random() < 0.5;
  const lane = state.h * (0.53 + Math.random() * 0.13);
  const speed = (36 + Math.random() * 34) * config.speed;
  const size = Math.min(state.w * 0.18, state.h * 0.105, 80) * (0.9 + (id % 3) * 0.05);
  const person = {
    index: id,
    groupId: id,
    x: initial ? Math.random() * state.w : (fromLeft ? -size : state.w + size),
    y: lane,
    vx: fromLeft ? speed : -speed,
    targetY: lane + (Math.random() - 0.5) * state.h * 0.08,
    w: size * 0.62,
    h: size,
    facing: "side",
    flip: false,
    animT: Math.random() * 4,
    throwTimer: 0.5 + Math.random() * 1.2,
    throwAnim: 0,
  };
  updatePersonFacing(person);
  state.people.push(person);
}

function updatePersonFacing(person) {
  const j = state.jarramplas;
  const dx = j.x - person.x;
  const dy = j.y + j.h * 0.42 - person.y;
  if (Math.abs(dx) > Math.abs(dy) * 1.25) {
    person.facing = "side";
    person.flip = dx < 0;
  } else {
    person.facing = dy < 0 ? "back" : "front";
    person.flip = false;
  }
}

function addFloater(text, x, y, color) {
  state.floaters.push({ text, x, y, color, life: 0.82, vy: -58 });
}

function formatTime(seconds) {
  const total = Math.ceil(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function launchTurnip(from, to, owner) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const power = Math.min(Math.hypot(dx, dy), Math.min(state.w, state.h) * 0.62);
  if (power < 20) return;
  const speed = owner === "player" ? 760 : 365 + Math.random() * 70;
  const angle = Math.atan2(dy, dx);
  state.turnips.push({
    x: from.x,
    y: from.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: Math.max(13, Math.min(state.w, state.h) * 0.03),
    spin: Math.random() * 6.28,
    owner,
    hit: false,
  });
}

function rectCircleHit(rect, circle) {
  const rx = rect.x - rect.w / 2;
  const ry = rect.y - rect.h;
  const cx = Math.max(rx, Math.min(circle.x, rx + rect.w));
  const cy = Math.max(ry, Math.min(circle.y, ry + rect.h));
  return Math.hypot(circle.x - cx, circle.y - cy) < circle.r * 0.8;
}

function update(now) {
  const dt = Math.min((now - state.last) / 1000, 0.033);
  state.last = now;

  if (state.mode === "playing") {
    state.timeLeft = Math.max(0, 60 - (now - state.startedAt) / 1000);
    timeEl.textContent = formatTime(state.timeLeft);
    if (state.timeLeft <= 0) endGame();

    const j = state.jarramplas;
    j.x += j.vx * dt;
    if (j.x < j.w * 0.72 || j.x > state.w - j.w * 0.72) {
      j.vx *= -1;
      j.x = Math.max(j.w * 0.72, Math.min(state.w - j.w * 0.72, j.x));
    }
    j.walkFrame = Math.floor(now / 120) % 16;
    j.flash = Math.max(0, (j.flash || 0) - dt);
    const config = difficultyConfig[state.difficulty];
    if (state.people.length < config.people && now > state.nextPersonAt) {
      spawnPerson(false);
      state.nextPersonAt = now + 360 + Math.random() * 520;
    }

    for (const person of state.people) {
      person.animT += dt * 8;
      person.throwTimer -= dt;
      person.throwAnim = Math.max(0, person.throwAnim - dt);
      person.x += person.vx * dt;
      person.y += (person.targetY - person.y) * dt * 0.55;
      updatePersonFacing(person);
      if (person.throwTimer <= 0) {
        person.throwTimer = config.crowdThrow + Math.random() * 1.35;
        person.throwAnim = 0.38;
        launchTurnip(
          { x: person.x, y: person.y - person.h * 0.55 },
          { x: j.x + (Math.random() - 0.5) * j.w * 0.45, y: j.y + j.h * 0.38 },
          "crowd"
        );
      }
    }
    state.people = state.people.filter((person) => person.x > -person.w * 2.6 && person.x < state.w + person.w * 2.6);

    for (const turnip of state.turnips) {
      turnip.x += turnip.vx * dt;
      turnip.y += turnip.vy * dt;
      turnip.vy += turnip.owner === "player" ? 290 * dt : 120 * dt;
      turnip.spin += dt * 10;
      if (turnip.hit) continue;

      if (turnip.owner === "player") {
        for (const person of state.people) {
          const hitBox = { x: person.x, y: person.y, w: person.w * 0.92, h: person.h * 0.86 };
          if (rectCircleHit(hitBox, turnip)) {
            turnip.hit = true;
            state.peopleHits += 1;
            state.score = Math.max(0, state.score - 5);
            scoreEl.textContent = `${state.score} pts`;
            addFloater("-5", person.x, person.y - person.h * 0.72, "#ff8f77");
            break;
          }
        }
      }

      const jBox = { x: j.x, y: j.y + j.h * 0.78, w: j.w * 0.68, h: j.h * 0.78 };
      if (!turnip.hit && rectCircleHit(jBox, turnip)) {
        turnip.hit = true;
        if (turnip.owner === "player") {
          state.jarramplasHits += 1;
          j.flash = 0.22;
          state.score += 10;
          scoreEl.textContent = `${state.score} pts`;
          addFloater("+10", j.x, j.y + j.h * 0.18, "#f2df70");
        }
      }
    }
    state.turnips = state.turnips.filter((t) => !t.hit && t.x > -90 && t.x < state.w + 90 && t.y > -120 && t.y < state.h + 120);
  }

  for (const floater of state.floaters) {
    floater.life -= dt;
    floater.y += floater.vy * dt;
  }
  state.floaters = state.floaters.filter((f) => f.life > 0);
}

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
  const frame = anim[Math.floor(person.animT) % anim.length];
  const y = person.y + Math.sin(person.animT * 0.7) * 2;
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.beginPath();
  ctx.ellipse(person.x, y + 2, person.w * 0.48, person.w * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  drawSprite(frame, person.x, y, person.h, person.flip);
}

function drawJarramplas() {
  const j = state.jarramplas;
  const walkFrames = assets.jarramplas.slice(0, 16);
  const frame = walkFrames[j.walkFrame % Math.max(1, walkFrames.length)];
  drawSprite(frame, j.x, j.y + j.h, j.h);
  if (j.flash > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    drawSprite(frame, j.x, j.y + j.h, j.h, false, Math.min(0.75, j.flash * 3.4));
    ctx.restore();
  }
}

function render() {
  drawBackground();
  const drawables = [
    ...state.people.map((person) => ({ y: person.y, draw: () => drawPerson(person) })),
    { y: state.jarramplas.y + state.jarramplas.h * 0.52, draw: drawJarramplas },
  ].sort((a, b) => a.y - b.y);
  for (const item of drawables) item.draw();
  for (const turnip of state.turnips) drawTurnip(turnip.x, turnip.y, turnip.r * 2, turnip.spin);

  if (state.drag) {
    ctx.strokeStyle = "rgba(255, 246, 223, 0.74)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(state.drag.start.x, state.drag.start.y);
    ctx.lineTo(state.drag.current.x, state.drag.current.y);
    ctx.stroke();
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

function loop(now) {
  update(now);
  render();
  requestAnimationFrame(loop);
}

function pointerPos(event) {
  const point = event.touches ? event.touches[0] : event;
  const rect = canvas.getBoundingClientRect();
  return {
    x: point.clientX - rect.left,
    y: point.clientY - rect.top,
  };
}

function launchStartFor(point) {
  return {
    x: Math.max(24, Math.min(state.w - 24, point.x)),
    y: state.h - Math.max(44, state.h * 0.07),
  };
}

function onPointerStart(event) {
  if (state.mode !== "playing") return;
  const p = pointerPos(event);
  if (p.y < state.h * 0.58) return;
  event.preventDefault();
  state.drag = { start: launchStartFor(p), current: p };
}

function onPointerMove(event) {
  if (!state.drag || state.mode !== "playing") return;
  event.preventDefault();
  state.drag.current = pointerPos(event);
}

function onPointerEnd(event) {
  if (!state.drag || state.mode !== "playing") return;
  event.preventDefault();
  const drag = state.drag;
  state.drag = null;
  launchTurnip(drag.start, drag.current, "player");
}

playButton.addEventListener("click", () => {
  state.mode = "select";
  showScreen("select");
});
document.getElementById("backButton").addEventListener("click", () => {
  state.mode = "menu";
  showScreen("start");
});
document.getElementById("levelBackButton").addEventListener("click", () => {
  state.mode = "select";
  showScreen("select");
});
document.getElementById("againButton").addEventListener("click", () => {
  state.mode = "select";
  showScreen("select");
});
document.querySelectorAll("[data-level]").forEach((button) => {
  button.addEventListener("click", () => chooseLevel(button.dataset.level));
});

canvas.addEventListener("touchstart", onPointerStart, { passive: false });
canvas.addEventListener("touchmove", onPointerMove, { passive: false });
canvas.addEventListener("touchend", onPointerEnd, { passive: false });
canvas.addEventListener("mousedown", onPointerStart);
window.addEventListener("mousemove", onPointerMove);
window.addEventListener("mouseup", onPointerEnd);
window.addEventListener("resize", resize);

resize();
loadAssets().catch((error) => {
  console.error(error);
  playButton.textContent = "Error";
});
requestAnimationFrame(loop);

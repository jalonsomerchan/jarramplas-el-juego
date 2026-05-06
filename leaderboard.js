const LEADERBOARD_KEY = 'jarramplas:leaderboard:v1';
const MAX_ENTRIES = 10;

function readLeaderboard() {
  try {
    const entries = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

function writeLeaderboard(entries) {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  } catch {
    // Storage may be unavailable. The game should keep working.
  }
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function scoreNumber(value) {
  return Number(clean(value).replace(/[^0-9]/g, '')) || 0;
}

function currentResultEntry() {
  const scoreText = clean(document.getElementById('finalScore')?.textContent);
  const score = scoreNumber(scoreText);
  if (!score) return null;

  return {
    score,
    scoreText,
    mode: clean(document.getElementById('finalMode')?.textContent),
    accuracy: clean(document.getElementById('finalAccuracy')?.textContent),
    turnipsHit: clean(document.getElementById('finalTurnipsHit')?.textContent),
    peopleHits: clean(document.getElementById('finalPeopleHits')?.textContent),
    playedAt: Date.now(),
  };
}

function saveCurrentResult() {
  const entry = currentResultEntry();
  if (!entry) return;

  const entries = readLeaderboard();
  const exists = entries.some((item) => (
    item.score === entry.score &&
    item.mode === entry.mode &&
    item.accuracy === entry.accuracy &&
    Math.abs(item.playedAt - entry.playedAt) < 2000
  ));

  if (exists) return;

  writeLeaderboard([entry, ...entries]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES));
}

function ensureLeaderboardUi() {
  if (document.getElementById('leaderboardPanel')) return;

  const panel = document.createElement('section');
  panel.id = 'leaderboardPanel';
  panel.className = 'screen';
  panel.innerHTML = `
    <div class="menu">
      <h2>Ranking local</h2>
      <div class="detail-list" id="leaderboardList"></div>
      <button id="leaderboardShareButton" type="button">Compartir mi mejor marca</button>
      <button class="secondary" id="leaderboardClearButton" type="button">Borrar ranking</button>
      <button class="secondary" id="leaderboardBackButton" type="button">Volver</button>
    </div>
  `;
  document.getElementById('app')?.appendChild(panel);

  const startActions = document.querySelector('#start .menu-actions');
  if (startActions && !document.getElementById('leaderboardButton')) {
    const button = document.createElement('button');
    button.className = 'secondary';
    button.id = 'leaderboardButton';
    button.type = 'button';
    button.textContent = 'Ranking';
    startActions.appendChild(button);
  }
}

function showOnlyLeaderboard() {
  document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('is-visible'));
  document.getElementById('leaderboardPanel')?.classList.add('is-visible');
  document.getElementById('hud')?.classList.remove('is-visible');
}

function showStart() {
  document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('is-visible'));
  document.getElementById('start')?.classList.add('is-visible');
}

function renderLeaderboard() {
  const list = document.getElementById('leaderboardList');
  if (!list) return;

  const entries = readLeaderboard();
  if (!entries.length) {
    list.innerHTML = '<div class="detail-row"><span>Aún no hay puntuaciones</span><strong>Juega una partida</strong></div>';
    return;
  }

  list.innerHTML = entries.map((entry, index) => {
    const date = new Date(entry.playedAt).toLocaleDateString('es-ES');
    const meta = [entry.mode, entry.accuracy && `Acierto ${entry.accuracy}`, date].filter(Boolean).join(' · ');
    return `
      <div class="detail-row">
        <span>#${index + 1} · ${meta}</span>
        <strong>${entry.score.toLocaleString('es-ES')} pts</strong>
      </div>
    `;
  }).join('');
}

async function shareBestScore() {
  const best = readLeaderboard()[0];
  if (!best) return;

  const url = window.location.href.split('#')[0];
  const text = `Mi récord en Jarramplas es ${best.score.toLocaleString('es-ES')} puntos 🔥 ¿Me superas?`;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Jarramplas - El Juego', text, url });
      return;
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    alert('Marca copiada para compartir 🔥');
  }
}

function bindLeaderboardEvents() {
  document.addEventListener('click', (event) => {
    if (event.target.closest('#leaderboardButton')) {
      renderLeaderboard();
      showOnlyLeaderboard();
    }

    if (event.target.closest('#leaderboardBackButton')) {
      showStart();
    }

    if (event.target.closest('#leaderboardClearButton')) {
      writeLeaderboard([]);
      renderLeaderboard();
    }

    if (event.target.closest('#leaderboardShareButton')) {
      shareBestScore();
    }
  });
}

function observeResults() {
  const resultScreen = document.getElementById('result');
  if (!resultScreen) return;

  const observer = new MutationObserver(() => {
    if (resultScreen.classList.contains('is-visible')) {
      saveCurrentResult();
    }
  });

  observer.observe(resultScreen, { attributes: true, attributeFilter: ['class'] });
}

ensureLeaderboardUi();
bindLeaderboardEvents();
observeResults();

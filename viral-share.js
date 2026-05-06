const SHARE_TITLE = 'Jarramplas - El Juego';
const SHARE_UTM = 'utm_source=share&utm_medium=web_share&utm_campaign=jarramplas_game';

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function shareUrl(params = {}) {
  const url = new URL(window.location.href.split('#')[0]);
  url.searchParams.set('utm_source', 'share');
  url.searchParams.set('utm_medium', 'web_share');
  url.searchParams.set('utm_campaign', 'jarramplas_game');

  Object.entries(params).forEach(([key, value]) => {
    const safeValue = cleanText(value);
    if (safeValue) url.searchParams.set(key, safeValue);
  });

  return url.toString();
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  return copied;
}

async function sharePayload(payload) {
  const textToCopy = `${payload.text}\n${payload.url}`;

  if (navigator.share) {
    try {
      await navigator.share(payload);
      return;
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
  }

  const copied = await copyToClipboard(textToCopy);
  if (copied) {
    alert('Enlace copiado. Compártelo por WhatsApp, Telegram o donde quieras 🔥');
  }
}

function resultPayload() {
  const score = cleanText(document.getElementById('finalScore')?.textContent).replace(/\s*pts$/i, '');
  const mode = cleanText(document.getElementById('finalMode')?.textContent);
  const accuracy = cleanText(document.getElementById('finalAccuracy')?.textContent);
  const hits = cleanText(document.getElementById('finalTurnipsHit')?.textContent);
  const peopleHits = cleanText(document.getElementById('finalPeopleHits')?.textContent);

  const text = score
    ? `He hecho ${score} puntos en Jarramplas 🔥 ¿Me superas?`
    : 'Estoy jugando a Jarramplas 🔥 ¿Te atreves a superar mi puntuación?';

  const details = [mode, accuracy && `acierto ${accuracy}`, hits && `${hits} impactos`, peopleHits && `${peopleHits} personas dadas`]
    .filter(Boolean)
    .join(' · ');

  return {
    title: SHARE_TITLE,
    text: details ? `${text}\n${details}` : text,
    url: shareUrl({ score, accuracy }),
  };
}

function genericPayload() {
  return {
    title: SHARE_TITLE,
    text: 'Juega gratis a Jarramplas, lanza nabos y consigue la máxima puntuación 🔥',
    url: shareUrl(),
  };
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('#shareButton, #shareResultButton');
  if (!button) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  const payload = button.id === 'shareResultButton' ? resultPayload() : genericPayload();
  sharePayload(payload);
}, true);

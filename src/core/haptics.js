export function vibrateImpact(duration = 20) {
  try {
    if (navigator.vibrate) navigator.vibrate(duration);
  } catch {
    // Algunos navegadores exponen vibrate, pero pueden rechazarlo fuera de gestos permitidos.
  }
}

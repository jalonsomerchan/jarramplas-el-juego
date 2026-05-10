# Refactor incremental de game.js

Esta rama inicia la issue #45 separando responsabilidades reutilizables de game.js en módulos ES pequeños, sin introducir build, frameworks ni romper el hosting estático.

## Módulos añadidos

- src/core/math.js: helpers puros como finiteNumber, clamp, lerp y easeOutQuad.
- src/core/dom.js: utilidades DOM pequeñas para evitar repetición al crear o actualizar elementos.
- src/core/haptics.js: feedback háptico centralizado.
- src/core/assets.js: helpers de carga de imágenes, etiquetas de archivo y frames de Jarramplas.
- src/core/screens.js: gestor mínimo de visibilidad de pantallas.

## Siguiente paso recomendado

Migrar game.js por bloques pequeños, en este orden:

1. Sustituir helpers puros internos por imports desde src/core/math.js.
2. Sustituir vibrateImpact por import desde src/core/haptics.js.
3. Migrar helpers de carga de assets a src/core/assets.js.
4. Migrar showScreen a createScreenManager de src/core/screens.js.
5. Después, extraer módulos más grandes: hud.js, leaderboard-ui.js, input.js, effects.js y rendering.js.

## Criterio de seguridad

Cada extracción debe dejar el juego arrancando directamente con python3 -m http.server.

No debe requerir bundler ni paso de build obligatorio.

## Nota

El fichero game.js es grande y concentra gameplay, canvas, navegación, HUD, assets, rankings y eventos. Para reducir riesgo, esta fase no modifica la lógica visible del juego; solo prepara módulos pequeños para migraciones posteriores revisables.

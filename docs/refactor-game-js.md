# Refactor incremental de game.js

Esta rama separa responsabilidades reutilizables de game.js en módulos ES pequeños, sin introducir build, frameworks ni romper el hosting estático.

## Módulos añadidos

- src/core/math.js: helpers puros como finiteNumber, clamp, lerp y easeOutQuad.
- src/core/dom.js: utilidades DOM pequeñas para evitar repetición al crear o actualizar elementos.
- src/core/haptics.js: feedback háptico centralizado.
- src/core/assets.js: helpers de carga de imágenes, etiquetas de archivo y frames de Jarramplas.
- src/core/screens.js: gestor mínimo de visibilidad de pantallas.
- src/game/runtime.js: límites de arrays runtime para mantener acotadas entidades activas.
- src/game/effects.js: floaters, partículas e impactos visuales.
- src/game/rendering.js: renderizado canvas de fondo, personajes, Jarramplas, nabos, trayectoria y overlays.
- src/input/pointer.js: entrada táctil/ratón para arrastrar y lanzar.
- src/ui/hud.js: actualización de puntos, modo, combo y récord.
- src/ui/leaderboard-ui.js: renderizado y sincronización de rankings local/global.
- src/ui/stats-ui.js: cajas, filas de detalle y pantalla de estadísticas.

## Estado actual

game.js queda como orquestador de estado, reglas de partida, navegación y bucle principal. Las responsabilidades de infraestructura, UI, input, efectos y renderizado ya viven en módulos dedicados.

## Siguiente paso recomendado

Si se continúa la issue #45, el siguiente corte natural es extraer lógica de gameplay pura:

1. Movimiento de Jarramplas y demo de menú.
2. Generación y actualización de personas.
3. Movimiento, colisiones y puntuación de nabos.
4. Flujo de partida: start, pause, resume, end y restart.

## Criterio de seguridad

Cada extracción debe dejar el juego arrancando directamente con python3 -m http.server.

No debe requerir bundler ni paso de build obligatorio.

## Nota

El fichero game.js sigue concentrando las reglas principales del juego para facilitar revisión y evitar cambios de comportamiento. El objetivo de esta fase es que las responsabilidades periféricas ya estén separadas y el juego siga funcionando directamente con un servidor estático.

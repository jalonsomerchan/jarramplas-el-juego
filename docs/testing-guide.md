# Guía de checks y calidad

## Comandos principales

```sh
npm ci
npm run lint
npm run format:check
npm run check:balance
npm run check:feedback
npm run check:modes
npm run build
npm run preview
```

## Qué validar siempre

- Lint correcto.
- Formato correcto.
- Build correcto.
- Juego funcional en móvil.
- Canvas responsive.
- Controles de teclado y touch.
- Assets cargando en build.
- Rutas compatibles con raíz y subruta.

## Tests de lógica

Este template no añade framework de testing para evitar dependencias innecesarias.

Añadir tests si el juego incorpora lógica compleja como:

- físicas,
- colisiones,
- generación procedural,
- niveles,
- economía,
- guardado de progreso,
- IA de enemigos,
- parsers de mapas o sprites.

Si se añaden tests, documentar:

- comando npm,
- carpeta,
- casos principales,
- integración en CI.

## Checks smoke sin framework

Para checks ligeros de configuración o simulación que no justifican un framework, usar scripts pequeños
en `scripts/` y exponerlos en `package.json`.

El balance de dificultad se valida con:

```sh
npm run check:balance
```

Este check falla si la configuración genera duraciones negativas, spawns imposibles, máximos de zorros
inválidos o niveles sin separación clara entre fácil, medio y difícil.

El feedback visual, sonoro y háptico se valida con:

```sh
npm run check:feedback
```

Este check falla si una acción principal no tiene sonido/vibración, si el volumen es excesivo o si un
sonido dura demasiado para móvil.

Los modos de juego se validan con:

```sh
npm run check:modes
```

Este check falla si un modo no tiene `id`, nombre visible u objetivo, si las constantes principales son inválidas, si las oleadas pueden superar límites simultáneos o si `GameScene` no puede inicializarse/reiniciarse por modo y dificultad.

## Checklist para PRs

- ¿Pasa `npm run lint`?
- ¿Pasa `npm run format:check`?
- ¿Pasa `npm run check:balance` si se toca el balance?
- ¿Pasa `npm run check:feedback` si se toca el feedback?
- ¿Pasa `npm run check:modes` si se tocan modos, reglas o flujo de partida?
- ¿Pasa `npm run build`?
- ¿No se han roto controles móviles?
- ¿No hay errores de consola?
- ¿No hay assets rotos?
- ¿La PR explica cómo probar el juego?

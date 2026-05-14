# Arquitectura de juego

## Objetivo

Mantener una base clara para juegos HTML5 pequeños y medianos con JavaScript puro y Canvas.

## Flujo principal

`src/js/app.js` solo debe inicializar dependencias y crear una instancia de `Game`.

`Game` coordina:

- canvas,
- renderer,
- input,
- escena activa,
- game loop,
- puntuación o estado global.

Las escenas implementan:

- `update(deltaTime)`,
- `render(renderer)`,
- métodos propios como `reset()`, `pause()` o `resume()` cuando haga falta.

## Game loop

Usar siempre `requestAnimationFrame`.

Separar:

```js
scene.update(deltaTime);
scene.render(renderer);
```

Buenas prácticas:

- Limitar `deltaTime` máximo para evitar saltos tras pestañas inactivas.
- Parar o pausar el loop cuando la ventana pierda foco si el juego lo requiere.
- No crear listeners dentro del loop.
- No cargar assets dentro del loop.

## Escenas

Crear una escena por pantalla o modo:

```txt
src/js/scenes/
├── MenuScene.js
├── GameScene.js
├── PauseScene.js
└── GameOverScene.js
```

Para juegos sencillos puede bastar con `GameScene.js`, pero si aparece menú, pausa o derrota, separar escenas.

## Entidades

Si el juego tiene varias entidades, separarlas:

```txt
src/js/entities/
├── Player.js
├── Enemy.js
├── Collectible.js
└── Obstacle.js
```

Cada entidad debe encargarse de su propio estado. La escena decide cuándo actualizarla y renderizarla.

## Configuración

Usar `src/js/config/gameConfig.js` para:

- tamaño base del canvas,
- velocidades,
- gravedad,
- dificultad,
- duraciones,
- claves de storage,
- límites de vidas o puntuación,
- parámetros de niveles.

Evitar valores mágicos repartidos por el código.

## Renderer

`Renderer` debe centralizar dibujo en canvas:

- escalado Retina,
- limpieza de pantalla,
- fondos,
- sprites,
- primitivas,
- textos.

Evitar usar `canvas.getContext('2d')` desde muchas clases si no hace falta.

## Input

`Input` debe centralizar:

- teclado,
- pointer/touch,
- mouse,
- swipe,
- gamepad si se añade.

No duplicar listeners en escenas distintas.

## Estado persistente

Usar helpers de `src/js/utils/storage.js` para `localStorage`.

Guardar solo datos necesarios:

- mejor puntuación,
- progreso,
- ajustes,
- skins desbloqueadas,
- opciones de audio.

## Checklist

- ¿`app.js` solo inicializa?
- ¿Hay separación entre `update` y `render`?
- ¿El loop usa `requestAnimationFrame`?
- ¿Las constantes están en config?
- ¿El input está centralizado?
- ¿El renderer centraliza el canvas?
- ¿La escena activa es clara?
- ¿El juego puede reiniciarse sin recargar?

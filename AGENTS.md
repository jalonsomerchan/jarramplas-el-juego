# AGENTS.md

## Regla principal

Este repositorio es una base para crear juegos HTML5 con JavaScript puro, Canvas, Vite y Tailwind CSS. Debe mantenerse ligera, modular, mantenible, accesible y preparada para móviles.

Las reglas de este archivo son obligatorias. Todo agente, asistente IA o automatización que modifique este repositorio debe leerlas, aplicarlas y comprobarlas antes de terminar cualquier tarea.

Antes de modificar juego, motor, escenas, input, assets, estilos, rutas, documentación, CI o despliegue, el agente debe consultar estas guías cuando existan:

- `docs/game-architecture.md`
- `docs/assets-guide.md`
- `docs/input-guide.md`
- `docs/deployment-guide.md`
- `docs/testing-guide.md`

## Principios obligatorios

- Mobile first.
- Juego funcional en navegador moderno sin dependencias pesadas.
- Canvas responsive con escalado correcto en pantallas Retina.
- Usar `requestAnimationFrame` para el game loop.
- Separar actualización (`update`) y renderizado (`render`).
- Separar responsabilidades en módulos pequeños.
- `src/js/app.js` debe limitarse a inicializar el juego.
- Evitar lógica compleja inline en `index.html`.
- Evitar valores mágicos: mover velocidades, tamaños y dificultad a `src/js/config/`.
- Mantener compatibilidad con teclado, táctil y puntero cuando aplique.
- Evitar scroll accidental durante el control táctil.
- Guardar progreso o puntuaciones en `localStorage` solo mediante helpers.
- Optimizar y organizar sprites, sonidos y fondos en `src/assets/`.
- Mantener compatibilidad con dominio raíz (`/`) y subruta (`/nombre-del-repositorio/`).
- Mantener ficheros lo más pequeños posible.
- Mantener checks de lint, formato y build.

## Arquitectura obligatoria para juegos

Usar esta estructura como referencia:

```txt
src/
├── assets/
│   ├── sprites/
│   ├── sounds/
│   └── backgrounds/
├── css/
│   └── main.css
└── js/
    ├── app.js
    ├── config/
    │   └── gameConfig.js
    ├── game/
    │   ├── Game.js
    │   ├── Input.js
    │   └── Renderer.js
    ├── scenes/
    │   └── GameScene.js
    └── utils/
        ├── math.js
        └── storage.js
```

Reglas:

- `src/js/game/`: motor, loop, input, renderer, cámara, físicas o servicios del juego.
- `src/js/scenes/`: pantallas como menú, juego, pausa, game over o victoria.
- `src/js/config/`: constantes de juego, niveles, dificultad, tamaños y velocidades.
- `src/js/utils/`: helpers genéricos como almacenamiento, colisiones, tiempo o carga de assets.
- `src/assets/`: sprites, sonidos, fondos y otros recursos.

## Reglas para crear issues

Toda issue creada por IA debe incluir un prompt accionable para resolverla.

Formato recomendado:

```md
## Prompt para resolver esta issue

Trabaja en este repositorio: [añade aquí la URL del repositorio].

Resuelve esta issue manteniendo todas las condiciones descritas en `AGENTS.md`: ficheros pequeños, arquitectura modular de juego, Canvas responsive, `requestAnimationFrame`, separación entre `update` y `render`, controles móviles/teclado, accesibilidad, rendimiento, compatibilidad con raíz/subruta y checks útiles.

[Describe aquí la tarea concreta, comportamiento esperado, escenas afectadas, assets necesarios y criterios de aceptación.]

Actualiza documentación y checks si el cambio modifica arquitectura, controles, assets, rutas, estilos o convenciones del proyecto.
```

Si el usuario pide varias issues, cada issue debe ser independiente, accionable y resoluble sin contexto externo.

Si una tarea es grande, dividirla en varias issues o PRs pequeñas con objetivos verificables.

## Reglas para trabajar con GitHub API

- Crear una rama nueva por tarea si la API lo permite.
- No trabajar directamente sobre `main` salvo petición expresa o limitación técnica indicada.
- Leer los ficheros actuales antes de editarlos.
- No sobrescribir ficheros enteros si basta con un cambio localizado.
- Usar commits pequeños y descriptivos.
- Abrir PR con resumen, motivo, cómo probarlo y notas.
- No incluir tokens, secretos ni `.env` reales.
- No añadir permisos amplios a workflows sin necesidad.

## Checklist para juegos

- ¿El juego funciona en móvil?
- ¿El canvas se adapta al viewport?
- ¿No hay scroll accidental durante el control táctil?
- ¿El game loop usa `requestAnimationFrame`?
- ¿La lógica está separada de la UI?
- ¿`app.js` solo inicializa?
- ¿Los assets se cargan con rutas compatibles con Vite y subrutas?
- ¿Las constantes están en configuración?
- ¿Hay estado claro para menú, jugando, pausa y game over cuando aplique?
- ¿El juego puede reiniciarse sin recargar la página?
- ¿Pasan `npm run lint`, `npm run format:check` y `npm run build`?

## Qué evitar

- Meter todo el juego en `app.js`.
- Crear ficheros enormes con varias responsabilidades.
- Usar librerías pesadas para tareas simples.
- Usar rutas absolutas que fallen en subruta.
- Cargar assets que no se usan.
- Guardar datos directamente en `localStorage` desde muchos sitios.
- Bloquear el hilo principal con operaciones largas.
- Ignorar accesibilidad, rendimiento o controles móviles.

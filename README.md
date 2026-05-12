# 🎯 Jarramplas - El Juego

![status](https://img.shields.io/badge/status-active-success)
![platform](https://img.shields.io/badge/platform-web-blue)
![license](https://img.shields.io/badge/license-pending-lightgrey)

> Juego arcade web inspirado en la fiesta tradicional de Jarramplas (Piornal, Extremadura).

---

## 🕹️ Demo

👉 https://jarramplas.alon.one/

---

## 📸 Capturas

![Gameplay](./assets/portada.png)

---

## 🚀 Características

- 🎯 Gameplay arcade rápido y adictivo
- 📱 Optimizado para móvil (touch)
- 🎮 Varios modos de juego
- 🏆 Sistema de récords
- 📊 Estadísticas persistentes
- 🔥 Sharing viral integrado
- 🌍 Ranking global opcional con Firebase Firestore

---

## 🧠 Cómo jugar

1. Pulsa **Jugar**
2. Elige modo
3. Selecciona nivel
4. Arrastra y lanza el nabo
5. Golpea a Jarramplas y evita a la gente

---

## ⚙️ Tecnologías

- HTML5 Canvas
- JavaScript Vanilla
- LocalStorage
- Firebase (opcional leaderboard)
- Playwright (smoke tests)

---

## 📁 Estructura

```
index.html
styles.css
pwa-assets.js
asset-fallbacks.js
game.js
config.js
storage.js
service-worker.js
assets/
tests/
.github/workflows/
```

---

## 🚀 Desarrollo

Para levantar el juego como web estática:

```bash
python3 -m http.server
```

Para instalar dependencias de desarrollo y ejecutar los smoke tests:

```bash
npm install
npx playwright install chromium
npm run test:smoke
```

También puedes ejecutar toda la suite con:

```bash
npm test
```

Los tests levantan automáticamente un servidor estático en `http://127.0.0.1:4173` y validan que la pantalla inicial, la navegación básica y las estadísticas funcionan sin depender de Firebase real.

## 📲 PWA, caché y publicación

El juego usa `service-worker.js` para que la PWA funcione mejor en móvil y pueda reutilizar assets tras la primera carga.

La lista de archivos cacheables está centralizada en `pwa-assets.js`:

- `CORE_ASSETS`: HTML, CSS, JS, manifest, iconos y assets mínimos para arrancar.
- `GAMEPLAY_ASSETS`: fondos, variantes de Jarramplas y frames de personajes.
- `APP_BUILD`: versión de publicación usada para generar `CACHE_VERSION`.

Estrategia actual:

- Las páginas usan `network first`, con fallback a `index.html` cacheado si no hay conexión.
- JS, CSS y manifest usan `network first` sin query string para evitar quedarse con versiones antiguas.
- Imágenes y assets de gameplay usan `stale while revalidate`: cargan rápido desde caché y se actualizan en segundo plano.
- El precache no bloquea la instalación si falla un asset no crítico; los errores se registran en consola.
- Al activar una versión nueva, se eliminan cachés antiguas cuyo prefijo empieza por `jarramplas-v`.

### Cómo publicar una nueva versión

1. Cambia `APP_BUILD` en `pwa-assets.js`, por ejemplo:

```js
const APP_BUILD = "20260512-3";
```

2. Si añades fondos, variantes de Jarramplas o personajes, actualiza también las listas de `pwa-assets.js` para mantener el offline coherente con `config.js`.
3. Si cambias `index.html`, `game.js`, `styles.css`, `config.js` o assets importantes, sube siempre `APP_BUILD`.
4. Publica los archivos estáticos normalmente.
5. En la siguiente visita, el service worker nuevo tomará control, limpiará cachés anteriores y descargará de nuevo los assets.

Si un usuario sigue viendo una versión antigua, puede cerrar y abrir la PWA o recargar la página. En desarrollo, también conviene borrar el service worker desde DevTools > Application > Service Workers.

## 🌍 Ranking global con Firebase

El juego funciona sin Firebase usando un ranking local en `localStorage`. Para activar el ranking global:

1. Crea un proyecto de Firebase y una base de datos Firestore.
2. Edita `firebase-config.js` y cambia `enabled` a `true`.
3. Rellena la configuración pública web de Firebase (`apiKey`, `authDomain`, `projectId`, `appId`).
4. Activa Authentication > Sign-in method > Anonymous.
5. Publica reglas de Firestore que limiten escrituras básicas a usuarios autenticados.

Ejemplo orientativo de reglas:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scores/{scoreId} {
      allow read: if true;
      allow create: if
        request.auth != null
        && request.resource.data.playerName is string
        && request.resource.data.playerName.size() <= 18
        && request.resource.data.score is int
        && request.resource.data.score >= 0
        && request.resource.data.score <= 999999
        && request.resource.data.gameType in ["timed", "survival", "limitedTurnips", "eviction"]
        && request.resource.data.difficulty in ["day18Evening", "day19Morning", "day19Evening", "day20Morning", "day20Evening"]
        && request.resource.data.accuracy >= 0
        && request.resource.data.accuracy <= 100
        && request.resource.data.jarramplasHits >= 0
        && request.resource.data.peopleHits >= 0
        && request.resource.data.createdAt is int;
      allow update, delete: if false;
    }
  }
}
```

La consulta global filtra por `gameType` y `difficulty`, ordena por `score` y muestra el top 10. Si Firestore no está configurado o falla, la interfaz muestra el ranking local y el juego sigue funcionando.

---

## 🧭 Roadmap

- [x] Juego base
- [x] Sharing viral
- [x] Leaderboard local
- [x] Leaderboard global
- [ ] Sistema de combos
- [ ] Misiones diarias
- [ ] PWA

---

## 💡 Ideas futuras

- 🎮 Modo frenesí
- 🧠 IA de movimiento
- 🔊 Sonido y música
- 👥 Retos entre amigos

---

## 👤 Autor

Jorge Alonso

---

## ❤️ Inspiración

Basado en la fiesta tradicional de Jarramplas en Piornal.

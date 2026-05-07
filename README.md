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

---

## 📁 Estructura

```
index.html
styles.css
game.js
config.js
storage.js
assets/
```

---

## 🚀 Desarrollo

```bash
python3 -m http.server
```

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

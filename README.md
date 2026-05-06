# Jarramplas - El Juego

Juego web arcade inspirado en la fiesta de Jarramplas de Piornal, Extremadura. El objetivo es lanzar nabos a Jarramplas, evitar golpear a la gente y conseguir la máxima puntuación posible en distintos modos de partida.

## 🎮 Características

- Juego HTML5 basado en canvas.
- Controles táctiles pensados para móvil.
- Varias modalidades de partida:
  - Por tiempo.
  - Supervivencia.
  - Nabos limitados.
  - Hasta que te echen.
- Selección de nivel/dificultad.
- Selección de escenario.
- Diferentes sprites de Jarramplas.
- Sistema de estadísticas locales.
- Récords por modo y dificultad.
- Integración con Google Analytics opcional.
- Preparado para futuras mejoras como leaderboard, PWA, sharing viral y misiones diarias.

## 🕹️ Cómo se juega

1. Pulsa **Jugar**.
2. Elige tipo de partida.
3. Elige nivel.
4. Selecciona escenario y Jarramplas.
5. Arrastra el nabo fijo de la parte inferior, apunta y suelta para lanzar.
6. Suma puntos golpeando a Jarramplas.
7. Evita golpear a la gente.

## 📁 Estructura del proyecto

```text
.
├── index.html              # Página principal del juego
├── styles.css              # Estilos de UI y pantallas
├── game.js                 # Lógica principal del juego
├── config.js               # Configuración de modos, niveles, assets y textos
├── storage.js              # Récords, estadísticas y persistencia local
├── analytics.js            # Tracking de eventos
├── assets/                 # Imágenes, sprites y portada
└── README.md               # Documentación del proyecto
```

## 🚀 Ejecutar en local

El proyecto es estático. Puedes abrirlo con cualquier servidor local.

### Opción rápida con Python

```bash
python3 -m http.server 8080
```

Después abre:

```text
http://localhost:8080
```

### Opción con Node

```bash
npx serve .
```

## ⚙️ Configuración

La mayor parte de la configuración está en `config.js`:

- `APP_VERSION`: versión visible del juego.
- `difficultyConfig`: niveles y dificultad.
- `gameTypeConfig`: modos de partida.
- `scenarios`: escenarios disponibles.
- `jarramplasVariants`: sprites/personajes de Jarramplas.
- `shareTextConfig`: textos para compartir.

## 📊 Analytics

El juego puede usar Google Analytics si se define:

```html
<script>
  window.JARRAMPLAS_GA_ID = "G-XXXXXXXXXX";
</script>
```

La lógica está centralizada en `analytics.js`.

## 💾 Persistencia local

`storage.js` guarda en `localStorage`:

- récords por modo y dificultad;
- estadísticas generales;
- historial de puntuaciones;
- estado del tutorial.

## 🌍 Despliegue

Al ser un proyecto estático, puede desplegarse en:

- GitHub Pages;
- Cloudflare Pages;
- Vercel;
- Netlify;
- cualquier hosting estático.

## 🧭 Roadmap sugerido

- [ ] Leaderboard global con Firebase/Supabase.
- [ ] Modo PWA instalable.
- [ ] Sistema de combos.
- [ ] Misiones diarias.
- [ ] Nickname de jugador.
- [ ] Ranking por modo y dificultad.
- [ ] Mejor feedback visual y háptico.
- [ ] Sonido y música.
- [ ] Modo práctica.
- [ ] Daily challenge.

## 🧪 Calidad y mejoras pendientes

Hay varias mejoras propuestas como issues en el repositorio:

- rendimiento móvil;
- fallback robusto para compartir;
- ranking local/global;
- modo offline;
- pausa automática al cambiar de pestaña;
- efectos visuales de impacto;
- sistema de combos.

## 📜 Contexto cultural

Jarramplas es una fiesta tradicional de Piornal, en Cáceres. Este juego es un homenaje arcade y desenfadado a esa celebración popular.

## 👤 Autor

Hecho por Jorge Alonso.

## 📄 Licencia

Pendiente de definir. Si el proyecto va a ser público, se recomienda añadir una licencia explícita (`MIT`, `GPL`, `Apache-2.0`, etc.).

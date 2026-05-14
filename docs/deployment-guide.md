# Guía de despliegue

## Objetivo

El juego debe funcionar tanto en raíz de dominio como en subruta.

Ejemplos:

```txt
https://example.com/
https://example.com/juego/
https://usuario.github.io/nombre-repo/
```

## Vite y base

Vite permite configurar la base pública del build en `vite.config.js`.

Para raíz:

```js
base: '/';
```

Para subruta:

```js
base: '/nombre-repo/';
```

Este proyecto usa `GITHUB_PAGES=true` en el workflow para compilar con la subruta pública de GitHub Pages:

```bash
GITHUB_PAGES=true npm run build
```

Con esa variable activa, la base de Vite es:

```js
base: '/pipis-game-3/';
```

Sin esa variable, el build y el servidor de desarrollo mantienen compatibilidad con raíz (`/`).

## Rutas

Evitar rutas absolutas duras cuando el juego pueda desplegarse en subruta.

Evitar:

```html
<script type="module" src="/src/js/app.js"></script>
<img src="/src/assets/player.png" alt="" />
```

Preferir rutas relativas o imports gestionados por Vite.

## Canvas y viewport

- Usar `viewport-fit=cover` si el juego se orienta a móvil.
- Evitar scroll accidental.
- Probar tamaños pequeños y grandes.
- Mantener el canvas adaptable al contenedor.

## GitHub Pages

El workflow `.github/workflows/deploy-pages.yml` publica `dist/` cuando hay push a `main` o ejecución manual.

Pasos del workflow:

1. `npm ci`
2. `npm run lint`
3. `npm run format:check`
4. `GITHUB_PAGES=true npm run build`
5. desplegar `dist/` con GitHub Pages Actions

La URL esperada es:

```txt
https://jalonsomerchan.github.io/pipis-game-3/
```

## Checklist

- ¿Funciona en `/`?
- ¿Funciona en `/nombre-repo/`?
- ¿El canvas ocupa bien la pantalla?
- ¿Los assets cargan en build?
- ¿No hay rutas absolutas duras problemáticas?
- ¿El build genera `dist/`?

# Guía de assets para juegos

## Estructura recomendada

```txt
src/assets/
├── sprites/
├── sounds/
└── backgrounds/
```

## Sprites

Para animaciones, preferir spritesheets frente a muchos archivos sueltos.

Ejemplo:

```txt
src/assets/sprites/player.png
src/assets/sprites/player.json
```

El JSON puede describir:

```json
{
  "image": "./player.png",
  "frameWidth": 64,
  "frameHeight": 64,
  "columns": 6,
  "rows": 1,
  "animations": {
    "idle": [0],
    "run": [0, 1, 2, 3, 4, 5]
  }
}
```

## Sonidos

- Optimizar tamaño.
- Usar formatos web habituales.
- No reproducir audio hasta que exista interacción del usuario.
- Permitir silenciar si el juego crece.

## Fondos

- Optimizar imágenes.
- Evitar fondos gigantes si no son necesarios.
- Para juegos infinitos, usar fondos tileables o parallax sencillo.

## Carga de assets

- No cargar assets dentro del game loop.
- Preparar un loader si hay muchos recursos.
- Mostrar una escena de carga si el juego lo necesita.
- No incluir recursos que no se usan.

## Rutas y Vite

Para assets procesados por Vite, usar imports desde JavaScript cuando aplique.

Para assets públicos, comprobar que las rutas funcionan en raíz y subruta.

Evitar rutas absolutas duras como:

```txt
/src/assets/player.png
/assets/player.png
```

si el proyecto se va a desplegar en subruta.

## Checklist

- ¿El asset se usa realmente?
- ¿Está optimizado?
- ¿Está en la carpeta correcta?
- ¿Funciona en build?
- ¿Funciona en subruta?
- ¿Tiene JSON de metadatos si es un spritesheet complejo?

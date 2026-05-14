# Guía de input

## Objetivo

Centralizar controles de teclado, ratón, touch y puntero para que el juego funcione bien en escritorio y móvil.

## Reglas principales

- No duplicar listeners en varias escenas.
- Usar una clase o módulo `Input` compartido.
- Usar Pointer Events cuando sea posible.
- Mantener soporte de teclado para escritorio.
- Evitar scroll accidental durante el juego.
- Evitar zoom o selección accidental en controles táctiles.

## Teclado

Controles recomendados:

- Flechas.
- WASD.
- Espacio para acción principal si aplica.
- Escape o P para pausa si aplica.

## Touch y pointer

Para móviles:

- El canvas debe usar `touch-action: none` o una clase equivalente.
- Evitar listeners pesados en cada frame.
- Convertir coordenadas de pantalla a coordenadas internas del canvas.
- Usar `setPointerCapture` cuando se arrastre dentro del canvas.

## Swipe

Si el juego usa swipe:

- Definir umbral mínimo.
- Ignorar microdeslizamientos.
- Evitar que el swipe active scroll.
- Documentar dirección y comportamiento esperado.

## Gamepad

No añadir soporte de gamepad por defecto salvo que la tarea lo pida.

Si se añade:

- Centralizarlo en `Input`.
- Documentar botones.
- Mantener fallback con teclado/touch.

## Checklist

- ¿Funciona con teclado?
- ¿Funciona en móvil?
- ¿El canvas evita scroll accidental?
- ¿Las coordenadas táctiles están normalizadas al canvas?
- ¿No se crean listeners dentro del game loop?
- ¿Hay fallback si un tipo de input no existe?

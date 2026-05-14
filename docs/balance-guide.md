# Guía de balance de dificultad

El balance principal vive en `src/js/config/gameConfig.js` y las curvas se calculan en
`src/js/config/difficultyCurves.js`. La escena de juego solo pide métricas actuales, por lo que
ajustar la dificultad no obliga a tocar lógica privada de `GameScene`.

## Qué tocar para ajustar la dificultad

- `levels.*.firstFoxDelay`: segundos hasta el primer zorro. Menor valor significa inicio más tenso.
- `levels.*.firstEggDelay`: segundos hasta el primer huevo. Mayor valor reduce la ayuda inicial.
- `levels.*.foxSpawnInterval`: intervalo base entre zorros.
- `levels.*.eggSpawnInterval`: intervalo base entre huevos.
- `levels.*.foxBaseSpeed`: velocidad base de los zorros.
- `levels.*.maxFoxes`: zorros simultáneos al inicio.
- `levels.*.maxFoxesCap`: techo de zorros simultáneos en partidas largas.
- `balance.foxSpawn.intervalReductionPerMinute`: acelera el spawn de zorros por minuto.
- `balance.foxSpawn.minInterval`: límite inferior para que el spawn no sea imposible.
- `balance.foxSpeed.increasePerMinute`: subida de velocidad por minuto.
- `balance.foxSpeed.maxMultiplier`: techo de velocidad en partidas largas.
- `balance.eggSpawn.delayIncreasePerMinute`: separa cada vez más los huevos.
- `balance.eggSpawn.maxMultiplier`: techo del intervalo de huevos.
- `balance.eggDuration.reductionPerMinute`: reduce la duración de huevos por minuto.
- `balance.eggDuration.minDuration`: duración mínima garantizada de un huevo.

## Valores actuales de intención

- Fácil: primer zorro a los 3.4 s, primer huevo a los 5.5 s y techo de 5 zorros.
- Medio: primer zorro a los 2.35 s, primer huevo a los 7 s y techo de 7 zorros.
- Difícil: primer zorro a los 1.55 s, primer huevo a los 8.8 s y techo de 9 zorros.

El tutorial no usa estas curvas: mantiene sus temporizadores fijos y sus entidades guiadas.

## Check smoke

Ejecuta:

```sh
npm run check:balance
```

El script valida que no haya duraciones negativas, spawns imposibles, máximos de zorros absurdos o
niveles sin separación real entre fácil, medio y difícil. También imprime una tabla por checkpoints
para revisar visualmente la progresión.

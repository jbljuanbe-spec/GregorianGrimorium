# Impresión: por qué se cortaban algunas partituras

## El síntoma

Al imprimir (o exportar a PDF) una ficha con una pieza larga —los tractos
son el género más largo del corpus—, la partitura no salía completa: la
página quedaba a medias o el pentagrama se veía recortado a la mitad.

## La causa, en dos capas

**Capa 1 — paginación.** `.score-surface svg { break-inside: avoid; }`
le pide al navegador que no parta el pentagrama a mitad de un sistema, que
es lo correcto: una hoja de verdad tampoco corta un sistema por la mitad.
Pero un `<svg>` es una unidad atómica para la paginación HTML — el
navegador no sabe partir *dentro* de él aunque quisiera —, así que "no
partir" más una pieza más alta que una página física no produce una
página más: como no hay dónde partir, sencillamente se pierde lo que
sobra de una página.

**Capa 2 — la que de verdad importaba.** Exsurge dibuja el SVG con
`width` y `height` pero **sin `viewBox`**
(`vendor/exsurge/src/Exsurge.Chant.js`, `createSvg()`). Sin `viewBox`, esos
atributos no solo fijan el tamaño: fijan también el sistema de coordenadas
interno del dibujo. El primer intento de arreglo puso un techo de altura
real en CSS (`max-height: 21cm` en el `@media print`), razonando que el
navegador reescalaría la partitura entera para que cupiera. **No fue así.**
Sin `viewBox`, imponer una caja más pequeña por CSS no reescala nada: el
`<svg>` raíz recorta por defecto lo que no cabe en su ventana. El resultado
visual era casi indistinguible del original —una partitura densa y
parcialmente ilegible— porque lo que se veía no era la pieza entera
encogida, sino solo la esquina superior izquierda del dibujo, sin el resto.

Se detectó comparando dos cosas que deberían coincidir y no coincidían: el
`textContent` del SVG (que sí llevaba la letra completa hasta el final,
porque el texto vive en el DOM independientemente de si se ve) contra lo
que aparecía en el PDF exportado y capturado con Playwright (que se cortaba
antes del final). La comprobación correcta no es "¿está el texto en el
DOM?", es "¿qué es visible tras aplicarse el recorte del `<svg>`?".

## El arreglo

`lib/exsurge-render.ts` le añade un `viewBox="0 0 {width} {height}"` al SVG
justo después de dibujarlo, si no trae uno — sin tocar el vendido en
`vendor/exsurge/`, que se mantiene sin parchear salvo lo estrictamente
necesario para que cargue (ver `vendor/exsurge/ORIGIN.md`). Con `viewBox`,
imponer una caja más pequeña por CSS reescala el dibujo entero en vez de
recortarlo — el comportamiento por defecto de un SVG, `preserveAspectRatio:
xMidYMid meet`, que es exactamente "que quepa entero, centrado, sin
deformar".

Y en `app/globals.css`, `@media print` le pone a `.score-surface svg` un
techo de altura real (`max-height: 21cm`) además del de ancho que ya tenía.
Una pieza normal no lo nota —su altura natural está muy por debajo—; una
pieza tan larga como un tracto se encoge lo justo para caber entera en una
página, legible aunque pequeña, en vez de perder la segunda mitad.

## Verificación

Sobre la salida estática, con Playwright generando el PDF real
(`page.pdf({ format: "A4" })`) y no solo mirando el CSS:

- El tracto más largo del corpus (`qui-habitat-889`, 4.030 caracteres de
  gabc) imprime su partitura completa en una página, terminando en la
  sílaba correcta («…sa-lu-tá-re \* me-um.», que es el final real de la
  pieza) — comprobado leyendo el PDF generado, no el DOM.
- Una pieza corta (`brachia-peccatorum-601`) sale exactamente igual que
  antes: su SVG no llega al techo de 21 cm, así que la nueva regla no la
  toca. `attrH ≈ cssH` sin diferencia perceptible.
- Un repertorio con una pieza larga seguida de una corta imprime las dos
  completas, cada una en su sitio, sin página en blanco de por medio.

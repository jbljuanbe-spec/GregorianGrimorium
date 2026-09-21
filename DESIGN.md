---
version: 1
name: Gregorian-Grimorium
description: >
  Un libro de coro llevado a la pantalla. La tesis: esto no es un producto SaaS
  con una partitura dentro, es una edición — un gradual que se consulta, se
  anota y se lleva al atril. La superficie es papel; la retícula es de imprenta,
  no de tarjetas; la elevación la llevan los filetes de 1 px, nunca una sombra.
  El rojo es la rúbrica, y solo aparece donde en un libro litúrgico aparecería.
---

## Por qué existe este archivo

La web se veía «hecha por IA», y eso es un diagnóstico concreto, no una
sensación. El acento delator estaba medido en el CSS: **30 declaraciones de
`border-radius`, 16 paneles con fondo tintado y borde, y una sombra difusa
global**. Todo elemento era un rectángulo blando flotando sobre otro. La
portada era una landing con un titular sans en negrita y media pantalla vacía,
en un sitio que tiene 3.051 piezas que enseñar.

Formato tomado de [Google Stitch DESIGN.md](https://stitch.withgoogle.com/docs/design-md/overview/),
vía el análisis de sistemas editoriales de `VoltAgent/awesome-design-md`. De
ahí viene el método y la disciplina de las reglas; el lenguaje visual es de
este proyecto y de su repertorio, no de ninguna marca ajena.

---

## colors

```
canvas:        #f4ecdb   Papel. El fondo de todo.
canvas-sunk:   #e8dcc4   Hueco: filas alternas, estados pulsados.
sheet:         #fffdf7   La hoja de la partitura. La superficie más clara.
ink:           #241a12   Tinta negra: lo que se canta.
ink-soft:      #5d4c38   Tinta aguada: metadatos, glosa.
ink-faint:     #8a7658   Tinta muy aguada: cifras al margen.
rubric:        #8a1c22   Rojo de rúbrica. Lo que indica CÓMO cantar.
rubric-wash:   #efdfd8   Lavado de rúbrica, solo para marcar la fila actual.
rule:          #cbb894   Filete. La única marca de estructura.
rule-strong:   #a89066   Filete grueso, para cerrar secciones.
gold:          #a8874a   Remate. Filetes de cabecera y nada más.
```

**Regla del rojo.** En un libro litúrgico el rojo es la rúbrica: no es un
acento de marca, es una categoría de información. Se usa para indicaciones de
ejecución, para el género de la pieza y para señalar un reparo. Nunca para un
botón «primario», nunca para decorar.

---

## typography

Tres familias, tres oficios. No hay una cuarta.

```
chant   Cardo             El latín, los íncipits y los titulares.
ui      Inter Tight       Etiquetas, navegación, botones, cifras.
hand    Cardo italic      Glosa y comentario de fuente.
```

**Por qué Cardo.** Está diseñada por David Perry *para* medievalistas y
clasicistas: una Bembo renacentista con la cobertura de diacríticos que este
repertorio necesita de verdad (é, æ, ǽ, œ) y con el aire de un libro
compuesto en plomo. Antes iba Spectral, que es buena pero es una de las serif
por defecto de Google Fonts y aparece en miles de webs generadas. **El tipo
de letra es lo que más delata una interfaz sin autor**, así que la cara tiene
que tener un referente y un motivo; esta los tiene.

La sans va en papel secundario a propósito: lo que se le pide es densidad y
cifras tabulares limpias, no carácter. La voz de la página es la serif.

| token | familia | tamaño | peso | interlínea | tracking |
|---|---|---|---|---|---|
| `display-hero` | chant | clamp(2.4rem, 6vw, 4rem) | **400** | 1.02 | -0.02em |
| `display-lg` | chant | 2rem | 400 | 1.1 | -0.01em |
| `display-md` | chant | 1.45rem | 400 | 1.15 | 0 |
| `incipit` | chant | 1.05rem | 400 | 1.25 | 0 |
| `body` | chant | 1rem | 400 | 1.55 | 0 |
| `ui-md` | ui | 0.875rem | 500 | 1.4 | 0 |
| `ui-sm` | ui | 0.78rem | 500 | 1.35 | 0 |
| `eyebrow` | ui | 0.68rem | 600 | 1.2 | 0.11em, versalitas |
| `figure` | ui | 0.72rem | 500 | 1 | 0.02em, tabular |

**El display va en peso 400.** La elegancia está en el dibujo de la letra y en
el tamaño, no en engordarla. Un titular serif de 64 px en regular tiene más
autoridad que uno sans en 700, y es la diferencia más visible entre una
edición y una landing.

---

## geometry

```
radius-none:  0      Todo. Botones, campos, contenedores, filas.
radius-full:  9999px Solo la marca circular, si alguna vez la hay.
hairline:     1px    Filete. La única señal de estructura.
```

**Esquinas cuadradas.** Un libro impreso no tiene rectángulos redondeados, y
el redondeo de 4 px es la firma más reconocible de una interfaz generada. Se
quitó de los 30 sitios donde estaba.

*La única excepción:* las teclas del diapasón llevan `0 0 2px 2px` —
redondeadas solo por abajo—, porque una tecla de piano lo está. Es un
referente real, no un ablandamiento decorativo; ese es el listón para
cualquier otra excepción futura.

**Sin sombras.** No existe `box-shadow` en este sistema salvo el foco de
teclado. La jerarquía la llevan el filete, el espacio en blanco y el contraste
de superficie. Una tarjeta con sombra dice «soy una tarjeta»; un filete dice
«aquí acaba una sección», que es lo que de verdad hace falta.

**Sin paneles tintados.** Lo que antes era un bloque con fondo y borde ahora es
contenido separado por un filete. La única superficie con fondo propio es la
hoja de la partitura (`sheet`), porque la notación necesita su papel.

---

## spacing

Escala de imprenta, en múltiplos de 4: `4 8 12 16 24 32 48 64 96`.

La columna de lectura no pasa de **34rem** (unos 70 caracteres). La retícula
de la mesa de trabajo sí usa todo el ancho, porque un atril es ancho.

---

## components

### `rule` — el filete
1 px sólido `rule`. Separa secciones y filas. Sustituye a toda tarjeta.
Un filete `rule-strong` de 1 px cierra un bloque mayor.

### `eyebrow` — la rúbrica al margen
Versalitas pequeñas en `rubric`, tracking 0.11em. Etiqueta lo que viene
debajo. Es el equivalente de la anotación roja al margen del libro.

### `entry` — la fila de pieza
Fila de una lista de repertorio. Íncipit en `incipit`, metadatos en `ui-sm`
`ink-soft` a continuación, cifra al margen derecho en `figure` tabular.
Filete inferior. Sin fondo, sin borde, sin redondeo. En hover, el fondo pasa a
`canvas-sunk`; la fila actual lleva un filete izquierdo de 2 px en `rubric`.

### `button` — el botón
Fondo transparente, 1 px `rule-strong`, texto `ink` en `ui-sm`, esquinas a 0.
En hover el borde pasa a `ink`. El botón de acción principal invierte: fondo
`ink`, texto `canvas`. Ninguno lleva rojo.

### `field` — el campo de texto
Fondo `sheet`, 1 px `rule-strong`, esquinas a 0, texto en `chant`. Al enfocar,
el borde pasa a `ink` — no a rojo.

### `sheet` — la hoja de la partitura
La única superficie con fondo propio (`sheet`) y filete completo. Es el papel:
tiene derecho a distinguirse porque contiene la notación.

### `title` — el título de una pieza
Sale de `lib/chant-title.mjs`, no del campo crudo. Los 705 Alleluia vienen
titulados por su versículo —la fuente hace bien, porque los 705 empiezan
cantando «Allelúia»—, pero crudo se lee «In multitudine» con la etiqueta
«Alleluia» al lado y no parece que tengan que ver. Se imprime como en los
libros: **«Allelúia: In multitúdine»**.

### `figure` — la cifra al margen
Números alineados a la derecha en `figure` tabular, color `ink-faint`. Como
los folios y los recuentos al margen de un índice.

---

## layout

**La portada es un índice, no una landing.** Un gradual abre con su tabla de
contenidos, no con una propuesta de valor y media pantalla vacía. La portada
lleva el buscador arriba y a continuación repertorio real: las piezas del
corpus, agrupadas, visibles sin hacer nada. La densidad es una virtud aquí —
un libro de coro tiene las páginas llenas.

**La ficha es un atril de tres paneles.** Biblioteca · partitura · útiles de
ensayo. Se mantiene: esa parte ya funcionaba.

---

## Do

- Separar con filetes de 1 px. Es la única señal de estructura del sistema.
- Poner el display en serif a peso 400 y tamaño grande.
- Reservar el rojo para la rúbrica: ejecución, género, reparo.
- Alinear cifras a la derecha con cifras tabulares.
- Llenar la portada de repertorio de verdad.
- Dejar que el blanco separe; es más barato que una caja.

## Don't

- **No redondear nada.** Ni botones, ni campos, ni contenedores.
- **No poner sombras.** La elevación la lleva el filete.
- **No envolver en paneles tintados** lo que un filete ya separa.
- **No usar sans en negrita para los titulares.** Es la voz de una landing.
- **No usar el rojo como acento de marca** ni en botones primarios.
- **No dejar la portada vacía** cuando hay 3.051 piezas que enseñar.

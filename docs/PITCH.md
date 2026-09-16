# Tono: qué significa transponer un canto gregoriano

## El problema

La petición natural de un director es «bájame esto un tono». Con una partitura
moderna se reescriben las notas. Con canto gregoriano no, y conviene entender
por qué antes de tocar el código.

La notación gregoriana **no fija la altura absoluta**. La clave (`c` para do,
`f` para fa) dice qué línea del tetragrama es ese grado, y las notas son
grados de la escala respecto a él. No hay diapasón: la altura real la elige
quien dirige, según las voces que tenga delante.

De ahí se siguen dos conclusiones que descartan las soluciones ingenuas:

1. **Mover la clave no transpone.** En gabc las letras de nota son posiciones
   en el tetragrama, no grados. Si se cambia la clave y se dejan las letras,
   cada nota pasa a ser un grado distinto: cambian los intervalos y la pieza
   deja de ser la misma melodía. Es un error, no una transposición.
2. **Desplazar las notas y la clave a la vez tampoco transpone.** Preserva los
   intervalos, pero el resultado suena exactamente igual: solo se ha dibujado
   la misma melodía más arriba o más abajo en el tetragrama. Trabajo visible,
   efecto musical nulo.

Exsurge, además, no tiene API de transposición: solo clases internas de clave
y altura.

## La solución

Lo que sí es real y es lo que hace un director: **asignar la nota a la que
suena el do** y comprobar dónde queda la tesitura.

Exsurge sí modela alturas: cada nota llega como `Pitch{step, octave}` con
`step` en semitonos (Do=0, Re=2, Mi=4, Fa=5, Sol=7, La=9, Si=11), así que
`octave * 12 + step` es un intervalo en semitonos desde el do de la clave.
`components/ChantScore.tsx` recoge esos intervalos de los neumas, y
`lib/pitch.mjs` los traduce a notas reales.

La interfaz ofrece:

- **do = _nota_**, ajustable por semitonos. Es la transposición de verdad.
- **La tesitura resultante**: de qué nota a qué nota suena la pieza y en cuál
  entra, para decidir en un vistazo si el coro llega.
- **Dar el tono**: suena la primera nota con la Web Audio API, que es lo que
  se entona antes de empezar.
- Al abrir una ficha, el do se propone de modo que la pieza quede centrada en
  una tesitura coral cómoda (`suggestDo`).

**La partitura no se redibuja al transponer**, y eso es correcto, no una
carencia: el dibujo es el mismo: lo que cambia es la altura a la que se canta.
Hay un test de navegador que comprueba justamente que el SVG no cambia.

## Comprobación musical

Con «Ecce advénit» (introito, modo II), el tono propuesto es do = Si♭3 y la
pieza queda de Sol3 a Fa4, entrando en Sol3. En grados: de la (una tercera
menor bajo el do) a sol. Para un modo II, plagal del re, ese ámbito la–sol es
el esperado.

Las alteraciones se nombran con bemoles (`La♭`, no `Sol♯`): es la grafía
idiomática del repertorio, cuya única alteración escrita es el si bemol.

## Duración: por qué no vale un pulso plano

La primera versión del reproductor daba a todas las notas la misma duración.
Suena a metrónomo y no sirve para ensayar, porque la notación gregoriana sí
escribe duración, solo que no con figuras:

| Signo en gabc | Qué es | Duración |
| --- | --- | --- |
| letra minúscula | punctum | la unidad |
| `.` | punctum mora | el doble |
| `_` | episema horizontal | sostenida, sin llegar al doble |
| letra MAYÚSCULA | punctum inclinatum, el rombo | más ligera |
| `~` | licuescente, la nota pequeña | abreviada |
| `w` | quilisma | ligera, **y alarga la nota anterior** |
| `'` | episema vertical | marca el apoyo, no la duración |
| `,` `;` `:` `::` | barras | respiraciones de longitud creciente |

Las barras no son compases: son pausas, y de distinta medida. Sin ellas la
pieza no respira, que es justo lo que hacía inservible el ensayo.

Un alargamiento escrito manda sobre la forma breve: un rombo con mora dura lo
que dice la mora.

Todo esto vive en `lib/performance.mjs`, con 20 tests, y es también de donde
sale la tesitura que muestra la ficha.

## Las alteraciones que faltaban

Exsurge aplica el bemol de la clave (`cb3`) pero **no** las alteraciones
sueltas de mitad de pieza (`gx` = ese grado bemol hasta el fin de la palabra,
según el uso de Solesmes). Como el reproductor leía las alturas de Exsurge,
sonaba medio tono alto en esos pasajes —y son muchos: **2.031 de los 3.051
cantos** del corpus llevan alguna.

Por eso las alturas se calculan aquí, con la misma aritmética de clave y
posición que usa Exsurge. Eso se comprobó midiendo: sobre 200 cantos del
corpus, las alturas coinciden exactamente con las de Exsurge en los 92 que no
llevan alteraciones, y difieren en ±1 semitono solo en los 108 que sí —que es
precisamente el fallo corregido. Ninguna discrepancia de otro tipo.

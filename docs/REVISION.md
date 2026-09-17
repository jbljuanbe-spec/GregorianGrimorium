# Revisión del corpus

## El problema

El corpus se importa solo. Una importación automática no puede firmar que
una ficha esté bien, así que ninguna de las 3.051 salía marcada como
revisada, y cada ficha lo decía:

> Ficha de importación automática, aún sin revisión humana: el texto o el
> modo pueden arrastrar errores de la fuente.

Era verdad y era inútil. «Sin revisar» mezcla dos cosas que no son la misma:

1. **Que ninguna persona la haya cotejado con el libro.** Cierto, y sigue
   siéndolo.
2. **Que no sepamos nada de su calidad.** Falso. El canto gregoriano tiene
   propiedades que se comprueban solas, y una de ellas es exigente.

Publicar solo lo primero y callar lo segundo no es prudencia, es no haber
mirado. Así que ahora cada ficha publica la evidencia: qué se le ha
comprobado, con qué resultado y por qué.

## Estado actual

| Grado | Fichas | Qué significa |
| --- | --- | --- |
| Verificado a mano | 0 | Una persona lo firmó, con fecha y contra qué edición. |
| Comprobado automáticamente | 2.768 | Pasa las siete comprobaciones aplicables. |
| Con reparos | 283 | Alguna no cuadra, y la ficha dice cuál. |

De «0 de 3.051 y no sabemos nada» a «2.768 pasan siete comprobaciones y 283
tienen un reparo con nombre». Las 283 son una cola que una persona puede
trabajar; las 3.051 no lo eran.

## Las comprobaciones

Están en `lib/review.mjs`, con tests en `lib/review.test.mjs`. Cada una
devuelve *pasa*, *falla* o *no aplica*, y una frase con lo que ha visto.

### 1. La notación se lee y produce una melodía

Paréntesis compensados, clave explícita al principio, al menos una nota. Sin
clave, Exsurge dibuja con una por defecto y la pieza suena en un ámbito que
no es el suyo. Falla en **6** fichas.

### 2. El texto cantado está limpio

Que no se hayan colado como sílabas las rúbricas de ejecución («ij.» = bis,
«E u o u a e» = las vocales de *saeculorum amen*), ni JSON o escapes de la
fuente, ni caracteres invisibles. Falla en **4**.

Dos cosas que costaron calibrar:

- **Los signos del gradual no son basura.** `℣` y `℟` marcan versículo y
  respuesta, `†` la señal de la cruz, `ǽ` es la ligadura acentuada de
  «cǽli». Tratarlos como corrupción marcaba **1.475 fichas buenas**. El
  primer intento hizo exactamente eso.
- **Una mayúscula a mitad de palabra sí es basura.** No existe en la
  ortografía latina, y es la huella que deja una rúbrica pegada donde no
  toca. Fue lo que destapó el defecto de la sección siguiente.

### 3. El texto guardado es el que produce su propia notación

El gabc es la fuente de verdad y `text_latin` se deriva de él, así que
cualquier divergencia es un texto rancio o tocado a mano. Cubre de una vez
toda la clase de fallos de extracción. Falla en **0**, y ahí está su valor:
es un guardián de regresión. Si la extracción mejora,
`pnpm run refresh:text` vuelve a derivar el texto y esto queda en verde solo.

### 4. El modo viene declarado y es uno de los ocho

Falla en **16** fichas, que la fuente trae sin modo.

### 5. La pieza cierra donde su modo manda

La comprobación con más fondo musical, y la que más errores encuentra
(**149**).

La finalis de cada modo está fijada por la teoría modal:

| Modo | Finalis | Afinal |
| --- | --- | --- |
| I, II | re | la |
| III, IV | mi | ti (y la) |
| V, VI | fa | do |
| VII, VIII | sol | re |

Si una pieza dice ser del modo II y no cierra ni en re ni en la, una de las
dos cosas está mal: o el modo declarado, o la transcripción.

**Por qué se admite la afinal.** Medido en crudo, la comprobación acertaba
solo el 85%, y los fallos tenían un patrón que no era ruido: modo II
acabando en `la` 109 veces, modo V en `do` 17, modo IV en `ti` 13. Eso es la
doctrina medieval de la *affinitas*, que empareja re con la, mi con ti y fa
con do —una quinta arriba—: una pieza transpuesta cierra en su afinal, y
transponer para que quepa en el tetragrama sin alteraciones es práctica
corriente en la Vaticana. No es un error, es notación legítima. Admitiéndolo:

| | Fichas | |
| --- | --- | --- |
| Finalis propia | 2.580 | 85,0% |
| Afinal legítima | 306 | 10,1% |
| **Anómalo** | **149** | **4,9%** |

Los modos III y IV admiten además `la`, que recoge la transposición por
cuarta, también atestiguada. El residuo de 149 es la cola que necesita
persona: mayoritariamente modo I acabando en fa (32) y modo IV en fa (29).

### 6. El modo coincide con las demás transcripciones

GregoBase recoge varias versiones de la misma pieza —Vaticana, Solesmes,
dominicana—. Dos ediciones no pueden tener razón las dos sobre el modo, así
que un desacuerdo señala un error en una. Falla en **96**, y son
desacuerdos reales: `accipite-6064` dice modo VIII donde otra dice IV.

**Cautela importante, y conviene no perderla de vista:** de las 2.328 fichas
con otra versión con la que cruzar, 2.248 las transcribió la misma persona
(Andrew Hinkley) a partir de libros distintos. Así que esto corrobora que
las **ediciones** concuerdan, no que dos personas independientes lo leyeran
igual. Vale menos que una firma, y por eso no da «verificado».

### 7. Consta la procedencia

Origen, licencia, identificador en la fuente, instantánea del volcado y al
menos una edición impresa con su página. Es lo que hace la ficha citable y
lo que permite cotejarla. Falla en **38**.

## Qué sigue exigiendo una persona

Nada de lo anterior mira la ficha contra el libro. Una transcripción puede
pasar las siete comprobaciones y tener una palabra partida donde no toca, un
neuma de menos, o un modo que la fuente ya traía mal y que sus otras
ediciones repiten. Eso solo lo ve alguien con el gradual delante.

Por eso el grado se llama **comprobado**, no revisado.

### Cómo se firma una ficha

En `data/reviewed.json`:

```json
{
  "signatures": {
    "brachia-peccatorum-601": {
      "by": "Nombre de quien firma",
      "date": "2026-09-17",
      "note": "cotejado con Graduale Romanum 1961, p. 467"
    }
  }
}
```

Es un archivo en el repositorio y no una base de datos a propósito: la firma
queda en el historial de git, con autor y fecha, y cualquiera puede auditar
quién dio por buena qué ficha. Una fila en una tabla no da eso.

**Firmar no borra los reparos.** Si una comprobación sigue fallando, la
ficha lo enseña igual: la contradicción se ve, no se tapa. Hay un test que
lo fija.

### Por dónde empezar

`/revision` tiene la cola ordenada por gravedad: primero las que fallan más
de una comprobación, y dentro de eso las que fallan lo más serio. Las 6 de
notación y las 4 de texto son las más baratas de arreglar y las que más
dañan la ficha.

`pnpm run validate` imprime el recuento y los reparos por comprobación en
cada compilación, así que el estado del corpus no hay que ir a buscarlo.

## Un defecto que encontró esta misma auditoría

Merece quedar escrito porque es el caso que justifica todo lo anterior.

Al mirar en el navegador una ficha con reparos, el texto latino decía:

> Ad**Cantor** te, Dómine, * le**Omnes**vávi ánimam meam

`Cantor` y `Omnes` son rúbricas de quién canta. La extracción de texto
quitaba las etiquetas `<alt>` del gabc pero **dejaba dentro su contenido**, y
`<alt>` es texto que va sobre el pentagrama: rúbricas escénicas como «Hic
genuflectitur» (aquí se arrodilla) o «Chorus genua flectit usque ad Reple».
Son la misma clase que «ij.», y había que separarlas igual.

Y la comprobación de texto lo daba por bueno: un falso negativo mío, en una
ficha sellada como comprobada. Arreglado en tres pasos:

1. `extractText` descarta el contenido de `<alt>` y `<c>`, sin meter espacio
   —la anotación va pegada dentro de la palabra, y un espacio la partía—.
   Las rúbricas se rescatan en `performance_notes` y la ficha las enseña
   bajo «Ejecución»: no se cantan, pero sí se obedecen.
2. `pnpm run refresh:text` volvió a derivar el texto de las 15 fichas
   afectadas desde su propio gabc. Aparecieron dos más de paso:
   «AlLELÚIA» era una capitular de dos letras con versalitas que el
   arreglador de capitulares no cubría.
3. Dos comprobaciones nuevas para que la clase no vuelva en silencio: la
   mayúscula a mitad de palabra, y la nº 3, que exige que el texto guardado
   sea el que produce su notación.

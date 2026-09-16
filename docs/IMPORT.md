# Importación del corpus

## Por qué gabc

Los corpus abiertos de canto gregoriano (GregoBase, proyecto Gregorio y
transcripciones propias) distribuyen las piezas en **gabc**, el formato de
entrada del motor tipográfico Gregorio: cabeceras `clave: valor;`, separador
`%%`, y un cuerpo donde el texto y los neumas se alternan
(`PU(eh)er(h) na(hi)tus(h)`).

Importar desde gabc en vez de desde un PDF escaneado elimina de golpe dos de
los riesgos críticos de la auditoría: la segmentación por canto ya viene
resuelta en origen, y la partitura se regenera desde el código fuente en vez
de reproducir la maquetación de una edición protegida.

## Dos vías de entrada

**Volcado de GregoBase** (la vía principal). El volcado no se versiona en
este repo; se descarga de GregoBaseCorpus:

```sh
git clone --depth 1 https://github.com/bacor/gregobasecorpus.git
pnpm run import:gregobase -- \
  --dump gregobasecorpus/gregobase_dumps/gregobase_20191024.sql \
  --genres in,gr,al,tr,of,co \
  [--out data/chants] [--dry-run] [--force] [--prune]
```

Los metadatos vienen de columnas de la base, no de cabeceras gabc: `incipit`,
`office-part` (código de dos letras), `mode`, `mode_var`, `version`,
`cantusid`, `transcriber`, más las tablas de fuentes y etiquetas. El gabc
está guardado como cadena JSON dentro del SQL y, en casi todos los registros,
sin cabeceras.

**Archivos `.gabc` sueltos** (transcripciones propias o corpus distribuidos
como archivos):

```sh
pnpm run import:gabc -- --in ./corpus-gabc --origin gabc-file --license CC0-1.0
```

`--origin` y `--license` son obligatorios: ningún registro entra al corpus sin
declarar de dónde viene y bajo qué licencia. `--origin licensed` solo se usa
con autorización documentada (ver `SOURCES.md`).

Las dos vías construyen el registro con el mismo `buildRecord`
(`scripts/lib/record.mjs`), así que el esquema se honra en un solo sitio.

## Garantías del importador

- **Nunca marca un registro como verificado.** Todo lo importado queda en
  `needs_review`; `verified` solo lo pone una persona.
- **Nunca pisa revisión humana.** Si el registro destino ya está
  `verified`, se omite. Solo `--force` lo reemplaza.
- **Un gabc roto no aborta el lote**: se reporta y el resto continúa.
- **Lo que produce valida contra el esquema.** Hay un test que compila
  `data/schema/chant.schema.json` y valida cada registro importado, para
  que el importador y el esquema no puedan divergir en silencio.

## Qué deriva del gabc y qué no

| Campo | Origen | Fiabilidad |
| --- | --- | --- |
| `incipit`, `title` | cabecera `name` | Alta |
| `text_latin` | cuerpo, quitando la notación | Alta, con salvedades (abajo) |
| `genre` | cabecera `office-part` | Alta; lo no reconocido cae en `Other` |
| `mode` | cabecera `mode` (árabe o romano) | Alta; `null` si es desconocido o modal irregular |
| `liturgical_occurrences` | cabecera `occasion` | Media: texto libre, sin calendario normalizado |
| `bibliography` | tablas de fuentes, o cabecera `book` | Alta desde el volcado (98,7%); media desde cabecera |
| `gabc` | tal cual, sin tocar | Es la partitura: el navegador la dibuja |

## Limitaciones conocidas del extractor de texto

Están cubiertas por tests, pero conviene tenerlas presentes al revisar:

- **Capitular tipográfica**: `PU(eh)er(h)` se imprime con "P" capitular y
  "U" en versalita; el extractor lo normaliza a "Puer". Una palabra
  íntegramente en mayúsculas (`ALLELUIA`) se respeta tal cual.
- **Salto de línea a mitad de palabra**: en gabc las palabras se separan por
  espacios, y un salto de línea se trata como espacio. Si un transcriptor
  parte una palabra entre dos líneas, aparecerá un espacio de más. Es una de
  las cosas que la revisión humana debe detectar.
- **Glifos especiales**: `<sp>ae</sp>` → æ, `<sp>V/</sp>` → ℣, etc. Un glifo
  no reconocido conserva su contenido en bruto en vez de desaparecer.
- **`occasion` no está normalizado**: dos gabc pueden nombrar la misma fiesta
  de forma distinta. Unificar calendarios es trabajo de Fase 3.

## Del gabc a la partitura en pantalla

Exsurge es de 2016 y **no interpreta nada de marcado**: lo que no se traduzca
antes se dibuja literalmente sobre el pentagrama. Por eso
`gabcForRendering()` (en `lib/gabc.mjs`, compartida con los importadores)
hace tres cosas antes de pasarle el gabc:

1. Quita las cabeceras, que Exsurge no espera.
2. Traduce los glifos `<sp>ae</sp>` → æ, `<sp>V/</sp>` → ℣, etc. Hay 3.732
   ocurrencias en el corpus: sin esto se verían las etiquetas en crudo.
3. Descarta `<v>` (TeX verbatim) y `<alt>` (texto alternativo), sin
   equivalente gráfico, y desenvuelve `<i>`, `<b>`, `<sc>`… conservando el
   texto.

El motor se empaqueta con `scripts/build-exsurge.mjs`: su código usa imports
no relativos estilo webpack 2016 y carga su fuente con un loader inline, así
que se resuelve con esbuild en un global servido desde `/vendor/exsurge.js`
en vez de configurar el bundler de Next para un caso único.

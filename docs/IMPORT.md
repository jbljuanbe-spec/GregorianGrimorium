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

## Uso

```sh
node scripts/import-gabc.mjs \
  --in ./corpus-gabc \
  --origin public-domain-scan \
  --edition "Graduale Romanum, 1961" \
  [--out data/chants] [--dry-run] [--force]
```

`--origin` y `--edition` son obligatorios: ningún registro entra al corpus
sin declarar de dónde viene. `--origin licensed` solo se usa con
autorización documentada (ver `SOURCES.md`).

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
| `source.printed_pages` | cabecera `book` (`p. 47`, `pp. 47-49`) | Media: depende de cómo lo escribiera el transcriptor |
| `score_images` | — | No deriva del gabc; se genera aparte con Gregorio |

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

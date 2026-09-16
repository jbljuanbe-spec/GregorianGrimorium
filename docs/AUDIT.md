# Auditoría — Gregorian Grimorium

Resumen de la auditoría que fundamenta las decisiones de este proyecto.

## Fortalezas

- Nicho especializado y reconocible: directores de coro, organistas, músicos
  de iglesia, estudiantes de música sacra e investigadores tienen necesidades
  concretas (localizar un canto, su texto, su contexto litúrgico, su
  notación).
- No es necesario resolver OMR/transcripción musical completa (MIDI,
  MusicXML) para aportar valor: una imagen fiel de la partitura basta.
- La búsqueda por íncipit, modo, género y celebración es más útil que
  navegar manualmente un libro de cientos de páginas.
- Arquitectura estática (JSON + imágenes + páginas pregeneradas) mantiene los
  costes de infraestructura cercanos a cero.

## Riesgos, por prioridad

| Prioridad | Riesgo | Mitigación adoptada |
| --- | --- | --- |
| Crítico | Derechos de autor de la edición fuente | Construir sobre GregoBase / ediciones de dominio público, no sobre el Graduale Triplex (1979, con derechos vigentes). Ver `SOURCES.md`. |
| Crítico | La IA no puede segmentar cantos por sí sola de forma fiable | Solo aplica si se procesa un PDF escaneado; al partir de GregoBase la segmentación por canto ya viene resuelta en origen. Si en el futuro se añade una fuente en PDF, todo recorte debe pasar por revisión humana y conservar referencia a su página de origen. |
| Alto | Metadata insuficiente (sin variantes, fuentes, relaciones, estado de validación) | Esquema de datos versionado en `data/schema/chant.schema.json`, con `review_status`, múltiples ocurrencias litúrgicas y referencia de fuente por registro. |
| Alto | El SEO no está garantizado por generar muchas páginas | Cada ficha debe aportar texto latino, contexto litúrgico y relaciones, no solo una imagen. No se indexan páginas de combinaciones de filtros. |
| Alto | AdSense/monetización prematura | Pospuesto explícitamente a Fase 3, condicionado a tener contenido autorizado y tráfico real. |

## Corrección sobre OMR

Ningún sistema actual convierte el Graduale Triplex a MIDI/MusicXML de forma
fiable y completa — la notación cuadrada y los neumas adiastemáticos son un
problema de investigación abierto — pero existen herramientas de OMR y
métodos académicos que ayudan con partes del proceso. La decisión de no
depender de OMR para el MVP es correcta independientemente de este matiz: no
hace falta resolver la transcripción para ofrecer un buscador útil.

## Indicadores de éxito (Fase 0-1)

| Indicador | Qué mide |
| --- | --- |
| Precisión de import/recorte | Partitura completa y sin elementos ajenos |
| Exactitud de metadata | Texto, modo y contexto litúrgico correctos |
| Tiempo de revisión por canto | Si la automatización ahorra trabajo real |
| Éxito de búsqueda | Si el usuario encuentra la pieza que necesita |

Objetivo propuesto (no medido aún): ≥95% de registros de una muestra
representativa con `review_status: "verified"` antes de escalar.

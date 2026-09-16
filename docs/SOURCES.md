# Fuentes del corpus

## Por qué no el Graduale Triplex directamente

El *Graduale Triplex* (1979, Abbaye Saint-Pierre de Solesmes / Desclée) añade
a la notación cuadrada del *Graduale Romanum* los neumas adiastemáticos de
los manuscritos de Laon 239 y Einsiedeln 121, obra editorial de Dom Eugène
Cardine y colaboradores. La composición gráfica y esa capa de neumas son
material con derechos vigentes: escanear y republicar esas páginas sin
autorización es un riesgo legal real, no teórico.

Usar el Triplex como fuente sigue siendo una opción **si se obtiene licencia
explícita** de Solesmes/Desclée — pero no es la vía de arranque de este
proyecto.

## Fuentes de arranque (Fase 0-1)

- **GregoBase** (gregobase.selapa.net): base de datos abierta de cantos
  gregorianos codificados en notación Gregorio (motor de tipografía musical
  libre), con metadata estructurada por canto (íncipit, modo, género,
  fiesta). Permite regenerar la partitura como imagen/PDF a partir del
  código fuente, en vez de escanear un libro protegido.
  **Pendiente de verificar manualmente**: los términos de licencia exactos
  de los datos y de las partituras generadas (el acceso a
  `gregobase.selapa.net` está bloqueado por la política de red de este
  entorno de ejecución; hay que revisarlo desde un entorno con salida a
  internet antes de importar datos en volumen).
- **Corpus Christi Watershed** (ccwatershed.org): escaneos de ediciones de
  dominio público (Graduale Romanum 1908/1961, Liber Usualis 1961),
  legalmente libres de derechos de edición vigentes.

## Regla de importación

Todo registro en `data/chants/` debe declarar su `source` (edición, y para
fuentes basadas en escaneo, las páginas impresas de origen) y su
`review_status`. Ningún registro se marca `verified` sin revisión humana
del texto, el modo y la imagen.

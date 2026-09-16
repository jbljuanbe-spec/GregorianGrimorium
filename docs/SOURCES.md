# Fuentes del corpus

## Licencia: verificada, CC0-1.0

El corpus procede de [GregoBase](https://gregobase.selapa.net/) a través de
[GregoBaseCorpus](https://github.com/bacor/gregobasecorpus), el empaquetado
que mantiene la comunidad de musicología computacional.

Su README declara, como fuente primaria:

> The GregoBaseCorpus (the collection of `.gabc` and `.csv` files) is released
> under a CC0-1.0 license, just like GregoBase itself. The Python code used to
> generate the corpus is released under an MIT license.

**CC0-1.0 es una renuncia al copyright**: no exige atribución ni impone
condiciones de redistribución. Aun así, este proyecto cita origen y licencia
en cada ficha y en el pie de la web, porque la trazabilidad es parte del
valor del proyecto, no una obligación legal.

Exsurge, el motor que dibuja las partituras, es **MIT** (Fr. Matthew Spencer,
OSJ) y su aviso de copyright se conserva en el bundle generado.

## Por qué no el Graduale Triplex

El *Graduale Triplex* (1979, Abbaye Saint-Pierre de Solesmes / Desclée) añade
a la notación cuadrada los neumas adiastemáticos de Laon 239 y Einsiedeln 121,
obra editorial de Dom Eugène Cardine y colaboradores. Esa capa de neumas y su
composición gráfica son material con derechos vigentes: escanear y republicar
esas páginas sin autorización es un riesgo legal real.

Este proyecto no lo necesita. Al dibujar la partitura desde el gabc no se
reproduce la maquetación de ninguna edición: se compone de nuevo a partir de
datos en dominio público. Usar el Triplex seguiría requiriendo licencia
explícita de Solesmes, y sería una vía paralela, nunca la base.

## Otras fuentes posibles

- **Corpus Christi Watershed** (ccwatershed.org): escaneos de ediciones de
  dominio público (Graduale Romanum 1908/1961, Liber Usualis 1961). Útiles
  como referencia de cotejo en la revisión humana, no como fuente de datos.
- **Cantus Index** (cantusindex.org): catálogo de musicología. El corpus trae
  `cantusid` en algunos registros, que la ficha enlaza.

## Nota sobre el entorno de ejecución

El entorno donde se desarrolla este repo solo tiene salida de red a GitHub,
npm y PyPI: `gregobase.selapa.net` y `ccwatershed.org` devuelven 403 en el
proxy. Por eso el corpus se importa del volcado SQL publicado en GitHub
(GregoBaseCorpus) y no de la web de GregoBase, y por eso la licencia se
verificó en el README del repositorio, que es además la fuente primaria.

## Regla de importación

Todo registro declara su `provenance` (origen, licencia, id externo y volcado
concreto) y su `review_status`. Ningún registro se marca `verified` sin
revisión humana del texto, el modo y la partitura.

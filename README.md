# Gregorian Grimorium

Biblioteca digital de canto gregoriano: un buscador donde directores de coro,
organistas, músicos de iglesia e investigadores localizan una pieza por
íncipit, por cualquier palabra de su texto latino, por modo o por edición, y
consultan su partitura en notación cuadrada.

## Decisión de arquitectura

**Las partituras no son imágenes.** Cada canto guarda su notación en **gabc**
(el formato del motor Gregorio) y el navegador la dibuja con
[Exsurge](https://github.com/frmatthew/exsurge). Eso resuelve de raíz los dos
riesgos críticos del proyecto:

- **Derechos**: no se reproduce la maquetación de ninguna edición protegida.
  El corpus viene de [GregoBase](https://gregobase.selapa.net/) vía
  [GregoBaseCorpus](https://github.com/bacor/gregobasecorpus), bajo
  **CC0-1.0**. Ver [`docs/SOURCES.md`](docs/SOURCES.md).
- **Segmentación**: no hay que recortar páginas de un PDF ni adivinar dónde
  empieza cada pieza; el corpus ya viene por canto.

Además, una partitura dibujada desde su código fuente se puede reajustar al
ancho de la pantalla, ampliar sin pixelarse y —lo más útil para un director—
traducir sus intervalos a notas reales: se elige a qué nota suena el do, se ve
la tesitura que resulta y se puede dar el tono. Ver [`docs/PITCH.md`](docs/PITCH.md).

## Estado

**MVP funcionando**: 3.054 propios de la misa (introitos, graduales, aleluyas,
tractos, ofertorios y comuniones), 3.054 páginas estáticas, búsqueda a texto
completo y partitura dibujada en el cliente.

Todos los registros están en `needs_review`: la importación nunca marca nada
como verificado. Ver [`docs/PLAN.md`](docs/PLAN.md).

## Repertorios

Un director puede reunir las piezas de una misa en un repertorio privado,
ordenarlas, anotarlas, imprimirlas de una vez y pasarlas al coro con un
enlace. No hay cuentas ni servidor: el repertorio vive en el navegador y el
enlace lleva el contenido codificado en su fragmento. Ver
[`lib/repertoire.mjs`](lib/repertoire.mjs).

## Despliegue

Exportación estática, sin servidor ni base de datos. Ver
[`docs/DEPLOY.md`](docs/DEPLOY.md).

```sh
pnpm install
pnpm run check    # tests + validación del corpus + tipos
pnpm run dev      # servidor de desarrollo
pnpm run build    # exportación estática a out/
```

## Estructura

```
data/chants/   Datos maestros (un JSON por canto), fuente de verdad en git
data/schema/   Esquema JSON del registro de canto
lib/           Librería gabc compartida entre importadores y frontend
scripts/       Importación, validación y artefactos de compilación
app/           Rutas Next.js (buscador, ficha de canto, sitemap)
components/    Buscador y visor de partitura (cliente)
docs/          Auditoría, plan, fuentes y guía de importación
```

## Importar el corpus

El volcado de GregoBase no se versiona aquí (6,8 MB de origen externo):

```sh
git clone --depth 1 https://github.com/bacor/gregobasecorpus.git
pnpm run import:gregobase -- --dump gregobasecorpus/gregobase_dumps/gregobase_20191024.sql \
  --genres in,gr,al,tr,of,co
```

Detalles y garantías del importador en [`docs/IMPORT.md`](docs/IMPORT.md).

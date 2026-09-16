# Despliegue

La web es una exportación estática (`pnpm run build` → `out/`): no hay
servidor, ni base de datos, ni funciones. Cualquier hosting estático sirve, y
el coste tiende a cero.

## Vercel

El repositorio ya trae todo lo necesario:

- `vercel.json`: framework, comando de compilación y cabeceras (caché
  inmutable para el motor de partituras, caché revalidable para el índice de
  búsqueda, y cabeceras de seguridad básicas).
- `pnpm run prebuild` genera el bundle de Exsurge y el índice antes de
  compilar, así que Vercel no necesita pasos extra.

Pasos, una sola vez:

1. En Vercel, **Add New → Project** e importar
   `jbljuanbe-spec/GregorianGrimorium`. Detecta Next.js y lee `vercel.json`.
2. Definir la variable de entorno **`NEXT_PUBLIC_SITE_URL`** con el dominio
   final (por ejemplo `https://gregoriangrimorium.com`). De ella dependen las
   URL canónicas, el `sitemap.xml` y `robots.txt`; sin ella se usa la URL de
   previsualización que Vercel expone en `VERCEL_URL`.
3. Desplegar. Cada push a la rama de producción vuelve a publicar.

El plan gratuito cubre de sobra un sitio estático de este tamaño (3.054
páginas, ~1 MB de índice, ~130 KB de motor de partituras), pero conviene
revisar los límites vigentes de transferencia antes de hacer campaña.

## Comprobaciones antes de publicar

```sh
pnpm run check   # tests, validación del corpus y tipos
pnpm run build   # exportación completa
```

CI ejecuta las cuatro cosas en cada push.

## Dominio y SEO

- `NEXT_PUBLIC_SITE_URL` debe apuntar al dominio definitivo **antes** de
  enviar el sitemap a Google Search Console: si se indexa el dominio de
  previsualización, las canónicas quedarán mal.
- El sitemap está en `/sitemap.xml` y lo referencia `/robots.txt`.
- Cada ficha publica datos estructurados `MusicComposition` con su texto
  latino, su modo y sus citas bibliográficas.
- No se generan páginas indexables por combinación de filtros: la búsqueda
  ocurre en el cliente sobre una única URL, así que no hay riesgo de miles de
  páginas de bajo valor.

## Alternativa: GitHub Pages

Funciona, pero el sitio quedaría bajo `/GregorianGrimorium/`, y eso exige
configurar `basePath` en `next.config.mjs` y revisar las rutas absolutas
(`/vendor/exsurge.js`, `/search-index.json`). Con un dominio propio en Vercel
no hace falta.

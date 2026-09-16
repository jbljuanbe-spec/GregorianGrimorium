# Exsurge (incorporado al repositorio)

Motor de dibujo de notación cuadrada. Es lo que convierte el gabc de cada
canto en la partitura que ve el usuario.

- **Origen**: https://github.com/frmatthew/exsurge
- **Commit**: `f828578b2fc4f501697414080d4241a322ae3cc0`
- **Licencia**: MIT (Fr. Matthew Spencer, OSJ) — ver `LICENSE`
- **Contenido**: `src/` sin modificar y la fuente `assets/fonts/ExsurgeChar.otf`

## Por qué está aquí y no como dependencia

1. **No hay nada instalable.** El paquete `exsurge` de npm es de 2016, está
   en la versión 0.0.0 y su tarball son 2,6 KB: no incluye `dist/`. El repo
   de GitHub tampoco trae bundle compilado.
2. **Como dependencia git no es reproducible.** pnpm normaliza la URL a la
   forma `git@github.com:` en el lockfile, así que la instalación exige
   credenciales SSH y falla en CI.
3. **Hay que parchearla igualmente.** Usa imports no relativos estilo
   webpack 2016 y carga su fuente con un loader inline (`url?limit=30000!`),
   cosa que `scripts/build-exsurge.mjs` resuelve con esbuild.
4. **El original puede desaparecer.** Es un repo de un solo mantenedor sin
   actividad desde 2016, y aquí es una pieza central del producto.

MIT permite la redistribución conservando el aviso de copyright, que se
mantiene en `LICENSE` y en la cabecera del bundle generado.

## Cómo se compila

`pnpm run prebuild` ejecuta `scripts/build-exsurge.mjs`, que empaqueta
`src/` a `public/vendor/exsurge.js` (un global `exsurge`, con la fuente
incrustada). El bundle es un artefacto generado y no se versiona.

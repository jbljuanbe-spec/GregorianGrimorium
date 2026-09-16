#!/usr/bin/env node
// Empaqueta Exsurge (MIT, Fr. Matthew Spencer OSJ) para el navegador.
//
// Exsurge dibuja la notación cuadrada a partir del gabc, así que la partitura
// se genera en el cliente desde el código fuente del canto: no hay imágenes
// escaneadas y no se reproduce la maquetación de ninguna edición ajena.
//
// Su código es de 2016 y usa imports no relativos ('Exsurge.Gabc'), que
// esperaban `resolve.modules` de webpack. En vez de configurar el bundler de
// Next para eso, se empaqueta aquí a un global con esbuild.

import { build } from "esbuild";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, "vendor/exsurge/src");
const outfile = join(root, "public/vendor/exsurge.js");

const MODULES = [
  "Exsurge.Core",
  "Exsurge.Text",
  "Exsurge.Glyphs",
  "Exsurge.Drawing",
  "Exsurge.Chant",
  "Exsurge.Chant.Markings",
  "Exsurge.Chant.Signs",
  "Exsurge.Chant.Neumes",
  "Exsurge.Chant.ChantLine",
  "Exsurge.Gabc",
];

// Se entra por Drawing y Gabc, no por index.js: ese registra un custom element
// con `document.registerElement`, API retirada de los navegadores.
const entry = join(root, ".exsurge-entry.mjs");
mkdirSync(dirname(entry), { recursive: true });
mkdirSync(dirname(outfile), { recursive: true });
writeFileSync(
  entry,
  [
    "export { ChantContext, Annotation } from 'Exsurge.Drawing';",
    "export { ChantScore } from 'Exsurge.Chant';",
    "export { Gabc } from 'Exsurge.Gabc';",
  ].join("\n"),
);

// Exsurge carga su fuente de caracteres con un loader inline de webpack 1
// (`url?limit=30000!...`). Se resuelve incrustándola como data URL, que es lo
// que hacía aquel loader: son 17 KB y así el bundle no depende de un archivo
// suelto que pueda faltar.
const webpackUrlLoader = {
  name: "webpack-url-loader",
  setup(builder) {
    builder.onResolve({ filter: /^url\?/ }, (args) => ({
      path: resolve(dirname(args.importer), args.path.split("!").pop()),
      namespace: "inline-font",
    }));
    builder.onLoad({ filter: /.*/, namespace: "inline-font" }, (args) => {
      const base64 = readFileSync(args.path).toString("base64");
      return {
        contents: `module.exports = ${JSON.stringify(`data:font/opentype;base64,${base64}`)};`,
        loader: "js",
      };
    });
  },
};

await build({
  entryPoints: [entry],
  plugins: [webpackUrlLoader],
  outfile,
  bundle: true,
  format: "iife",
  globalName: "exsurge",
  minify: true,
  target: ["es2018"],
  alias: Object.fromEntries(MODULES.map((name) => [name, join(source, `${name}.js`)])),
  banner: {
    js: "/* Exsurge — MIT, Copyright (c) 2008-2016 Fr. Matthew Spencer, OSJ — https://github.com/frmatthew/exsurge */",
  },
  legalComments: "none",
});

rmSync(entry, { force: true });
console.log(`✓ public/vendor/exsurge.js`);

#!/usr/bin/env node
// Publica un JSON por canto en public/chants/<id>.json.
//
// Lo necesita el repertorio: esa página compone varias partituras en el
// cliente y tiene que pedir la notación pieza a pieza, en vez de cargar el
// corpus entero. De paso queda una API pública: los datos son CC0, así que
// cualquiera puede consumirla.

import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const corpusDir = join(root, "data/chants");
const outputDir = join(root, "public/chants");

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

const files = readdirSync(corpusDir).filter((file) => file.endsWith(".json"));
let bytes = 0;

for (const file of files) {
  const chant = JSON.parse(readFileSync(join(corpusDir, file), "utf8"));
  // Se publica el registro completo: es dominio público y la trazabilidad
  // (procedencia, licencia, volcado) es parte de lo que se ofrece.
  const body = JSON.stringify(chant);
  writeFileSync(join(outputDir, `${chant.id}.json`), body);
  bytes += body.length;
}

console.log(`✓ public/chants/ — ${files.length} cantos, ${(bytes / 1024 / 1024).toFixed(1)} MB`);

#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import { detectCorruption } from "./lib/record.mjs";
import { splitPerformanceMarks } from "../lib/gabc.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const schemaPath = join(root, "data/schema/chant.schema.json");
const chantsDir = join(root, "data/chants");

const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

const files = readdirSync(chantsDir).filter((f) => f.endsWith(".json"));
let errors = 0;
const byStatus = {};
const seenIds = new Set();

for (const file of files) {
  const path = join(chantsDir, file);
  const record = JSON.parse(readFileSync(path, "utf8"));
  const valid = validate(record);

  if (!valid) {
    errors++;
    console.error(`✗ ${file}`);
    for (const err of validate.errors) {
      console.error(`  ${err.instancePath || "/"} ${err.message}`);
    }
    continue;
  }

  if (record.id !== file.replace(/\.json$/, "")) {
    errors++;
    console.error(`✗ ${file}: id "${record.id}" no coincide con el nombre de archivo`);
    continue;
  }

  if (seenIds.has(record.id)) {
    errors++;
    console.error(`✗ ${file}: id duplicado "${record.id}"`);
    continue;
  }
  seenIds.add(record.id);

  // El esquema no puede ver la calidad del texto, solo su forma. Estas son
  // las comprobaciones que impiden publicar un registro con basura heredada
  // de la fuente o con marcas de ejecución colándose como texto cantado.
  const corruption = detectCorruption(record.text_latin);
  if (corruption) {
    errors++;
    console.error(`✗ ${file}: ${corruption}`);
    continue;
  }

  const marks = splitPerformanceMarks(record.text_latin);
  if (marks.text !== record.text_latin) {
    errors++;
    console.error(
      `✗ ${file}: el texto aún contiene marcas de ejecución ` +
        `(${marks.repeat ? `repetición "${marks.repeat}"` : "fórmula salmódica"})`,
    );
    continue;
  }

  if (!/^\s*\((?:[cf]b?[1-4]|cb?[1-4])\)/.test(record.gabc.replace(/^[\s\S]*?^%%\s*$/m, "").trim())) {
    // Sin clave al principio, Exsurge dibuja con una por defecto y la pieza
    // puede sonar en otro ámbito del que le corresponde.
    console.warn(`· ${file}: el gabc no empieza por una clave explícita`);
  }

  byStatus[record.review_status] = (byStatus[record.review_status] ?? 0) + 1;
}

const summary = Object.entries(byStatus)
  .map(([status, count]) => `${count} ${status}`)
  .join(", ");
console.log(`${files.length} registros (${summary}), ${errors} error(es)`);
process.exit(errors > 0 ? 1 : 0);

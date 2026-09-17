#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import { detectCorruption } from "./lib/record.mjs";
import { splitPerformanceMarks } from "../lib/gabc.mjs";
import { auditCorpus, CHECKS } from "../lib/review.mjs";

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
const records = [];

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

  byStatus[record.review_status] = (byStatus[record.review_status] ?? 0) + 1;
  records.push(record);
}

const summary = Object.entries(byStatus)
  .map(([status, count]) => `${count} ${status}`)
  .join(", ");
console.log(`${files.length} registros (${summary}), ${errors} error(es)`);

// La auditoría de revisión no bloquea: un reparo no es un registro inválido,
// es trabajo pendiente. Se informa para que el estado del corpus se vea en
// cada compilación y no haya que ir a buscarlo.
if (errors === 0) {
  const audits = auditCorpus(records);
  const grades = {};
  const failures = {};
  for (const audit of audits) {
    grades[audit.grade] = (grades[audit.grade] ?? 0) + 1;
    for (const check of audit.failed) failures[check.id] = (failures[check.id] ?? 0) + 1;
  }

  console.log("");
  console.log("Revisión:");
  for (const grade of ["verificado", "comprobado", "con-reparos"]) {
    const count = grades[grade] ?? 0;
    console.log(`  ${String(count).padStart(5)}  ${grade}`);
  }
  if (Object.keys(failures).length > 0) {
    console.log("");
    console.log("Reparos por comprobación:");
    for (const [id, count] of Object.entries(failures).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(count).padStart(5)}  ${id} — ${CHECKS[id]}`);
    }
    console.log("");
    console.log("  Cola ordenada por gravedad en /revision.");
  }
}

process.exit(errors > 0 ? 1 : 0);

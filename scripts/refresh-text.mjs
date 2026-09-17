#!/usr/bin/env node
/**
 * Regenera `text_latin` y `performance_notes` de cada ficha a partir de su
 * propio `gabc`, que es la fuente de verdad.
 *
 * Existe porque la extracción de texto tenía un defecto: quitaba las
 * etiquetas de `<alt>` pero dejaba dentro lo que llevaban, y `<alt>` son
 * rúbricas de sobre el pentagrama —«Hic genuflectitur», «Cantor», «Omnes»—.
 * Se pegaban dentro de la palabra: «AdCantor te, Dómine, * leOmnesvávi».
 *
 * Es determinista y se puede volver a pasar cuando la extracción mejore:
 * no inventa nada, solo vuelve a derivar lo derivado. Con --dry-run enseña
 * lo que cambiaría sin tocar nada.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractRubrics, extractText, splitPerformanceMarks, stripHeaders } from "../lib/gabc.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const chantsDir = join(root, "data/chants");
const dryRun = process.argv.includes("--dry-run");

let changed = 0;
let rubrics = 0;
const samples = [];

for (const file of readdirSync(chantsDir).filter((name) => name.endsWith(".json"))) {
  const path = join(chantsDir, file);
  const record = JSON.parse(readFileSync(path, "utf8"));

  const body = stripHeaders(record.gabc);
  const marks = splitPerformanceMarks(extractText(body));
  const notes = extractRubrics(body);

  const before = record.text_latin;
  const beforeNotes = record.performance_notes ?? [];

  const textChanged = marks.text !== before;
  const notesChanged = JSON.stringify(notes) !== JSON.stringify(beforeNotes);
  if (!textChanged && !notesChanged) continue;

  changed += 1;
  if (notes.length > 0) rubrics += 1;
  if (samples.length < 10 && textChanged) {
    samples.push({ id: record.id, before, after: marks.text, notes });
  }

  if (!dryRun) {
    record.text_latin = marks.text;
    // Solo se escribe la clave si hay algo que guardar: una lista vacía en
    // 3.040 fichas es ruido en el repositorio.
    if (notes.length > 0) record.performance_notes = notes;
    else delete record.performance_notes;
    writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`);
  }
}

for (const sample of samples) {
  console.log(`· ${sample.id}`);
  console.log(`    antes: ${sample.before.slice(0, 100)}`);
  console.log(`    ahora: ${sample.after.slice(0, 100)}`);
  if (sample.notes.length > 0) console.log(`    rúbrica: ${sample.notes.join(" · ")}`);
}

console.log("");
console.log(
  `${changed} ficha(s) ${dryRun ? "cambiarían" : "actualizadas"}, ` +
    `${rubrics} con rúbricas sobre el pentagrama rescatadas`,
);

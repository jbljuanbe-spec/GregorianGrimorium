#!/usr/bin/env node
// Importa archivos .gabc a registros de data/chants/.
//
// Uso:
//   node scripts/import-gabc.mjs --in <dir> --origin <gregobase|public-domain-scan|licensed> \
//        --edition "<edición>" [--out data/chants] [--dry-run] [--force]
//
// La procedencia es obligatoria y explícita: ningún registro entra al corpus
// sin declarar de dónde viene (ver docs/SOURCES.md).

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseGabc } from "./lib/gabc.mjs";
import { toChantRecord } from "./lib/normalize.mjs";

const VALID_ORIGINS = ["gregobase", "public-domain-scan", "licensed"];

export function importGabcFiles({ inputDir, outputDir, origin, edition, dryRun = false, force = false }) {
  if (!VALID_ORIGINS.includes(origin)) {
    throw new Error(`--origin debe ser uno de: ${VALID_ORIGINS.join(", ")}`);
  }
  if (!dryRun && !existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const files = readdirSync(inputDir).filter((file) => file.endsWith(".gabc"));
  const imported = [];
  const skipped = [];
  const failed = [];

  for (const file of files) {
    try {
      const parsed = parseGabc(readFileSync(join(inputDir, file), "utf8"));
      const record = toChantRecord(parsed, { origin, edition });
      const target = join(outputDir, `${record.id}.json`);

      // Nunca sobreescribir revisión humana: un registro `verified` solo se
      // reemplaza con --force explícito.
      if (existsSync(target) && !force) {
        const current = JSON.parse(readFileSync(target, "utf8"));
        if (current.review_status === "verified") {
          skipped.push({ file, id: record.id, reason: "ya verificado" });
          continue;
        }
      }

      if (!dryRun) writeFileSync(target, `${JSON.stringify(record, null, 2)}\n`);
      imported.push(record);
    } catch (error) {
      failed.push({ file, reason: error.message });
    }
  }

  return { imported, skipped, failed };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (key === "dry-run" || key === "force") {
      args[key] = true;
    } else {
      args[key] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const root = dirname(dirname(fileURLToPath(import.meta.url)));

  if (!args.in || !args.origin || !args.edition) {
    console.error("Faltan argumentos. Uso:");
    console.error('  node scripts/import-gabc.mjs --in <dir> --origin <origen> --edition "<edición>"');
    process.exit(2);
  }

  const result = importGabcFiles({
    inputDir: args.in,
    outputDir: args.out ?? join(root, "data/chants"),
    origin: args.origin,
    edition: args.edition,
    dryRun: Boolean(args["dry-run"]),
    force: Boolean(args.force),
  });

  for (const record of result.imported) console.log(`✓ ${record.id} (${record.genre}, modo ${record.mode ?? "?"})`);
  for (const skip of result.skipped) console.log(`· ${skip.file}: omitido (${skip.reason})`);
  for (const fail of result.failed) console.error(`✗ ${fail.file}: ${fail.reason}`);

  console.log(
    `\n${result.imported.length} importados, ${result.skipped.length} omitidos, ${result.failed.length} con error` +
      (args["dry-run"] ? " (dry-run, no se escribió nada)" : ""),
  );
  process.exit(result.failed.length > 0 ? 1 : 0);
}

#!/usr/bin/env node
// Importa un volcado de GregoBase (CC0-1.0) a data/chants/.
//
// Uso:
//   node scripts/import-gregobase.mjs --dump <archivo.sql> \
//        [--genres in,gr,al,tr,of,co] [--out data/chants] [--dry-run] [--force]
//
// El volcado se obtiene de https://github.com/bacor/gregobasecorpus
// (gregobase_dumps/). No se versiona en este repo: son 6,8 MB de origen
// externo, y lo que importa versionar es el resultado revisable.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { toRecords } from "./lib/gregobase.mjs";

export function importDump(dumpPath, { outputDir, genres = null, dryRun = false, force = false }) {
  const dump = readFileSync(dumpPath, "utf8");
  const snapshot = basename(dumpPath, ".sql");
  const { records, failed } = toRecords(dump, { genres, snapshot });

  if (!dryRun && !existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const verified = new Set(
    existsSync(outputDir)
      ? readdirSync(outputDir)
          .filter((file) => file.endsWith(".json"))
          .filter((file) => {
            const current = JSON.parse(readFileSync(join(outputDir, file), "utf8"));
            return current.review_status === "verified";
          })
          .map((file) => file.replace(/\.json$/, ""))
      : [],
  );

  const written = [];
  const skipped = [];

  for (const record of records) {
    if (verified.has(record.id) && !force) {
      skipped.push(record.id);
      continue;
    }
    if (!dryRun) {
      writeFileSync(join(outputDir, `${record.id}.json`), `${JSON.stringify(record, null, 2)}\n`);
    }
    written.push(record);
  }

  return { written, skipped, failed, snapshot };
}

// Borra los registros de una importación previa que ya no estén en el lote,
// preservando siempre lo verificado a mano.
function pruneStale(outputDir, keep) {
  const removed = [];
  for (const file of readdirSync(outputDir).filter((name) => name.endsWith(".json"))) {
    const id = file.replace(/\.json$/, "");
    if (keep.has(id)) continue;
    const current = JSON.parse(readFileSync(join(outputDir, file), "utf8"));
    if (current.review_status === "verified") continue;
    unlinkSync(join(outputDir, file));
    removed.push(id);
  }
  return removed;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    if (key === "dry-run" || key === "force" || key === "prune") {
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

  if (!args.dump) {
    console.error("Falta --dump <archivo.sql>. Descárgalo de github.com/bacor/gregobasecorpus");
    process.exit(2);
  }

  const outputDir = args.out ?? join(root, "data/chants");
  const genres = args.genres ? args.genres.split(",").map((code) => code.trim()) : null;

  const result = importDump(args.dump, {
    outputDir,
    genres,
    dryRun: Boolean(args["dry-run"]),
    force: Boolean(args.force),
  });

  const byGenre = {};
  for (const record of result.written) byGenre[record.genre] = (byGenre[record.genre] ?? 0) + 1;

  console.log(`volcado: ${result.snapshot}`);
  for (const [genre, count] of Object.entries(byGenre).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(5)}  ${genre}`);
  }

  if (args.prune && !args["dry-run"]) {
    const removed = pruneStale(outputDir, new Set(result.written.map((record) => record.id)));
    if (removed.length) console.log(`  purgados ${removed.length} registros obsoletos`);
  }

  console.log(
    `\n${result.written.length} escritos, ${result.skipped.length} omitidos por estar verificados, ` +
      `${result.failed.length} descartados` +
      (args["dry-run"] ? " (dry-run, no se escribió nada)" : ""),
  );
  for (const fail of result.failed.slice(0, 10)) {
    console.error(`  ✗ ${fail.id} «${fail.incipit ?? ""}»: ${fail.reason}`);
  }
  if (result.failed.length > 10) console.error(`  ... y ${result.failed.length - 10} más`);
}

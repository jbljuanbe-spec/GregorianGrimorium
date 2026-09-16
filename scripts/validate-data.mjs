#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const schemaPath = join(root, "data/schema/chant.schema.json");
const chantsDir = join(root, "data/chants");

const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

const files = readdirSync(chantsDir).filter((f) => f.endsWith(".json"));
let errors = 0;
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

  console.log(`✓ ${file} (${record.review_status})`);
}

console.log(`\n${files.length} registros, ${errors} error(es)`);
process.exit(errors > 0 ? 1 : 0);

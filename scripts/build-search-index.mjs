#!/usr/bin/env node
// Genera public/search-index.json a partir de los datos maestros.
// El buscador es cliente puro: descarga este índice y filtra en memoria.

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { displayTitle } from "../lib/chant-title.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const corpusDir = join(root, "data/chants");
const outfile = join(root, "public/search-index.json");

function fold(value) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/æ/gi, "ae")
    .replace(/œ/gi, "oe")
    .toLowerCase();
}

const index = readdirSync(corpusDir)
  .filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(readFileSync(join(corpusDir, file), "utf8")))
  .sort((a, b) => a.incipit.localeCompare(b.incipit, "la"))
  .map((chant) => ({
    id: chant.id,
    incipit: chant.incipit,
    title: displayTitle(chant),
    genre: chant.genre,
    mode: chant.mode,
    version: chant.version,
    sources: [...new Set(chant.bibliography.map((reference) => reference.title))],
    verified: chant.review_status === "verified",
    haystack: fold(`${chant.incipit} ${chant.text_latin}`),
  }));

mkdirSync(dirname(outfile), { recursive: true });
writeFileSync(outfile, JSON.stringify(index));

const kb = (JSON.stringify(index).length / 1024).toFixed(0);
console.log(`✓ public/search-index.json — ${index.length} cantos, ${kb} KB`);

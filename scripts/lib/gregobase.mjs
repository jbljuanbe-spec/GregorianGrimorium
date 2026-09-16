// Convierte un volcado de GregoBase en registros de canto.
//
// GregoBase se publica como CC0-1.0 (ver docs/SOURCES.md), y guarda el gabc
// como cadena JSON dentro del SQL, normalmente solo el cuerpo de la notación:
// los metadatos viven en columnas, no en cabeceras gabc.

import { readTable } from "./sqldump.mjs";
import { buildRecord } from "./record.mjs";

const LICENSE = "CC0-1.0";

export function decodeGabc(raw) {
  if (!raw) return null;
  if (!raw.startsWith('"')) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function readCorpus(dump) {
  const chants = readTable(dump, "gregobase_chants");
  const sources = new Map(readTable(dump, "gregobase_sources").map((row) => [row.id, row]));
  const tags = new Map(readTable(dump, "gregobase_tags").map((row) => [row.id, row.tag]));

  const occurrencesByChant = groupBy(readTable(dump, "gregobase_chant_tags"), "chant_id");
  const sourcesByChant = groupBy(readTable(dump, "gregobase_chant_sources"), "chant_id");

  return { chants, sources, tags, occurrencesByChant, sourcesByChant };
}

export function toRecords(dump, { genres = null, snapshot = null } = {}) {
  const corpus = readCorpus(dump);
  const records = [];
  const failed = [];

  for (const chant of corpus.chants) {
    const code = chant["office-part"];
    if (genres && !genres.includes(code)) continue;

    try {
      const gabc = decodeGabc(chant.gabc);
      if (!gabc) throw new Error("gabc ilegible o ausente");

      records.push(
        buildRecord({
          incipit: chant.incipit,
          gabc,
          genreCode: code,
          mode: chant.mode,
          modeVariant: chant.mode_var,
          version: chant.version,
          cantusId: chant.cantusid,
          transcriber: chant.transcriber,
          commentary: chant.commentary,
          occurrences: toOccurrences(corpus, chant.id),
          bibliography: toBibliography(corpus, chant.id),
          provenance: { origin: "gregobase", license: LICENSE, externalId: chant.id, snapshot },
          idSuffix: chant.id,
        }),
      );
    } catch (error) {
      failed.push({ id: chant.id, incipit: chant.incipit, reason: error.message });
    }
  }

  return { records, failed };
}

function toOccurrences({ occurrencesByChant, tags }, chantId) {
  return (occurrencesByChant.get(chantId) ?? [])
    .map((link) => tags.get(link.tag_id)?.trim())
    .filter(Boolean)
    .map((celebration) => ({ calendar: "Roman", celebration }));
}

function toBibliography({ sourcesByChant, sources }, chantId) {
  return (sourcesByChant.get(chantId) ?? [])
    .map((link) => {
      const source = sources.get(link.source);
      if (!source) return null;
      const year = Number(source.year);
      return {
        title: source.title,
        editor: source.editor || null,
        year: Number.isInteger(year) && year > 0 ? year : null,
        page: link.page || null,
      };
    })
    .filter(Boolean);
}

function groupBy(rows, key) {
  const grouped = new Map();
  for (const row of rows) {
    const bucket = grouped.get(row[key]);
    if (bucket) bucket.push(row);
    else grouped.set(row[key], [row]);
  }
  return grouped;
}

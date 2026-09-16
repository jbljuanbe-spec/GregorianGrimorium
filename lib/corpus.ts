// Carga del corpus en tiempo de compilación. Los datos maestros son los
// archivos de data/chants/, versionados en git: no hay base de datos.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export type ReviewStatus = "draft" | "needs_review" | "verified";

export interface Reference {
  title: string;
  editor: string | null;
  year: number | null;
  page: string | null;
}

export interface Chant {
  id: string;
  incipit: string;
  title: string;
  cantus_id: string | null;
  genre: string;
  genre_code: string | null;
  mode: string | null;
  mode_variant: string | null;
  version: string | null;
  text_latin: string;
  gabc: string;
  transcriber: string | null;
  commentary: string | null;
  liturgical_occurrences: { calendar: string; celebration: string }[];
  bibliography: Reference[];
  provenance: {
    origin: string;
    license: string;
    external_id: string | null;
    snapshot: string | null;
  };
  review_status: ReviewStatus;
}

const CORPUS_DIR = join(process.cwd(), "data/chants");

let cache: Chant[] | null = null;

export function loadCorpus(): Chant[] {
  if (cache) return cache;
  cache = readdirSync(CORPUS_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(join(CORPUS_DIR, file), "utf8")) as Chant)
    .sort((a, b) => a.incipit.localeCompare(b.incipit, "la"));
  return cache;
}

export function getChant(id: string): Chant | undefined {
  return loadCorpus().find((chant) => chant.id === id);
}

/** Clave de pieza: mismo íncipit y mismo género, aunque cambie la edición. */
function pieceKey(chant: Chant): string {
  return `${foldAccents(chant.incipit)}|${chant.genre}`;
}

/**
 * Otras transcripciones de la misma pieza. GregoBase recoge varias versiones
 * del mismo canto —Solesmes, Vaticana, dominicana…— y sin cruzarlas la
 * búsqueda devuelve entradas casi idénticas sin forma de distinguirlas.
 */
export function getOtherVersions(chant: Chant): Chant[] {
  const key = pieceKey(chant);
  return loadCorpus().filter((other) => other.id !== chant.id && pieceKey(other) === key);
}

// Búsqueda y agrupación insensibles a acentos: la ortografía varía entre
// ediciones ("caeli" y "cæli", "advenit" y "advénit").
export function foldAccents(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/æ/gi, "ae")
    .replace(/œ/gi, "oe")
    .toLowerCase();
}

export interface IndexEntry {
  id: string;
  incipit: string;
  genre: string;
  mode: string | null;
  version: string | null;
  sources: string[];
  verified: boolean;
  /** Íncipit y texto latino, sin acentos, para buscar. */
  haystack: string;
}

export function corpusFacets(chants: Chant[]) {
  const genres = new Map<string, number>();
  const modes = new Map<string, number>();
  const sources = new Map<string, number>();

  for (const chant of chants) {
    genres.set(chant.genre, (genres.get(chant.genre) ?? 0) + 1);
    if (chant.mode) modes.set(chant.mode, (modes.get(chant.mode) ?? 0) + 1);
    for (const title of new Set(chant.bibliography.map((reference) => reference.title))) {
      sources.set(title, (sources.get(title) ?? 0) + 1);
    }
  }

  const byCount = (a: [string, number], b: [string, number]) => b[1] - a[1];
  const MODE_ORDER = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

  return {
    genres: [...genres.entries()].sort(byCount),
    modes: [...modes.entries()].sort((a, b) => MODE_ORDER.indexOf(a[0]) - MODE_ORDER.indexOf(b[0])),
    sources: [...sources.entries()].sort(byCount),
  };
}

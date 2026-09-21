// Carga del corpus en tiempo de compilación. Los datos maestros son los
// archivos de data/chants/, versionados en git: no hay base de datos.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { auditCorpus, type Audit, type Grade, type Signature } from "@/lib/review.mjs";

export type { Audit, Check, CheckId, Grade, Signature } from "@/lib/review.mjs";
import { displayTitle } from "@/lib/chant-title.mjs";
export { displayTitle };

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
  /** "ij" = bis, "iij" = ter. Rúbrica de ejecución, no texto cantado. */
  repeat_indication: string | null;
  /** Termina con la fórmula salmódica, escrita "E u o u a e". */
  psalm_tone_ending: boolean;
  /**
   * Rúbricas que el libro imprime sobre el pentagrama y que no se cantan:
   * "Hic genuflectitur", "Cantor", "Omnes". Salen de las etiquetas <alt>.
   */
  performance_notes?: string[];
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

// ---------- Auditoría de revisión ----------
//
// Se calcula una vez por compilación para las 3.051 fichas y se guarda en un
// índice por id: cada ficha la necesita, y la cola de /revision las necesita
// todas a la vez.

let audits: Map<string, Audit> | null = null;

function loadSignatures(): Record<string, Signature> {
  try {
    const raw = JSON.parse(readFileSync(join(process.cwd(), "data/reviewed.json"), "utf8"));
    return (raw.signatures ?? {}) as Record<string, Signature>;
  } catch {
    // Sin el archivo, nadie ha firmado nada: es el estado inicial, no un error.
    return {};
  }
}

function loadAudits(): Map<string, Audit> {
  if (audits) return audits;
  audits = new Map(
    auditCorpus(loadCorpus(), loadSignatures()).map(({ id, ...audit }) => [id, audit]),
  );
  return audits;
}

/** La auditoría de una ficha: qué se ha comprobado y con qué resultado. */
export function auditOf(chant: Chant): Audit {
  return loadAudits().get(chant.id)!;
}

/**
 * Las fichas con algún reparo, ordenadas por gravedad: primero las que
 * fallan más comprobaciones, y dentro de eso las que fallan lo más serio.
 * Es la cola de trabajo de quien vaya a revisar a mano.
 */
export function reviewQueue(): { chant: Chant; audit: Audit }[] {
  const severity: Record<string, number> = {
    notacion: 0,
    incipit: 1,
    texto: 2,
    derivado: 3,
    modo: 4,
    finalis: 5,
    ediciones: 6,
    procedencia: 7,
  };

  return loadCorpus()
    .map((chant) => ({ chant, audit: auditOf(chant) }))
    .filter(({ audit }) => audit.failed.length > 0)
    .sort((a, b) => {
      if (b.audit.failed.length !== a.audit.failed.length) {
        return b.audit.failed.length - a.audit.failed.length;
      }
      const worst = (entry: { audit: Audit }) =>
        Math.min(...entry.audit.failed.map((check) => severity[check.id] ?? 9));
      return worst(a) - worst(b);
    });
}

/** Recuento por grado, para poder decir en qué estado está el corpus. */
export function reviewTally(): Record<Grade, number> {
  const tally = { verificado: 0, comprobado: 0, "con-reparos": 0 } as Record<Grade, number>;
  for (const audit of loadAudits().values()) tally[audit.grade]++;
  return tally;
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
  /** El íncipit ya presentable: ver lib/chant-title.mjs. */
  title: string;
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

/** Slug para las rutas de taxonomía: "Responsorium breve" -> "responsorium-breve". */
export function toSlug(value: string): string {
  return foldAccents(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface Taxon {
  slug: string;
  label: string;
  count: number;
}

function taxonomy(values: (chant: Chant) => string[]): Taxon[] {
  const counts = new Map<string, { label: string; count: number }>();

  for (const chant of loadCorpus()) {
    for (const label of new Set(values(chant))) {
      const slug = toSlug(label);
      const entry = counts.get(slug);
      if (entry) entry.count += 1;
      else counts.set(slug, { label, count: 1 });
    }
  }

  return [...counts.entries()]
    .map(([slug, entry]) => ({ slug, ...entry }))
    .sort((a, b) => b.count - a.count);
}

export function genres(): Taxon[] {
  return taxonomy((chant) => [chant.genre]);
}

export function editions(): Taxon[] {
  return taxonomy((chant) => chant.bibliography.map((reference) => reference.title));
}

/** Los modos se ordenan I–VIII, que es su orden propio, no por frecuencia. */
export function modes(): Taxon[] {
  const order = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  return taxonomy((chant) => (chant.mode ? [chant.mode] : [])).sort(
    (a, b) => order.indexOf(a.label) - order.indexOf(b.label),
  );
}

export function chantsByGenre(slug: string): Chant[] {
  return loadCorpus().filter((chant) => toSlug(chant.genre) === slug);
}

export function chantsByMode(slug: string): Chant[] {
  return loadCorpus().filter((chant) => chant.mode && toSlug(chant.mode) === slug);
}

export function chantsByEdition(slug: string): Chant[] {
  return loadCorpus().filter((chant) =>
    chant.bibliography.some((reference) => toSlug(reference.title) === slug),
  );
}

/**
 * Pieza anterior y siguiente dentro del mismo género, por orden alfabético.
 * Sin esto no hay forma de recorrer el corpus: solo se puede volver a buscar.
 */
export function neighbours(chant: Chant): { previous: Chant | null; next: Chant | null } {
  const siblings = chantsByGenre(toSlug(chant.genre));
  const position = siblings.findIndex((other) => other.id === chant.id);
  return {
    previous: position > 0 ? siblings[position - 1] : null,
    next: position >= 0 && position < siblings.length - 1 ? siblings[position + 1] : null,
  };
}

/**
 * Agrupa transcripciones de la misma pieza en una fila por pieza, igual que
 * hace el buscador en el cliente.
 */
export function toListItems(chants: Chant[]) {
  const pieces = new Map<string, { chant: Chant; versions: number }>();

  for (const chant of chants) {
    const key = pieceKey(chant);
    const piece = pieces.get(key);
    if (piece) piece.versions += 1;
    else pieces.set(key, { chant, versions: 1 });
  }

  return [...pieces.values()].map(({ chant, versions }) => ({
    id: chant.id,
    incipit: chant.incipit,
    title: displayTitle(chant),
    mode: chant.mode,
    versions,
    detail: [chant.genre, chant.version, chant.bibliography[0]?.title]
      .filter(Boolean)
      .join(" · "),
  }));
}

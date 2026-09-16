// Constructor único de registros de canto. Todos los importadores pasan por
// aquí, para que el esquema se honre en un solo sitio.

import { extractText, stripHeaders } from "../../lib/gabc.mjs";

// Vocabulario de géneros, tomado de los códigos de dos letras de GregoBase.
const GENRE_BY_CODE = new Map([
  ["in", "Introitus"],
  ["gr", "Graduale"],
  ["al", "Alleluia"],
  ["tr", "Tractus"],
  ["of", "Offertorium"],
  ["co", "Communio"],
  ["an", "Antiphona"],
  ["re", "Responsorium"],
  ["rb", "Responsorium breve"],
  ["hy", "Hymnus"],
  ["se", "Sequentia"],
  ["ky", "Kyriale"],
  ["ps", "Psalmus"],
  ["ca", "Canticum"],
  ["or", "Oratio"],
  ["pr", "Preces"],
  ["im", "Improperia"],
  ["va", "Varia"],
]);

// Nombres largos, para los gabc que traen `office-part` escrito.
const GENRE_BY_NAME = new Map([
  ["introitus", "Introitus"],
  ["introit", "Introitus"],
  ["graduale", "Graduale"],
  ["gradual", "Graduale"],
  ["alleluia", "Alleluia"],
  ["tractus", "Tractus"],
  ["tract", "Tractus"],
  ["offertorium", "Offertorium"],
  ["offertory", "Offertorium"],
  ["communio", "Communio"],
  ["communion", "Communio"],
  ["antiphona", "Antiphona"],
  ["antiphon", "Antiphona"],
  ["responsorium", "Responsorium"],
  ["responsory", "Responsorium"],
  ["responsorium breve", "Responsorium breve"],
  ["hymnus", "Hymnus"],
  ["hymn", "Hymnus"],
  ["sequentia", "Sequentia"],
  ["sequence", "Sequentia"],
  ["kyriale", "Kyriale"],
  ["kyrie", "Kyriale"],
  ["gloria", "Kyriale"],
  ["sanctus", "Kyriale"],
  ["agnus dei", "Kyriale"],
  ["psalmus", "Psalmus"],
  ["canticum", "Canticum"],
  ["oratio", "Oratio"],
  ["preces", "Preces"],
  ["improperia", "Improperia"],
  ["varia", "Varia"],
]);

const ROMAN_MODES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export function buildRecord({
  incipit,
  gabc,
  genreCode = null,
  genreName = null,
  mode = null,
  modeVariant = null,
  version = null,
  cantusId = null,
  transcriber = null,
  commentary = null,
  occurrences = [],
  bibliography = [],
  provenance,
  idSuffix = null,
}) {
  const name = incipit?.trim();
  if (!name) throw new Error("Falta el íncipit");
  if (!provenance?.origin || !provenance?.license) {
    throw new Error("La procedencia (origin) y su licencia son obligatorias");
  }

  const notation = gabc?.trim();
  if (!notation) throw new Error(`Sin notación gabc: ${name}`);

  const textLatin = extractText(stripHeaders(notation));
  if (!textLatin) throw new Error(`Sin texto legible: ${name}`);

  const slug = slugify(name);
  if (!slug) throw new Error(`El íncipit no produce un identificador válido: ${name}`);

  return {
    id: idSuffix ? `${slug}-${idSuffix}` : slug,
    incipit: name,
    title: name,
    cantus_id: cantusId || null,
    genre: toGenre({ code: genreCode, name: genreName }),
    genre_code: genreCode || null,
    mode: toMode(mode),
    mode_variant: modeVariant || null,
    version: version || null,
    text_latin: textLatin,
    gabc: notation,
    transcriber: transcriber || null,
    commentary: commentary || null,
    liturgical_occurrences: occurrences,
    bibliography,
    provenance: {
      origin: provenance.origin,
      license: provenance.license,
      external_id: provenance.externalId ?? null,
      snapshot: provenance.snapshot ?? null,
    },
    // Una importación nunca da nada por verificado: `verified` solo lo asigna
    // una persona tras revisar texto, modo y partitura.
    review_status: "needs_review",
  };
}

export function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/æ/gi, "ae")
    .replace(/œ/gi, "oe")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function toGenre({ code, name }) {
  if (code && GENRE_BY_CODE.has(code.trim().toLowerCase())) {
    return GENRE_BY_CODE.get(code.trim().toLowerCase());
  }
  if (name) {
    const key = name.trim().toLowerCase().replace(/\.$/, "");
    if (GENRE_BY_NAME.has(key)) return GENRE_BY_NAME.get(key);
  }
  return "Other";
}

export function toMode(mode) {
  if (mode === null || mode === undefined) return null;
  const value = String(mode).trim();
  const arabic = value.match(/^([1-8])\b/);
  if (arabic) return ROMAN_MODES[Number(arabic[1]) - 1];
  const roman = value.match(/^(I{1,3}|IV|VI{0,3}|V)\b/i);
  if (roman) {
    const upper = roman[1].toUpperCase();
    return ROMAN_MODES.includes(upper) ? upper : null;
  }
  return null;
}

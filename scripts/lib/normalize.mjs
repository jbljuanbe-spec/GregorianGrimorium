// Convierte un gabc ya parseado en un registro conforme a
// data/schema/chant.schema.json.

import { extractText } from "./gabc.mjs";

const GENRE_BY_OFFICE_PART = new Map([
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
  ["kyrie", "Kyrie"],
  ["gloria", "Gloria"],
  ["credo", "Credo"],
  ["sanctus", "Sanctus"],
  ["agnus dei", "Agnus Dei"],
  ["agnus", "Agnus Dei"],
  ["antiphona", "Antiphona"],
  ["antiphon", "Antiphona"],
  ["responsorium", "Responsorium"],
  ["responsory", "Responsorium"],
  ["hymnus", "Hymnus"],
  ["hymn", "Hymnus"],
  ["sequentia", "Sequentia"],
  ["sequence", "Sequentia"],
]);

const ROMAN_MODES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export function toChantRecord({ headers, body }, { origin, edition, externalId = null }) {
  if (!origin || !edition) {
    throw new Error("La procedencia (origin) y la edición (edition) son obligatorias");
  }

  const name = headers.name?.trim();
  if (!name) throw new Error("gabc sin cabecera `name`");

  const textLatin = extractText(body);
  if (!textLatin) throw new Error(`gabc sin texto legible: ${name}`);

  return {
    id: slugify(name),
    incipit: name,
    title: name,
    genre: toGenre(headers["office-part"]),
    mode: toMode(headers.mode),
    text_latin: textLatin,
    liturgical_occurrences: toOccurrences(headers.occasion),
    related_chant_ids: [],
    source: {
      origin,
      edition: headers.book?.trim() || edition,
      external_id: externalId,
      printed_pages: extractPages(headers.book),
    },
    score_images: [],
    // La importación nunca marca un registro como verificado: el estado
    // `verified` solo lo asigna una persona tras revisar texto, modo e imagen.
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

function toGenre(officePart) {
  if (!officePart) return "Other";
  const key = officePart.trim().toLowerCase().replace(/\.$/, "");
  return GENRE_BY_OFFICE_PART.get(key) ?? "Other";
}

function toMode(mode) {
  if (!mode) return null;
  const value = mode.trim();
  const arabic = value.match(/^([1-8])\b/);
  if (arabic) return ROMAN_MODES[Number(arabic[1]) - 1];
  const roman = value.match(/^(I{1,3}|IV|VI{0,3}|V)\b/i);
  if (roman) {
    const upper = roman[1].toUpperCase();
    return ROMAN_MODES.includes(upper) ? upper : null;
  }
  return null;
}

function toOccurrences(occasion) {
  const celebration = occasion?.trim();
  return celebration ? [{ calendar: "Roman", celebration }] : [];
}

// "Graduale Romanum, 1961, p. 47" -> [47]; "pp. 47-49" -> [47, 48, 49]
function extractPages(book) {
  if (!book) return [];
  const match = book.match(/pp?\.?\s*(\d+)(?:\s*[-–]\s*(\d+))?/i);
  if (!match) return [];
  const from = Number(match[1]);
  const to = match[2] ? Number(match[2]) : from;
  if (to < from) return [from];
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

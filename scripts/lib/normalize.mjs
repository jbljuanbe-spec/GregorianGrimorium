// Convierte un archivo .gabc suelto (con cabeceras) en un registro de canto.
// Es la vía para transcripciones propias o corpus distribuidos como archivos;
// el volcado de GregoBase entra por lib/gregobase.mjs.

import { buildRecord } from "./record.mjs";

export function toChantRecord({ headers, body }, { origin, license, externalId = null, snapshot = null }) {
  if (!headers.name?.trim()) throw new Error("gabc sin cabecera `name`");

  return buildRecord({
    incipit: headers.name,
    gabc: body,
    genreName: headers["office-part"],
    mode: headers.mode,
    modeVariant: headers["mode-modifier"],
    transcriber: headers.transcriber,
    commentary: headers.commentary,
    occurrences: toOccurrences(headers.occasion),
    bibliography: toBibliography(headers.book),
    provenance: { origin, license, externalId, snapshot },
  });
}

function toOccurrences(occasion) {
  const celebration = occasion?.trim();
  return celebration ? [{ calendar: "Roman", celebration }] : [];
}

// "Graduale Romanum, 1961, p. 47" -> título, año y página
function toBibliography(book) {
  const reference = book?.trim();
  if (!reference) return [];

  const page = reference.match(/pp?\.?\s*([\d\s,–-]+\d)/i);
  const year = reference.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  // Se quitan página y año del título para que coincida con el vocabulario
  // de GregoBase (sources.title = "Graduale Romanum", year aparte).
  const title = reference
    .replace(/,?\s*pp?\.?\s*[\d\s,–-]+\d\s*$/i, "")
    .replace(/,?\s*\b(1[0-9]{3}|20[0-9]{2})\b\s*$/, "")
    .replace(/,\s*$/, "")
    .trim();

  return [
    {
      title: title || reference,
      editor: null,
      year: year ? Number(year[1]) : null,
      page: page ? page[1].trim() : null,
    },
  ];
}

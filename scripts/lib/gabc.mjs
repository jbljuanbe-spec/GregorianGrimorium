// Parser del formato gabc (entrada del motor Gregorio), el formato de
// intercambio de los corpus abiertos de canto gregoriano.
//
// Un archivo gabc son cabeceras `clave: valor;`, un separador `%%`, y el
// cuerpo, donde el texto y la notación se alternan: `PU(eh)er(h) na(hi)tus(h)`.
// El texto queda fuera de los paréntesis; los neumas, dentro.

const SPECIAL_GLYPHS = new Map([
  ["ae", "æ"],
  ["AE", "Æ"],
  ["'ae", "ǽ"],
  ["oe", "œ"],
  ["OE", "Œ"],
  ["R/", "℟"],
  ["V/", "℣"],
  ["+", "†"],
]);

export function parseGabc(source) {
  const lines = source.split(/\r?\n/);
  const separator = lines.findIndex((line) => line.trim() === "%%");
  if (separator === -1) {
    throw new Error("gabc inválido: falta el separador %% entre cabeceras y cuerpo");
  }
  return {
    headers: parseHeaders(lines.slice(0, separator)),
    body: lines.slice(separator + 1).join("\n"),
  };
}

function parseHeaders(lines) {
  const headers = {};
  let buffer = "";
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("%")) continue;
    buffer = buffer ? `${buffer} ${line}` : line;
    // Un valor puede ocupar varias líneas; termina en punto y coma.
    if (!buffer.endsWith(";")) continue;
    const entry = buffer.slice(0, -1);
    const colon = entry.indexOf(":");
    if (colon > 0) {
      headers[entry.slice(0, colon).trim().toLowerCase()] = entry.slice(colon + 1).trim();
    }
    buffer = "";
  }
  return headers;
}

export function extractText(body) {
  let text = "";
  let depth = 0;
  for (const char of body) {
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth = Math.max(0, depth - 1);
    } else if (depth === 0) {
      text += char;
    }
  }
  return normalizeLyrics(text);
}

function normalizeLyrics(raw) {
  const text = raw
    .replace(/<v>.*?<\/v>/gs, "")
    .replace(/<sp>(.*?)<\/sp>/g, (_, glyph) => SPECIAL_GLYPHS.get(glyph) ?? glyph)
    .replace(/<[^>]*>/g, "")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return text.split(" ").map(fixDropCap).join(" ");
}

// Las mayúsculas iniciales del gabc son tipográficas (capitular): `PUer` se
// imprime con "P" capitular y "U" en versalita, pero el texto es "Puer".
function fixDropCap(word) {
  return /^[A-Z]{2,}[a-z]/.test(word) ? word[0] + word.slice(1).toLowerCase() : word;
}

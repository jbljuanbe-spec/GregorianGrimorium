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

// El gabc puede venir como archivo completo (cabeceras, `%%`, cuerpo) o como
// cuerpo suelto, que es lo habitual en el volcado de GregoBase.
export function stripHeaders(gabc) {
  const separator = gabc.search(/^%%\s*$/m);
  if (separator === -1) return gabc;
  return gabc.slice(gabc.indexOf("\n", separator) + 1);
}

// Prepara el gabc para Exsurge, que es de 2016 y no interpreta nada de
// marcado: lo que no se traduzca aquí se dibuja literalmente sobre el
// pentagrama ("<i>Ps.</i>" en medio de la partitura).
export function gabcForRendering(gabc) {
  return stripHeaders(gabc)
    .replace(/<sp>(.*?)<\/sp>/g, (_, glyph) => SPECIAL_GLYPHS.get(glyph) ?? glyph)
    // Verbatim TeX y texto alternativo sobre el pentagrama: sin equivalente.
    .replace(/<v>.*?<\/v>/gs, "")
    .replace(/<alt>.*?<\/alt>/gs, "")
    // Cursiva, negrita, versalita, color, subrayado: se conserva el texto.
    .replace(/<\/?(i|b|sc|c|ul|eu|e|u)>/g, "")
    .trim();
}

// Marcas de ejecución que los libros imprimen junto a la notación pero que
// NO son texto que se cante. Si se dejan en el texto latino, aparecen como si
// fueran sílabas: "Allelúia. * ij. ℣. A summo caelo…".
const REPEAT_MARK = /(?:^|\s)(i{1,3}j)\.?(?=\s|$)/i;
// "E u o u a e" son las vocales de "saEcUlOrUm AmEn": marcan la fórmula
// salmódica final, no una palabra.
const PSALM_ENDING = /(?:^|\s)E\s*u\s*o\s*u\s*a\s*e\.?(?=\s|$)/i;

/**
 * Separa el texto cantado de las marcas de ejecución.
 *
 * @returns {{ text: string, repeat: string|null, psalmToneEnding: boolean }}
 */
export function splitPerformanceMarks(text) {
  const repeat = text.match(REPEAT_MARK);
  const ending = PSALM_ENDING.test(text);

  const clean = text
    .replace(new RegExp(REPEAT_MARK, "gi"), " ")
    .replace(new RegExp(PSALM_ENDING, "gi"), " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,:;])/g, "$1")
    .trim();

  return {
    text: clean,
    repeat: repeat ? repeat[1].toLowerCase() : null,
    psalmToneEnding: ending,
  };
}

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

/**
 * Etiquetas cuyo contenido NO se canta.
 *
 * `<alt>` es texto que va sobre el pentagrama, y lo que lleva son rúbricas
 * escénicas —«Hic genuflectitur», «Chorus genua flectit», o quién canta
 * («Cantor», «Omnes»)—. `<c>` rodea referencias como «Ps.» o «℣. 1».
 * Quitando solo la etiqueta y dejando dentro lo que hay, esas rúbricas se
 * pegaban dentro de la palabra: «AdCantor te, Dómine, * leOmnesvávi». Son la
 * misma clase que «ij.» y hay que separarlas igual.
 *
 * Las demás —`<i>`, `<b>`, `<sc>`, `<ul>`— son tipográficas y envuelven
 * sílabas que sí se cantan, así que de esas se conserva el contenido.
 */
const NOT_SUNG = /<(alt|v|c)>[\s\S]*?<\/\1>/g;

/** Las rúbricas de sobre el pentagrama, para no perderlas al limpiar. */
export function extractRubrics(body) {
  return [...body.matchAll(/<alt>([\s\S]*?)<\/alt>/g)]
    .map((match) => match[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function normalizeLyrics(raw) {
  const text = raw
    // Sin espacio: la anotación va pegada dentro de la palabra
    // (`le<alt>Omnes</alt>vávi`), así que meter un espacio la partiría.
    .replace(NOT_SUNG, "")
    .replace(/<sp>(.*?)<\/sp>/g, (_, glyph) => SPECIAL_GLYPHS.get(glyph) ?? glyph)
    .replace(/<[^>]*>/g, "")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,:;])/g, "$1")
    .trim();

  return text
    .split(" ")
    .map((word, index) => fixDropCap(word, index === 0))
    .join(" ");
}

// Las mayúsculas iniciales del gabc son tipográficas, no textuales: la
// capitular va seguida de versalitas. Se escribe `PUer` para imprimir "Puer",
// y GregoBase suele poner la primera palabra entera en mayúsculas ("ECCE
// advénit" es "Ecce advénit"). Una palabra en mayúsculas a mitad de texto se
// respeta: ahí las mayúsculas sí son del texto.
function fixDropCap(word, isFirstWord) {
  if (/^[A-Z]{2,}[a-z]/.test(word)) return titleCase(word);
  if (isFirstWord && /^[A-ZÁÉÍÓÚÝÆŒ]{2,}[^a-z]*$/.test(word)) return titleCase(word);
  // Capitular de más de una letra seguida de versalitas: "AlLELUIA" es
  // "Alleluia" con la "Al" en capitular. Sin esto quedaba "AlLELÚIA", con
  // una mayúscula a mitad de palabra que no existe en latín.
  if (/^[A-ZÁÉÍÓÚÝÆŒ][a-záéíóúýæœ]+[A-ZÁÉÍÓÚÝÆŒ]{2,}[.,:;!?*]*$/.test(word)) return titleCase(word);
  return word;
}

function titleCase(word) {
  return word[0] + word.slice(1).toLowerCase();
}

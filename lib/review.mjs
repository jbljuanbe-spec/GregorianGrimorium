import { extractText, gabcForRendering, splitPerformanceMarks, stripHeaders } from "./gabc.mjs";
import { readPerformance } from "./performance.mjs";

/**
 * Auditoría automática de una ficha.
 *
 * El problema que resuelve: decir «sin revisar» de las 3.051 fichas mezcla
 * dos cosas que no son la misma. Una es que ninguna persona la haya firmado.
 * La otra es que no sepamos nada de ella, y eso es falso: hay propiedades
 * del canto gregoriano que se comprueban solas, y algunas son exigentes.
 *
 * Así que se publica la evidencia en vez de una etiqueta genérica. Cada
 * comprobación dice qué mira, y la ficha las enseña una por una. La firma
 * humana sigue siendo otro eje, y sigue valiendo lo que vale.
 */

// Grados de la escala en semitonos sobre el do.
const DO = 0, RE = 2, MI = 4, FA = 5, SOL = 7, LA = 9, TI = 11;

export const DEGREE_NAMES = {
  0: "do", 1: "re♭", 2: "re", 3: "mi♭", 4: "mi", 5: "fa",
  6: "fa♯", 7: "sol", 8: "sol♯", 9: "la", 10: "la♭", 11: "ti",
};

/**
 * Finalis de cada modo y sus afinales.
 *
 * La finalis es la nota en que cierra el modo. Las afinales son los grados
 * en que la misma pieza puede cerrar cuando está transpuesta, que es
 * práctica corriente en la Vaticana para que quepa en el tetragrama sin
 * alteraciones: la doctrina medieval de la *affinitas* empareja re con la,
 * mi con ti y fa con do, una quinta más arriba. La tercera afinal de los
 * modos III y IV (la) recoge la transposición por cuarta, también atestiguada
 * en el corpus. Sin admitir esto, 306 fichas correctas darían un falso
 * positivo. Cifras y razonamiento en docs/REVISION.md.
 */
export const MODES = {
  I: { finalis: RE, affinals: [LA] },
  II: { finalis: RE, affinals: [LA] },
  III: { finalis: MI, affinals: [TI, LA] },
  IV: { finalis: MI, affinals: [TI, LA] },
  V: { finalis: FA, affinals: [DO] },
  VI: { finalis: FA, affinals: [DO] },
  VII: { finalis: SOL, affinals: [RE] },
  VIII: { finalis: SOL, affinals: [RE] },
};

/** Lo que cada comprobación mira, para poder explicarlo en la ficha. */
export const CHECKS = {
  notacion: "La notación se lee y produce una melodía",
  texto: "El texto cantado está limpio de rúbricas y de basura de la fuente",
  derivado: "El texto guardado es el que produce su propia notación",
  modo: "El modo viene declarado y es uno de los ocho",
  finalis: "La pieza cierra en la finalis de su modo o en su afinal",
  ediciones: "El modo coincide con las demás transcripciones de la pieza",
  procedencia: "Consta de dónde sale, con qué licencia y en qué edición impresa",
};

/**
 * Lo que puede aparecer en un texto latino de este repertorio.
 *
 * Incluye a propósito los signos que los graduales impresos usan y que no
 * son basura aunque no sean letras: ℣ y ℟ marcan versículo y respuesta
 * (1.783 apariciones en el corpus), † la señal de la cruz, * la división
 * del íncipit, y ǽ la ligadura acentuada de «cǽli». Darlos por corruptos
 * marcaba 1.475 fichas buenas.
 */
const LATIN = new RegExp(
  "^[" +
    "a-z" +
    "áéíóúýàèìòùâêîôûäëïöüãñç" +
    "æœǽ" +
    "0-9" +
    "℣℟†+*" +
    "'’‘\"«»" +
    ",.:;!?()\\[\\]/\\-\\s–—" +
    "]+$",
  "i",
);

/**
 * Caracteres que nunca son texto: controles, marcas invisibles de dirección
 * y espacios de ancho cero. Se colaron tres en la importación y no se ven
 * mirando la ficha, así que solo salen con una comprobación como esta.
 */
const INVISIBLE = new RegExp(
  "[\\u0000-\\u0008\\u000b-\\u001f\\u007f\\u200b-\\u200f\\u2028\\u2029\\ufeff]",
);

function degreeOf(semitones) {
  return ((semitones % 12) + 12) % 12;
}

function pass(id, detail) {
  return { id, state: "pass", detail };
}

function fail(id, detail) {
  return { id, state: "fail", detail };
}

function skip(id, detail) {
  return { id, state: "skip", detail };
}

/**
 * Lee la notación una sola vez por ficha. Dos comprobaciones la necesitan y
 * son 3.051 fichas en cada compilación, así que parsearla dos veces se nota.
 */
function readOnce(chant) {
  try {
    const performance = readPerformance(gabcForRendering(chant.gabc));
    return { performance, notes: performance.events.filter((event) => event.kind === "note") };
  } catch (cause) {
    return { error: cause };
  }
}

/** La notación se lee y da notas: sin esto no hay pieza que enseñar. */
function checkNotation(chant, read) {
  const body = stripHeaders(chant.gabc);

  const opens = (body.match(/\(/g) ?? []).length;
  const closes = (body.match(/\)/g) ?? []).length;
  if (opens !== closes) {
    return fail("notacion", `paréntesis descompensados: ${opens} abren y ${closes} cierran`);
  }

  if (!/^\s*\([cf]b?[1-4]\)/.test(body.trim())) {
    // Sin clave explícita, Exsurge dibuja con una por defecto y la pieza
    // puede sonar en un ámbito que no es el suyo.
    return fail("notacion", "no empieza por una clave explícita");
  }

  if (read.error) return fail("notacion", `la notación no se puede leer: ${read.error.message}`);
  if (read.notes.length === 0) return fail("notacion", "no contiene ni una nota");

  return pass("notacion", `${read.notes.length} notas en clave ${read.performance.clef}`);
}

/** El texto cantado, limpio: ni rúbricas de ejecución ni restos de la fuente. */
function checkText(chant) {
  const text = chant.text_latin ?? "";
  if (text.trim().length === 0) return fail("texto", "no hay texto latino");

  const marks = splitPerformanceMarks(text);
  if (marks.text !== text) {
    const what = marks.repeat ? `repetición «${marks.repeat}»` : "fórmula salmódica";
    return fail("texto", `arrastra marcas de ejecución como texto cantado (${what})`);
  }

  if (/[{}\\]|"\s*:\s*"/.test(text)) {
    return fail("texto", "contiene restos estructurales de la fuente (JSON o escapes)");
  }

  const invisible = text.match(INVISIBLE);
  if (invisible) {
    const code = invisible[0].codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
    return fail("texto", `contiene un carácter invisible (U+${code}) heredado de la importación`);
  }

  if (!LATIN.test(text)) {
    const strange = [...new Set([...text].filter((char) => !LATIN.test(char)))];
    return fail("texto", `caracteres que no son de texto latino: ${strange.join(" ")}`);
  }

  // Una minúscula seguida de mayúscula dentro de la palabra no existe en la
  // ortografía latina, y es la huella que deja una rúbrica pegada donde no
  // toca: «AdCantor te», «leOmnesvávi», «AlLELÚIA». Fue lo que delató que la
  // extracción conservaba el contenido de las etiquetas <alt>.
  const spliced = text.match(/[a-záéíóúýæœ][A-ZÁÉÍÓÚÝÆŒ]/);
  if (spliced) {
    return fail("texto", `mayúscula a mitad de palabra («…${spliced[0]}…»): algo se ha pegado al texto`);
  }

  return pass("texto", `${text.trim().split(/\s+/).length} palabras`);
}

/**
 * El texto guardado tiene que ser el que produce su propia notación.
 *
 * Es la comprobación que cubre toda la clase de fallos de extracción de una
 * vez: el gabc es la fuente de verdad y `text_latin` se deriva de él, así
 * que cualquier divergencia es un texto rancio o tocado a mano. Si la
 * extracción mejora, `pnpm run refresh:text` vuelve a derivarlo y esto queda
 * en verde solo.
 */
function checkDerived(chant) {
  let derived;
  try {
    derived = splitPerformanceMarks(extractText(stripHeaders(chant.gabc))).text;
  } catch {
    return skip("derivado", "no se puede comprobar: la notación no se lee");
  }

  if (derived === chant.text_latin) return pass("derivado", "coincide con su notación");

  // Una ficha firmada a mano puede llevar una corrección deliberada del
  // texto; se dice cuál es la diferencia en vez de darla por buena o mala.
  return fail(
    "derivado",
    `el texto guardado no es el que produce su notación (la notación da «${derived.slice(0, 60)}…»)`,
  );
}

/** El modo declarado existe y es uno de los ocho. */
function checkMode(chant) {
  if (!chant.mode) return fail("modo", "la fuente no declara modo");
  if (!(chant.mode in MODES)) return fail("modo", `modo declarado fuera de I–VIII: «${chant.mode}»`);
  return pass("modo", `modo ${chant.mode}`);
}

/**
 * La comprobación con más fondo musical: el modo declarado tiene que
 * sostenerse en la melodía. Si una pieza dice ser del modo II y no cierra
 * ni en re ni en la, una de las dos cosas está mal.
 */
function checkFinalis(chant, read) {
  const expected = chant.mode && MODES[chant.mode];
  if (!expected) return skip("finalis", "no se puede comprobar sin un modo válido");
  if (read.error) return skip("finalis", "no se puede comprobar: la notación no se lee");
  if (read.notes.length === 0) return skip("finalis", "no se puede comprobar: no hay notas");

  const degree = degreeOf(read.notes.at(-1).semitones);
  const name = DEGREE_NAMES[degree] ?? String(degree);

  if (degree === expected.finalis) {
    return pass("finalis", `cierra en ${name}, la finalis del modo ${chant.mode}`);
  }
  if (expected.affinals.includes(degree)) {
    return pass("finalis", `cierra en ${name}, afinal del modo ${chant.mode} (transpuesta)`);
  }
  return fail(
    "finalis",
    `cierra en ${name}; el modo ${chant.mode} pide ${DEGREE_NAMES[expected.finalis]}` +
      ` o su afinal ${expected.affinals.map((a) => DEGREE_NAMES[a]).join(" / ")}`,
  );
}

/**
 * Cruce entre transcripciones de la misma pieza. Dos ediciones impresas no
 * pueden tener razón las dos sobre el modo, así que un desacuerdo señala
 * un error en una de ellas.
 *
 * Con una cautela que conviene no perder de vista: casi todas las versiones
 * del corpus las transcribió la misma persona a partir de libros distintos,
 * así que esto corrobora que las ediciones concuerdan, no que dos personas
 * independientes lo leyeran igual. Vale menos que una firma humana.
 */
function checkEditions(chant, siblings) {
  if (!siblings || siblings.length === 0) {
    return skip("ediciones", "es la única transcripción de esta pieza en el corpus");
  }
  if (!chant.mode) return skip("ediciones", "no se puede cruzar sin modo declarado");

  const others = new Set(siblings.map((s) => s.mode).filter(Boolean));
  if (others.size === 0) return skip("ediciones", "las otras versiones no declaran modo");

  if (others.has(chant.mode)) {
    return pass("ediciones", `otras ${siblings.length} transcripción(es) también dicen modo ${chant.mode}`);
  }
  return fail("ediciones", `aquí modo ${chant.mode}, pero otra transcripción dice ${[...others].join(", ")}`);
}

/** De dónde sale y con qué licencia: es lo que hace la ficha citable. */
function checkProvenance(chant) {
  const p = chant.provenance ?? {};
  const missing = ["origin", "license", "external_id", "snapshot"].filter((key) => !p[key]);
  if (missing.length > 0) return fail("procedencia", `falta ${missing.join(", ")}`);
  if (!chant.bibliography || chant.bibliography.length === 0) {
    return fail("procedencia", "no consta ninguna edición impresa");
  }
  const pages = chant.bibliography.filter((reference) => reference.page).length;
  return pass("procedencia", `${chant.bibliography.length} edición(es), ${pages} con página`);
}

/**
 * Audita una ficha. `siblings` son las otras transcripciones de la misma
 * pieza; `signedOff` es la firma humana si existe.
 */
export function auditChant(chant, { siblings = [], signedOff = null } = {}) {
  const read = readOnce(chant);
  const checks = [
    checkNotation(chant, read),
    checkText(chant),
    checkDerived(chant),
    checkMode(chant),
    checkFinalis(chant, read),
    checkEditions(chant, siblings),
    checkProvenance(chant),
  ];

  const failed = checks.filter((check) => check.state === "fail");
  const applicable = checks.filter((check) => check.state !== "skip");

  // Tres estados, y cada uno dice la verdad de lo que es. «Comprobado» no
  // es «revisado»: es que pasa las comprobaciones que una máquina sabe
  // hacer, y la ficha enseña cuáles.
  const grade = signedOff ? "verificado" : failed.length === 0 ? "comprobado" : "con-reparos";

  return {
    grade,
    checks,
    failed,
    passed: applicable.length - failed.length,
    applicable: applicable.length,
    signedOff,
  };
}

export const GRADES = {
  verificado: {
    label: "Verificado a mano",
    blurb: "Una persona ha cotejado esta ficha con su edición impresa y la firma.",
  },
  comprobado: {
    label: "Comprobado automáticamente",
    blurb:
      "Pasa todas las comprobaciones automáticas, incluida la que exige que la melodía " +
      "cierre donde su modo manda. Nadie la ha cotejado a mano con la edición impresa.",
  },
  "con-reparos": {
    label: "Con reparos",
    blurb: "Alguna comprobación automática no cuadra. Debajo está cuál y por qué.",
  },
};

/** Clave de pieza, igual que la del buscador: mismo íncipit y mismo género. */
export function pieceKey(chant) {
  const folded = chant.incipit
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/æ/gi, "ae")
    .replace(/œ/gi, "oe")
    .toLowerCase();
  return `${folded}|${chant.genre}`;
}

/** Audita el corpus entero, cruzando cada pieza con sus otras versiones. */
export function auditCorpus(chants, signatures = {}) {
  const byPiece = new Map();
  for (const chant of chants) {
    const key = pieceKey(chant);
    if (!byPiece.has(key)) byPiece.set(key, []);
    byPiece.get(key).push(chant);
  }

  return chants.map((chant) => ({
    id: chant.id,
    ...auditChant(chant, {
      siblings: byPiece.get(pieceKey(chant)).filter((other) => other.id !== chant.id),
      signedOff: signatures[chant.id] ?? null,
    }),
  }));
}

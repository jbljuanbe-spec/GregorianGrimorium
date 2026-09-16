// Modelo de ejecución: convierte la notación gabc en una secuencia de sonidos
// con su altura y su duración, para poder escuchar la pieza y ensayar con ella.
//
// Por qué no basta con leer las alturas que da Exsurge:
//
//  1. Exsurge aplica el bemol de la CLAVE (`cb3`) pero no las alteraciones
//     sueltas de mitad de pieza (`ix` = si bemol), así que el audio sonaba
//     medio tono alto en esos pasajes.
//  2. Exsurge no expone duraciones. Todas las notas iguales convierte el
//     audio en algo inservible para ensayar: el canto gregoriano es de ritmo
//     libre, pero no plano —la mora (`.`) alarga, el episema (`_`) sostiene,
//     y las barras son respiraciones de distinta longitud.
//
// El método es el equalista de Solesmes: la nota es la unidad, y lo que la
// modifica está escrito en el gabc.

/** Semitonos desde el do para cada grado de la escala diatónica. */
const STEPS = [0, 2, 4, 5, 7, 9, 11];

/** Duración en pulsos. La nota suelta es la unidad. */
export const BEATS = {
  note: 1,
  /** Punctum mora (`.`): la nota vale el doble. */
  mora: 2,
  /** Episema horizontal (`_`): sostiene la nota sin llegar a doblarla. */
  episema: 1.5,
  /**
   * Punctum inclinatum, el rombo: en gabc se escribe con mayúscula. Va en
   * grupos descendentes y se canta más ligero que el punctum cuadrado.
   */
  inclinatum: 0.75,
  /**
   * Licuescente (`~`), la nota pequeña: cierra la sílaba sobre una consonante
   * y se emite abreviada.
   */
  liquescent: 0.75,
  /**
   * Quilisma (`w`), la nota dentada: se pasa por ella con ligereza, y la
   * anterior se alarga, que es la regla de Solesmes.
   */
  quilisma: 0.75,
  /** Lo que se alarga la nota que precede a un quilisma. */
  beforeQuilisma: 1.5,
};

/** Silencios de las barras, de la coma de respiración a la doble barra. */
export const RESTS = { virgula: 0.5, quarter: 1, half: 1.5, full: 2.5, double: 3.5 };

// Posición en el tetragrama de una letra gabc, con el mismo origen que usa
// Exsurge: `gabcHeightToExsurgeHeight` en Exsurge.Gabc.js.
function staffPosition(letter) {
  return letter.toLowerCase().charCodeAt(0) - "a".charCodeAt(0) - 6;
}

// Claves, con la posición y la octava que les asigna Exsurge.
const CLEFS = {
  c1: { fa: false, position: -3 },
  c2: { fa: false, position: -1 },
  c3: { fa: false, position: 1 },
  c4: { fa: false, position: 3 },
  f1: { fa: true, position: -3 },
  f2: { fa: true, position: -1 },
  f3: { fa: true, position: 1 },
  f4: { fa: true, position: 3 },
};

const NOTE_LETTER = /[a-mA-M]/;
const ACCIDENTAL = { x: -1, y: 0, "#": 1 };

/**
 * Lee la notación y devuelve los sonidos en orden.
 *
 * @param body gabc sin cabeceras.
 * @returns {{ events: Array<{kind:"note",semitones:number,beats:number}|{kind:"rest",beats:number}>, clef: string }}
 */
export function readPerformance(body) {
  const events = [];
  let clef = { fa: false, position: 1, flat: false };
  let clefName = "c3";
  let accidentals = new Map();
  let depth = 0;
  let position = 0;

  while (position < body.length) {
    const char = body[position];

    if (char === "(") {
      depth += 1;
      position += 1;
      continue;
    }
    if (char === ")") {
      depth = Math.max(0, depth - 1);
      position += 1;
      continue;
    }
    if (depth === 0) {
      // Fuera de los paréntesis va el texto. Un espacio separa palabras, y
      // con la palabra terminan las alteraciones, como en el uso de Solesmes.
      if (/\s/.test(char)) accidentals = new Map();
      position += 1;
      continue;
    }

    // Clave: `(c3)`, `(f3)`, o con bemol `(cb3)`.
    const clefMatch = body.slice(position).match(/^([cf])(b?)([1-4])/);
    if (clefMatch && CLEFS[`${clefMatch[1]}${clefMatch[3]}`]) {
      const found = CLEFS[`${clefMatch[1]}${clefMatch[3]}`];
      clef = { ...found, flat: clefMatch[2] === "b" };
      clefName = `${clefMatch[1]}${clefMatch[2]}${clefMatch[3]}`;
      accidentals = new Map();
      position += clefMatch[0].length;
      continue;
    }

    if (NOTE_LETTER.test(char)) {
      const next = body[position + 1];

      // Una letra seguida de x, y o # no es una nota: declara la alteración
      // que rige hasta el fin de la palabra.
      if (next && next in ACCIDENTAL) {
        accidentals.set(degreeOf(staffPosition(char), clef), ACCIDENTAL[next]);
        position += 2;
        continue;
      }

      const { beats, length, quilisma } = readModifiers(body, position + 1, char);

      // La nota anterior a un quilisma se alarga (Solesmes): el quilisma no
      // es un adorno suelto, condiciona a su vecina.
      if (quilisma) {
        const previous = lastNote(events);
        if (previous && previous.beats === BEATS.note) previous.beats = BEATS.beforeQuilisma;
      }

      events.push({ kind: "note", semitones: semitonesOf(staffPosition(char), clef, accidentals), beats });
      position += 1 + length;
      continue;
    }

    if (char === "[") {
      const close = body.indexOf("]", position);
      position = close === -1 ? body.length : close + 1;
      continue;
    }

    const rest = readDivider(body, position);
    if (rest) {
      events.push({ kind: "rest", beats: rest.beats });
      position += rest.length;
      continue;
    }

    position += 1;
  }

  return { events, clef: clefName };
}

function lastNote(events) {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    if (events[i].kind === "note") return events[i];
  }
  return null;
}

/** Grado de la escala (0 = do) en que cae una posición del tetragrama. */
function degreeOf(notePosition, clef) {
  const offset = notePosition - clef.position + (clef.fa ? 3 : 0);
  return ((offset % 7) + 7) % 7;
}

function semitonesOf(notePosition, clef, accidentals) {
  const offset = notePosition - clef.position + (clef.fa ? 3 : 0);
  const degree = ((offset % 7) + 7) % 7;
  const octave = Math.floor(offset / 7);

  let semitones = octave * 12 + STEPS[degree];

  // El bemol de la clave afecta al si, que es la única alteración que la
  // notación gregoriana escribe en clave.
  if (clef.flat && STEPS[degree] === 11) semitones -= 1;

  if (accidentals.has(degree)) {
    const alteration = accidentals.get(degree);
    // El becuadro devuelve el grado a su altura natural; bemol y sostenido
    // lo mueven medio tono.
    semitones = octave * 12 + STEPS[degree] + alteration;
  }

  return semitones;
}

// Signos de forma y espaciado que acompañan a una nota sin cambiar su altura
// ni su duración: quilisma, virga, licuescencias, uniones, espaciados.
const SHAPE = /[nopqrstuvwzNOPQRSTUVWZ~<>!/\-=+0-9']/;

/**
 * Lee los signos que siguen a una nota y devuelve su duración.
 *
 * El orden importa: los alargamientos escritos (mora, episema) mandan sobre
 * las formas breves, porque son indicaciones explícitas de duración.
 */
function readModifiers(body, start, letter) {
  // El rombo se escribe con mayúscula y ya nace breve.
  let beats = letter === letter.toUpperCase() ? BEATS.inclinatum : BEATS.note;
  let lengthened = false;
  let quilisma = false;
  let length = 0;

  while (start + length < body.length) {
    const char = body[start + length];

    if (char === ".") {
      beats = BEATS.mora;
      lengthened = true;
      length += 1;
      continue;
    }
    if (char === "_") {
      beats = Math.max(beats, BEATS.episema);
      lengthened = true;
      length += 1;
      continue;
    }
    if (char === "~" && !lengthened) {
      beats = BEATS.liquescent;
      length += 1;
      continue;
    }
    if ((char === "w" || char === "W") && !lengthened) {
      beats = BEATS.quilisma;
      quilisma = true;
      length += 1;
      continue;
    }
    // Los corchetes llevan ajustes de posición con `;` y `:` dentro, que no
    // son respiraciones: se salta el bloque entero.
    if (char === "[") {
      const close = body.indexOf("]", start + length);
      length = (close === -1 ? body.length : close + 1) - start;
      continue;
    }
    if (SHAPE.test(char)) {
      length += 1;
      continue;
    }
    // Otra nota, una barra, un espacio o el fin del grupo: la nota termina.
    break;
  }

  return { beats, length, quilisma };
}

/** Barras y comas: las respiraciones del canto. */
function readDivider(body, position) {
  if (body.startsWith("::", position)) return { beats: RESTS.double, length: 2 };
  const char = body[position];
  if (char === ":") return { beats: RESTS.full, length: 1 };
  if (char === ";") return { beats: RESTS.half, length: 1 };
  if (char === ",") return { beats: RESTS.quarter, length: 1 };
  if (char === "`") return { beats: RESTS.virgula, length: 1 };
  return null;
}

/**
 * Sitúa cada sonido en el tiempo, en pulsos desde el principio. Es lo que
 * permite pausar y reanudar por la misma nota: basta saber en qué pulso se
 * paró para encontrar el evento que toca.
 */
export function buildTimeline(events) {
  let at = 0;
  const timeline = events.map((event) => {
    const entry = { ...event, at };
    at += event.beats;
    return entry;
  });

  return { timeline, totalBeats: at };
}

/** Evento que suena en un pulso dado; el último si ya ha terminado. */
export function indexAtBeat(timeline, beat) {
  for (let i = timeline.length - 1; i >= 0; i -= 1) {
    if (timeline[i].at <= beat) return i;
  }
  return 0;
}

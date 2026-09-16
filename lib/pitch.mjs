// Alturas absolutas de un canto.
//
// La notación gregoriana es relativa: la clave dice qué línea es el do, y las
// notas son grados de la escala, no frecuencias. El director elige en qué tono
// se canta. Por eso "transponer" aquí no es redibujar la partitura —el dibujo
// sería idéntico— sino decidir a qué nota real suena el do y ver dónde queda
// la tesitura.
//
// Exsurge entrega cada nota como Pitch{step, octave} con step en semitonos
// (Do=0, Re=2, Mi=4, Fa=5, Sol=7, La=9, Si=11), así que `octave*12 + step` es
// un intervalo en semitonos desde el do de esa octava.

// Se nombran con bemoles: es la grafía idiomática del repertorio gregoriano,
// donde la única alteración de la notación es el si bemol.
const NOTE_NAMES = ["Do", "Re♭", "Re", "Mi♭", "Mi", "Fa", "Sol♭", "Sol", "La♭", "La", "Si♭", "Si"];

/** Do central (C4) en numeración MIDI. Es el do de referencia por defecto. */
export const DEFAULT_DO = 60;

/** Rango de tonos ofrecidos para el do, de Fa2 a Fa4. */
export const DO_RANGE = { min: 41, max: 65 };

export function midiToName(midi) {
  const rounded = Math.round(midi);
  // La octava se numera a la española partiendo del do: Do3 es C3.
  const octave = Math.floor(rounded / 12) - 1;
  return `${NOTE_NAMES[((rounded % 12) + 12) % 12]}${octave}`;
}

export function midiToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

/**
 * Convierte las alturas relativas de un canto en alturas absolutas.
 *
 * @param semitonesFromDo Intervalos en semitonos desde el do de la clave, en
 *   orden de aparición.
 * @param doMidi Nota real a la que suena el do.
 */
export function absolutePitches(semitonesFromDo, doMidi) {
  if (!semitonesFromDo.length) return null;

  const midis = semitonesFromDo.map((semitones) => doMidi + semitones);
  const lowest = Math.min(...midis);
  const highest = Math.max(...midis);

  return {
    first: midis[0],
    lowest,
    highest,
    /** Amplitud en semitonos entre la nota más grave y la más aguda. */
    ambitus: highest - lowest,
  };
}

/**
 * Propone el do que deja la pieza centrada en una tesitura coral cómoda.
 * Se toma como centro Do4 (60), el punto medio habitual de un coro mixto.
 */
export function suggestDo(semitonesFromDo, center = DEFAULT_DO) {
  if (!semitonesFromDo.length) return DEFAULT_DO;

  const lowest = Math.min(...semitonesFromDo);
  const highest = Math.max(...semitonesFromDo);
  const middle = (lowest + highest) / 2;

  return clampDo(Math.round(center - middle));
}

export function clampDo(doMidi) {
  return Math.min(DO_RANGE.max, Math.max(DO_RANGE.min, doMidi));
}

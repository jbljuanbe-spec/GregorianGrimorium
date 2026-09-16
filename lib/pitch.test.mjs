import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_DO,
  absolutePitches,
  clampDo,
  midiToFrequency,
  midiToName,
  suggestDo,
} from "./pitch.mjs";

test("midiToName usa los nombres españoles de las notas", () => {
  assert.equal(midiToName(60), "Do4");
  assert.equal(midiToName(69), "La4");
  assert.equal(midiToName(58), "Si♭3");
  assert.equal(midiToName(41), "Fa2");
});

test("midiToName nombra las alteraciones con bemoles, como el repertorio", () => {
  // "La♭", no "Sol♯": en canto gregoriano la grafía habitual es el bemol.
  assert.equal(midiToName(56), "La♭3");
  assert.equal(midiToName(61), "Re♭4");
  assert.equal(midiToName(66), "Sol♭4");
});

test("midiToFrequency ancla en el La4 de 440 Hz", () => {
  assert.equal(midiToFrequency(69), 440);
  assert.ok(Math.abs(midiToFrequency(60) - 261.63) < 0.01);
  // Una octava arriba dobla la frecuencia.
  assert.ok(Math.abs(midiToFrequency(81) - 880) < 0.0001);
});

test("absolutePitches traslada los intervalos al tono elegido", () => {
  // Do-Re-Mi-Fa desde el do de la clave.
  const pitches = absolutePitches([0, 2, 4, 5], DEFAULT_DO);
  assert.deepEqual(pitches, { first: 60, lowest: 60, highest: 65, ambitus: 5 });
  assert.equal(midiToName(pitches.first), "Do4");
  assert.equal(midiToName(pitches.highest), "Fa4");
});

test("bajar el do baja toda la pieza sin alterar los intervalos", () => {
  const alto = absolutePitches([0, 2, 4, 5], 60);
  const bajo = absolutePitches([0, 2, 4, 5], 58);
  assert.equal(bajo.first, alto.first - 2);
  assert.equal(bajo.highest, alto.highest - 2);
  // Lo que no cambia es la amplitud: transponer no deforma la melodía.
  assert.equal(bajo.ambitus, alto.ambitus);
});

test("absolutePitches admite notas bajo el do de la clave", () => {
  // La y Si por debajo del do, algo habitual en modo I.
  const pitches = absolutePitches([-3, -1, 0, 4], DEFAULT_DO);
  assert.equal(pitches.lowest, 57);
  assert.equal(midiToName(pitches.lowest), "La3");
  assert.equal(pitches.ambitus, 7);
});

test("absolutePitches devuelve null si no hay notas", () => {
  assert.equal(absolutePitches([], DEFAULT_DO), null);
});

test("suggestDo centra la pieza en la tesitura de referencia", () => {
  // Pieza que va de -6 a +6 semitonos: ya está centrada en el do.
  assert.equal(suggestDo([-6, 0, 6]), DEFAULT_DO);
  // Pieza que solo sube: conviene bajar el do para no forzar agudos.
  assert.ok(suggestDo([0, 7, 12]) < DEFAULT_DO);
  // Pieza grave: conviene subirlo.
  assert.ok(suggestDo([-12, -7, 0]) > DEFAULT_DO);
});

test("suggestDo y clampDo no salen del rango cantable", () => {
  assert.equal(suggestDo([]), DEFAULT_DO);
  assert.equal(clampDo(200), 65);
  assert.equal(clampDo(0), 41);
  // Una pieza extrema no propone un do fuera de rango.
  const extreme = suggestDo([-60, -50]);
  assert.ok(extreme >= 41 && extreme <= 65);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { BEATS, RESTS, buildTimeline, indexAtBeat, readPerformance } from "./performance.mjs";

/** Alturas de las notas, en semitonos desde el do de la clave. */
function pitches(gabc) {
  return readPerformance(gabc)
    .events.filter((event) => event.kind === "note")
    .map((event) => event.semitones);
}

/** Secuencia compacta: nota=semitonos×pulsos, silencio=·pulsos. */
function sequence(gabc) {
  return readPerformance(gabc)
    .events.map((event) => (event.kind === "note" ? `${event.semitones}×${event.beats}` : `·${event.beats}`))
    .join(" ");
}

test("con clave de do en tercera, la línea de la clave es el do", () => {
  // Con `c3` el do cae en la letra h; de ahí hacia arriba y hacia abajo.
  assert.deepEqual(pitches("(c3) a(h)b(i)c(j)"), [0, 2, 4]);
  assert.deepEqual(pitches("(c3) a(g)b(f)c(e)"), [-1, -3, -5]);
});

test("cada clave mueve la escala entera", () => {
  // La misma letra suena distinta según dónde esté el do: con `c3` el do cae
  // en h; con `c2` h queda dos grados por encima (mi), con `c4` dos por
  // debajo (la). Estos valores están comprobados contra Exsurge sobre 200
  // cantos del corpus.
  assert.deepEqual(pitches("(c1) a(h)"), [7]);
  assert.deepEqual(pitches("(c2) a(h)"), [4]);
  assert.deepEqual(pitches("(c3) a(h)"), [0]);
  assert.deepEqual(pitches("(c4) a(h)"), [-3]);
  // La clave de fa pone el fa en su línea.
  assert.deepEqual(pitches("(f3) a(h)"), [5]);
  assert.deepEqual(pitches("(f4) a(h)"), [2]);
});

test("las mayúsculas son notas, no modificadores", () => {
  // En gabc la mayúscula es la forma inclinada de la misma altura.
  assert.deepEqual(pitches("(c3) a(hvGF)"), [0, -1, -3]);
});

test("el bemol de la clave baja el si", () => {
  // `cb3`: el si suena bemol sin necesidad de escribirlo en cada nota.
  assert.deepEqual(pitches("(cb3) a(g)b(h)"), [-2, 0]);
  assert.deepEqual(pitches("(c3) a(g)b(h)"), [-1, 0]);
});

test("una alteración suelta rige sobre su grado en el resto de la palabra", () => {
  // Esto es lo que el reproductor ignoraba: `gx` baja el grado de g.
  assert.deepEqual(pitches("(c3) o(gxfe/gvFE)"), [-3, -5, -2, -3, -5]);
  assert.deepEqual(pitches("(c3) o(gfe/gvFE)"), [-1, -3, -5, -1, -3, -5]);
});

test("el becuadro devuelve el grado a su altura natural", () => {
  assert.deepEqual(pitches("(c3) cá(gyhg)"), [0, -1]);
  assert.deepEqual(pitches("(c3) o(g#hg)"), [0, 0]);
});

test("la alteración caduca al acabar la palabra", () => {
  // En gabc las sílabas de una palabra van pegadas y las palabras se separan
  // por espacios. Dentro de la palabra la alteración sigue rigiendo aunque
  // cambie de sílaba...
  assert.deepEqual(pitches("(c3) o(gxg)tro(g)"), [-2, -2]);
  // ...y con la palabra siguiente caduca, según el uso de Solesmes.
  assert.deepEqual(pitches("(c3) o(gxg) tro(g)"), [-2, -1]);
});

test("la mora dobla la nota y el episema la sostiene", () => {
  assert.equal(sequence("(c3) a(h)"), `0×${BEATS.note}`);
  assert.equal(sequence("(c3) a(h.)"), `0×${BEATS.mora}`);
  assert.equal(sequence("(c3) a(h_)"), `0×${BEATS.episema}`);
  // El episema vertical marca el apoyo, no la duración.
  assert.equal(sequence("(c3) a(h')"), `0×${BEATS.note}`);
});

test("las barras son respiraciones de distinta longitud", () => {
  assert.equal(sequence("(c3) a(h) (,)"), `0×1 ·${RESTS.quarter}`);
  assert.equal(sequence("(c3) a(h) (;)"), `0×1 ·${RESTS.half}`);
  assert.equal(sequence("(c3) a(h) (:)"), `0×1 ·${RESTS.full}`);
  assert.equal(sequence("(c3) a(h) (::)"), `0×1 ·${RESTS.double}`);
  // La doble barra no se lee como dos barras simples.
  assert.equal(readPerformance("(c3) a(h) (::)").events.filter((e) => e.kind === "rest").length, 1);
});

test("los ajustes entre corchetes no suenan como respiraciones", () => {
  // `[ocb:1;6mm]` lleva `:` y `;` dentro y no es ninguna barra.
  assert.equal(sequence("(c3) mi(f[ocb:1;6mm])se(g)"), "-3×1 -1×1");
});

test("ligaduras y signos de forma no añaden notas", () => {
  // `!` une, `/` espacia, `~` y `v` son formas: solo las letras son notas.
  assert.deepEqual(pitches("(c3) o(h!i'j)"), [0, 2, 4]);
  assert.deepEqual(pitches("(c3) o(fh~)"), [-3, 0]);
  assert.deepEqual(pitches("(c3) o(ed/fef)"), [-5, -7, -3, -5, -3]);
});

test("un pasaje real se lee completo, con sus duraciones y respiraciones", () => {
  const gabc = "(c3) da(hvGF) me(gxfegvFE.) (,) Dó(ed/fef)mi(f)";
  const { events } = readPerformance(gabc);

  assert.equal(events.filter((event) => event.kind === "note").length, 14);
  assert.equal(events.filter((event) => event.kind === "rest").length, 1);
  // La última nota antes de la respiración lleva mora.
  const beforeRest = events[events.findIndex((event) => event.kind === "rest") - 1];
  assert.equal(beforeRest.beats, BEATS.mora);
});

test("sin notación no inventa sonidos", () => {
  assert.deepEqual(readPerformance("").events, []);
  assert.deepEqual(readPerformance("(c3)").events, []);
});

test("el rombo se canta más ligero que el punctum", () => {
  // El punctum inclinatum (rombo) se escribe con mayúscula en gabc.
  assert.equal(sequence("(c3) a(hvGF)"), `0×${BEATS.note} -1×${BEATS.inclinatum} -3×${BEATS.inclinatum}`);
});

test("la nota pequeña licuescente se abrevia", () => {
  assert.equal(sequence("(c3) a(h)b(f~)"), `0×${BEATS.note} -3×${BEATS.liquescent}`);
});

test("el quilisma es ligero y alarga la nota anterior", () => {
  // Regla de Solesmes: no es un adorno suelto, condiciona a su vecina.
  assert.equal(
    sequence("(c3) a(h)b(gw)c(h)"),
    `0×${BEATS.beforeQuilisma} -1×${BEATS.quilisma} 0×${BEATS.note}`,
  );
});

test("un alargamiento escrito manda sobre la forma breve", () => {
  // Un rombo con mora dura lo que dice la mora, no lo que insinúa la forma.
  assert.equal(sequence("(c3) a(G.)"), `-1×${BEATS.mora}`);
  assert.equal(sequence("(c3) a(f~_)"), `-3×${BEATS.episema}`);
});

test("la duración total refleja el ritmo, no una rejilla", () => {
  const total = (gabc) =>
    readPerformance(gabc).events.reduce((sum, event) => sum + event.beats, 0);
  const real = "(c3) da(hvGF) me(gxfegvFE.) (,) Dó(ed/fef)mi(f)";
  // Si todo durara igual, 14 notas y una respiración darían 15 pulsos justos.
  assert.notEqual(total(real), 15);
  assert.ok(total(real) > 0);
});

test("la línea de tiempo acumula los pulsos de cada sonido", () => {
  const { events } = readPerformance("(c3) a(h)b(h.)(,)c(h)");
  const { timeline, totalBeats } = buildTimeline(events);
  assert.deepEqual(timeline.map((entry) => entry.at), [0, 1, 3, 4]);
  assert.equal(totalBeats, 5);
});

test("indexAtBeat localiza dónde se paró, para reanudar ahí", () => {
  const { timeline } = buildTimeline(readPerformance("(c3) a(h)b(h.)(,)c(h)").events);
  assert.equal(indexAtBeat(timeline, 0), 0);
  assert.equal(indexAtBeat(timeline, 0.5), 0);
  assert.equal(indexAtBeat(timeline, 1), 1);
  assert.equal(indexAtBeat(timeline, 2.9), 1);
  assert.equal(indexAtBeat(timeline, 3), 2);
  assert.equal(indexAtBeat(timeline, 99), 3);
});

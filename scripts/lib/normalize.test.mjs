import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGabc, stripHeaders } from "../../lib/gabc.mjs";
import { toChantRecord } from "./normalize.mjs";
import { slugify, toMode, toGenre } from "./record.mjs";

const PROVENANCE = { origin: "gabc-file", license: "CC0-1.0" };

function record(source, provenance = PROVENANCE) {
  return toChantRecord(parseGabc(source), provenance);
}

test("toChantRecord construye un registro completo", () => {
  const result = record(`name: Puer natus est nobis;
office-part: Introitus;
mode: 7;
occasion: In Nativitate Domini;
book: Graduale Romanum, 1961, p. 47;
transcriber: Anon;
%%
(c3) PU(eh)er(h) na(hi)tus(h) est(hg) no(hi)bis(h.)`);

  assert.equal(result.id, "puer-natus-est-nobis");
  assert.equal(result.incipit, "Puer natus est nobis");
  assert.equal(result.genre, "Introitus");
  assert.equal(result.mode, "VII");
  assert.equal(result.text_latin, "Puer natus est nobis");
  assert.equal(result.transcriber, "Anon");
  assert.deepEqual(result.liturgical_occurrences, [
    { calendar: "Roman", celebration: "In Nativitate Domini" },
  ]);
  assert.deepEqual(result.bibliography, [
    { title: "Graduale Romanum", editor: null, year: 1961, page: "47" },
  ]);
  assert.equal(result.provenance.origin, "gabc-file");
  assert.equal(result.provenance.license, "CC0-1.0");
});

test("conserva el gabc como partitura del registro", () => {
  const result = record("name: Kyrie;\n%%\n(c3) Ky(f)ri(g)e(h)");
  assert.equal(result.gabc, "(c3) Ky(f)ri(g)e(h)");
});

test("la importación nunca marca un registro como verificado", () => {
  assert.equal(record("name: Kyrie;\n%%\n(c3) Ky(f)ri(g)e(h)").review_status, "needs_review");
});

test("exige procedencia y licencia explícitas", () => {
  const source = "name: Kyrie;\n%%\n(c3) Ky(f)ri(g)e(h)";
  assert.throws(() => record(source, { origin: "", license: "CC0-1.0" }), /obligatorias/);
  assert.throws(() => record(source, { origin: "gabc-file", license: "" }), /obligatorias/);
});

test("rechaza un gabc sin nombre o sin texto", () => {
  assert.throws(() => record("office-part: Introitus;\n%%\n(c3) a(f)"), /sin cabecera `name`/);
  assert.throws(() => record("name: Vacío;\n%%\n(c3)"), /Sin texto legible/);
});

test("extrae año y página de la cabecera book", () => {
  const bibliography = (book) => record(`name: X;\nbook: ${book};\n%%\n(c3) a(f)`).bibliography[0];
  assert.deepEqual(bibliography("Graduale Romanum, 1961, p. 47"), {
    title: "Graduale Romanum",
    editor: null,
    year: 1961,
    page: "47",
  });
  assert.equal(bibliography("Graduale Romanum, 1974, p. 56, 57").page, "56, 57");
  assert.equal(bibliography("Liber Usualis").page, null);
  assert.equal(bibliography("Liber Usualis").title, "Liber Usualis");
});

test("sin cabecera book no inventa bibliografía", () => {
  assert.deepEqual(record("name: X;\n%%\n(c3) a(f)").bibliography, []);
});

test("toMode traduce modos árabes y romanos y tolera lo desconocido", () => {
  assert.equal(toMode("1"), "I");
  assert.equal(toMode("8"), "VIII");
  assert.equal(toMode("VII"), "VII");
  assert.equal(toMode("3 transposed"), "III");
  assert.equal(toMode("peregrinus"), null);
  assert.equal(toMode(null), null);
  assert.equal(toMode("9"), null);
});

test("toGenre acepta código de dos letras y nombre largo", () => {
  assert.equal(toGenre({ code: "in" }), "Introitus");
  assert.equal(toGenre({ code: "rb" }), "Responsorium breve");
  assert.equal(toGenre({ name: "Communio" }), "Communio");
  assert.equal(toGenre({ name: "offertory" }), "Offertorium");
  assert.equal(toGenre({ name: "Offertorium." }), "Offertorium");
  assert.equal(toGenre({ code: "zz", name: "Prosa" }), "Other");
  assert.equal(toGenre({}), "Other");
});

test("stripHeaders deja solo el cuerpo de la notación", () => {
  assert.equal(stripHeaders("name: X;\n%%\n(c3) a(f)"), "(c3) a(f)");
  assert.equal(stripHeaders("(c3) a(f)"), "(c3) a(f)");
});

test("slugify produce identificadores válidos para el esquema", () => {
  assert.equal(slugify("Puer natus est nobis"), "puer-natus-est-nobis");
  assert.equal(slugify("Rorate cæli désuper"), "rorate-caeli-desuper");
  assert.equal(slugify("  ¡Alleluia!  "), "alleluia");
  assert.match(slugify("Kýrie, eléison"), /^[a-z0-9]+(-[a-z0-9]+)*$/);
});

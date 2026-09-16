import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGabc } from "./gabc.mjs";
import { toChantRecord, slugify } from "./normalize.mjs";

const PROVENANCE = { origin: "public-domain-scan", edition: "Graduale Romanum, 1961" };

function record(source, provenance = PROVENANCE) {
  return toChantRecord(parseGabc(source), provenance);
}

test("toChantRecord construye un registro completo", () => {
  const result = record(`name: Puer natus est nobis;
office-part: Introitus;
mode: 7;
occasion: In Nativitate Domini;
book: Graduale Romanum, 1961, p. 47;
%%
(c3) PU(eh)er(h) na(hi)tus(h) est(hg) no(hi)bis(h.)`);

  assert.equal(result.id, "puer-natus-est-nobis");
  assert.equal(result.incipit, "Puer natus est nobis");
  assert.equal(result.genre, "Introitus");
  assert.equal(result.mode, "VII");
  assert.equal(result.text_latin, "Puer natus est nobis");
  assert.deepEqual(result.liturgical_occurrences, [
    { calendar: "Roman", celebration: "In Nativitate Domini" },
  ]);
  assert.equal(result.source.origin, "public-domain-scan");
  assert.deepEqual(result.source.printed_pages, [47]);
});

test("la importación nunca marca un registro como verificado", () => {
  const result = record("name: Kyrie;\n%%\n(c3) Ky(f)ri(g)e(h)");
  assert.equal(result.review_status, "needs_review");
});

test("exige procedencia explícita", () => {
  const source = "name: Kyrie;\n%%\n(c3) Ky(f)ri(g)e(h)";
  assert.throws(() => record(source, { origin: "", edition: "x" }), /obligatorias/);
  assert.throws(() => record(source, { origin: "gregobase", edition: "" }), /obligatorias/);
});

test("rechaza un gabc sin nombre o sin texto", () => {
  assert.throws(() => record("office-part: Introitus;\n%%\n(c3) a(f)"), /sin cabecera `name`/);
  assert.throws(() => record("name: Vacío;\n%%\n(c3)"), /sin texto legible/);
});

test("traduce los modos árabes y romanos, y tolera lo desconocido", () => {
  const withMode = (mode) => record(`name: X;\nmode: ${mode};\n%%\n(c3) a(f)`).mode;
  assert.equal(withMode("1"), "I");
  assert.equal(withMode("8"), "VIII");
  assert.equal(withMode("VII"), "VII");
  assert.equal(withMode("3 transposed"), "III");
  assert.equal(withMode("peregrinus"), null);
  assert.equal(record("name: X;\n%%\n(c3) a(f)").mode, null);
});

test("normaliza el género y usa Other si no lo reconoce", () => {
  const withPart = (part) => record(`name: X;\noffice-part: ${part};\n%%\n(c3) a(f)`).genre;
  assert.equal(withPart("Communio"), "Communio");
  assert.equal(withPart("communion"), "Communio");
  assert.equal(withPart("Offertorium."), "Offertorium");
  assert.equal(withPart("Agnus Dei"), "Agnus Dei");
  assert.equal(withPart("Prosa"), "Other");
});

test("extrae rangos de páginas de la cabecera book", () => {
  const pages = (book) => record(`name: X;\nbook: ${book};\n%%\n(c3) a(f)`).source.printed_pages;
  assert.deepEqual(pages("Graduale Romanum, p. 47"), [47]);
  assert.deepEqual(pages("Graduale Romanum, pp. 47-49"), [47, 48, 49]);
  assert.deepEqual(pages("Graduale Romanum, 1961"), []);
});

test("la cabecera book, si existe, manda sobre la edición pasada por argumento", () => {
  const result = record("name: X;\nbook: Liber Usualis, 1961, p. 12;\n%%\n(c3) a(f)");
  assert.equal(result.source.edition, "Liber Usualis, 1961, p. 12");
});

test("slugify produce identificadores válidos para el esquema", () => {
  assert.equal(slugify("Puer natus est nobis"), "puer-natus-est-nobis");
  assert.equal(slugify("Rorate cæli désuper"), "rorate-caeli-desuper");
  assert.equal(slugify("  ¡Alleluia!  "), "alleluia");
  assert.match(slugify("Kýrie, eléison"), /^[a-z0-9]+(-[a-z0-9]+)*$/);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGabc, extractText } from "./gabc.mjs";

const SAMPLE = `name: Puer natus est nobis;
office-part: Introitus;
mode: 7;
book: Graduale Romanum, 1961, p. 47;
% un comentario que debe ignorarse
%%
(c3) PU(eh)er(h) na(hi)tus(h) est(hg) no(hi)bis,(h.)`;

test("parseGabc separa cabeceras y cuerpo", () => {
  const { headers, body } = parseGabc(SAMPLE);
  assert.equal(headers.name, "Puer natus est nobis");
  assert.equal(headers["office-part"], "Introitus");
  assert.equal(headers.mode, "7");
  assert.equal(headers.book, "Graduale Romanum, 1961, p. 47");
  assert.match(body, /^\(c3\) PU\(eh\)er/);
});

test("parseGabc ignora comentarios y admite valores multilínea", () => {
  const { headers } = parseGabc("name: Ave\nMaria;\n%%\n(c3) A(f)ve(g)");
  assert.equal(headers.name, "Ave Maria");
});

test("parseGabc falla si no hay separador %%", () => {
  assert.throws(() => parseGabc("name: Sin cuerpo;"), /falta el separador/);
});

test("extractText elimina la notación y conserva las palabras", () => {
  const { body } = parseGabc(SAMPLE);
  assert.equal(extractText(body), "Puer natus est nobis,");
});

test("extractText une las sílabas de una misma palabra", () => {
  assert.equal(extractText("(c3) al(f)le(g)lu(h)ia(g)"), "alleluia");
});

test("extractText normaliza la capitular tipográfica", () => {
  // "PUer" es capitular + versalita, no mayúsculas reales.
  assert.equal(extractText("(c3) PU(eh)er(h)"), "Puer");
  // Una palabra íntegramente en mayúsculas se respeta.
  assert.equal(extractText("(c3) ALLELUIA(f)"), "ALLELUIA");
});

test("extractText traduce los glifos especiales", () => {
  assert.equal(extractText("(c3) s<sp>ae</sp>(f)cu(g)la(h)"), "sæcula");
  assert.equal(extractText("(c3) <sp>V/</sp>(::) Glo(f)ri(g)a(h)"), "℣ Gloria");
});

test("extractText descarta marcado tipográfico y TeX verbatim", () => {
  assert.equal(extractText("(c3) <i>Ps.</i>(f) Can(g)ta(h)te(g)"), "Ps. Cantate");
  assert.equal(extractText("(c3) <v>\\greheightstar</v>(f) no(g)bis(h)"), "nobis");
});

test("extractText no se descuadra con paréntesis de notación anidada", () => {
  assert.equal(extractText("(c3) mi(f[ocb:1;6mm])se(g)re(h)re(g)"), "miserere");
});

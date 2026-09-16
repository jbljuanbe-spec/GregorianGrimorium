import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGabc, extractText, gabcForRendering, splitPerformanceMarks } from "./gabc.mjs";

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
  // GregoBase escribe la primera palabra entera en mayúsculas por la capitular.
  assert.equal(extractText("(c3) EC(ce!fg)CE(f.) ad(fe~)vé(f)nit(f.)"), "Ecce advénit");
  assert.equal(extractText("(c3) ALLELUIA(f)"), "Alleluia");
});

test("extractText respeta las mayúsculas a mitad de texto", () => {
  // Solo la primera palabra lleva capitular; ahí las mayúsculas son del texto.
  assert.equal(extractText("(c3) lau(f)da(g) IHS(h)"), "lauda IHS");
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

test("gabcForRendering traduce los glifos que Exsurge no entiende", () => {
  // Sin esto, "<sp>ae</sp>" se dibujaría literal sobre el pentagrama.
  assert.equal(gabcForRendering("(c3) s<sp>ae</sp>(f)cu(g)la(h)"), "(c3) sæ(f)cu(g)la(h)");
  assert.equal(gabcForRendering("(c3) <sp>V/</sp>(::) Glo(f)ri(g)a(h)"), "(c3) ℣(::) Glo(f)ri(g)a(h)");
});

test("gabcForRendering quita el marcado tipográfico y conserva el texto", () => {
  assert.equal(gabcForRendering("(c3) <i>Ps.</i>(::) De(e)us(f)"), "(c3) Ps.(::) De(e)us(f)");
  assert.equal(gabcForRendering("(c3) <b>Ky(f)</b>ri(g)e(h)"), "(c3) Ky(f)ri(g)e(h)");
});

test("gabcForRendering descarta lo que no tiene equivalente gráfico", () => {
  assert.equal(gabcForRendering("(c3) <v>\\greheightstar</v>(f) no(g)bis(h)"), "(c3) (f) no(g)bis(h)");
  assert.equal(gabcForRendering("(c3) <alt>Intr.</alt>(f) no(g)bis(h)"), "(c3) (f) no(g)bis(h)");
});

test("gabcForRendering conserva la notación intacta y quita las cabeceras", () => {
  const gabc = "name: X;\nmode: 2;\n%%\n(f3) EC(ce!fg)CE(f.) *(,) ad(fe~)vé(f!gwh_f)nit(f.)";
  assert.equal(gabcForRendering(gabc), "(f3) EC(ce!fg)CE(f.) *(,) ad(fe~)vé(f!gwh_f)nit(f.)");
});

test("splitPerformanceMarks separa la indicación de repetición", () => {
  // "ij." abrevia "bis": es una rúbrica de ejecución, no texto cantado.
  const result = splitPerformanceMarks("Allelúia. * ij. ℣. A summo caelo egréssio");
  assert.equal(result.text, "Allelúia. * ℣. A summo caelo egréssio");
  assert.equal(result.repeat, "ij");
  assert.equal(result.psalmToneEnding, false);
});

test("splitPerformanceMarks reconoce la triple repetición", () => {
  assert.equal(splitPerformanceMarks("Kýrie eléison iij.").repeat, "iij");
});

test("splitPerformanceMarks separa la fórmula salmódica", () => {
  // "E u o u a e" son las vocales de "saEcUlOrUm AmEn", no una palabra.
  const result = splitPerformanceMarks("Allelúia, allelúia. E u o u a e.");
  assert.equal(result.text, "Allelúia, allelúia.");
  assert.equal(result.psalmToneEnding, true);
});

test("splitPerformanceMarks no toca el texto que no lleva marcas", () => {
  const result = splitPerformanceMarks("Puer natus est nobis");
  assert.equal(result.text, "Puer natus est nobis");
  assert.equal(result.repeat, null);
  assert.equal(result.psalmToneEnding, false);
});

test("splitPerformanceMarks no confunde palabras que contienen las letras", () => {
  // "ejus" o "Filio" no deben perder nada; solo se quita "ij" como palabra.
  assert.equal(splitPerformanceMarks("in manu ejus").text, "in manu ejus");
  assert.equal(splitPerformanceMarks("Fílio Regis").text, "Fílio Regis");
});

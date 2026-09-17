import assert from "node:assert/strict";
import test from "node:test";
import { auditChant, auditCorpus, MODES } from "./review.mjs";

/** Ficha mínima válida: modo VIII, cierra en sol, que es su finalis. */
function chant(overrides = {}) {
  return {
    id: "test-1",
    incipit: "Test",
    genre: "Communio",
    mode: "VIII",
    text_latin: "Dóminus dixit ad me.",
    gabc: "(c4) Dó(g)mi(h)nus(g) di(f)xit(gh) ad(h) me.(g) (::)",
    bibliography: [{ title: "Graduale Romanum", page: "100" }],
    provenance: {
      origin: "gregobase",
      license: "CC0-1.0",
      external_id: "1",
      snapshot: "gregobase_20191024",
    },
    ...overrides,
  };
}

function checkOf(audit, id) {
  return audit.checks.find((check) => check.id === id);
}

test("una ficha sana pasa todas las comprobaciones aplicables", () => {
  const audit = auditChant(chant());
  assert.equal(audit.grade, "comprobado");
  assert.equal(audit.failed.length, 0);
});

test("«comprobado» no es «verificado»: sin firma humana nunca sube de ahí", () => {
  const audit = auditChant(chant());
  assert.equal(audit.grade, "comprobado");
  assert.equal(audit.signedOff, null);
});

test("la firma de una persona es lo único que da «verificado»", () => {
  const signedOff = { by: "J. Bautista", date: "2026-09-17", note: "cotejado con GR 1961 p. 100" };
  const audit = auditChant(chant(), { signedOff });
  assert.equal(audit.grade, "verificado");
  assert.deepEqual(audit.signedOff, signedOff);
});

test("una firma no tapa un reparo: el fallo sigue listado", () => {
  // Que alguien firme no borra que la notación esté rota; se guarda el
  // detalle para que la contradicción sea visible y no silenciosa.
  const audit = auditChant(chant({ gabc: "(c4) Dó(g" }), {
    signedOff: { by: "Alguien", date: "2026-09-17" },
  });
  assert.equal(audit.grade, "verificado");
  assert.ok(audit.failed.some((check) => check.id === "notacion"));
});

test("detecta que la pieza no cierra donde su modo manda", () => {
  // Cierra en fa, y el modo VIII pide sol (o su afinal re).
  const audit = auditChant(chant({ gabc: "(c4) Dó(g)mi(h)nus(f) (::)" }));
  const finalis = checkOf(audit, "finalis");
  assert.equal(finalis.state, "fail");
  assert.match(finalis.detail, /cierra en fa/);
  assert.equal(audit.grade, "con-reparos");
});

test("acepta la afinal: una pieza transpuesta no es un error", () => {
  // Modo II cierra en la, una quinta sobre su finalis re. Es la affinitas
  // medieval y notación corriente en la Vaticana. En clave c4, «h» es la.
  const audit = auditChant(chant({ mode: "II", gabc: "(c4) Dó(g)mi(g)nus(h) (::)" }));
  const finalis = checkOf(audit, "finalis");
  assert.equal(finalis.state, "pass");
  assert.match(finalis.detail, /afinal/);
});

test("las ocho afinales son una quinta sobre su finalis", () => {
  for (const [mode, { finalis, affinals }] of Object.entries(MODES)) {
    assert.ok(affinals.includes((finalis + 7) % 12), `el modo ${mode} no admite su afinal`);
  }
});

test("sin modo declarado, la finalis no se juzga: se marca no aplicable", () => {
  const audit = auditChant(chant({ mode: null }));
  assert.equal(checkOf(audit, "finalis").state, "skip");
  assert.equal(checkOf(audit, "modo").state, "fail");
});

test("los signos litúrgicos del gradual no son basura", () => {
  // ℣ y ℟ marcan versículo y respuesta, y ǽ es la ligadura de «cǽli».
  const audit = auditChant(chant({ text_latin: "℣ Dómine, ad te clamávi. ℟ Ex cǽlis." }));
  assert.equal(checkOf(audit, "texto").state, "pass");
});

test("un carácter invisible sí es basura, y no se ve mirando la ficha", () => {
  const audit = auditChant(chant({ text_latin: `Dómine‎ ad te clamávi.` }));
  const texto = checkOf(audit, "texto");
  assert.equal(texto.state, "fail");
  assert.match(texto.detail, /U\+200E/);
});

test("rechaza restos estructurales de la fuente", () => {
  const audit = auditChant(chant({ text_latin: '{"text": "Dóminus"}' }));
  assert.equal(checkOf(audit, "texto").state, "fail");
});

test("exige procedencia completa para poder citar la ficha", () => {
  const audit = auditChant(chant({ provenance: { origin: "gregobase", license: "CC0-1.0" } }));
  const procedencia = checkOf(audit, "procedencia");
  assert.equal(procedencia.state, "fail");
  assert.match(procedencia.detail, /external_id/);
});

test("sin edición impresa no hay contra qué cotejar", () => {
  const audit = auditChant(chant({ bibliography: [] }));
  assert.equal(checkOf(audit, "procedencia").state, "fail");
});

test("una sola transcripción no se puede cruzar con nada", () => {
  const audit = auditChant(chant());
  assert.equal(checkOf(audit, "ediciones").state, "skip");
});

test("dos ediciones que dicen modos distintos son un reparo", () => {
  const audit = auditChant(chant({ mode: "VIII" }), {
    siblings: [chant({ id: "test-2", mode: "IV" })],
  });
  const ediciones = checkOf(audit, "ediciones");
  assert.equal(ediciones.state, "fail");
  assert.match(ediciones.detail, /IV/);
});

test("dos ediciones que concuerdan corroboran el modo", () => {
  const audit = auditChant(chant(), { siblings: [chant({ id: "test-2" })] });
  assert.equal(checkOf(audit, "ediciones").state, "pass");
});

test("auditCorpus cruza cada pieza con sus otras versiones sola", () => {
  const audits = auditCorpus([
    chant({ id: "a", mode: "VIII" }),
    chant({ id: "b", mode: "IV", gabc: "(c4) Dó(g)mi(h)nus(e) (::)" }),
  ]);
  // Mismo íncipit y mismo género: son la misma pieza, y sus modos chocan.
  for (const audit of audits) {
    assert.equal(audit.checks.find((check) => check.id === "ediciones").state, "fail");
  }
});

test("el cruce ignora acentos y ligaduras, como el buscador", () => {
  const audits = auditCorpus([
    chant({ id: "a", incipit: "Ecce advénit", mode: "VIII" }),
    chant({ id: "b", incipit: "Ecce advenit", mode: "VIII" }),
  ]);
  for (const audit of audits) {
    assert.equal(audit.checks.find((check) => check.id === "ediciones").state, "pass");
  }
});

test("cuenta aciertos sobre las aplicables, no sobre el total", () => {
  const audit = auditChant(chant());
  // «ediciones» no aplica con una sola transcripción, así que no cuenta.
  assert.equal(audit.applicable, 6);
  assert.equal(audit.passed, 6);
});

test("una rúbrica pegada dentro de la palabra es un reparo", () => {
  // La huella del defecto real: <alt>Cantor</alt> se colaba en el texto y
  // producía «AdCantor te, Dómine, * leOmnesvávi».
  const audit = auditChant(chant({ text_latin: "AdCantor te, Dómine, levávi." }));
  const texto = checkOf(audit, "texto");
  assert.equal(texto.state, "fail");
  assert.match(texto.detail, /mayúscula a mitad de palabra/);
});

test("la capitular de dos letras no es una rúbrica pegada", () => {
  // «Allelúia» sale de «AlLELUIA» en el gabc, y ya viene arreglada.
  const audit = auditChant(chant({ text_latin: "Allelúia. * Dóminus dixit." }));
  assert.equal(checkOf(audit, "texto").state, "pass");
});

test("el texto guardado tiene que ser el que produce su notación", () => {
  const audit = auditChant(chant({ text_latin: "Otra cosa que no dice la notación." }));
  const derivado = checkOf(audit, "derivado");
  assert.equal(derivado.state, "fail");
  assert.match(derivado.detail, /no es el que produce su notación/);
});

test("un texto derivado de su propia notación cuadra", () => {
  const audit = auditChant(chant());
  assert.equal(checkOf(audit, "derivado").state, "pass");
});

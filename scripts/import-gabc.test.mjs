import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import { importGabcFiles } from "./import-gabc.mjs";

const PROVENANCE = { origin: "public-domain-scan", edition: "Graduale Romanum, 1961" };

function fixture(files) {
  const inputDir = mkdtempSync(join(tmpdir(), "gabc-in-"));
  const outputDir = mkdtempSync(join(tmpdir(), "gabc-out-"));
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(inputDir, name), content);
  }
  return { inputDir, outputDir };
}

const KYRIE = "name: Kyrie eleison;\noffice-part: Kyrie;\nmode: 1;\n%%\n(c3) Ky(f)ri(g)e(h) e(g)le(f)i(g)son(f.)";

test("importa un directorio de gabc a registros JSON", () => {
  const { inputDir, outputDir } = fixture({
    "kyrie.gabc": KYRIE,
    "sanctus.gabc": "name: Sanctus;\noffice-part: Sanctus;\n%%\n(c3) San(f)ctus(g)",
    "notas.txt": "esto no debe importarse",
  });

  const result = importGabcFiles({ inputDir, outputDir, ...PROVENANCE });

  assert.equal(result.imported.length, 2);
  assert.equal(result.failed.length, 0);
  assert.deepEqual(readdirSync(outputDir).sort(), ["kyrie-eleison.json", "sanctus.json"]);

  const written = JSON.parse(readFileSync(join(outputDir, "kyrie-eleison.json"), "utf8"));
  assert.equal(written.text_latin, "Kyrie eleison");
  assert.equal(written.review_status, "needs_review");
});

test("no sobreescribe un registro ya verificado por una persona", () => {
  const { inputDir, outputDir } = fixture({ "kyrie.gabc": KYRIE });
  const target = join(outputDir, "kyrie-eleison.json");
  const verified = { id: "kyrie-eleison", text_latin: "texto corregido a mano", review_status: "verified" };
  writeFileSync(target, JSON.stringify(verified));

  const result = importGabcFiles({ inputDir, outputDir, ...PROVENANCE });

  assert.equal(result.imported.length, 0);
  assert.equal(result.skipped.length, 1);
  assert.equal(JSON.parse(readFileSync(target, "utf8")).text_latin, "texto corregido a mano");
});

test("--force sí reemplaza un registro verificado", () => {
  const { inputDir, outputDir } = fixture({ "kyrie.gabc": KYRIE });
  const target = join(outputDir, "kyrie-eleison.json");
  writeFileSync(target, JSON.stringify({ id: "kyrie-eleison", review_status: "verified" }));

  const result = importGabcFiles({ inputDir, outputDir, ...PROVENANCE, force: true });

  assert.equal(result.imported.length, 1);
  assert.equal(JSON.parse(readFileSync(target, "utf8")).review_status, "needs_review");
});

test("sí actualiza un registro que aún no está verificado", () => {
  const { inputDir, outputDir } = fixture({ "kyrie.gabc": KYRIE });
  const target = join(outputDir, "kyrie-eleison.json");
  writeFileSync(target, JSON.stringify({ id: "kyrie-eleison", review_status: "draft" }));

  const result = importGabcFiles({ inputDir, outputDir, ...PROVENANCE });

  assert.equal(result.imported.length, 1);
  assert.equal(JSON.parse(readFileSync(target, "utf8")).review_status, "needs_review");
});

test("dry-run no escribe nada", () => {
  const { inputDir, outputDir } = fixture({ "kyrie.gabc": KYRIE });

  const result = importGabcFiles({ inputDir, outputDir, ...PROVENANCE, dryRun: true });

  assert.equal(result.imported.length, 1);
  assert.deepEqual(readdirSync(outputDir), []);
});

test("un gabc inválido no aborta el lote, se reporta como error", () => {
  const { inputDir, outputDir } = fixture({ "kyrie.gabc": KYRIE, "roto.gabc": "sin separador" });

  const result = importGabcFiles({ inputDir, outputDir, ...PROVENANCE });

  assert.equal(result.imported.length, 1);
  assert.equal(result.failed.length, 1);
  assert.match(result.failed[0].reason, /separador/);
});

test("todo registro importado valida contra data/schema/chant.schema.json", () => {
  const { inputDir, outputDir } = fixture({
    "kyrie.gabc": KYRIE,
    "puer.gabc": `name: Puer natus est nobis;
office-part: Introitus;
mode: 7;
occasion: In Nativitate Domini;
book: Graduale Romanum, 1961, pp. 47-48;
%%
(c3) PU(eh)er(h) na(hi)tus(h) est(hg) s<sp>ae</sp>(h)cu(g)lo(f.)`,
    "sin-modo.gabc": "name: Prosa quaedam;\noffice-part: Prosa;\n%%\n(c3) Pro(f)sa(g)",
  });

  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  const schema = JSON.parse(readFileSync(join(root, "data/schema/chant.schema.json"), "utf8"));
  const validate = new Ajv({ allErrors: true }).compile(schema);

  const { imported } = importGabcFiles({ inputDir, outputDir, ...PROVENANCE });

  assert.equal(imported.length, 3);
  for (const chant of imported) {
    assert.ok(validate(chant), `${chant.id}: ${JSON.stringify(validate.errors)}`);
  }
});

test("rechaza una procedencia no declarada en el esquema", () => {
  const { inputDir, outputDir } = fixture({ "kyrie.gabc": KYRIE });
  assert.throws(
    () => importGabcFiles({ inputDir, outputDir, origin: "internet", edition: "x" }),
    /--origin debe ser uno de/,
  );
});

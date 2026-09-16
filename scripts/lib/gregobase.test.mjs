import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import { toRecords, decodeGabc } from "./gregobase.mjs";

// Un volcado mínimo con la forma real del de GregoBase: el gabc va como
// cadena JSON y, en la mayoría de registros, sin cabeceras.
const DUMP = [
  "INSERT INTO `gregobase_chants` (`id`, `cantusid`, `version`, `incipit`, `initial`, `office-part`, `mode`, `mode_var`, `transcriber`, `commentary`, `gabc`, `gabc_verses`, `tex_verses`, `remarks`) VALUES",
  "(7328,'g00123','Solesmes','Ecce advénit',1,'in','2',NULL,'Fernando Gil',NULL,",
  "'\"(f3) EC(ce!fg)CE(f.) *(,) ad(fe~)v\\\\u00e9(f!gwh_f)nit(f.)\"',NULL,NULL,NULL),",
  "(88,NULL,NULL,'Alleluia',1,'al','7','peregrinus',NULL,'dudoso',",
  "'\"name: Alleluia;\\\\r\\\\nmode: 7;\\\\r\\\\n%%\\\\r\\\\n(c4) AL(ff)le(gh)l\\\\u00fa(h)ia(g.)\"',NULL,NULL,NULL),",
  "(99,NULL,NULL,'Sin notación',1,'co','1',NULL,NULL,NULL,NULL,NULL,NULL,NULL);",
  "INSERT INTO `gregobase_sources` (`id`, `year`, `editor`, `title`, `description`, `caption`, `pages`) VALUES",
  "(3,1974,'Solesmes','Graduale Romanum','','',NULL),(9,0,'','Sin año','','',NULL);",
  "INSERT INTO `gregobase_tags` (`id`, `tag`) VALUES (5,' In Epiphania Domini'),(6,'');",
  "INSERT INTO `gregobase_chant_tags` (`chant_id`, `tag_id`) VALUES (7328,5),(7328,6);",
  "INSERT INTO `gregobase_chant_sources` (`chant_id`, `source`, `page`, `sequence`, `extent`) VALUES",
  "(7328,3,'56',1,1),(7328,9,'',1,1);",
].join("\n");

function records(options) {
  const { records: result } = toRecords(DUMP, options);
  return new Map(result.map((record) => [record.provenance.external_id, record]));
}

test("decodeGabc deshace la cadena JSON del volcado", () => {
  assert.equal(decodeGabc('"(f3) EC(ce)CE(f.)"'), "(f3) EC(ce)CE(f.)");
  assert.equal(decodeGabc('"adv\\u00e9nit"'), "advénit");
  assert.equal(decodeGabc("(f3) sin comillas"), "(f3) sin comillas");
  assert.equal(decodeGabc(null), null);
  assert.equal(decodeGabc('"json roto'), null);
});

test("construye el registro con los metadatos de las columnas", () => {
  const chant = records().get("7328");
  assert.equal(chant.id, "ecce-advenit-7328");
  assert.equal(chant.incipit, "Ecce advénit");
  assert.equal(chant.genre, "Introitus");
  assert.equal(chant.genre_code, "in");
  assert.equal(chant.mode, "II");
  assert.equal(chant.version, "Solesmes");
  assert.equal(chant.cantus_id, "g00123");
  assert.equal(chant.transcriber, "Fernando Gil");
  assert.equal(chant.text_latin, "Ecce * advénit");
  assert.equal(chant.review_status, "needs_review");
});

test("declara procedencia CC0 y el volcado concreto", () => {
  const chant = records({ snapshot: "gregobase_20191024" }).get("7328");
  assert.deepEqual(chant.provenance, {
    origin: "gregobase",
    license: "CC0-1.0",
    external_id: "7328",
    snapshot: "gregobase_20191024",
  });
});

test("extrae el texto también cuando el gabc trae cabeceras", () => {
  const chant = records().get("88");
  assert.equal(chant.text_latin, "Allelúia");
  assert.equal(chant.mode, "VII");
  assert.equal(chant.mode_variant, "peregrinus");
  assert.equal(chant.commentary, "dudoso");
});

test("cruza etiquetas litúrgicas y descarta las vacías", () => {
  const chant = records().get("7328");
  assert.deepEqual(chant.liturgical_occurrences, [
    { calendar: "Roman", celebration: "In Epiphania Domini" },
  ]);
});

test("cruza la bibliografía con su página, y el año 0 queda a null", () => {
  const chant = records().get("7328");
  assert.deepEqual(chant.bibliography, [
    { title: "Graduale Romanum", editor: "Solesmes", year: 1974, page: "56" },
    { title: "Sin año", editor: null, year: null, page: null },
  ]);
});

test("un canto sin notación se descarta, no se publica a medias", () => {
  const { records: result, failed } = toRecords(DUMP);
  assert.equal(result.length, 2);
  assert.equal(failed.length, 1);
  assert.equal(failed[0].id, "99");
  assert.match(failed[0].reason, /gabc ilegible/);
});

test("el filtro por género respeta los códigos de la fuente", () => {
  const { records: result } = toRecords(DUMP, { genres: ["in"] });
  assert.deepEqual(result.map((record) => record.genre), ["Introitus"]);
});

test("todo registro importado valida contra el esquema", () => {
  const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
  const schema = JSON.parse(readFileSync(join(root, "data/schema/chant.schema.json"), "utf8"));
  const validate = new Ajv({ allErrors: true }).compile(schema);
  const { records: result } = toRecords(DUMP, { snapshot: "test" });

  assert.equal(result.length, 2);
  for (const chant of result) {
    assert.ok(validate(chant), `${chant.id}: ${JSON.stringify(validate.errors)}`);
  }
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readTable } from "./sqldump.mjs";

test("lee filas simples con sus columnas", () => {
  const dump = "INSERT INTO `t` (`id`, `name`) VALUES (1,'Kyrie'),(2,'Gloria');";
  assert.deepEqual(readTable(dump, "t"), [
    { id: "1", name: "Kyrie" },
    { id: "2", name: "Gloria" },
  ]);
});

test("distingue NULL de la cadena 'NULL'", () => {
  const dump = "INSERT INTO `t` (`a`, `b`) VALUES (NULL,'NULL');";
  assert.deepEqual(readTable(dump, "t"), [{ a: null, b: "NULL" }]);
});

test("no se rompe con comas ni paréntesis dentro de las cadenas", () => {
  const dump = "INSERT INTO `t` (`gabc`) VALUES ('(c3) PU(eh)er(h) na(hi)tus(h), est(hg)');";
  assert.deepEqual(readTable(dump, "t"), [{ gabc: "(c3) PU(eh)er(h) na(hi)tus(h), est(hg)" }]);
});

test("respeta las comillas y barras escapadas", () => {
  const dump = "INSERT INTO `t` (`a`, `b`) VALUES ('d\\'Arezzo','c:\\\\path');";
  assert.deepEqual(readTable(dump, "t"), [{ a: "d'Arezzo", b: "c:\\path" }]);
});

test("traduce los saltos de línea escapados", () => {
  const dump = "INSERT INTO `t` (`a`) VALUES ('linea1\\nlinea2');";
  assert.deepEqual(readTable(dump, "t"), [{ a: "linea1\nlinea2" }]);
});

test("admite la comilla duplicada como comilla literal", () => {
  const dump = "INSERT INTO `t` (`a`) VALUES ('d''Arezzo');";
  assert.deepEqual(readTable(dump, "t"), [{ a: "d'Arezzo" }]);
});

test("acumula varias sentencias INSERT de la misma tabla", () => {
  const dump = "INSERT INTO `t` (`a`) VALUES ('x');\nINSERT INTO `t` (`a`) VALUES ('y'),('z');";
  assert.deepEqual(readTable(dump, "t").map((row) => row.a), ["x", "y", "z"]);
});

test("ignora otras tablas del mismo volcado", () => {
  const dump = "INSERT INTO `otra` (`a`) VALUES ('no');\nINSERT INTO `t` (`a`) VALUES ('si');";
  assert.deepEqual(readTable(dump, "t"), [{ a: "si" }]);
});

test("una columna ausente en la tupla queda a null", () => {
  const dump = "INSERT INTO `t` (`a`, `b`, `c`) VALUES ('x','y');";
  assert.deepEqual(readTable(dump, "t"), [{ a: "x", b: "y", c: null }]);
});

test("no confunde un punto y coma dentro de una cadena con el fin de la sentencia", () => {
  const dump = "INSERT INTO `t` (`a`) VALUES ('f(g;h)'),('segunda');";
  assert.deepEqual(readTable(dump, "t").map((row) => row.a), ["f(g;h)", "segunda"]);
});

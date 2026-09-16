import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LIMITS,
  addChant,
  annotate,
  createRepertoire,
  decodeRepertoire,
  encodeRepertoire,
  moveChant,
  removeChant,
  rename,
} from "./repertoire.mjs";

const A = "ecce-advenit-7328";
const B = "puer-natus-est-nobis-123";
const C = "rorate-caeli-456";

test("un repertorio nuevo empieza vacío y con nombre", () => {
  const repertoire = createRepertoire("Misa del III Domingo");
  assert.equal(repertoire.name, "Misa del III Domingo");
  assert.deepEqual(repertoire.items, []);
});

test("añade cantos en el orden en que se añaden", () => {
  const repertoire = addChant(addChant(createRepertoire(), A), B);
  assert.deepEqual(repertoire.items.map((item) => item.id), [A, B]);
});

test("no duplica una pieza que ya está en el repertorio", () => {
  const repertoire = addChant(addChant(createRepertoire(), A), A);
  assert.equal(repertoire.items.length, 1);
});

test("reordena subiendo y bajando, sin salirse de los extremos", () => {
  let repertoire = [A, B, C].reduce(addChant, createRepertoire());
  repertoire = moveChant(repertoire, 2, -1);
  assert.deepEqual(repertoire.items.map((item) => item.id), [A, C, B]);

  // En el primer puesto, subir no hace nada.
  repertoire = moveChant(repertoire, 0, -1);
  assert.deepEqual(repertoire.items.map((item) => item.id), [A, C, B]);
  // En el último, bajar tampoco.
  repertoire = moveChant(repertoire, 2, 1);
  assert.deepEqual(repertoire.items.map((item) => item.id), [A, C, B]);
});

test("anota una pieza sin tocar las demás", () => {
  let repertoire = [A, B].reduce(addChant, createRepertoire());
  repertoire = annotate(repertoire, 1, "Solo el primer verso");
  assert.equal(repertoire.items[0].note, "");
  assert.equal(repertoire.items[1].note, "Solo el primer verso");
});

test("quita una pieza por su posición", () => {
  const repertoire = removeChant([A, B, C].reduce(addChant, createRepertoire()), 1);
  assert.deepEqual(repertoire.items.map((item) => item.id), [A, C]);
});

test("las operaciones no mutan el repertorio original", () => {
  const original = addChant(createRepertoire("Adviento"), A);
  const changed = rename(annotate(addChant(original, B), 0, "nota"), "Navidad");
  assert.equal(original.items.length, 1);
  assert.equal(original.items[0].note, "");
  assert.equal(original.name, "Adviento");
  assert.equal(changed.name, "Navidad");
});

test("el enlace compartido conserva nombre, orden y anotaciones", () => {
  let repertoire = rename([A, B, C].reduce(addChant, createRepertoire()), "Misa de Epifanía");
  repertoire = annotate(repertoire, 1, "Empezar en Sol; solo el verso 1");
  const restored = decodeRepertoire(encodeRepertoire(repertoire));
  assert.deepEqual(restored, repertoire);
});

test("un enlace sin anotaciones se codifica más corto", () => {
  const plain = [A, B, C].reduce(addChant, createRepertoire("Misa"));
  const annotated = annotate(plain, 0, "una nota cualquiera");
  assert.ok(encodeRepertoire(plain).length < encodeRepertoire(annotated).length);
});

test("decodifica con acentos y comillas en el nombre y en las notas", () => {
  let repertoire = rename(addChant(createRepertoire(), A), 'Misa "de difuntos" — Año 2026');
  repertoire = annotate(repertoire, 0, "Atención: tono más bajo, «grave»");
  assert.deepEqual(decodeRepertoire(encodeRepertoire(repertoire)), repertoire);
});

test("un enlace manipulado no produce un repertorio inválido", () => {
  assert.equal(decodeRepertoire(""), null);
  assert.equal(decodeRepertoire("no-es-json"), null);
  assert.equal(decodeRepertoire(encodeURIComponent('{"a":1}')), null);
  // Versión desconocida: mejor rechazar que interpretar mal.
  assert.equal(decodeRepertoire(encodeURIComponent(JSON.stringify([99, "x", []]))), null);
});

test("descarta identificadores que no son slugs, en vez de enrutarlos", () => {
  const hostile = JSON.stringify([
    1,
    "Intento",
    [["../../etc/passwd"], ["<script>alert(1)</script>"], ["https://otro.sitio"], [A]],
  ]);
  const decoded = decodeRepertoire(encodeURIComponent(hostile));
  assert.deepEqual(decoded.items.map((item) => item.id), [A]);
});

test("recorta lo que exceda los límites del enlace", () => {
  const long = JSON.stringify([
    1,
    "N".repeat(500),
    [[A, "x".repeat(1000)], ...Array.from({ length: 200 }, (_, i) => [`canto-${i}`])],
  ]);
  const decoded = decodeRepertoire(encodeURIComponent(long));
  assert.equal(decoded.name.length, LIMITS.name);
  assert.equal(decoded.items[0].note.length, LIMITS.note);
  assert.equal(decoded.items.length, LIMITS.items);
});

test("no acepta más piezas que el límite", () => {
  let repertoire = createRepertoire();
  for (let i = 0; i < LIMITS.items + 10; i += 1) repertoire = addChant(repertoire, `canto-${i}`);
  assert.equal(repertoire.items.length, LIMITS.items);
});

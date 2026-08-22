import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("el historial y los resultados se renderizan con nodos y texto seguro", async () => {
  const app = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

  assert.doesNotMatch(app, /\.innerHTML\s*=/);
  assert.doesNotMatch(app, /insertAdjacentHTML/);
  assert.match(app, /queryLabel\.textContent/);
  assert.match(app, /detailLabel\.textContent/);
  assert.match(app, /tagNode\.textContent/);
});

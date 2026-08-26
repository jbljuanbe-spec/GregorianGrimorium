import assert from "node:assert/strict";
import test from "node:test";
import { isWithinScope, marketsForScope, normaliseScope } from "../public/scope.js";

test("separa España, Italia, EMEA y remoto global mediante ámbitos explícitos", () => {
  const madrid = { location: "Madrid, España", country: "Spain", remote: false };
  const milan = { location: "Milano, Italia", country: "Italy", remote: false };
  const berlin = { location: "Berlin, Germany", country: "Germany", remote: false };
  const remote = { location: "Anywhere", country: "", remote: true };
  assert.equal(isWithinScope(madrid, "spain"), true);
  assert.equal(isWithinScope(milan, "spain"), false);
  assert.equal(isWithinScope(milan, "italy"), true);
  assert.equal(isWithinScope(berlin, "emea"), true);
  assert.equal(isWithinScope(remote, "remote"), true);
  assert.equal(isWithinScope(milan, "remote"), false);
});

test("limita los mercados Adzuna de EMEA y normaliza ámbitos desconocidos", () => {
  assert.deepEqual(marketsForScope("emea"), ["it", "de", "fr", "nl"]);
  assert.equal(normaliseScope("desconocido"), "spain");
});

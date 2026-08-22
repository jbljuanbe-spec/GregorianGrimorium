import assert from "node:assert/strict";
import test from "node:test";
import { normaliseAndDeduplicate } from "../public/sources.js";

test("deduplica por URL y conserva solamente resultados de España", () => {
  const job = {
    title: "International Business Analyst", company: "Empresa", location: "Madrid, Spain", country: "Spain", remote: false,
    sourceUrl: "https://example.com/job/1?utm_source=test", source: "Prueba", modality: "Híbrido", contractType: "Indefinido", area: "Internacionalización", description: "Mercados", requirements: "", publishedAt: "2026-08-22T00:00:00.000Z",
  };
  const result = normaliseAndDeduplicate([[job, { ...job, sourceUrl: "https://example.com/job/1" }], [{ ...job, title: "Puesto remoto", company: "Otro", location: "Berlin", country: "Germany", sourceUrl: "https://example.com/job/2" }]], false);
  assert.equal(result.length, 1);
  assert.equal(result[0].sourceUrl, "https://example.com/job/1");
});

test("incluye puestos remotos solo cuando el usuario lo habilita", () => {
  const job = { title: "Remote role", company: "Empresa", location: "Anywhere", country: "", remote: true, sourceUrl: "https://example.com/remote", source: "Prueba", modality: "Remoto", contractType: "Indefinido", area: "Internacional", description: "", requirements: "", publishedAt: null };
  assert.equal(normaliseAndDeduplicate([[job]], false).length, 0);
  assert.equal(normaliseAndDeduplicate([[job]], true).length, 1);
});

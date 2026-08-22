import assert from "node:assert/strict";
import test from "node:test";
import { normaliseAndDeduplicate } from "../public/sources.js";

test("las fuentes de navegador conservan varias posiciones distintas de una misma empresa", () => {
  const common = { title: "Analista de mercado", company: "Empresa", location: "Madrid, Spain", country: "Spain", remote: false, source: "Prueba", modality: "Híbrido", contractType: "Indefinido", area: "Mercados", description: "", requirements: "", publishedAt: null };
  const result = normaliseAndDeduplicate([[{ ...common, sourceUrl: "https://example.com/jobs/A" }, { ...common, sourceUrl: "https://example.com/jobs/B" }]], false);
  assert.equal(result.length, 2);
});

test("las fuentes de navegador eliminan la misma requisición sindicada en URLs distintas", () => {
  const common = { title: "Analista de mercado", company: "Empresa", location: "Madrid, Spain", country: "Spain", remote: false, source: "Prueba", modality: "Híbrido", contractType: "Indefinido", area: "Mercados", requirements: "", publishedAt: null };
  const result = normaliseAndDeduplicate([[{ ...common, sourceUrl: "https://example.com/jobs/R-201", description: "Oferta" }, { ...common, sourceUrl: "https://other.example.com/123", description: "Requisición R-201" }]], false);
  assert.equal(result.length, 1);
});

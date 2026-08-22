import assert from "node:assert/strict";
import test from "node:test";
import { findTargetCompany, targetCompanies } from "../public/targetCompanies.js";

test("el radar corporativo mantiene cien entidades objetivo con enlaces HTTPS", () => {
  assert.equal(targetCompanies.length, 100);
  assert.equal(new Set(targetCompanies.map(company => company.name)).size, 100);
  assert.ok(targetCompanies.every(company => company.careersUrl.startsWith("https://")));
});

test("reconoce empresas objetivo en resultados agregados para priorizarlas", () => {
  assert.equal(findTargetCompany("Banco Santander S.A.")?.name, "Santander");
  assert.equal(findTargetCompany("Iberdrola Clientes")?.name, "Iberdrola");
  assert.equal(findTargetCompany("Empresa ajena"), undefined);
});

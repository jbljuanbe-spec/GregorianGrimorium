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

test("prioriza los portales oficiales corregidos para Indra y empresas con rutas renovadas", () => {
  const byName = name => targetCompanies.find(company => company.name === name)?.careersUrl;
  assert.equal(byName("Indra"), "https://careers.indragroup.com/");
  assert.equal(byName("Acciona"), "https://acciona.wd3.myworkdayjobs.com/es/ACCIONA_Employment_Channel");
  assert.equal(byName("CaixaBank"), "https://caixabankcareers.com/");
  assert.equal(byName("Wallapop"), "https://job-boards.eu.greenhouse.io/wallapop");
});

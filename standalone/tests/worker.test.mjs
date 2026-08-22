import assert from "node:assert/strict";
import test from "node:test";
import worker, { broadenAdzunaQuery, normaliseAndDeduplicate, normaliseIberdrola } from "../src/worker.js";

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

test("amplía consultas demasiado específicas hacia un término de mercado con mayor cobertura", () => {
  assert.equal(broadenAdzunaQuery("desarrollo de negocio internacional"), "desarrollo de negocio");
  assert.equal(broadenAdzunaQuery("relaciones institucionales"), "asuntos públicos");
  assert.equal(broadenAdzunaQuery("comercio exterior"), "comercio exterior");
});

test("normaliza vacantes oficiales de Iberdrola con enlace directo de candidatura", () => {
  const job = normaliseIberdrola({ title: "Business Development Manager", externalPath: "/job/Madrid/Business-Development_R-42", locationsText: "Spain, Madrid", bulletFields: ["R-42"] });
  assert.equal(job.company, "Iberdrola");
  assert.match(job.sourceUrl, /myworkdayjobs\.com/);
});

test("recupera una vacante española desde el conector oficial de Iberdrola", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /iberdrola\.wd3\.myworkdayjobs\.com/);
    assert.equal(options.method, "POST");
    return new Response(JSON.stringify({ jobPostings: [{ title: "Business Development", externalPath: "/job/Madrid/R-42", locationsText: "Madrid, Spain", bulletFields: [] }] }), { headers: { "Content-Type": "application/json" } });
  };
  try {
    const response = await worker.fetch(new Request("https://example.test/api/search?q=desarrollo%20de%20negocio&sources=iberdrola"), { ASSETS: { fetch: () => new Response("not used") } });
    const payload = await response.json();
    assert.equal(payload.results.length, 1);
    assert.equal(payload.results[0].source, "Iberdrola Careers");
    assert.deepEqual(payload.sources, ["Iberdrola Careers"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("informa el fallo de Iberdrola sin ocultar el resto de la búsqueda", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });
  try {
    const response = await worker.fetch(new Request("https://example.test/api/search?sources=iberdrola"), { ASSETS: { fetch: () => new Response("not used") } });
    const payload = await response.json();
    assert.equal(payload.results.length, 0);
    assert.equal(payload.sourceErrors[0].source, "iberdrola");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("devuelve una respuesta corporativa vacía sin registrar un error espurio", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ total: 0, jobPostings: [] }), { headers: { "Content-Type": "application/json" } });
  try {
    const response = await worker.fetch(new Request("https://example.test/api/search?sources=iberdrola"), { ASSETS: { fetch: () => new Response("not used") } });
    const payload = await response.json();
    assert.deepEqual(payload.results, []);
    assert.deepEqual(payload.sourceErrors, []);
    assert.deepEqual(payload.sources, ["Iberdrola Careers"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("recorre páginas corporativas acotadas para no perder una vacante española posterior", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls += 1;
    const { offset } = JSON.parse(options.body);
    const jobPostings = offset === 50
      ? [{ title: "Gestor de negocio", externalPath: "/job/Spain-Madrid/R-99", locationsText: "Spain, Madrid", bulletFields: [] }]
      : [{ title: "Role abroad", externalPath: "/job/United-Kingdom/R-01", locationsText: "United Kingdom", bulletFields: [] }];
    return new Response(JSON.stringify({ total: 100, jobPostings }), { headers: { "Content-Type": "application/json" } });
  };
  try {
    const response = await worker.fetch(new Request("https://example.test/api/search?sources=iberdrola"), { ASSETS: { fetch: () => new Response("not used") } });
    const payload = await response.json();
    assert.equal(calls, 2);
    assert.equal(payload.results.length, 1);
    assert.equal(payload.results[0].location, "Spain, Madrid");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

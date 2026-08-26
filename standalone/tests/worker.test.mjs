import assert from "node:assert/strict";
import test from "node:test";
import worker, { broadenAdzunaQuery, buildAdzunaQueries, normaliseAcciona, normaliseAndDeduplicate, normaliseIberdrola, normaliseRepsol, normaliseSantander } from "../src/worker.js";

test("deduplica por URL y conserva solamente resultados de España", () => {
  const job = {
    title: "International Business Analyst", company: "Empresa", location: "Madrid, Spain", country: "Spain", remote: false,
    sourceUrl: "https://example.com/job/1?utm_source=test", source: "Prueba", modality: "Híbrido", contractType: "Indefinido", area: "Internacionalización", description: "Mercados", requirements: "", publishedAt: "2026-08-22T00:00:00.000Z",
  };
  const result = normaliseAndDeduplicate([[job, { ...job, sourceUrl: "https://example.com/job/1" }], [{ ...job, title: "Puesto remoto", company: "Otro", location: "Berlin", country: "Germany", sourceUrl: "https://example.com/job/2" }]], false);
  assert.equal(result.length, 1);
  assert.equal(result[0].sourceUrl, "https://example.com/job/1");
});

test("conserva dos requisiciones distintas de una misma empresa aunque compartan título y ubicación", () => {
  const vacancy = {
    title: "Business Development Manager", company: "Empresa", location: "Madrid, Spain", country: "Spain", remote: false,
    source: "Prueba", modality: "Híbrido", contractType: "Indefinido", area: "Internacionalización", description: "Mercados", requirements: "", publishedAt: null,
  };
  const result = normaliseAndDeduplicate([[{ ...vacancy, sourceUrl: "https://careers.example.com/job/R-100" }, { ...vacancy, sourceUrl: "https://careers.example.com/job/R-101" }]], false);
  assert.equal(result.length, 2);
});

test("elimina una misma requisición sindicada en dos URLs de fuentes distintas", () => {
  const vacancy = {
    title: "Business Development Manager", company: "Empresa", location: "Madrid, Spain", country: "Spain", remote: false,
    source: "Prueba", modality: "Híbrido", contractType: "Indefinido", area: "Internacionalización", requirements: "", publishedAt: null,
  };
  const result = normaliseAndDeduplicate([[{ ...vacancy, sourceUrl: "https://careers.example.com/job/Madrid/R-29340-1", description: "Oferta corporativa" }, { ...vacancy, sourceUrl: "https://aggregator.example.com/jobs/123", description: "Referencia R-29340" }]], false);
  assert.equal(result.length, 1);
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

test("limita las variantes de Adzuna y conserva la intención comercial", () => {
  assert.deepEqual(buildAdzunaQueries("desarrollo de negocio internacional"), ["desarrollo de negocio", "business development"]);
  assert.deepEqual(buildAdzunaQueries("asuntos públicos"), ["asuntos públicos", "relaciones institucionales"]);
});

test("filtra las vacantes internacionales por el ámbito elegido", () => {
  const jobs = [[
    { id: "it", title: "Business Development", company: "Empresa Italia", location: "Milano", country: "Italy", sourceUrl: "https://example.com/it", remote: false },
    { id: "es", title: "Business Development", company: "Empresa España", location: "Madrid", country: "Spain", sourceUrl: "https://example.com/es", remote: false },
  ]];
  const result = normaliseAndDeduplicate(jobs, "italy", false);
  assert.equal(result.length, 1);
  assert.equal(result[0].location, "Milano");
});

test("normaliza vacantes oficiales de Iberdrola con enlace directo de candidatura", () => {
  const job = normaliseIberdrola({ title: "Business Development Manager", externalPath: "/job/Madrid/Business-Development_R-42", locationsText: "Spain, Madrid", bulletFields: ["R-42"] });
  assert.equal(job.company, "Iberdrola");
  assert.match(job.sourceUrl, /myworkdayjobs\.com/);
});

test("reconoce España en la ruta oficial aunque Workday resuma la ubicación", () => {
  const job = normaliseIberdrola({ title: "Vacante", externalPath: "/job/Spain-Bilbao/R-88", locationsText: "3 Locations", bulletFields: [] });
  assert.equal(normaliseAndDeduplicate([[job]], false).length, 1);
});

test("normaliza vacantes oficiales de Santander con su URL corporativa de candidatura", () => {
  const job = normaliseSantander({ title: "Business Development", externalPath: "/job/Madrid/R-22", locationsText: "Madrid, Spain", bulletFields: ["R-22"] });
  assert.equal(job.company, "Santander");
  assert.match(job.sourceUrl, /santander\.wd3\.myworkdayjobs\.com/);
});

test("normaliza vacantes oficiales de Repsol con su URL corporativa de candidatura", () => {
  const job = normaliseRepsol({ title: "Business Development", externalPath: "/job/Campus-Repsol-Madrid/R-22", locationsText: "Campus Repsol-Madrid", bulletFields: ["R-22"] });
  assert.equal(job.company, "Repsol");
  assert.match(job.sourceUrl, /repsol\.wd3\.myworkdayjobs\.com/);
});

test("normaliza vacantes oficiales de Acciona con su URL corporativa de candidatura", () => {
  const job = normaliseAcciona({ title: "Desarrollo de Negocio", externalPath: "/job/Madrid/Desarrollo-de-Negocio_20101001", locationsText: "Madrid", bulletFields: ["20101001"] });
  assert.equal(job.company, "Acciona");
  assert.match(job.sourceUrl, /acciona\.wd3\.myworkdayjobs\.com/);
});

test("recupera una vacante española desde el conector oficial de Iberdrola", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /iberdrola\.wd3\.myworkdayjobs\.com/);
    assert.equal(options.method, "POST");
    const request = JSON.parse(options.body);
    assert.equal(request.searchText, "desarrollo de negocio");
    assert.equal(request.limit, 20);
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
    const jobPostings = offset === 80
      ? [{ title: "Gestor de negocio", externalPath: "/job/Spain-Madrid/R-99", locationsText: "Spain, Madrid", bulletFields: [] }]
      : [{ title: "Role abroad", externalPath: "/job/United-Kingdom/R-01", locationsText: "United Kingdom", bulletFields: [] }];
    return new Response(JSON.stringify({ total: 100, jobPostings }), { headers: { "Content-Type": "application/json" } });
  };
  try {
    const response = await worker.fetch(new Request("https://example.test/api/search?sources=iberdrola"), { ASSETS: { fetch: () => new Response("not used") } });
    const payload = await response.json();
    assert.equal(calls, 5);
    assert.equal(payload.results.length, 1);
    assert.equal(payload.results[0].location, "Spain, Madrid");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("recupera una vacante española desde el conector oficial de Santander", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /santander\.wd3\.myworkdayjobs\.com/);
    assert.equal(JSON.parse(options.body).limit, 20);
    return new Response(JSON.stringify({ total: 1, jobPostings: [{ title: "Responsable Desarrollo de Negocio", externalPath: "/job/Spain-Madrid/R-22", locationsText: "Spain, Madrid", bulletFields: ["R-22"] }] }), { headers: { "Content-Type": "application/json" } });
  };
  try {
    const response = await worker.fetch(new Request("https://example.test/api/search?q=desarrollo%20de%20negocio&sources=santander"), { ASSETS: { fetch: () => new Response("not used") } });
    const payload = await response.json();
    assert.equal(payload.results[0].company, "Santander");
    assert.deepEqual(payload.sources, ["Santander Careers"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("recupera una vacante española desde el conector oficial de Repsol", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /repsol\.wd3\.myworkdayjobs\.com/);
    assert.equal(JSON.parse(options.body).limit, 20);
    return new Response(JSON.stringify({ total: 1, jobPostings: [{ title: "Desarrollo de Negocio", externalPath: "/job/Campus-Repsol-Madrid/R-44", locationsText: "Campus Repsol-Madrid", bulletFields: ["R-44"] }] }), { headers: { "Content-Type": "application/json" } });
  };
  try {
    const response = await worker.fetch(new Request("https://example.test/api/search?q=desarrollo%20de%20negocio&sources=repsol"), { ASSETS: { fetch: () => new Response("not used") } });
    const payload = await response.json();
    assert.equal(payload.results[0].company, "Repsol");
    assert.deepEqual(payload.sources, ["Repsol Careers"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("recupera una vacante española desde el conector oficial de Acciona", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /acciona\.wd3\.myworkdayjobs\.com/);
    assert.equal(JSON.parse(options.body).limit, 20);
    return new Response(JSON.stringify({ total: 1, jobPostings: [{ title: "Desarrollo de Negocio", externalPath: "/job/Madrid/Desarrollo-de-Negocio_20101001", locationsText: "Madrid", bulletFields: ["20101001"] }] }), { headers: { "Content-Type": "application/json" } });
  };
  try {
    const response = await worker.fetch(new Request("https://example.test/api/search?q=desarrollo%20de%20negocio&sources=acciona"), { ASSETS: { fetch: () => new Response("not used") } });
    const payload = await response.json();
    assert.equal(payload.results[0].company, "Acciona");
    assert.deepEqual(payload.sources, ["Acciona Careers"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

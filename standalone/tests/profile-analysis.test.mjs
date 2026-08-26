import assert from "node:assert/strict";
import test from "node:test";
import { explainKeywordFit, extractProfileFromCvText, locationAdjustment, requiredExperienceYears } from "../public/profileAnalysis.js";
import { buildSearchPlan, profileMatchEvidence, queryMatchEvidence } from "../public/matching.js";

test("extrae competencias y experiencia de un CV en texto de forma local", () => {
  const profile = extractProfileFromCvText("Profesional con más de 8 años de experiencia en comercio exterior, Power BI, Excel, relaciones institucionales e inglés e italiano.");
  assert.equal(profile.yearsExperience, "8");
  assert.match(profile.keywords, /comercio exterior/);
  assert.match(profile.roles, /relaciones institucionales/);
  assert.match(profile.languages, /inglés/);
  assert.ok(profile.experience.length > 30);
});

test("detecta el requisito de experiencia más alto de una oferta", () => {
  assert.equal(requiredExperienceYears("Al menos 5 años de experiencia en ventas"), 5);
  assert.equal(requiredExperienceYears("Experiencia de 3-5 años en mercados"), 5);
  assert.equal(requiredExperienceYears("Sin requisito de antigüedad"), 0);
});

test("convierte sinónimos de mercado en etiquetas de coincidencia y carencia explicables", () => {
  const result = explainKeywordFit({ keywords: "Desarrollo de negocio, Excel, Inglés", roles: "", areas: "", experience: "", languages: "" }, {
    title: "Business Developer",
    area: "Energía", description: "Se requiere market intelligence, English y PowerBI.", requirements: "",
  });
  assert.ok(result.matched.includes("desarrollo de negocio"));
  assert.ok(result.matched.includes("inglés"));
  assert.ok(result.missing.includes("power bi"));
});

test("mantiene una oportunidad fuerte fuera de la ubicación preferida como revisión y no como descarte rígido", () => {
  assert.deepEqual(locationAdjustment("Madrid", "Barcelona", "Presencial"), { score: 0, review: true, penalty: 12 });
  assert.deepEqual(locationAdjustment("Madrid", "Barcelona", "Remoto"), { score: 8, review: false, penalty: 0 });
});

test("reconoce partnerships y expansión internacional como equivalencias válidas", () => {
  const evidence = profileMatchEvidence({ keywords: "desarrollo de negocio, internacionalización", roles: "", areas: "", experience: "" }, { title: "Strategic Partnerships Manager", area: "", description: "Lead international expansion and market entry", requirements: "" });
  assert.ok(evidence.matched.includes("desarrollo de negocio"));
  assert.ok(evidence.matched.includes("internacionalización"));
});

test("el plan de búsqueda otorga mayor peso a una coincidencia semántica en el título", () => {
  assert.equal(buildSearchPlan("desarrollo de negocio internacional").primary, "desarrollo de negocio");
  const result = queryMatchEvidence("desarrollo de negocio internacional", { title: "Business Development Manager", area: "", description: "", requirements: "" });
  assert.equal(result.titleMatch, true);
  assert.ok(result.score >= 10);
});

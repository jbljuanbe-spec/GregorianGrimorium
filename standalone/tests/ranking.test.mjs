import assert from "node:assert/strict";
import test from "node:test";
import { filterByTargetCompany, rankAndFilterJobs, rankJob } from "../public/ranking.js";

test("el ranking real conserva una oferta fuerte de empresa objetivo fuera de Madrid como revisión", () => {
  const profile = {
    keywords: "desarrollo de negocio, comercio exterior, internacionalización, análisis de mercado, relaciones institucionales, energía, power bi, excel",
    roles: "desarrollo de negocio internacional, comercio exterior, relaciones institucionales",
    areas: "energía, internacionalización",
    experience: "desarrollo de negocio internacional, análisis de mercado, gestión de stakeholders",
    languages: "inglés C1, italiano C1",
    locations: "Madrid",
    yearsExperience: "8",
  };
  const job = rankJob(profile, { title: "Business Development y Comercio Exterior", company: "Iberdrola", location: "Barcelona", modality: "Presencial", area: "Energía", description: "Internacionalización, análisis de mercado, relaciones institucionales, Power BI, Excel e inglés. Mínimo 5 años de experiencia.", requirements: "" });
  assert.equal(job.fit.locationVeto, true);
  assert.equal(job.fit.experienceFit, true);
  assert.ok(job.fit.score > 35);
});

test("el filtro de experiencia puede dejar un estado vacío sin ocultar la fuente consultada", () => {
  const profile = { keywords: "desarrollo de negocio", roles: "", areas: "", experience: "", languages: "inglés", locations: "Madrid", yearsExperience: "3" };
  const jobs = [{ title: "Desarrollo de negocio", company: "Iberdrola", location: "Madrid, Spain", modality: "Presencial", area: "Energía", description: "Se requieren mínimo 8 años de experiencia", requirements: "" }];
  assert.equal(rankAndFilterJobs(profile, jobs, "fit").length, 0);
});

test("el filtro de radar conserva solo resultados de empresas objetivo o de una empresa concreta", () => {
  const jobs = [{ fit: { targetCompany: { name: "Iberdrola" } } }, { fit: { targetCompany: { name: "Santander" } } }, { fit: { targetCompany: null } }];
  assert.equal(filterByTargetCompany(jobs, "target").length, 2);
  assert.deepEqual(filterByTargetCompany(jobs, "Iberdrola"), [jobs[0]]);
});

test("prioriza una coincidencia de rol en el título y la consulta frente a una mención secundaria en la descripción", () => {
  const profile = { keywords: "desarrollo de negocio, internacionalización, excel", roles: "desarrollo de negocio internacional", areas: "", experience: "", languages: "inglés C1", locations: "Madrid", yearsExperience: "6" };
  const titleMatch = rankJob(profile, { title: "Business Development Manager", company: "Empresa", location: "Madrid", modality: "Híbrido", area: "Internacionalización", description: "Excel e inglés", requirements: "" }, "desarrollo de negocio internacional");
  const descriptionOnly = rankJob(profile, { title: "Operations Coordinator", company: "Empresa", location: "Madrid", modality: "Híbrido", area: "Operaciones", description: "Apoyo ocasional a business development y Excel", requirements: "" }, "desarrollo de negocio internacional");
  assert.ok(titleMatch.fit.score > descriptionOnly.fit.score);
  assert.equal(titleMatch.fit.confidence, "alta");
});

test("no penaliza una oportunidad italiana cuando el usuario ha elegido Italia como ámbito", () => {
  const profile = { keywords: "desarrollo de negocio, internacionalización", roles: "desarrollo de negocio internacional", areas: "", experience: "", languages: "inglés C1, italiano C1", locations: "Madrid", yearsExperience: "6" };
  const vacancy = { title: "Business Development Manager", company: "Empresa internacional", location: "Milano, Italia", country: "Italy", modality: "Híbrido", area: "Internacionalización", description: "International expansion", requirements: "Italian C1" };
  const local = rankJob(profile, vacancy, "desarrollo de negocio", "spain");
  const italy = rankJob(profile, vacancy, "desarrollo de negocio", "italy");
  assert.ok(italy.fit.score > local.fit.score);
  assert.ok(italy.fit.factors.location >= 8);
});

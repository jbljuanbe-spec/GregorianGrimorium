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

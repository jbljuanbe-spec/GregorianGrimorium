import { findTargetCompany } from "./targetCompanies.js";
import { explainKeywordFit, locationAdjustment, requiredExperienceYears } from "./profileAnalysis.js";
import { profileMatchEvidence, queryMatchEvidence } from "./matching.js";

const text = (value = "") => String(value).toLocaleLowerCase("es-ES");

export function rankJob(profile, job, query = "") {
  const keywordFit = explainKeywordFit(profile, job);
  const semanticFit = profileMatchEvidence(profile, job);
  const queryFit = queryMatchEvidence(query, job);
  const locationFit = locationAdjustment(profile.locations, job.location, job.modality);
  const languageLabels = ["inglés", "ingles", "italiano", "español", "espanol", "francés", "frances", "alemán", "aleman"];
  const corpus = text(`${job.title || ""} ${job.description || ""} ${job.requirements || ""}`);
  const requested = languageLabels.filter(language => corpus.includes(language));
  const known = languageLabels.filter(language => text(profile.languages).includes(language));
  const languageScore = !requested.length ? 0 : Math.round(requested.filter(language => known.includes(language)).length / requested.length * 8);
  const targetCompany = findTargetCompany(job.company);
  const targetBoost = targetCompany ? 4 : 0;
  const requiredYears = requiredExperienceYears(`${job.title} ${job.description} ${job.requirements}`);
  const profileYears = Number(profile.yearsExperience) || 0;
  const experienceScore = !requiredYears || !profileYears ? 0 : profileYears >= requiredYears ? 4 : -12;
  const weightedMatch = semanticFit.details.reduce((sum, item) => sum + item.weight, 0);
  const possibleMatch = Math.max(semanticFit.details.length * 2, 1);
  const competencyScore = Math.round(weightedMatch / possibleMatch * 36);
  const locationScore = Math.round(locationFit.score * .8) - Math.round(locationFit.penalty * .75);
  const roleTitleScore = semanticFit.details.some(item => item.titleMatch) ? 18 : 0;
  const score = Math.min(100, Math.max(0, roleTitleScore + competencyScore + queryFit.score + locationScore + languageScore + targetBoost + experienceScore));
  const matched = [...new Set([...semanticFit.matched, ...queryFit.matched, ...keywordFit.matched])];
  return {
    ...job,
    fit: {
      score,
      matched: matched.slice(0, 7),
      missing: [...new Set([...keywordFit.missing, ...semanticFit.missing])].slice(0, 4),
      locationVeto: locationFit.review,
      targetCompany,
      requiredYears,
      profileYears,
      experienceFit: !requiredYears || !profileYears || profileYears >= requiredYears,
      confidence: semanticFit.details.some(item => item.titleMatch) || semanticFit.matched.length >= 2 ? "alta" : semanticFit.matched.length ? "media" : "baja",
      factors: { title: roleTitleScore, competencies: competencyScore, query: queryFit.score, location: locationScore, languages: languageScore, target: targetBoost, experience: experienceScore },
    },
  };
}

export function rankAndFilterJobs(profile, jobs, experienceFilter = "all", query = "") {
  return jobs
    .map(job => rankJob(profile, job, query))
    .filter(job => experienceFilter !== "fit" || job.fit.experienceFit)
    .sort((a, b) => b.fit.score - a.fit.score || Date.parse(b.publishedAt || "") - Date.parse(a.publishedAt || ""));
}

export function filterByTargetCompany(jobs, selection = "all") {
  if (selection === "all") return jobs;
  if (selection === "target") return jobs.filter(job => Boolean(job.fit.targetCompany));
  return jobs.filter(job => job.fit.targetCompany?.name === selection);
}

import { findTargetCompany } from "./targetCompanies.js";
import { explainKeywordFit, locationAdjustment, requiredExperienceYears } from "./profileAnalysis.js";

const text = (value = "") => String(value).toLocaleLowerCase("es-ES");

export function rankJob(profile, job) {
  const keywordFit = explainKeywordFit(profile, job);
  const keywords = keywordFit.profileTags;
  const matched = keywordFit.matched;
  const locationFit = locationAdjustment(profile.locations, job.location, job.modality);
  const languageLabels = ["inglés", "ingles", "italiano", "español", "espanol", "francés", "frances", "alemán", "aleman"];
  const corpus = text(`${job.title || ""} ${job.description || ""} ${job.requirements || ""}`);
  const requested = languageLabels.filter(language => corpus.includes(language));
  const known = languageLabels.filter(language => text(profile.languages).includes(language));
  const languageScore = !requested.length ? 10 : Math.round(requested.filter(language => known.includes(language)).length / requested.length * 10);
  const targetCompany = findTargetCompany(job.company);
  const targetBoost = targetCompany ? 8 : 0;
  const requiredYears = requiredExperienceYears(`${job.title} ${job.description} ${job.requirements}`);
  const profileYears = Number(profile.yearsExperience) || 0;
  const experienceScore = !requiredYears || !profileYears ? 0 : profileYears >= requiredYears ? 7 : -20;
  const score = Math.min(100, Math.max(0, Math.round(matched.length / Math.max(keywords.length, 1) * 75) + locationFit.score + languageScore + targetBoost + experienceScore - locationFit.penalty));
  return {
    ...job,
    fit: {
      score,
      matched: matched.slice(0, 7),
      missing: keywordFit.missing.slice(0, 4),
      locationVeto: locationFit.review,
      targetCompany,
      requiredYears,
      profileYears,
      experienceFit: !requiredYears || !profileYears || profileYears >= requiredYears,
    },
  };
}

export function rankAndFilterJobs(profile, jobs, experienceFilter = "all") {
  return jobs
    .map(job => rankJob(profile, job))
    .filter(job => experienceFilter !== "fit" || job.fit.experienceFit)
    .sort((a, b) => b.fit.score - a.fit.score);
}

export function filterByTargetCompany(jobs, selection = "all") {
  if (selection === "all") return jobs;
  if (selection === "target") return jobs.filter(job => Boolean(job.fit.targetCompany));
  return jobs.filter(job => job.fit.targetCompany?.name === selection);
}

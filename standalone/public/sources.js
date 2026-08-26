import { buildSearchPlan } from "./matching.js";
import { isWithinScope, normaliseScope } from "../shared/scope.js";

const SOURCE_LIMIT = 50;
const RESULT_LIMIT = 120;

const cleanText = (value = "") => String(value).replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#x27;|&quot;|&amp;/g, " ").replace(/\s+/g, " ").trim();

const canonicalUrl = value => {
  try {
    const url = new URL(value);
    url.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "ref", "source"].forEach(key => url.searchParams.delete(key));
    return url.toString();
  } catch { return ""; }
};

const requisitionKey = job => {
  const company = cleanText(job.company).toLocaleLowerCase("es-ES").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const corpus = `${job.vacancyId || ""} ${job.id || ""} ${job.sourceUrl || ""} ${job.description || ""} ${job.requirements || ""}`;
  const match = corpus.match(/\bR[-_ ]?(\d{3,})(?:-\d+)?\b/i);
  return match && company ? `${company}|r-${match[1]}` : "";
};

const normaliseArbeitnow = item => ({
  id: `arbeitnow:${item.slug || canonicalUrl(item.url)}`, source: "Arbeitnow", sourceUrl: canonicalUrl(item.url), title: cleanText(item.title), company: cleanText(item.company_name), location: cleanText(item.location) || "Ubicación no indicada", country: cleanText(item.location), modality: item.remote ? "Remoto" : "No indicada", contractType: cleanText(item.job_types?.join(", ")) || "No indicado", area: "Oferta de empleo", publishedAt: item.created_at ? new Date(item.created_at * 1000).toISOString() : null, description: cleanText(item.description), requirements: cleanText(item.tags?.join(", ")), remote: Boolean(item.remote),
});

const normaliseJobicy = item => ({
  id: `jobicy:${item.id || canonicalUrl(item.url)}`, source: "Jobicy", sourceUrl: canonicalUrl(item.url), title: cleanText(item.jobTitle), company: cleanText(item.companyName), location: cleanText(item.jobGeo) || "Remoto", country: cleanText(item.jobGeo), modality: "Remoto", contractType: cleanText(item.jobType?.join(", ")) || "No indicado", area: cleanText(item.jobIndustry?.join(", ")) || "Remoto internacional", publishedAt: item.pubDate || null, description: cleanText(item.jobExcerpt || item.jobDescription), requirements: cleanText(item.jobLevel || ""), remote: true,
});

export function normaliseAndDeduplicate(sourceGroups, scopeOrIncludeRemote = "spain", remoteOption = false) {
  const includeRemote = typeof scopeOrIncludeRemote === "boolean" ? scopeOrIncludeRemote : remoteOption;
  const scope = typeof scopeOrIncludeRemote === "boolean" ? "spain" : normaliseScope(scopeOrIncludeRemote);
  const urlKeys = new Set();
  const requisitionKeys = new Set();
  const output = [];
  sourceGroups.flat().forEach(job => {
    if (!job.title || !job.company || !job.sourceUrl || !isWithinScope(job, scope, includeRemote)) return;
    const urlKey = canonicalUrl(job.sourceUrl);
    const requisition = requisitionKey(job);
    if (urlKeys.has(urlKey) || (requisition && requisitionKeys.has(requisition))) return;
    urlKeys.add(urlKey); if (requisition) requisitionKeys.add(requisition); output.push({ ...job, sourceUrl: urlKey });
  });
  return output.sort((a, b) => Date.parse(b.publishedAt || "") - Date.parse(a.publishedAt || "")).slice(0, RESULT_LIMIT);
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Fuente no disponible (${response.status})`);
  return response.json();
}

export async function searchPublicSources({ query, sources, includeRemote, scope = "spain" }) {
  const groups = [];
  const sourceErrors = [];
  const usedSources = [];
  const jobs = [];
  if (sources.includes("arbeitnow")) jobs.push(["Arbeitnow", () => fetchJson("https://www.arbeitnow.com/api/job-board-api").then(payload => (payload.data || []).slice(0, SOURCE_LIMIT).map(normaliseArbeitnow))]);
  if (sources.includes("jobicy")) {
    const url = new URL("https://jobicy.com/api/v2/remote-jobs");
    url.searchParams.set("count", String(SOURCE_LIMIT));
    if (query) url.searchParams.set("tag", buildSearchPlan(query).primary);
    jobs.push(["Jobicy", () => fetchJson(url).then(payload => (payload.jobs || []).map(normaliseJobicy))]);
  }
  await Promise.all(jobs.map(async ([source, operation]) => {
    try { groups.push(await operation()); usedSources.push(source); } catch (error) { sourceErrors.push({ source, message: error instanceof Error ? error.message : "Fuente no disponible" }); }
  }));
  return { results: normaliseAndDeduplicate(groups, scope, includeRemote), sources: usedSources, sourceErrors };
}

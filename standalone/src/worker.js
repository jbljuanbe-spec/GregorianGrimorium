const SOURCE_LIMIT = 50;
const RESULT_LIMIT = 120;
const WORKDAY_PAGE_SIZE = 20;
const MAX_WORKDAY_PAGES = 5;

const responseHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function cleanText(value = "") {
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#x27;|&quot;|&amp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "ref", "source"].forEach(key => url.searchParams.delete(key));
    return url.toString();
  } catch {
    return "";
  }
}

function normalizedKey(job) {
  return [job.company, job.title, job.location]
    .map(value => cleanText(value).toLocaleLowerCase("es-ES").normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
    .join("|");
}

function isSpainOrRemote(job, includeRemote) {
  const location = `${job.location || ""} ${job.country || ""}`.toLocaleLowerCase("es-ES");
  return location.includes("spain") || location.includes("españa") || location.includes("madrid") || location.includes("barcelona") || location.includes("valencia") || location.includes("bilbao") || location.includes("sevilla") || (includeRemote && job.remote === true);
}

function normaliseArbeitnow(item) {
  return {
    id: `arbeitnow:${item.slug || canonicalUrl(item.url)}`,
    source: "Arbeitnow",
    sourceUrl: canonicalUrl(item.url),
    title: cleanText(item.title),
    company: cleanText(item.company_name),
    location: cleanText(item.location) || "Ubicación no indicada",
    country: cleanText(item.location),
    modality: item.remote ? "Remoto" : "No indicada",
    contractType: cleanText(item.job_types?.join(", ")) || "No indicado",
    area: "Oferta de empleo",
    publishedAt: item.created_at ? new Date(item.created_at * 1000).toISOString() : null,
    description: cleanText(item.description),
    requirements: cleanText(item.tags?.join(", ")),
    remote: Boolean(item.remote),
  };
}

function normaliseJobicy(item) {
  return {
    id: `jobicy:${item.id || canonicalUrl(item.url)}`,
    source: "Jobicy",
    sourceUrl: canonicalUrl(item.url),
    title: cleanText(item.jobTitle),
    company: cleanText(item.companyName),
    location: cleanText(item.jobGeo) || "Remoto",
    country: cleanText(item.jobGeo),
    modality: "Remoto",
    contractType: cleanText(item.jobType?.join(", ")) || "No indicado",
    area: cleanText(item.jobIndustry?.join(", ")) || "Remoto internacional",
    publishedAt: item.pubDate || null,
    description: cleanText(item.jobExcerpt || item.jobDescription),
    requirements: cleanText(item.jobLevel || ""),
    remote: true,
  };
}

function normaliseAdzuna(item) {
  return {
    id: `adzuna:${item.id || canonicalUrl(item.redirect_url)}`,
    source: "Adzuna",
    sourceUrl: canonicalUrl(item.redirect_url),
    title: cleanText(item.title),
    company: cleanText(item.company?.display_name),
    location: cleanText(item.location?.display_name),
    country: cleanText(item.location?.area?.join(", ")),
    modality: "No indicada",
    contractType: cleanText(item.contract_type) || "No indicado",
    area: cleanText(item.category?.label) || "Oferta de empleo",
    publishedAt: item.created || null,
    description: cleanText(item.description),
    requirements: "",
    remote: /remote|remoto/i.test(`${item.title} ${item.description}`),
  };
}

export function normaliseIberdrola(item) {
  const sourceUrl = `https://iberdrola.wd3.myworkdayjobs.com/en-US/Iberdrola${item.externalPath || ""}`;
  return {
    id: `iberdrola:${item.externalPath || item.title}`,
    source: "Iberdrola Careers",
    sourceUrl: canonicalUrl(sourceUrl),
    title: cleanText(item.title),
    company: "Iberdrola",
    location: cleanText(item.locationsText) || "Ubicación no indicada",
    country: cleanText(`${item.locationsText} ${item.externalPath}`),
    modality: "No indicada",
    contractType: "No indicado",
    area: "Energía",
    publishedAt: null,
    description: cleanText(item.bulletFields?.join(", ")),
    requirements: "",
    remote: /remote|remoto/i.test(`${item.title} ${item.locationsText}`),
  };
}

export function normaliseAndDeduplicate(sourceGroups, includeRemote) {
  const urlKeys = new Set();
  const contentKeys = new Set();
  const output = [];

  sourceGroups.flat().forEach(job => {
    if (!job.title || !job.company || !job.sourceUrl || !isSpainOrRemote(job, includeRemote)) return;
    const urlKey = canonicalUrl(job.sourceUrl);
    const contentKey = normalizedKey(job);
    if (urlKeys.has(urlKey) || contentKeys.has(contentKey)) return;
    urlKeys.add(urlKey);
    contentKeys.add(contentKey);
    output.push({ ...job, sourceUrl: urlKey });
  });

  return output
    .sort((a, b) => Date.parse(b.publishedAt || "") - Date.parse(a.publishedAt || ""))
    .slice(0, RESULT_LIMIT);
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Fuente no disponible (${response.status})`);
  return response.json();
}

async function searchArbeitnow() {
  const payload = await fetchJson("https://www.arbeitnow.com/api/job-board-api");
  return (payload.data || []).slice(0, SOURCE_LIMIT).map(normaliseArbeitnow);
}

async function searchJobicy(query) {
  const url = new URL("https://jobicy.com/api/v2/remote-jobs");
  url.searchParams.set("count", String(SOURCE_LIMIT));
  if (query) url.searchParams.set("tag", query);
  const payload = await fetchJson(url.toString());
  return (payload.jobs || []).map(normaliseJobicy);
}

export function broadenAdzunaQuery(query) {
  const normalized = cleanText(query).toLocaleLowerCase("es-ES");
  if (/desarrollo.*negocio|business development|comercial/.test(normalized)) return "desarrollo de negocio";
  if (/comercio exterior|exportaci[oó]n|internacionalizaci[oó]n/.test(normalized)) return "comercio exterior";
  if (/relaciones institucionales|asuntos p[uú]blicos|public affairs/.test(normalized)) return "asuntos públicos";
  if (/mercado|inteligencia/.test(normalized)) return "análisis de mercado";
  return query || "desarrollo de negocio";
}

async function searchAdzuna(query, location, env) {
  if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) return [];
  const url = new URL("https://api.adzuna.com/v1/api/jobs/es/search/1");
  url.searchParams.set("app_id", env.ADZUNA_APP_ID);
  url.searchParams.set("app_key", env.ADZUNA_APP_KEY);
  url.searchParams.set("what", broadenAdzunaQuery(query));
  if (location) url.searchParams.set("where", location);
  url.searchParams.set("results_per_page", String(SOURCE_LIMIT));
  url.searchParams.set("content-type", "application/json");
  const payload = await fetchJson(url.toString());
  return (payload.results || []).map(normaliseAdzuna);
}

async function fetchIberdrolaPage(query, offset) {
  const response = await fetch("https://iberdrola.wd3.myworkdayjobs.com/wday/cxs/iberdrola/Iberdrola/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ limit: WORKDAY_PAGE_SIZE, offset, searchText: broadenAdzunaQuery(query) }),
  });
  if (!response.ok) throw new Error(`Fuente corporativa no disponible (${response.status})`);
  return response.json();
}

async function searchIberdrola(query) {
  const firstPage = await fetchIberdrolaPage(query, 0);
  const total = Math.min(Number(firstPage.total) || 0, WORKDAY_PAGE_SIZE * MAX_WORKDAY_PAGES);
  const offsets = Array.from({ length: Math.max(0, Math.ceil(total / WORKDAY_PAGE_SIZE) - 1) }, (_, index) => (index + 1) * WORKDAY_PAGE_SIZE);
  const extraPages = await Promise.all(offsets.map(offset => fetchIberdrolaPage(query, offset)));
  return [firstPage, ...extraPages].flatMap(payload => payload.jobPostings || []).map(normaliseIberdrola);
}

async function search(request, env) {
  const url = new URL(request.url);
  const query = cleanText(url.searchParams.get("q") || "").slice(0, 100);
  const location = cleanText(url.searchParams.get("location") || "Madrid").slice(0, 80);
  const includeRemote = url.searchParams.get("remote") === "true";
  const enabled = new Set((url.searchParams.get("sources") || "arbeitnow,jobicy,adzuna,iberdrola").split(","));
  const jobs = [];
  const sourceErrors = [];

  const sources = [
    ["arbeitnow", searchArbeitnow],
    ["jobicy", () => searchJobicy(query)],
    ["adzuna", () => searchAdzuna(query, location, env)],
    ["iberdrola", () => searchIberdrola(query)],
  ];

  await Promise.all(sources.map(async ([name, operation]) => {
    if (!enabled.has(name)) return;
    try {
      jobs.push(await operation());
    } catch (error) {
      sourceErrors.push({ source: name, message: error instanceof Error ? error.message : "Fuente no disponible" });
    }
  }));

  const results = normaliseAndDeduplicate(jobs, includeRemote);
  const sourceLabels = { arbeitnow: "Arbeitnow", jobicy: "Jobicy", adzuna: "Adzuna", iberdrola: "Iberdrola Careers" };
  const activeSources = [...enabled]
    .filter(name => name !== "adzuna" || Boolean(env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY))
    .map(name => sourceLabels[name] || name);
  if (enabled.has("adzuna") && !activeSources.includes("Adzuna")) {
    sourceErrors.push({ source: "Adzuna", message: "Configura la clave gratuita en el Worker para activar esta fuente" });
  }
  return new Response(JSON.stringify({
    query,
    effectiveQuery: enabled.has("adzuna") ? broadenAdzunaQuery(query) : query,
    location,
    generatedAt: new Date().toISOString(),
    sources: activeSources,
    sourceErrors,
    results,
  }), { headers: responseHeaders });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") return new Response(JSON.stringify({ ok: true, service: "byscador-search" }), { headers: responseHeaders });
    if (url.pathname === "/api/search") return search(request, env);
    return env.ASSETS.fetch(request);
  },
};

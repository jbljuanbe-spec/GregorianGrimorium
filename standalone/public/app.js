import { normaliseAndDeduplicate, searchPublicSources } from "./sources.js";
import { findTargetCompany, targetCompanies } from "./targetCompanies.js";

const defaults = {
  headline: "Desarrollo de Negocio Internacional · Comercio Exterior · Relaciones Institucionales",
  summary: "Profesional internacional orientado a inteligencia de mercado, expansión comercial, coordinación institucional y análisis de oportunidades en entornos regulados.",
  experience: "Desarrollo de negocio internacional, comercio exterior, análisis de mercado, gestión de stakeholders, programas institucionales y coordinación con interlocutores públicos y privados.",
  keywords: "internacionalización, desarrollo de negocio, comercio exterior, business development, análisis de mercado, inteligencia regulatoria, relaciones institucionales, exportación, ICEX, Incoterms, Power BI, Excel, SAP, CRM, KPIs, aeroespacial, defensa, Italia, EMEA",
  roles: "desarrollo de negocio internacional, comercio exterior, relaciones institucionales, asuntos públicos, project manager internacional, analista de mercados",
  areas: "internacionalización, defensa y aeroespacial, asociaciones sectoriales, cámaras de comercio, energía, industria, promoción exterior",
  locations: "Madrid",
  languages: "español nativo, inglés C1, italiano C1",
};

const profileKey = "byscador-standalone-profile";
const seenKey = "byscador-standalone-seen";
const searchHistoryKey = "byscador-standalone-search-history";
const profile = { ...defaults, ...JSON.parse(localStorage.getItem(profileKey) || "{}") };
const seen = new Set(JSON.parse(localStorage.getItem(seenKey) || "[]"));
let searchHistory = JSON.parse(localStorage.getItem(searchHistoryKey) || "[]");
const elements = {
  query: document.querySelector("#query"), location: document.querySelector("#location"), searchButton: document.querySelector("#search-button"), profileHeadline: document.querySelector("#profile-headline"), profileSummary: document.querySelector("#profile-summary"), profileKeywords: document.querySelector("#profile-keywords"),
  results: document.querySelector("#results"), summary: document.querySelector("#summary"), empty: document.querySelector("#empty-state"), template: document.querySelector("#result-template"), targetList: document.querySelector("#target-list"), targetToggle: document.querySelector("#target-toggle"), targetCount: document.querySelector("#target-count"),
  profilePanel: document.querySelector("#profile-panel"), profileToggle: document.querySelector("#profile-toggle"), profileClose: document.querySelector("#profile-close"), profileForm: document.querySelector("#profile-form"), history: document.querySelector("#search-history"),
};

function split(value) { return value.split(/[,;\n|]/).map(item => item.trim().toLocaleLowerCase("es-ES")).filter(Boolean); }
function text(value = "") { return String(value).toLocaleLowerCase("es-ES"); }
function match(job) {
  const corpus = text(`${job.title} ${job.area} ${job.description} ${job.requirements}`);
  const keywords = [...new Set([...split(profile.keywords), ...split(profile.roles), ...split(profile.areas), ...split(profile.experience)])];
  const matched = keywords.filter(keyword => corpus.includes(keyword));
  const locationScore = split(profile.locations).some(place => text(job.location).includes(place)) ? 15 : job.modality === "Remoto" ? 8 : 0;
  const languageLabels = ["inglés", "ingles", "italiano", "español", "espanol", "francés", "frances", "alemán", "aleman"];
  const requested = languageLabels.filter(language => corpus.includes(language));
  const known = languageLabels.filter(language => text(profile.languages).includes(language));
  const languageScore = !requested.length ? 10 : Math.round(requested.filter(language => known.includes(language)).length / requested.length * 10);
  const targetCompany = findTargetCompany(job.company);
  const targetBoost = targetCompany ? 8 : 0;
  const score = Math.min(100, Math.round(matched.length / Math.max(keywords.length, 1) * 75) + locationScore + languageScore + targetBoost);
  const rawRequirements = split(job.requirements || job.description).filter(item => item.length > 3).slice(0, 12);
  const profileText = text(`${profile.keywords} ${profile.roles} ${profile.areas} ${profile.languages} ${profile.experience}`);
  const missing = rawRequirements.filter(requirement => !profileText.includes(requirement)).slice(0, 4);
  const locationVeto = split(profile.locations).length && locationScore === 0 && job.modality !== "Remoto";
  return { ...job, fit: { score: locationVeto ? Math.min(score, 35) : score, matched: matched.slice(0, 7), missing, locationVeto, targetCompany } };
}

function formatDate(value) { if (!value) return "Fecha no indicada"; const date = new Date(value); return Number.isNaN(date.valueOf()) ? "Fecha no indicada" : date.toLocaleDateString("es-ES", { day: "numeric", month: "short" }); }

function saveSearchHistory(entry) {
  const key = `${entry.query.toLocaleLowerCase("es-ES")}|${entry.location.toLocaleLowerCase("es-ES")}|${entry.sources.join(",")}|${entry.remote}`;
  searchHistory = [entry, ...searchHistory.filter(item => `${item.query.toLocaleLowerCase("es-ES")}|${item.location.toLocaleLowerCase("es-ES")}|${item.sources.join(",")}|${item.remote}` !== key)].slice(0, 6);
  localStorage.setItem(searchHistoryKey, JSON.stringify(searchHistory));
  renderSearchHistory();
}

function renderSearchHistory() {
  elements.history.replaceChildren();
  if (!searchHistory.length) return;
  const title = document.createElement("p"); title.className = "history-label"; title.textContent = "CONSULTAS RECIENTES"; elements.history.append(title);
  searchHistory.forEach(entry => {
    const button = document.createElement("button");
    button.className = "history-item";
    const queryLabel = document.createElement("strong");
    const detailLabel = document.createElement("span");
    const selectedSources = Array.isArray(entry.sources) ? entry.sources : [];
    queryLabel.textContent = String(entry.query || "Búsqueda amplia");
    detailLabel.textContent = `${String(entry.location || "España")} · ${selectedSources.join(", ")}`;
    button.append(queryLabel, detailLabel);
    button.addEventListener("click", () => {
      elements.query.value = entry.query; elements.location.value = entry.location;
      document.querySelector("#include-remote").checked = entry.remote;
      document.querySelectorAll('input[name="source"]').forEach(input => { input.checked = selectedSources.includes(input.value); });
      search();
    });
    elements.history.append(button);
  });
}

function render(jobs, sourceNames, errors, effectiveQuery) {
  elements.results.replaceChildren();
  elements.empty.hidden = Boolean(jobs.length);
  const sorted = jobs.map(match).sort((a, b) => b.fit.score - a.fit.score);
  const newCount = sorted.filter(job => !seen.has(job.sourceUrl)).length;
  elements.summary.replaceChildren();
  const summaryLine = document.createElement("span");
  const resultCount = document.createElement("strong"); resultCount.textContent = String(sorted.length);
  const newResultCount = document.createElement("strong"); newResultCount.textContent = String(newCount);
  summaryLine.append(resultCount, " ofertas verificables · ", newResultCount, ` nuevas para este navegador · Fuentes: ${sourceNames.join(", ") || "ninguna"}${effectiveQuery ? ` · consulta ampliada: ${effectiveQuery}` : ""}`);
  elements.summary.append(summaryLine);
  if (errors.length) { const errorLine = document.createElement("small"); errorLine.textContent = errors.map(error => `${error.source}: ${error.message}`).join(" · "); elements.summary.append(errorLine); }
  sorted.forEach(job => {
    const node = elements.template.content.cloneNode(true);
    node.querySelector(".score strong").textContent = job.fit.score;
    node.querySelector(".source").textContent = `${job.source}${job.fit.targetCompany ? ` · empresa objetivo: ${job.fit.targetCompany.name}` : ""}${job.fit.locationVeto ? " · ubicación por revisar" : ""}`;
    node.querySelector("h2").textContent = job.title;
    node.querySelector(".company").textContent = `${job.company} · ${job.location} · ${job.modality}`;
    node.querySelector("time").textContent = formatDate(job.publishedAt);
    const tags = node.querySelector(".tags");
    [job.area, job.contractType].filter(Boolean).forEach(tag => { const tagNode = document.createElement("span"); tagNode.textContent = String(tag); tags.append(tagNode); });
    node.querySelector(".description").textContent = job.description || "La fuente no ha publicado un resumen de la oferta.";
    node.querySelector(".matched").textContent = job.fit.matched.join(" · ") || "Coincidencia parcial por revisar";
    node.querySelector(".missing").textContent = job.fit.missing.join(" · ") || "Sin carencias explícitas detectadas";
    const link = node.querySelector(".apply"); link.href = job.sourceUrl; link.addEventListener("click", () => { seen.add(job.sourceUrl); localStorage.setItem(seenKey, JSON.stringify([...seen])); });
    elements.results.append(node);
  });
}

async function search() {
  const query = elements.query.value.trim();
  const location = elements.location.value.trim();
  const sources = [...document.querySelectorAll('input[name="source"]:checked')].map(input => input.value);
  const remote = document.querySelector("#include-remote").checked;
  elements.searchButton.disabled = true; elements.searchButton.textContent = "Buscando…";
  elements.summary.textContent = "Consultando fuentes autorizadas y eliminando duplicados…";
  try {
    const publicSources = sources.filter(source => source !== "adzuna");
    const payload = await searchPublicSources({ query, sources: publicSources, includeRemote: remote });
    if (sources.includes("adzuna")) {
      try {
        const params = new URLSearchParams({ q: query, location, sources: "adzuna", remote: String(remote) });
        const response = await fetch(`/api/search?${params}`);
        if (response.ok) {
          const adzuna = await response.json();
          payload.results = normaliseAndDeduplicate([payload.results, adzuna.results || []], remote);
          payload.sources = [...new Set([...payload.sources, ...(adzuna.sources || [])])];
          payload.sourceErrors.push(...(adzuna.sourceErrors || []));
        } else {
          payload.sourceErrors.push({ source: "Adzuna", message: "Configura la clave gratuita en el Worker para activar esta fuente" });
        }
      } catch {
        payload.sourceErrors.push({ source: "Adzuna", message: "Configura la clave gratuita en el Worker para activar esta fuente" });
      }
    }
    saveSearchHistory({ query, location, sources, remote, searchedAt: new Date().toISOString() });
    render(payload.results || [], payload.sources || [], payload.sourceErrors || [], payload.effectiveQuery || query);
  } catch (error) {
    elements.summary.textContent = error instanceof Error ? error.message : "No se pudo completar la búsqueda";
  } finally { elements.searchButton.disabled = false; elements.searchButton.textContent = "Buscar ofertas"; }
}

function renderProfileSnapshot() {
  elements.profileHeadline.textContent = profile.headline;
  elements.profileSummary.textContent = profile.summary;
  elements.profileKeywords.replaceChildren();
  split(profile.keywords).slice(0, 8).forEach(keyword => { const item = document.createElement("span"); item.textContent = keyword; elements.profileKeywords.append(item); });
}

function renderTargetRadar() {
  elements.targetCount.textContent = String(targetCompanies.length);
  elements.targetList.replaceChildren();
  targetCompanies.forEach(target => {
    const link = document.createElement("a");
    link.href = target.careersUrl; link.target = "_blank"; link.rel = "noreferrer";
    const name = document.createElement("strong"); name.textContent = target.name;
    const sector = document.createElement("span"); sector.textContent = target.sector;
    link.append(name, sector); elements.targetList.append(link);
  });
}

Object.entries(profile).forEach(([name, value]) => { const input = elements.profileForm.elements.namedItem(name); if (input) input.value = value; });
elements.profileToggle.addEventListener("click", () => { elements.profilePanel.hidden = false; });
elements.profileClose.addEventListener("click", () => { elements.profilePanel.hidden = true; });
elements.profileForm.addEventListener("submit", event => { event.preventDefault(); new FormData(elements.profileForm).forEach((value, name) => { profile[name] = value; }); localStorage.setItem(profileKey, JSON.stringify(profile)); renderProfileSnapshot(); elements.profilePanel.hidden = true; });
elements.searchButton.addEventListener("click", search);
elements.targetToggle.addEventListener("click", () => { const hidden = elements.targetList.hidden; elements.targetList.hidden = !hidden; elements.targetToggle.textContent = hidden ? "Ocultar empresas" : "Ver empresas objetivo"; });
renderSearchHistory();
renderProfileSnapshot();
renderTargetRadar();

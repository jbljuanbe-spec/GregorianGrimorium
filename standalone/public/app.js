import { normaliseAndDeduplicate, searchPublicSources } from "./sources.js";
import { activeCorporateTargets, targetCompanies } from "./targetCompanies.js";
import { extractProfileFromCvText } from "./profileAnalysis.js";
import { filterByTargetCompany, rankAndFilterJobs } from "./ranking.js";

const defaults = {
  headline: "Desarrollo de Negocio Internacional · Comercio Exterior · Relaciones Institucionales",
  summary: "Profesional internacional orientado a inteligencia de mercado, expansión comercial, coordinación institucional y análisis de oportunidades en entornos regulados.",
  experience: "Desarrollo de negocio internacional, comercio exterior, análisis de mercado, gestión de stakeholders, programas institucionales y coordinación con interlocutores públicos y privados.",
  yearsExperience: "",
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
let latestSearch = null;
const elements = {
  query: document.querySelector("#query"), location: document.querySelector("#location"), searchButton: document.querySelector("#search-button"), profileHeadline: document.querySelector("#profile-headline"), profileSummary: document.querySelector("#profile-summary"), profileKeywords: document.querySelector("#profile-keywords"),
  results: document.querySelector("#results"), summary: document.querySelector("#summary"), empty: document.querySelector("#empty-state"), template: document.querySelector("#result-template"), experienceFilter: document.querySelector("#experience-filter"), targetFilter: document.querySelector("#target-company-filter"), cvFile: document.querySelector("#cv-file"), cvStatus: document.querySelector("#cv-status"),
  profilePanel: document.querySelector("#profile-panel"), profileToggle: document.querySelector("#profile-toggle"), profileClose: document.querySelector("#profile-close"), profileForm: document.querySelector("#profile-form"), history: document.querySelector("#search-history"),
};

function split(value) { return value.split(/[,;\n|]/).map(item => item.trim().toLocaleLowerCase("es-ES")).filter(Boolean); }

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
  const sorted = filterByTargetCompany(rankAndFilterJobs(profile, jobs, elements.experienceFilter.value), elements.targetFilter.value);
  elements.empty.hidden = Boolean(sorted.length);
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
    node.querySelector(".company").textContent = `${job.company} · ${job.location} · ${job.modality}${job.fit.requiredYears ? ` · requiere ${job.fit.requiredYears}+ años` : ""}`;
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
    const workerSources = sources.filter(source => ["adzuna", "iberdrola", "santander", "repsol", "acciona"].includes(source));
    const publicSources = sources.filter(source => !workerSources.includes(source));
    const payload = await searchPublicSources({ query, sources: publicSources, includeRemote: remote });
    if (workerSources.length) {
      try {
        const params = new URLSearchParams({ q: query, location, sources: workerSources.join(","), remote: String(remote) });
        const response = await fetch(`/api/search?${params}`);
        if (response.ok) {
          const adzuna = await response.json();
          payload.results = normaliseAndDeduplicate([payload.results, adzuna.results || []], remote);
          payload.sources = [...new Set([...payload.sources, ...(adzuna.sources || [])])];
          payload.sourceErrors.push(...(adzuna.sourceErrors || []));
        } else {
          payload.sourceErrors.push({ source: "Fuentes de Worker", message: "No se pudo recuperar la fuente seleccionada" });
        }
      } catch {
        payload.sourceErrors.push({ source: "Fuentes de Worker", message: "No se pudo recuperar la fuente seleccionada" });
      }
    }
    saveSearchHistory({ query, location, sources, remote, searchedAt: new Date().toISOString() });
    latestSearch = { jobs: payload.results || [], sources: payload.sources || [], errors: payload.sourceErrors || [], effectiveQuery: payload.effectiveQuery || query };
    render(latestSearch.jobs, latestSearch.sources, latestSearch.errors, latestSearch.effectiveQuery);
  } catch (error) {
    elements.summary.textContent = error instanceof Error ? error.message : "No se pudo completar la búsqueda";
  } finally { elements.searchButton.disabled = false; elements.searchButton.textContent = "Buscar ofertas"; }
}

async function readCvText(file) {
  if (file.size > 8 * 1024 * 1024) throw new Error("El CV supera el límite local de 8 MB");
  const extension = file.name.split(".").pop()?.toLocaleLowerCase("es-ES");
  if (["txt", "md"].includes(extension)) return file.text();
  const arrayBuffer = await file.arrayBuffer();
  if (extension === "docx" && window.mammoth) return (await window.mammoth.extractRawText({ arrayBuffer })).value;
  if (extension === "pdf" && window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const document = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = await Promise.all([...Array(document.numPages)].map(async (_, index) => (await (await document.getPage(index + 1)).getTextContent()).items.map(item => item.str).join(" ")));
    return pages.join("\n");
  }
  throw new Error("Usa un CV .docx, .pdf, .txt o .md");
}

async function importCv(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  elements.cvStatus.textContent = "Leyendo el CV solo en este navegador…";
  try {
    const extracted = extractProfileFromCvText(await readCvText(file));
    Object.entries(extracted).forEach(([name, value]) => { if (value) { profile[name] = value; const field = elements.profileForm.elements.namedItem(name); if (field) field.value = value; } });
    localStorage.setItem(profileKey, JSON.stringify(profile));
    renderProfileSnapshot();
    elements.cvStatus.textContent = "Perfil extraído localmente. Revisa y guarda los campos antes de buscar.";
  } catch (error) { elements.cvStatus.textContent = error instanceof Error ? error.message : "No se pudo leer el CV"; }
}

function renderProfileSnapshot() {
  elements.profileHeadline.textContent = profile.headline;
  elements.profileSummary.textContent = profile.summary;
  elements.profileKeywords.replaceChildren();
  split(profile.keywords).slice(0, 8).forEach(keyword => { const item = document.createElement("span"); item.textContent = keyword; elements.profileKeywords.append(item); });
}

function renderTargetRadar() {
  targetCompanies.forEach(target => {
    const option = document.createElement("option"); option.value = target.name; option.textContent = `${target.name} · ${activeCorporateTargets.has(target.name) ? "conector activo" : "portal oficial"}`; elements.targetFilter.append(option);
  });
}

Object.entries(profile).forEach(([name, value]) => { const input = elements.profileForm.elements.namedItem(name); if (input) input.value = value; });
elements.profileToggle.addEventListener("click", () => { elements.profilePanel.hidden = false; });
elements.profileClose.addEventListener("click", () => { elements.profilePanel.hidden = true; });
elements.profileForm.addEventListener("submit", event => { event.preventDefault(); new FormData(elements.profileForm).forEach((value, name) => { profile[name] = value; }); localStorage.setItem(profileKey, JSON.stringify(profile)); renderProfileSnapshot(); elements.profilePanel.hidden = true; });
elements.searchButton.addEventListener("click", search);
elements.experienceFilter.addEventListener("change", () => { if (elements.results.children.length) search(); });
elements.targetFilter.addEventListener("change", () => { if (latestSearch) render(latestSearch.jobs, latestSearch.sources, latestSearch.errors, latestSearch.effectiveQuery); });
elements.cvFile.addEventListener("change", importCv);
renderSearchHistory();
renderProfileSnapshot();
renderTargetRadar();

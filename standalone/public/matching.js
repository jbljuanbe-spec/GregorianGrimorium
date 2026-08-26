const normalise = (value = "") => String(value).toLocaleLowerCase("es-ES").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9+/# ]/g, " ").replace(/\s+/g, " ").trim();

export const MATCH_FAMILIES = {
  "desarrollo de negocio": ["desarrollo de negocio", "business development", "business developer", "new business", "desarrollo comercial", "growth manager", "strategic partnerships", "alianzas estrategicas"],
  "comercio exterior": ["comercio exterior", "comercio internacional", "international trade", "foreign trade", "exportacion", "export manager", "trade manager"],
  "internacionalización": ["internacionalizacion", "internationalization", "international expansion", "expansion internacional", "market entry", "go to market", "emea", "global markets"],
  "análisis de mercado": ["analisis de mercado", "market analysis", "market intelligence", "inteligencia de mercado", "market research", "competitive intelligence"],
  "relaciones institucionales": ["relaciones institucionales", "institutional relations", "asuntos publicos", "public affairs", "government affairs", "government relations", "public policy", "regulatory affairs"],
  "gestión de stakeholders": ["gestion de stakeholders", "stakeholder management", "stakeholders", "grupos de interes"],
  "energía": ["energia", "energy", "renewable", "utilities", "power sector"],
  "defensa": ["defensa", "defence", "defense", "security and defence"],
  "aeroespacial": ["aeroespacial", "aerospace", "aviation"],
  "project management": ["project management", "project manager", "gestion de proyectos", "program manager", "programme manager"],
  "excel": ["excel", "microsoft excel", "advanced excel"],
  "power bi": ["power bi", "powerbi", "microsoft power bi"],
  "crm": ["crm", "salesforce", "hubspot", "dynamics 365"],
  "sap": ["sap", "sap erp", "s 4hana"],
  "inglés": ["ingles", "english"],
  "italiano": ["italiano", "italian"],
};

const matches = (corpus, label) => (MATCH_FAMILIES[label] || [label]).some(term => corpus.includes(normalise(term)));
const split = value => String(value || "").split(/[,;\n|]/).map(normalise).filter(Boolean);

export function buildSearchPlan(query) {
  const raw = String(query || "").trim();
  const corpus = normalise(raw);
  const families = Object.keys(MATCH_FAMILIES).filter(label => matches(corpus, label));
  const primary = families[0] || raw || "desarrollo de negocio";
  return { raw, primary, families, alternatives: (MATCH_FAMILIES[primary] || []).slice(0, 2) };
}

export function profileMatchEvidence(profile, job) {
  const profileCorpus = normalise(`${profile.keywords || ""} ${profile.roles || ""} ${profile.areas || ""} ${profile.experience || ""}`);
  const titleCorpus = normalise(`${job.title || ""} ${job.area || ""}`);
  const jobCorpus = normalise(`${job.title || ""} ${job.area || ""} ${job.description || ""} ${job.requirements || ""}`);
  const explicit = split(profile.keywords);
  const families = Object.keys(MATCH_FAMILIES).filter(label => matches(profileCorpus, label));
  const labels = [...new Set([...families, ...explicit])];
  const details = labels.map(label => ({ label, titleMatch: matches(titleCorpus, label), corpusMatch: matches(jobCorpus, label) || jobCorpus.includes(label), weight: matches(titleCorpus, label) ? 2 : (matches(jobCorpus, label) || jobCorpus.includes(label) ? 1 : 0) }));
  return { details, matched: details.filter(item => item.corpusMatch).map(item => item.label), missing: details.filter(item => !item.corpusMatch).map(item => item.label) };
}

export function queryMatchEvidence(query, job) {
  const plan = buildSearchPlan(query);
  if (!plan.raw) return { score: 0, matched: [], titleMatch: false };
  const title = normalise(`${job.title || ""} ${job.area || ""}`);
  const corpus = normalise(`${job.title || ""} ${job.area || ""} ${job.description || ""} ${job.requirements || ""}`);
  const labels = plan.families.length ? plan.families : [plan.primary];
  const matched = labels.filter(label => matches(corpus, label));
  const titleMatch = labels.some(label => matches(title, label));
  const rawTokens = normalise(plan.raw).split(" ").filter(token => token.length > 3);
  const tokenCoverage = rawTokens.length ? rawTokens.filter(token => corpus.includes(token)).length / rawTokens.length : 0;
  return { score: Math.round(Math.min(16, (titleMatch ? 10 : 0) + (labels.length ? matched.length / labels.length * 4 : 0) + tokenCoverage * 2)), matched, titleMatch };
}

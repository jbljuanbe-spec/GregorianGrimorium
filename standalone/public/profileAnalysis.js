const KNOWN_SKILLS = [
  "desarrollo de negocio", "business development", "comercio exterior", "internacionalización", "exportación", "análisis de mercado", "inteligencia regulatoria", "relaciones institucionales", "asuntos públicos", "gestión de stakeholders", "negociación", "power bi", "excel", "sap", "crm", "kpis", "incoterms", "icex", "aeroespacial", "defensa", "energía", "italia", "emea", "project management", "licitaciones", "licitación", "ferias internacionales",
];

const KEYWORD_FAMILIES = {
  "desarrollo de negocio": ["desarrollo de negocio", "business development", "business developer", "new business"],
  "comercio exterior": ["comercio exterior", "comercio internacional", "exportación", "exportacion", "export"],
  "internacionalización": ["internacionalización", "internacionalizacion", "internationalisation", "internationalization"],
  "análisis de mercado": ["análisis de mercado", "analisis de mercado", "market analysis", "market intelligence", "inteligencia de mercado"],
  "relaciones institucionales": ["relaciones institucionales", "asuntos públicos", "asuntos publicos", "public affairs", "government affairs"],
  "gestión de stakeholders": ["gestión de stakeholders", "gestion de stakeholders", "stakeholder management", "stakeholders"],
  "excel": ["excel", "microsoft excel"],
  "power bi": ["power bi", "powerbi"],
  "crm": ["crm", "salesforce", "hubspot"],
  "sap": ["sap", "sap erp"],
  "inglés": ["inglés", "ingles", "english"],
  "italiano": ["italiano", "italian"],
  "aeroespacial": ["aeroespacial", "aerospace"],
  "defensa": ["defensa", "defence", "defense"],
  "energía": ["energía", "energia", "energy", "renovable", "renewable"],
  "project management": ["project management", "project manager", "gestión de proyectos", "gestion de proyectos", "program manager"],
  "negociación": ["negociación", "negociacion", "negotiation"],
  "licitaciones": ["licitaciones", "licitación", "licitacion", "tender"],
  "incoterms": ["incoterms", "incoterm"],
  "kpis": ["kpis", "kpi", "indicadores"],
};

const ROLE_PATTERNS = [
  ["desarrollo de negocio internacional", /desarrollo de negocio|business development|business developer/i],
  ["comercio exterior", /comercio exterior|exportaci[oó]n|importaci[oó]n|internacionalizaci[oó]n/i],
  ["relaciones institucionales", /relaciones institucionales|asuntos p[uú]blicos|public affairs/i],
  ["analista de mercados", /an[aá]lisis de mercado|market intelligence|inteligencia de mercado/i],
  ["project manager internacional", /project manager|gesti[oó]n de proyectos|program manager/i],
];

const clean = (value = "") => String(value).replace(/\s+/g, " ").trim();
const normalise = (value = "") => clean(value).toLocaleLowerCase("es-ES").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9+/# ]/g, " ").replace(/\s+/g, " ").trim();

export function extractKeywordTags(text) {
  const corpus = normalise(text);
  const tags = Object.entries(KEYWORD_FAMILIES).filter(([, variants]) => variants.some(variant => corpus.includes(normalise(variant)))).map(([label]) => label);
  return [...new Set(tags)];
}

export function profileKeywordTags(profile) {
  const text = `${profile.keywords || ""},${profile.roles || ""},${profile.areas || ""},${profile.experience || ""},${profile.languages || ""}`;
  const recognised = extractKeywordTags(text);
  const explicit = String(profile.keywords || "").split(/[,;\n|]/).map(value => clean(value)).filter(value => value.length > 2).map(value => ({ raw: value, key: normalise(value) })).filter(({ key }) => key && !recognised.some(tag => normalise(tag) === key));
  return [...new Set([...recognised, ...explicit.map(({ raw }) => raw)])];
}

export function explainKeywordFit(profile, job) {
  const profileTags = profileKeywordTags(profile);
  const jobTags = extractKeywordTags(`${job.title || ""} ${job.area || ""} ${job.description || ""} ${job.requirements || ""}`);
  const profileNormalised = new Set(profileTags.map(normalise));
  const profileText = normalise(`${profile.keywords || ""} ${profile.roles || ""} ${profile.areas || ""} ${profile.experience || ""} ${profile.languages || ""}`);
  const matched = jobTags.filter(tag => profileNormalised.has(normalise(tag)) || profileText.includes(normalise(tag)));
  const missing = jobTags.filter(tag => !matched.includes(tag));
  return { matched, missing, profileTags, jobTags };
}

export function extractExperienceYears(text) {
  const explicit = [...String(text).matchAll(/(?:m[aá]s de |al menos |m[ií]nimo de )?(\d{1,2})\+?\s*a[nñ]os(?:\s+de\s+experiencia)?/gi)].map(match => Number(match[1]));
  if (explicit.length) return Math.max(...explicit);
  const years = [...String(text).matchAll(/\b(19\d{2}|20\d{2})\b/g)].map(match => Number(match[1])).filter(year => year <= new Date().getFullYear());
  if (!years.length) return 0;
  return Math.max(0, new Date().getFullYear() - Math.min(...years));
}

export function requiredExperienceYears(text) {
  const value = String(text);
  const range = value.match(/(\d{1,2})\s*(?:-|a|–)\s*(\d{1,2})\s*a[nñ]os/iu);
  if (range) return Number(range[2]);
  const explicit = [...value.matchAll(/(?:m[ií]nimo de |al menos |m[aá]s de |experiencia de )?(\d{1,2})\+?\s*a[nñ]os(?:\s+de\s+experiencia)?/giu)].map(match => Number(match[1]));
  return explicit.length ? Math.max(...explicit) : 0;
}

export function extractProfileFromCvText(text) {
  const normalized = clean(text);
  const lower = normalized.toLocaleLowerCase("es-ES");
  const keywords = KNOWN_SKILLS.filter(skill => lower.includes(skill));
  const roles = ROLE_PATTERNS.filter(([, pattern]) => pattern.test(normalized)).map(([role]) => role);
  const years = extractExperienceYears(normalized);
  const languages = ["inglés", "italiano", "francés", "alemán", "portugués"].filter(language => lower.includes(language));
  return {
    yearsExperience: years ? String(years) : "",
    keywords: keywords.join(", "),
    roles: roles.join(", "),
    languages: languages.join(", "),
    summary: clean(normalized.slice(0, 650)),
  };
}

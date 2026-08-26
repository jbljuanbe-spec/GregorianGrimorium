const normalise = (value = "") => String(value).toLocaleLowerCase("es-ES").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const SPAIN = ["espana", "spain", "madrid", "barcelona", "valencia", "bilbao", "sevilla", "malaga", "zaragoza", "valladolid"];
const ITALY = ["italia", "italy", "milano", "milan", "roma", "rome", "torino", "turin", "bologna", "napoli", "florence", "firenze"];
const EMEA = [...ITALY, "emea", "germany", "deutschland", "berlin", "munich", "france", "paris", "netherlands", "amsterdam", "belgium", "brussels", "austria", "vienna", "switzerland", "zurich", "ireland", "dublin", "portugal", "lisbon", "uk", "united kingdom", "london", "poland", "warsaw"];

export const SEARCH_SCOPES = {
  spain: { label: "España", markets: ["es"], defaultLocation: "Madrid" },
  italy: { label: "Italia", markets: ["it"], defaultLocation: "Milán" },
  emea: { label: "EMEA", markets: ["it", "de", "fr", "nl"], defaultLocation: "" },
  remote: { label: "Remoto global", markets: ["it", "de", "fr", "nl"], defaultLocation: "" },
};

export function normaliseScope(value) { return SEARCH_SCOPES[value] ? value : "spain"; }
export function scopeLabel(scope) { return SEARCH_SCOPES[normaliseScope(scope)].label; }
export function marketsForScope(scope) { return SEARCH_SCOPES[normaliseScope(scope)].markets; }
export function defaultLocationForScope(scope) { return SEARCH_SCOPES[normaliseScope(scope)].defaultLocation; }

export function isWithinScope(job, requestedScope = "spain", includeRemote = false) {
  const scope = normaliseScope(requestedScope);
  if (scope === "remote") return job.remote === true;
  if (job.remote === true && includeRemote) return true;
  const location = normalise(`${job.location || ""} ${job.country || ""}`);
  const terms = scope === "spain" ? SPAIN : scope === "italy" ? ITALY : EMEA;
  return terms.some(term => location.includes(term));
}

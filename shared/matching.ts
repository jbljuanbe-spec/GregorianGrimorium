export type MatchProfile = {
  skills: string;
  desiredRoles: string;
  targetAreas: string;
  locations: string;
  modalities: string;
  contractTypes: string;
  languages: string;
  keywords: string;
};

export type MatchOffer = {
  title: string;
  area: string;
  location: string;
  modality: string;
  contractType: string;
  description: string;
  requirements: string;
};

export type FitAnalysis = {
  score: number;
  keywordScore: number;
  roleScore: number;
  preferenceScore: number;
  languageScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  reasons: string[];
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9+#/& ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const list = (value: string) =>
  value
    .split(/[,;\n|]/)
    .map(item => normalize(item))
    .filter(item => item.length > 1);

const includesPhrase = (content: string, phrase: string) =>
  normalize(content).includes(normalize(phrase));

const unique = (items: string[]) => Array.from(new Set(items));

export function analyseOfferFit(profile: MatchProfile, offer: MatchOffer): FitAnalysis {
  const offerText = `${offer.title} ${offer.area} ${offer.description} ${offer.requirements}`;
  const profileKeywords = unique([...list(profile.keywords), ...list(profile.skills)]);
  const matchedKeywords = profileKeywords.filter(keyword => includesPhrase(offerText, keyword));
  const keywordScore = profileKeywords.length
    ? Math.round((matchedKeywords.length / profileKeywords.length) * 45)
    : 0;

  const roleTerms = unique([...list(profile.desiredRoles), ...list(profile.targetAreas)]);
  const matchedRoleTerms = roleTerms.filter(term => includesPhrase(`${offer.title} ${offer.area} ${offerText}`, term));
  const roleScore = roleTerms.length
    ? Math.round((matchedRoleTerms.length / roleTerms.length) * 25)
    : 0;

  const preferredLocations = list(profile.locations);
  const preferredModalities = list(profile.modalities);
  const preferredContracts = list(profile.contractTypes);
  const locationScore = preferredLocations.some(location => includesPhrase(offer.location, location)) ? 8 : 0;
  const modalityScore = preferredModalities.some(modality => includesPhrase(offer.modality, modality)) ? 4 : 0;
  const contractScore = preferredContracts.some(contract => includesPhrase(offer.contractType, contract)) ? 3 : 0;
  const preferenceScore = locationScore + modalityScore + contractScore;

  const languageLabels = ["ingles", "italiano", "espanol", "frances", "aleman"];
  const requestedLanguages = languageLabels.filter(language => includesPhrase(offerText, language));
  const knownLanguages = languageLabels.filter(language => includesPhrase(profile.languages, language));
  const languageScore = requestedLanguages.length === 0
    ? 10
    : Math.round((requestedLanguages.filter(language => knownLanguages.includes(language)).length / requestedLanguages.length) * 10);

  const requirements = list(offer.requirements);
  const profileText = `${profile.keywords} ${profile.skills} ${profile.languages}`;
  const missingKeywords = unique(
    requirements.filter(requirement => requirement.length > 2 && !includesPhrase(profileText, requirement)),
  ).slice(0, 6);

  const reasons = [
    matchedKeywords.length ? `${matchedKeywords.length} coincidencias de competencias` : "No hay coincidencias explícitas de competencias",
    matchedRoleTerms.length ? `Alineación con ${matchedRoleTerms.slice(0, 2).join(" y ")}` : "Área o puesto fuera de los objetivos principales",
    locationScore ? "Ubicación alineada con la preferencia" : "Ubicación por revisar",
  ];

  return {
    score: Math.min(100, keywordScore + roleScore + preferenceScore + languageScore),
    keywordScore,
    roleScore,
    preferenceScore,
    languageScore,
    matchedKeywords: matchedKeywords.slice(0, 8),
    missingKeywords,
    reasons,
  };
}

import { describe, expect, it } from "vitest";
import { analyseOfferFit } from "./matching";

const profile = {
  skills: "Excel avanzado, Power BI, comercio exterior, análisis de mercado",
  desiredRoles: "Desarrollo de negocio internacional, relaciones institucionales",
  targetAreas: "Internacionalización, defensa y aeroespacial",
  locations: "Madrid",
  modalities: "Híbrido, Remoto",
  contractTypes: "Indefinido",
  languages: "Español nativo, Inglés C1, Italiano C1",
  keywords: "internacionalización, business development, exportación, Italia, KPIs",
};

describe("analyseOfferFit", () => {
  it("prioriza una oferta que coincide con competencias, ubicación e idiomas", () => {
    const analysis = analyseOfferFit(profile, {
      title: "Business Development International Analyst",
      area: "Internacionalización",
      location: "Madrid",
      modality: "Híbrido",
      contractType: "Indefinido",
      description: "Análisis de mercado en Italia, exportación y seguimiento de KPIs para expansión internacional.",
      requirements: "Inglés C1, Italiano C1, Excel avanzado, Power BI",
    });

    expect(analysis.score).toBeGreaterThanOrEqual(70);
    expect(analysis.matchedKeywords).toContain("italia");
    expect(analysis.missingKeywords).toEqual([]);
  });

  it("hace visibles los requisitos que no figuran en el perfil", () => {
    const analysis = analyseOfferFit(profile, {
      title: "Analista de ciberseguridad",
      area: "Tecnología",
      location: "Valencia",
      modality: "Presencial",
      contractType: "Temporal",
      description: "Operación de un SOC y auditoría de seguridad.",
      requirements: "Python, AWS, certificación CISSP",
    });

    expect(analysis.score).toBeLessThan(45);
    expect(analysis.missingKeywords).toEqual(expect.arrayContaining(["python", "aws"]));
  });
});

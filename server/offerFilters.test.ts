import { describe, expect, it } from "vitest";
import { filterOfferRecords } from "../shared/offerFilters";

const offers = [
  {
    title: "Business Development International Analyst",
    company: "Empresa A",
    description: "Mercados internacionales, exportación y análisis de negocio.",
    location: "Madrid",
    modality: "Híbrido",
    contractType: "Indefinido",
    area: "Internacionalización",
    publishedAt: new Date("2026-08-18T00:00:00Z"),
    applicationStatus: "favorita" as const,
  },
  {
    title: "Controller de programa",
    company: "Empresa B",
    description: "Seguimiento financiero de programas aeroespaciales.",
    location: "Albacete",
    modality: "Presencial",
    contractType: "Temporal",
    area: "Aeroespacial",
    publishedAt: new Date("2026-07-01T00:00:00Z"),
    applicationStatus: "pendiente" as const,
  },
];

describe("filterOfferRecords", () => {
  it("conserva únicamente la oferta que satisface todos los filtros esenciales", () => {
    const result = filterOfferRecords(offers, {
      location: "Madrid",
      modality: "Híbrido",
      contractType: "Indefinido",
      area: "internacionalización",
      publishedAfter: new Date("2026-08-01T00:00:00Z"),
      status: "favorita",
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe("Business Development International Analyst");
  });

  it("busca texto en puesto, empresa y descripción sin distinguir mayúsculas", () => {
    expect(filterOfferRecords(offers, { query: "EXPORTACIÓN" })).toEqual([offers[0]]);
    expect(filterOfferRecords(offers, { query: "empresa b" })).toEqual([offers[1]]);
  });
});

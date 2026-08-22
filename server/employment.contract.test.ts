import { describe, expect, it } from "vitest";
import { offerStatusValues } from "../drizzle/schema";
import { offerFilterInput, offerStatusUpdateInput } from "./routers/employment";

describe("contrato de catálogo de ofertas", () => {
  it("acepta los filtros esenciales de ubicación, modalidad, contrato, área y fecha", () => {
    const result = offerFilterInput.parse({
      query: "internacionalización",
      location: "Madrid",
      modality: "Híbrido",
      contractType: "Indefinido",
      area: "Defensa",
      publishedAfter: "2026-08-01T00:00:00.000Z",
      status: "favorita",
    });

    expect(result.location).toBe("Madrid");
    expect(result.publishedAfter).toBe("2026-08-01T00:00:00.000Z");
  });

  it("mantiene los cuatro estados de seguimiento solicitados", () => {
    expect(offerStatusValues).toEqual(["pendiente", "favorita", "aplicada", "descartada"]);
  });

  it.each(offerStatusValues)("acepta la actualización de estado %s", applicationStatus => {
    expect(offerStatusUpdateInput.parse({ id: 42, applicationStatus })).toEqual({ id: 42, applicationStatus });
  });
});

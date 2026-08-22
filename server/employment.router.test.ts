import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getOrCreateJobProfile: vi.fn(),
  listJobOffers: vi.fn(),
  updateJobOfferStatus: vi.fn(),
  createJobOffer: vi.fn(),
  getJobOffersByIds: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { employmentRouter } from "./routers/employment";
import type { TrpcContext } from "./_core/context";

const profile = {
  skills: "Excel, Power BI, comercio exterior",
  desiredRoles: "desarrollo de negocio internacional",
  targetAreas: "internacionalización",
  locations: "Madrid",
  modalities: "Híbrido",
  contractTypes: "Indefinido",
  languages: "Español, Inglés C1, Italiano C1",
  keywords: "internacionalización, exportación",
};

function createContext(): TrpcContext {
  return {
    user: {
      id: 7,
      openId: "juan-private",
      name: "Juan",
      email: "juan@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createAnonymousContext(): TrpcContext {
  return {
    user: null,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("procedimientos privados de ofertas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getOrCreateJobProfile.mockResolvedValue(profile);
    dbMocks.listJobOffers.mockResolvedValue([]);
  });

  it("entrega todos los filtros esenciales a la capa de datos, incluyendo una fecha normalizada", async () => {
    const caller = employmentRouter.createCaller(createContext());
    await caller.offers.list({
      location: "Madrid",
      modality: "Híbrido",
      contractType: "Indefinido",
      area: "Defensa",
      publishedAfter: "2026-08-01T00:00:00.000Z",
    });

    expect(dbMocks.listJobOffers).toHaveBeenCalledWith(7, expect.objectContaining({
      location: "Madrid",
      modality: "Híbrido",
      contractType: "Indefinido",
      area: "Defensa",
      publishedAfter: new Date("2026-08-01T00:00:00.000Z"),
    }));
  });

  it.each(["pendiente", "favorita", "aplicada", "descartada"] as const)("persiste el estado %s solo en la oferta del usuario", async applicationStatus => {
    const caller = employmentRouter.createCaller(createContext());
    await caller.offers.updateStatus({ id: 19, applicationStatus });

    expect(dbMocks.updateJobOfferStatus).toHaveBeenCalledWith(7, 19, applicationStatus);
  });

  it("deniega el perfil y las ofertas si no existe una sesión autenticada", async () => {
    const caller = employmentRouter.createCaller(createAnonymousContext());

    await expect(caller.profile.me()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.offers.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

import { and, desc, eq, gte, inArray, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  jobOffers,
  jobProfiles,
  OfferStatus,
  users,
} from "../drizzle/schema";
import { filterOfferRecords } from "../shared/offerFilters";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

const defaultProfile = {
  headline: "Desarrollo de Negocio Internacional · Comercio Exterior · Relaciones Institucionales",
  summary:
    "Perfil internacional con experiencia en inteligencia de mercado, análisis de negocio, coordinación institucional y gestión de programas en entornos regulados.",
  skills:
    "Desarrollo de negocio internacional, comercio exterior, análisis de mercado, inteligencia regulatoria, business cases, Excel avanzado, Power BI, SAP, CRM, gestión de KPIs, negociación intercultural, gestión de stakeholders, ferias internacionales",
  desiredRoles:
    "Desarrollo de negocio internacional, comercio exterior, relaciones institucionales, asuntos públicos, project manager internacional, analista de mercados",
  targetAreas:
    "Internacionalización, defensa y aeroespacial, asociaciones sectoriales, cámaras de comercio, energía, industria, promoción exterior",
  locations: "Madrid",
  modalities: "Híbrido, Presencial, Remoto",
  contractTypes: "Indefinido, Jornada completa",
  languages: "Español nativo, Inglés C1, Italiano C1",
  keywords:
    "internacionalización, desarrollo de negocio, comercio exterior, business development, análisis de mercado, inteligencia regulatoria, relaciones institucionales, exportación, ICEX, Incoterms, Power BI, Excel, SAP, CRM, KPIs, aeroespacial, defensa, Italia, EMEA",
};

export async function getOrCreateJobProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db.select().from(jobProfiles).where(eq(jobProfiles.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(jobProfiles).values({ userId, ...defaultProfile });
  const created = await db.select().from(jobProfiles).where(eq(jobProfiles.userId, userId)).limit(1);
  return created[0];
}

export async function updateJobProfile(userId: number, values: typeof defaultProfile) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible");
  await db
    .insert(jobProfiles)
    .values({ userId, ...values })
    .onDuplicateKeyUpdate({ set: { ...values } });
  return getOrCreateJobProfile(userId);
}

type OfferFilters = {
  query?: string;
  location?: string;
  modality?: string;
  contractType?: string;
  area?: string;
  publishedAfter?: Date;
  status?: OfferStatus;
};

export async function listJobOffers(userId: number, filters: OfferFilters = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(jobOffers.userId, userId)];
  if (filters.query) {
    const pattern = `%${filters.query}%`;
    conditions.push(or(like(jobOffers.title, pattern), like(jobOffers.company, pattern), like(jobOffers.description, pattern))!);
  }
  if (filters.location) conditions.push(like(jobOffers.location, `%${filters.location}%`));
  if (filters.modality) conditions.push(eq(jobOffers.modality, filters.modality as "Presencial" | "Híbrido" | "Remoto" | "Flexible"));
  if (filters.contractType) conditions.push(like(jobOffers.contractType, `%${filters.contractType}%`));
  if (filters.area) conditions.push(like(jobOffers.area, `%${filters.area}%`));
  if (filters.publishedAfter) conditions.push(gte(jobOffers.publishedAt, filters.publishedAfter));
  if (filters.status) conditions.push(eq(jobOffers.applicationStatus, filters.status));
  const records = await db.select().from(jobOffers).where(and(...conditions)).orderBy(desc(jobOffers.createdAt));
  return filterOfferRecords(records, filters);
}

export async function getJobOffersByIds(userId: number, ids: number[]) {
  const db = await getDb();
  if (!db || ids.length === 0) return [];
  return db.select().from(jobOffers).where(and(eq(jobOffers.userId, userId), inArray(jobOffers.id, ids)));
}

export async function createJobOffer(userId: number, values: Omit<typeof jobOffers.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible");
  const result = await db.insert(jobOffers).values({ userId, ...values });
  return result;
}

export async function updateJobOfferStatus(userId: number, id: number, applicationStatus: OfferStatus) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible");
  await db
    .update(jobOffers)
    .set({ applicationStatus })
    .where(and(eq(jobOffers.id, id), eq(jobOffers.userId, userId)));
}

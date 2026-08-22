import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const jobProfiles = mysqlTable("jobProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  headline: varchar("headline", { length: 255 }).notNull(),
  summary: text("summary").notNull(),
  skills: text("skills").notNull(),
  desiredRoles: text("desiredRoles").notNull(),
  targetAreas: text("targetAreas").notNull(),
  locations: text("locations").notNull(),
  modalities: text("modalities").notNull(),
  contractTypes: text("contractTypes").notNull(),
  languages: text("languages").notNull(),
  keywords: text("keywords").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const offerStatusValues = ["pendiente", "favorita", "aplicada", "descartada"] as const;

export const jobOffers = mysqlTable("jobOffers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  source: varchar("source", { length: 100 }).notNull(),
  sourceUrl: text("sourceUrl").notNull(),
  location: varchar("location", { length: 160 }).notNull(),
  modality: mysqlEnum("modality", ["Presencial", "Híbrido", "Remoto", "Flexible"]).notNull(),
  contractType: varchar("contractType", { length: 120 }).notNull(),
  area: varchar("area", { length: 160 }).notNull(),
  publishedAt: timestamp("publishedAt"),
  salary: varchar("salary", { length: 120 }),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  applicationStatus: mysqlEnum("applicationStatus", offerStatusValues).default("pendiente").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type JobProfile = typeof jobProfiles.$inferSelect;
export type JobOffer = typeof jobOffers.$inferSelect;
export type OfferStatus = (typeof offerStatusValues)[number];

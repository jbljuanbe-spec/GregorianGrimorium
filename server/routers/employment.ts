import { z } from "zod";
import { offerStatusValues } from "../../drizzle/schema";
import {
  createJobOffer,
  getJobOffersByIds,
  getOrCreateJobProfile,
  listJobOffers,
  updateJobOfferStatus,
  updateJobProfile,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { analyseOfferFit } from "../../shared/matching";

const profileInput = z.object({
  headline: z.string().min(3).max(255),
  summary: z.string().min(20),
  skills: z.string().min(3),
  desiredRoles: z.string().min(3),
  targetAreas: z.string().min(3),
  locations: z.string().min(2),
  modalities: z.string().min(2),
  contractTypes: z.string().min(2),
  languages: z.string().min(2),
  keywords: z.string().min(3),
});

const offerInput = z.object({
  title: z.string().min(2).max(255),
  company: z.string().min(2).max(255),
  source: z.string().min(2).max(100),
  sourceUrl: z.string().url(),
  location: z.string().min(2).max(160),
  modality: z.enum(["Presencial", "Híbrido", "Remoto", "Flexible"]),
  contractType: z.string().min(2).max(120),
  area: z.string().min(2).max(160),
  publishedAt: z.string().datetime().optional().nullable(),
  salary: z.string().max(120).optional().nullable(),
  description: z.string().min(20),
  requirements: z.string().min(3),
  notes: z.string().optional().nullable(),
});

export const offerFilterInput = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  modality: z.enum(["Presencial", "Híbrido", "Remoto", "Flexible"]).optional(),
  contractType: z.string().optional(),
  area: z.string().optional(),
  publishedAfter: z.string().datetime().optional(),
  status: z.enum(offerStatusValues).optional(),
}).optional();

export const offerStatusUpdateInput = z.object({
  id: z.number().int().positive(),
  applicationStatus: z.enum(offerStatusValues),
});

export const employmentRouter = router({
  profile: router({
    me: protectedProcedure.query(({ ctx }) => getOrCreateJobProfile(ctx.user.id)),
    update: protectedProcedure.input(profileInput).mutation(({ ctx, input }) => updateJobProfile(ctx.user.id, input)),
  }),
  offers: router({
    list: protectedProcedure.input(offerFilterInput).query(async ({ ctx, input }) => {
      const profile = await getOrCreateJobProfile(ctx.user.id);
      const offers = await listJobOffers(ctx.user.id, { ...input, publishedAfter: input?.publishedAfter ? new Date(input.publishedAfter) : undefined });
      if (!profile) return [];
      return offers
        .map(offer => ({ ...offer, fit: analyseOfferFit(profile, offer) }))
        .sort((a, b) => b.fit.score - a.fit.score);
    }),
    create: protectedProcedure.input(offerInput).mutation(async ({ ctx, input }) => {
      await createJobOffer(ctx.user.id, {
        ...input,
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
        salary: input.salary || null,
        notes: input.notes || null,
      });
      return { success: true } as const;
    }),
    updateStatus: protectedProcedure
      .input(offerStatusUpdateInput)
      .mutation(({ ctx, input }) => updateJobOfferStatus(ctx.user.id, input.id, input.applicationStatus)),
    compare: protectedProcedure.input(z.object({ ids: z.array(z.number().int()).min(2).max(3) })).query(async ({ ctx, input }) => {
      const [profile, offers] = await Promise.all([getOrCreateJobProfile(ctx.user.id), getJobOffersByIds(ctx.user.id, input.ids)]);
      if (!profile) return [];
      return offers.map(offer => ({ ...offer, fit: analyseOfferFit(profile, offer) }));
    }),
  }),
});

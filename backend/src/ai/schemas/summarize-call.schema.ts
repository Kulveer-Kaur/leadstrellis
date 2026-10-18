import { z } from 'zod';
import { CallOutcome, Financing, PropertyType, Timeline } from '../../generated/prisma/enums.js';

export const summarizeCallSchema = z.object({
  outcome: z.enum(CallOutcome),
  summary: z.string().min(1),
  sentiment: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']),
  requirementUpdates: z.object({
    budgetMin: z.number().nonnegative().nullable(),
    budgetMax: z.number().nonnegative().nullable(),
    bedroomsMin: z.number().min(0).max(10).nullable(),
    bedroomsMax: z.number().min(0).max(10).nullable(),
    propertyTypes: z.array(z.enum(PropertyType)),
    communities: z.array(z.string()),
    timeline: z.enum(Timeline).nullable(),
    financing: z.enum(Financing).nullable(),
    addMustHaves: z.array(z.string()),
  }),
  viewing: z.object({
    agreed: z.boolean(),
    propertyRef: z.string().nullable(),
    /** 0 or 1 = one of the two offered slots; null = other / not agreed. */
    slotIndex: z.number().int().min(0).max(1).nullable(),
    requestedTimeText: z.string().nullable(),
  }),
  followUpInDays: z.number().int().min(0).max(365).nullable(),
  optOut: z.boolean(),
});

export type CallSummary = z.infer<typeof summarizeCallSchema>;

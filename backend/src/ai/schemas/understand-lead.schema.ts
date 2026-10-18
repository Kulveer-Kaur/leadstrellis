import { z } from 'zod';
import { Financing, LeadPurpose, PropertyType, Timeline } from '../../generated/prisma/enums.js';

export const MISSING_FIELDS = ['budget', 'location', 'bedrooms', 'propertyType', 'timeline', 'purpose'] as const;

/** What the "understand lead" task must return: search criteria + intent read + contact details found in the text. */
export const understandLeadSchema = z.object({
  purpose: z.enum(LeadPurpose).nullable(),
  propertyTypes: z.array(z.enum(PropertyType)),
  bedroomsMin: z.number().min(0).max(10).nullable(),
  bedroomsMax: z.number().min(0).max(10).nullable(),
  budgetMin: z.number().nonnegative().nullable(),
  budgetMax: z.number().nonnegative().nullable(),
  emirate: z.string().nullable(),
  communities: z.array(z.string()),
  timeline: z.enum(Timeline),
  financing: z.enum(Financing),
  completionPreference: z.enum(['READY', 'OFF_PLAN']).nullable(),
  mustHaves: z.array(z.string()),
  niceToHaves: z.array(z.string()),
  language: z.enum(['en', 'ar', 'mixed']),
  summary: z.string().min(1),
  confidence: z.number().min(0).max(1),
  missingFields: z.array(z.enum(MISSING_FIELDS)),
  contact: z.object({
    fullName: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
  }),
  intent: z.object({
    score: z.number().min(0).max(20),
    signals: z.array(z.string()),
    reasoning: z.string(),
  }),
});

export type UnderstandLeadOutput = z.infer<typeof understandLeadSchema>;

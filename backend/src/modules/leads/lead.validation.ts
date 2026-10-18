import { z } from 'zod';
import {
  AgentMode,
  Channel,
  Financing,
  IntentLevel,
  LeadPurpose,
  LeadSource,
  LeadStatus,
  PropertyType,
  Timeline,
} from '../../generated/prisma/enums.js';

const csv = <T extends z.ZodType>(item: T) =>
  z.preprocess((v) => (typeof v === 'string' ? v.split(',').filter(Boolean) : v), z.array(item)).optional();

export const listLeadsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: csv(z.enum(LeadStatus)),
  intent: csv(z.enum(IntentLevel)),
  source: csv(z.enum(LeadSource)),
  emirate: z.string().optional(),
  assignedToId: z.string().optional(),
  view: z.enum(['all', 'hot', 'action']).default('all'),
  sort: z.enum(['-createdAt', 'createdAt', '-score', 'score']).default('-createdAt'),
});
export type ListLeadsQuery = z.infer<typeof listLeadsQuery>;

const requirementShape = {
  purpose: z.enum(LeadPurpose).nullable(),
  propertyTypes: z.array(z.enum(PropertyType)),
  bedroomsMin: z.number().int().min(0).max(10).nullable(),
  bedroomsMax: z.number().int().min(0).max(10).nullable(),
  // AED; anything this small is a typo (e.g. "2.5" meant 2.5M) and would match nothing.
  budgetMin: z.number().int().min(10_000, 'Budget is in AED, e.g. 2,500,000').nullable(),
  budgetMax: z.number().int().min(10_000, 'Budget is in AED, e.g. 2,500,000').nullable(),
  emirate: z.string().nullable(),
  communities: z.array(z.string()),
  timeline: z.enum(Timeline),
  financing: z.enum(Financing),
  mustHaves: z.array(z.string()),
  niceToHaves: z.array(z.string()),
};

export const updateRequirementSchema = z.object(requirementShape).partial();

/** Manual entry from the dashboard. Either a free-text note (AI extracts) or structured fields (or both). */
export const createLeadSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().max(30).optional(),
    email: z.email().optional(),
    instagramHandle: z.string().trim().max(60).optional(),
    source: z.enum(LeadSource).default('MANUAL'),
    preferredChannel: z.enum(Channel).optional(),
    notes: z.string().trim().max(4000).optional(),
    requirement: updateRequirementSchema.optional(),
    assignedToId: z.string().optional(),
    /** Who works the lead from the start: OFF, RULES (free) or AI (needs an email unless OFF). */
    agentMode: z.enum(AgentMode).default('OFF'),
  })
  .refine((v) => v.phone || v.email || v.instagramHandle, { message: 'Add a phone, email or Instagram handle', path: ['phone'] })
  .refine((v) => v.notes || v.requirement, { message: 'Add notes or requirements', path: ['notes'] })
  .refine((v) => v.agentMode === 'OFF' || v.email, { message: 'The proposal is sent by email: add an email address', path: ['email'] });
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  email: z.email().nullable().optional(),
  instagramHandle: z.string().trim().max(60).nullable().optional(),
  preferredChannel: z.enum(Channel).nullable().optional(),
  assignedToId: z.string().nullable().optional(),
});

export const changeStatusSchema = z.object({
  status: z.enum(LeadStatus),
  reason: z.string().trim().max(300).optional(),
});

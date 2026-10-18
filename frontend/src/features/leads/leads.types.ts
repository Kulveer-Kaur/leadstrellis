import type { AgentMode, Channel, LeadSource } from '@/types';

export interface RequirementInput {
  purpose?: 'BUY' | 'RENT' | 'INVEST' | null;
  bedroomsMin?: number | null;
  bedroomsMax?: number | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  communities?: string[];
  emirate?: string | null;
  timeline?: 'IMMEDIATE' | 'ONE_TO_THREE_MONTHS' | 'THREE_TO_SIX_MONTHS' | 'SIX_MONTHS_PLUS' | 'UNKNOWN';
  financing?: 'CASH' | 'MORTGAGE' | 'UNKNOWN';
  propertyTypes?: ('APARTMENT' | 'VILLA' | 'TOWNHOUSE' | 'PENTHOUSE' | 'STUDIO' | 'PLOT' | 'OFFICE')[];
  mustHaves?: string[];
}

/** Body of POST /leads (backend lead.validation.ts → createLeadSchema). */
export interface CreateLeadInput {
  fullName: string;
  phone?: string;
  email?: string;
  instagramHandle?: string;
  source: LeadSource;
  preferredChannel?: Channel;
  notes?: string;
  requirement?: RequirementInput;
  assignedToId?: string;
  /** Who works the lead: OFF (default), RULES (free) or AI (uses tokens). Needs an email unless OFF. */
  agentMode?: AgentMode;
}

export interface CreatedLead {
  id: string;
  code: string;
  fullName: string;
  assignedTo: { id: string; name: string } | null;
}

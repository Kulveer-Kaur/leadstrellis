import type { LeadSource } from '../generated/prisma/enums.js';
import type { RequirementView } from '../ai/context/ai-context.types.js';

export interface ScoringContext {
  requirement: RequirementView | null;
  source: LeadSource;
  /** Median price of comparable available listings, or null if none. */
  marketMedianAed: number | null;
  engagement: { inboundMessages: number; callsAnswered: number; viewingsBooked: number };
  aiIntent: { score: number; reasoning: string };
}

export interface RuleResult {
  key: string;
  label: string;
  points: number;
  max: number;
  note: string;
}

export type ScoringRule = (ctx: ScoringContext) => RuleResult;

import type { IntentLevel } from '../generated/prisma/enums.js';

/** Score components and their maximum points (total 100). See IMPLEMENTATION_PLAN.md §6 step 4. */
export const SCORE_WEIGHTS = {
  budgetFit: 25,
  timeline: 20,
  completeness: 15,
  sourceQuality: 10,
  engagement: 10,
  aiIntent: 20,
} as const;

export const INTENT_THRESHOLDS = { high: 70, medium: 40 } as const;

export const intentFromScore = (score: number): IntentLevel =>
  score >= INTENT_THRESHOLDS.high ? 'HIGH' : score >= INTENT_THRESHOLDS.medium ? 'MEDIUM' : 'LOW';

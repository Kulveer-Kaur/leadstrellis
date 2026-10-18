import type { RerankOutput } from '../schemas/rerank.schema.js';

export interface ScoredCandidate {
  refCode: string;
  prescore: number;
  /** Human-readable matched features from the prescorer, e.g. "in Dubai Marina", "sea view". */
  matched: string[];
  overBudgetPct: number;
}

/** Ranks by the rule-based prescore and writes a plain factual reason. */
export function rerankWithRules(candidates: ScoredCandidate[], pickCount: number): RerankOutput {
  return {
    picks: [...candidates]
      .sort((a, b) => b.prescore - a.prescore)
      .slice(0, pickCount)
      .map((c) => ({
        refCode: c.refCode,
        fitScore: Math.round(c.prescore),
        reason: c.matched.length ? `Matches your brief: ${c.matched.slice(0, 3).join(', ')}.` : 'Close to your budget and criteria.',
        caveat: c.overBudgetPct > 0 ? `${Math.round(c.overBudgetPct)}% above budget` : null,
      })),
  };
}

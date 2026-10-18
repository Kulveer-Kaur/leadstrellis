import type { LeadProfile, ListingView } from '../context/ai-context.types.js';
import { rerankWithRules, type ScoredCandidate } from '../fallbacks/rerank.fallback.js';
import { runJsonTask } from '../guards/run-json-task.js';
import { RERANK_PROMPT_VERSION, rerankSystemPrompt, rerankUserPrompt } from '../prompts/rerank-properties.prompt.js';
import { rerankSchema } from '../schemas/rerank.schema.js';

export interface RerankPick {
  refCode: string;
  fitScore: number;
  reason: string;
  caveat: string | null;
}

/** Stage 3 of matching: the LLM picks the best N of the pre-filtered candidates and explains why. */
export async function rerankProperties(lead: LeadProfile, listings: ListingView[], scored: ScoredCandidate[], pickCount = 3, useAi = true) {
  const result = await runJsonTask({
    task: 'rerank-properties',
    promptVersion: RERANK_PROMPT_VERSION,
    system: rerankSystemPrompt(pickCount),
    user: rerankUserPrompt(lead, listings),
    schema: rerankSchema,
    fallback: () => rerankWithRules(scored, pickCount),
    useAi: useAi && !clearWinner(scored),
  });

  // Keep only real, unique refCodes; top up from the rule ranking if the AI returned too few.
  const valid = new Set(listings.map((l) => l.refCode));
  const picks: RerankPick[] = [];
  for (const p of result.data.picks) {
    if (valid.has(p.refCode) && !picks.some((x) => x.refCode === p.refCode)) picks.push({ ...p, fitScore: Math.round(p.fitScore) });
  }
  if (picks.length < pickCount) {
    for (const p of rerankWithRules(scored, scored.length).picks) {
      if (picks.length >= pickCount) break;
      if (!picks.some((x) => x.refCode === p.refCode)) picks.push(p);
    }
  }
  return { picks: picks.slice(0, pickCount), source: result.source };
}

/**
 * Token saver: when the rule score already shows one clear best home (strong fit and a wide
 * lead over the runner-up), the AI would pick the same order, so the free ranking is used.
 */
export function clearWinner(scored: ScoredCandidate[]) {
  const [a, b] = [...scored].sort((x, y) => y.prescore - x.prescore);
  return Boolean(a && a.prescore >= 85 && a.overBudgetPct === 0 && (!b || a.prescore - b.prescore >= 15));
}

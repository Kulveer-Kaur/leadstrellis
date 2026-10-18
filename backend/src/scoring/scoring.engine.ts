import { INTENT_THRESHOLDS, intentFromScore } from '../constants/scoring.constants.js';
import { aiIntentRule } from './rules/ai-intent.rule.js';
import { budgetFitRule } from './rules/budget-fit.rule.js';
import { completenessRule } from './rules/completeness.rule.js';
import { engagementRule } from './rules/engagement.rule.js';
import { sourceQualityRule } from './rules/source-quality.rule.js';
import { timelineRule } from './rules/timeline.rule.js';
import type { ScoringContext, ScoringRule } from './scoring.types.js';

const RULES: ScoringRule[] = [budgetFitRule, timelineRule, completenessRule, sourceQualityRule, engagementRule, aiIntentRule];

/** Rules + AI → a 0–100 score with a per-rule breakdown, so every score can be explained. */
export function computeScore(ctx: ScoringContext) {
  const breakdown = RULES.map((rule) => rule(ctx));
  let total = Math.min(100, breakdown.reduce((sum, r) => sum + r.points, 0));
  // A budget far below the market for what they want is not a serious lead, however keen the message.
  const budget = breakdown.find((b) => b.key === 'budgetFit');
  if (budget && budget.points === 0 && ctx.marketMedianAed) total = Math.min(total, INTENT_THRESHOLDS.medium - 1);
  return { total, intentLevel: intentFromScore(total), breakdown };
}

import { SCORE_WEIGHTS } from '../../constants/scoring.constants.js';
import { formatAed } from '../../utils/currency.js';
import type { ScoringRule } from '../scoring.types.js';

/** Is the budget realistic for what they asked for? Compared with the median of comparable listings. */
export const budgetFitRule: ScoringRule = ({ requirement, marketMedianAed }) => {
  const max = SCORE_WEIGHTS.budgetFit;
  const budget = requirement?.budgetMax ?? requirement?.budgetMin;
  const base = { key: 'budgetFit', label: 'Budget fit', max };
  if (!budget) return { ...base, points: 5, note: 'Budget not given yet' };
  if (!marketMedianAed) return { ...base, points: 15, note: 'No comparable listings to check against' };

  const ratio = budget / marketMedianAed;
  const points = ratio >= 1 ? 25 : ratio >= 0.85 ? 20 : ratio >= 0.7 ? 12 : ratio >= 0.5 ? 6 : 0;
  const verdict = ratio >= 1 ? 'at or above' : ratio >= 0.85 ? 'slightly below' : ratio >= 0.5 ? 'well below' : 'far below';
  return { ...base, points, note: `${formatAed(budget)} is ${verdict} the ${formatAed(marketMedianAed)} median for similar homes` };
};

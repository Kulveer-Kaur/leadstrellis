import { SCORE_WEIGHTS } from '../../constants/scoring.constants.js';
import type { ScoringRule } from '../scoring.types.js';

export const aiIntentRule: ScoringRule = ({ aiIntent }) => ({
  key: 'aiIntent',
  label: 'AI intent signal',
  points: Math.min(SCORE_WEIGHTS.aiIntent, Math.max(0, Math.round(aiIntent.score))),
  max: SCORE_WEIGHTS.aiIntent,
  note: aiIntent.reasoning,
});

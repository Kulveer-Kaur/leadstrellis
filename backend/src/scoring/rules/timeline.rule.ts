import { SCORE_WEIGHTS } from '../../constants/scoring.constants.js';
import type { Timeline } from '../../generated/prisma/enums.js';
import type { ScoringRule } from '../scoring.types.js';

const POINTS: Record<Timeline, [number, string]> = {
  IMMEDIATE: [20, 'Wants to move now'],
  ONE_TO_THREE_MONTHS: [15, 'Within 1–3 months'],
  THREE_TO_SIX_MONTHS: [8, 'Within 3–6 months'],
  SIX_MONTHS_PLUS: [3, '6 months or more'],
  UNKNOWN: [6, 'Timeline unknown'],
};

export const timelineRule: ScoringRule = ({ requirement }) => {
  const [points, note] = POINTS[requirement?.timeline ?? 'UNKNOWN'];
  return { key: 'timeline', label: 'Timeline', points, max: SCORE_WEIGHTS.timeline, note };
};

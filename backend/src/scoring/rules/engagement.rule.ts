import { SCORE_WEIGHTS } from '../../constants/scoring.constants.js';
import type { ScoringRule } from '../scoring.types.js';

export const engagementRule: ScoringRule = ({ engagement: e }) => {
  const points = Math.min(SCORE_WEIGHTS.engagement, 2 + Math.min(e.inboundMessages, 2) * 2 + (e.callsAnswered ? 3 : 0) + (e.viewingsBooked ? 4 : 0));
  const parts = [
    e.inboundMessages ? `${e.inboundMessages} replies` : null,
    e.callsAnswered ? 'answered a call' : null,
    e.viewingsBooked ? 'viewing booked' : null,
  ].filter(Boolean);
  return { key: 'engagement', label: 'Engagement', points, max: SCORE_WEIGHTS.engagement, note: parts.length ? parts.join(', ') : 'First contact only' };
};

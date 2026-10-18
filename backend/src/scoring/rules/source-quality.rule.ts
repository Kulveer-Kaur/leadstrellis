import { SCORE_WEIGHTS } from '../../constants/scoring.constants.js';
import type { LeadSource } from '../../generated/prisma/enums.js';
import type { ScoringRule } from '../scoring.types.js';

/** Historical conversion by channel: phone and agent-entered (referrals, walk-ins) convert best. */
const POINTS: Record<LeadSource, number> = {
  PHONE: 10,
  REFERRAL: 10,
  MANUAL: 9,
  WHATSAPP: 8,
  EMAIL: 7,
  WEBSITE: 7,
  GOOGLE_BUSINESS: 7,
  PROPERTY_PORTAL: 7,
  INSTAGRAM: 6,
  FACEBOOK: 6,
  ADS: 5,
};

export const sourceQualityRule: ScoringRule = ({ source }) => ({
  key: 'sourceQuality',
  label: 'Source quality',
  points: POINTS[source],
  max: SCORE_WEIGHTS.sourceQuality,
  note: `${source.charAt(0)}${source.slice(1).toLowerCase()} leads`,
});

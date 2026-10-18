import { SCORE_WEIGHTS } from '../../constants/scoring.constants.js';
import type { ScoringRule } from '../scoring.types.js';

const KEY_FIELDS = 6;

export const completenessRule: ScoringRule = ({ requirement }) => {
  const missing = requirement ? requirement.missingFields.length : KEY_FIELDS;
  const known = KEY_FIELDS - missing;
  return {
    key: 'completeness',
    label: 'Completeness',
    points: Math.round((known / KEY_FIELDS) * SCORE_WEIGHTS.completeness),
    max: SCORE_WEIGHTS.completeness,
    note: `${known} of ${KEY_FIELDS} key details known`,
  };
};

import type { RequirementView } from '../../ai/context/ai-context.types.js';
import type { ScoredCandidate } from '../../ai/fallbacks/rerank.fallback.js';
import { findCommunity } from '../../constants/uae-locations.js';
import type { Property } from '../../generated/prisma/client.js';

/** Keywords that show a listing satisfies a must-have. */
const FEATURE_HINTS: Record<string, RegExp> = {
  'sea view': /sea|beach|water|marina|palm|gulf/i,
  'marina view': /marina/i,
  'Burj Khalifa view': /burj/i,
  'golf view': /golf/i,
  'private pool': /private pool/i,
  "maid's room": /maid/i,
  'pet friendly': /pet/i,
  'near metro': /metro/i,
  '2 parking': /2 parking|two parking/i,
  furnished: /furnished/i,
  garden: /garden/i,
  'near schools': /school/i,
  balcony: /balcony|terrace/i,
};

/** Stage 2 (rule-based ranking): 0–100 fit plus the human-readable reasons behind it. */
export function prescore(r: RequirementView, p: Property): ScoredCandidate {
  const matched: string[] = [];
  let score = 0;

  // Price (30)
  let overBudgetPct = 0;
  if (r.budgetMax) {
    const ratio = p.priceAed / r.budgetMax;
    if (ratio <= 1) {
      score += ratio >= 0.7 ? 30 : 20;
      matched.push('within budget');
    } else {
      overBudgetPct = (ratio - 1) * 100;
      score += Math.max(0, 30 - overBudgetPct * 2.5);
    }
  } else score += 15;

  // Location (25)
  if (r.communities.includes(p.community)) {
    score += 25;
    matched.push(`in ${p.community}`);
  } else if (r.communities.some((c) => findCommunity(c)?.nearby.includes(p.community))) {
    score += 12;
    matched.push(`${p.community}, next to your preferred area`);
  } else if (!r.communities.length && (!r.emirate || r.emirate === p.emirate)) score += 12;
  else if (r.emirate === p.emirate) score += 5;

  // Bedrooms (20) and type (10): the wrong bedroom count is the most common bad match.
  if (r.bedroomsMin == null) score += 10;
  else if (p.bedrooms >= r.bedroomsMin && p.bedrooms <= (r.bedroomsMax ?? r.bedroomsMin)) {
    score += 20;
    matched.push(p.bedrooms === 0 ? 'studio as requested' : `${p.bedrooms} bedroom${p.bedrooms === 1 ? '' : 's'}`);
  } else if (Math.abs(p.bedrooms - r.bedroomsMin) <= 1 || Math.abs(p.bedrooms - (r.bedroomsMax ?? r.bedroomsMin)) <= 1) score += 5;
  score += !r.propertyTypes.length || r.propertyTypes.includes(p.type) ? 10 : 4;

  // Must-haves (10)
  const haystack = `${p.view ?? ''} ${p.amenities.join(' ')} ${p.description} ${p.furnished ? 'furnished' : ''}`;
  if (r.mustHaves.length) {
    const hits = r.mustHaves.filter((m) => (FEATURE_HINTS[m] ?? new RegExp(m.replace(/[^\w ]/g, ''), 'i')).test(haystack));
    score += Math.round((hits.length / r.mustHaves.length) * 10);
    matched.push(...hits);
  } else score += 6;

  // Ready vs off-plan (5)
  if (!r.completionPreference) score += 3;
  else if (r.completionPreference === p.completionStatus) {
    score += 5;
    matched.push(p.completionStatus === 'READY' ? 'ready to move in' : 'off-plan with payment plan');
  }

  return { refCode: p.refCode, prescore: Math.min(100, Math.round(score)), matched, overBudgetPct };
}

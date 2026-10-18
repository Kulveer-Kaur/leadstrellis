import { ALIASES_LONGEST_FIRST, findCommunity, normalizeEmirate } from '../../constants/uae-locations.js';
import type { PropertyType, Timeline } from '../../generated/prisma/enums.js';
import { formatAed } from '../../utils/currency.js';
import { MISSING_FIELDS, type UnderstandLeadOutput } from '../schemas/understand-lead.schema.js';

/**
 * Rule-based lead understanding. Used offline (mock mode), as the AI fallback,
 * and by the seed script. Deliberately conservative: unknown stays null.
 */
export function extractWithRules(message: string): UnderstandLeadOutput {
  const text = ` ${message.toLowerCase().replace(/\s+/g, ' ')} `;
  const { budgetMin, budgetMax } = parseBudget(text);
  const { bedroomsMin, bedroomsMax, maid } = parseBedrooms(text);
  const propertyTypes = parseTypes(text, bedroomsMin);
  const communities = parseCommunities(text);
  const emirate = communities.length ? findCommunity(communities[0])!.emirate : parseEmirate(text);
  const impliedBuy = (budgetMax ?? 0) >= 300_000;
  const purpose = /\b(rent|rental|lease|tenancy|per month|monthly|yearly|per year|\/yr|cheques?)\b/.test(text) && !/rental income|rental yield/.test(text)
    ? 'RENT'
    : /\b(invest(ment|or)?|roi|yield|rental income|golden visa|flip)\b/.test(text)
      ? 'INVEST'
      : /\b(buy|purchase|own|cash buyer|mortgage)\b/.test(text)
        ? 'BUY'
        : impliedBuy
          ? 'BUY'
          : null;
  const timeline = parseTimeline(text);
  const financing = /\bcash\b/.test(text) ? 'CASH' : /\b(mortgage|pre-?approved|bank finance|financing)\b/.test(text) ? 'MORTGAGE' : 'UNKNOWN';
  const completionPreference = /\b(off[- ]?plan|payment plan|handover)\b/.test(text)
    ? 'OFF_PLAN'
    : /\b(ready|move in|vacant|ready to move)\b/.test(text)
      ? 'READY'
      : null;
  const mustHaves = parseMustHaves(text, maid);
  const language = /[؀-ۿ]/.test(message)
    ? /[a-z]{3,}/i.test(message)
      ? 'mixed'
      : 'ar'
    : /\b(habibi|yalla|inshallah|shukran|marhaba|salam|wallah)\b/.test(text)
      ? 'mixed'
      : 'en';

  const known = {
    budget: budgetMax != null || budgetMin != null,
    location: communities.length > 0 || emirate != null,
    bedrooms: bedroomsMin != null,
    propertyType: propertyTypes.length > 0,
    timeline: timeline !== 'UNKNOWN',
    purpose: purpose != null,
  };
  const missingFields = MISSING_FIELDS.filter((f) => !known[f]);
  const intent = scoreIntent(text, 6 - missingFields.length, timeline, financing);

  return {
    purpose,
    propertyTypes,
    bedroomsMin,
    bedroomsMax,
    budgetMin,
    budgetMax,
    emirate,
    communities,
    timeline,
    financing,
    completionPreference,
    mustHaves,
    niceToHaves: [],
    language,
    summary: summarize({ purpose, propertyTypes, bedroomsMin, communities, emirate, budgetMax, timeline }),
    confidence: Math.round(((6 - missingFields.length) / 6) * 70) / 100,
    missingFields,
    contact: {
      fullName: null,
      email: message.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] ?? null,
      phone: message.match(/(\+?971|0)5\d[\s-]?\d{3}[\s-]?\d{4}/)?.[0] ?? null,
    },
    intent,
  };
}

const UNIT: Record<string, number> = { k: 1e3, thousand: 1e3, m: 1e6, mn: 1e6, mil: 1e6, million: 1e6, cr: 1e7, crore: 1e7 };

/** Fixed demo FX rates to AED (same as the AI prompt). */
const FX: Record<string, number> = { '£': 4.65, gbp: 4.65, $: 3.67, usd: 3.67, '€': 4.0, eur: 4.0 };

function parseBudget(text: string) {
  const amounts: number[] = [];
  // UAE rents are yearly: "5k a month" → 60000.
  const monthly = /(per month|a month|\/month|\/mo|monthly|pm\b)/.test(text);
  const re = /(aed|dhs?|dirhams?|£|\$|€|gbp|usd|eur)?\s?(\d{1,3}(?:[,.]\d{1,3})*(?:\.\d+)?)\s?(k|thousand|mn|mil|million|m|cr|crore)?\s?(gbp|usd|eur|pounds?|dollars?|euros?)?\b/g;
  for (const m of text.matchAll(re)) {
    const unit = m[3];
    const raw = Number(m[2].replace(/,(?=\d{3})/g, ''));
    const currency = (m[1] ?? m[4] ?? '').replace(/pounds?/, 'gbp').replace(/dollars?/, 'usd').replace(/euros?/, 'eur');
    const hasCurrency = Boolean(currency);
    if (!unit && !hasCurrency && raw < 10_000) continue; // "2 bed", "4 cheques"
    let value = unit ? raw * UNIT[unit] : raw;
    if (unit === 'cr' || unit === 'crore') value *= 0.044; // INR crore → AED
    value *= FX[currency] ?? 1;
    if (monthly && value >= 1_000 && value < 100_000) value *= 12;
    if (value >= 10_000 && value <= 500_000_000) amounts.push(Math.round(value));
  }
  if (!amounts.length) return { budgetMin: null, budgetMax: null };
  const scaled = amounts;
  if (scaled.length >= 2) return { budgetMin: Math.min(...scaled.slice(0, 2)), budgetMax: Math.max(...scaled.slice(0, 2)) };
  const [v] = scaled;
  if (/\b(around|about|approx|roughly)\b/.test(text)) return { budgetMin: Math.round(v * 0.9), budgetMax: Math.round(v * 1.1) };
  return { budgetMin: null, budgetMax: v };
}

const WORD_NUM: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };

function parseBedrooms(text: string) {
  const maid = /maid/.test(text);
  if (/\bstudio\b/.test(text)) return { bedroomsMin: 0, bedroomsMax: 0, maid };
  const range = text.match(/\b(\d)\s?(?:-|to|or)\s?(\d)\s?(?:br|bhk|bed)/);
  if (range) return { bedroomsMin: Number(range[1]), bedroomsMax: Number(range[2]), maid };
  const single = text.match(/\b(\d)\s?(?:\+\s?maid\s?)?(?:br|bhk|b\/r|bed(?:room)?s?|bd)\b/);
  if (single) return { bedroomsMin: Number(single[1]), bedroomsMax: Number(single[1]), maid };
  const field = text.match(/\bbed(?:room)?s?\s?[:=]\s?(\d)\b/); // web form "Bedrooms: 3"
  if (field) return { bedroomsMin: Number(field[1]), bedroomsMax: Number(field[1]), maid };
  const word = text.match(/\b(one|two|three|four|five|six)[\s-]bed(?:room)?/);
  if (word) return { bedroomsMin: WORD_NUM[word[1]], bedroomsMax: WORD_NUM[word[1]], maid };
  return { bedroomsMin: null, bedroomsMax: null, maid };
}

function parseTypes(text: string, beds: number | null): PropertyType[] {
  const types = new Set<PropertyType>();
  if (/\bvillas?\b/.test(text)) types.add('VILLA');
  if (/\b(townhouses?|town house|th)\b/.test(text)) types.add('TOWNHOUSE');
  if (/\b(penthouses?|ph)\b/.test(text)) types.add('PENTHOUSE');
  if (/\b(apartments?|flats?|apt|unit)\b/.test(text)) types.add('APARTMENT');
  if (/\bstudio\b/.test(text) || beds === 0) types.add('STUDIO');
  if (/\b(plot|land)\b/.test(text)) types.add('PLOT');
  if (/\boffice\b/.test(text)) types.add('OFFICE');
  return [...types];
}

function parseCommunities(text: string) {
  const found: string[] = [];
  let rest = text;
  for (const alias of ALIASES_LONGEST_FIRST) {
    if (alias.length < 3) continue;
    const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (re.test(rest)) {
      const c = findCommunity(alias)!;
      if (!found.includes(c.name)) found.push(c.name);
      rest = rest.replace(re, ' ');
    }
  }
  return found;
}

function parseEmirate(text: string) {
  for (const e of ['abu dhabi', 'dubai', 'sharjah', 'ajman', 'ras al khaimah', 'rak']) {
    if (text.includes(e)) return normalizeEmirate(e) ?? null;
  }
  return null;
}

function parseTimeline(text: string): Timeline {
  if (/\b(asap|urgent(ly)?|immediately|this week|this month|right away|today|now)\b/.test(text)) return 'IMMEDIATE';
  if (/\b(next month|within (a|one|two|2|1) months?|in (1|2|3|two|three) months|1-3 months|(by|in) (january|february|march|april|may|june|july|august|september|october|november|december))\b/.test(text)) return 'ONE_TO_THREE_MONTHS';
  if (/\b(3-6 months|in (4|5|6|four|five|six) months|six months|by (q1|q2|q3|q4)|end of (the )?year)\b/.test(text)) return 'THREE_TO_SIX_MONTHS';
  if (/\b(next year|no rush|just (looking|exploring|browsing)|exploring|20(27|28|29))\b/.test(text)) return 'SIX_MONTHS_PLUS';
  return 'UNKNOWN';
}

const MUST_HAVES: [RegExp, string][] = [
  [/sea view|sea-view|beach view|water view/, 'sea view'],
  [/burj (khalifa )?view/, 'Burj Khalifa view'],
  [/marina view/, 'marina view'],
  [/golf view|golf course/, 'golf view'],
  [/private pool/, 'private pool'],
  [/\bpets?\b|pet[- ]friendly|dog|cat\b/, 'pet friendly'],
  [/metro/, 'near metro'],
  [/\b(2|two) parking/, '2 parking'],
  [/\bfurnished\b/, 'furnished'],
  [/garden/, 'garden'],
  [/school/, 'near schools'],
  [/balcony/, 'balcony'],
];

function parseMustHaves(text: string, maid: boolean) {
  const list = MUST_HAVES.filter(([re]) => re.test(text)).map(([, label]) => label);
  if (maid) list.unshift("maid's room");
  if (/unfurnished/.test(text)) return list.filter((l) => l !== 'furnished');
  return list;
}

function scoreIntent(text: string, knownCount: number, timeline: Timeline, financing: string) {
  const signals: string[] = [];
  if (/\b(seo|backlinks|crypto|loan offer|click here|promotion)\b/.test(text)) {
    return { score: 1, signals: ['looks like spam'], reasoning: 'The message does not look like a genuine property enquiry.' };
  }
  let score = 4 + knownCount;
  if (timeline === 'IMMEDIATE') (score += 4), signals.push('urgent timeline');
  else if (timeline === 'ONE_TO_THREE_MONTHS') (score += 2), signals.push('moving within 3 months');
  if (financing === 'CASH') (score += 3), signals.push('cash buyer');
  if (/pre-?approved/.test(text)) (score += 3), signals.push('mortgage pre-approved');
  if (/\b(viewing|visit|see it|see the|schedule|book)\b/.test(text)) (score += 2), signals.push('asked for a viewing');
  if (/\b(just (looking|browsing)|price list|what do you have|any options)\b/.test(text)) (score -= 3), signals.push('browsing');
  const capped = Math.max(0, Math.min(20, score));
  return {
    score: capped,
    signals,
    reasoning: signals.length ? `Based on: ${signals.join(', ')}.` : 'Few commitment signals in the message.',
  };
}

function summarize(p: {
  purpose: string | null;
  propertyTypes: PropertyType[];
  bedroomsMin: number | null;
  communities: string[];
  emirate: string | null;
  budgetMax: number | null;
  timeline: Timeline;
}) {
  const beds = p.bedroomsMin == null ? '' : p.bedroomsMin === 0 ? 'studio ' : `${p.bedroomsMin}BR `;
  const type = p.propertyTypes.filter((t) => t !== 'STUDIO')[0]?.toLowerCase() ?? (beds ? '' : 'property');
  const where = p.communities[0] ?? p.emirate ?? 'the UAE';
  const verb = p.purpose === 'RENT' ? 'Wants to rent' : p.purpose === 'INVEST' ? 'Investor looking for' : 'Looking for';
  const budget = p.budgetMax ? ` up to ${formatAed(p.budgetMax)}${p.purpose === 'RENT' ? '/year' : ''}` : '';
  const when = p.timeline === 'IMMEDIATE' ? ', needs it soon' : '';
  return `${verb} a ${beds}${type} in ${where}${budget}${when}.`.replace(/\s+/g, ' ').replace(' a  ', ' a ');
}

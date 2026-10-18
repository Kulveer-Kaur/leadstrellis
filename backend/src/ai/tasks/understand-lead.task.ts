import { findCommunity, normalizeEmirate } from '../../constants/uae-locations.js';
import { extractWithRules } from '../fallbacks/keyword-extractor.js';
import { runJsonTask } from '../guards/run-json-task.js';
import {
  UNDERSTAND_LEAD_PROMPT_VERSION,
  understandLeadSystemPrompt,
  understandLeadUserPrompt,
  type UnderstandLeadPromptInput,
} from '../prompts/understand-lead.prompt.js';
import { MISSING_FIELDS, understandLeadSchema, type UnderstandLeadOutput } from '../schemas/understand-lead.schema.js';

/** Step 3 + AI half of step 4: extract requirements and read intent from a free-text enquiry. */
export async function understandLead(input: UnderstandLeadPromptInput, useAi = true) {
  const result = await runJsonTask({
    task: 'understand-lead',
    promptVersion: UNDERSTAND_LEAD_PROMPT_VERSION,
    system: understandLeadSystemPrompt(),
    user: understandLeadUserPrompt(input),
    schema: understandLeadSchema,
    fallback: () => extractWithRules(input.message),
    useAi,
  });
  return { ...result, data: normalize(result.data) };
}

/** Snap AI output onto our canonical vocabulary and fix inconsistencies. */
function normalize(o: UnderstandLeadOutput): UnderstandLeadOutput {
  const communities: string[] = [];
  const niceToHaves = [...o.niceToHaves];
  for (const name of o.communities) {
    const c = findCommunity(name);
    if (c && !communities.includes(c.name)) communities.push(c.name);
    else if (!c) niceToHaves.push(`near ${name}`);
  }
  const emirate = normalizeEmirate(o.emirate) ?? (communities[0] ? findCommunity(communities[0])!.emirate : null);

  const round = (n: number | null) => (n == null ? null : Math.round(n));
  let [budgetMin, budgetMax] = [round(o.budgetMin), round(o.budgetMax)];
  if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) [budgetMin, budgetMax] = [budgetMax, budgetMin];

  let [bedroomsMin, bedroomsMax] = [round(o.bedroomsMin), round(o.bedroomsMax)];
  if (o.propertyTypes.includes('STUDIO') && bedroomsMin == null) [bedroomsMin, bedroomsMax] = [0, 0];
  if (bedroomsMin != null && bedroomsMax == null) bedroomsMax = bedroomsMin;

  const known: Record<(typeof MISSING_FIELDS)[number], boolean> = {
    budget: budgetMax != null || budgetMin != null,
    location: communities.length > 0 || emirate != null,
    bedrooms: bedroomsMin != null,
    propertyType: o.propertyTypes.length > 0,
    timeline: o.timeline !== 'UNKNOWN',
    purpose: o.purpose != null,
  };

  return {
    ...o,
    communities,
    niceToHaves,
    emirate,
    budgetMin,
    budgetMax,
    bedroomsMin,
    bedroomsMax,
    missingFields: MISSING_FIELDS.filter((f) => !known[f]),
    intent: { ...o.intent, score: Math.round(Math.min(20, Math.max(0, o.intent.score))) },
  };
}

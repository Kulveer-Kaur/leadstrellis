import { toRequirementView } from '../../ai/context/ai-context.js';
import type { UnderstandLeadOutput } from '../../ai/schemas/understand-lead.schema.js';
import { MISSING_FIELDS } from '../../ai/schemas/understand-lead.schema.js';
import type { CallSummary } from '../../ai/schemas/summarize-call.schema.js';
import { findCommunity } from '../../constants/uae-locations.js';
import type { LeadRequirement, Prisma } from '../../generated/prisma/client.js';
import type { ExtractedBy } from '../../generated/prisma/enums.js';
import { prisma } from '../../lib/prisma.js';

/** Recomputes which key fields are still unknown. */
export function missingFieldsOf(r: Pick<LeadRequirement, 'budgetMin' | 'budgetMax' | 'communities' | 'emirate' | 'bedroomsMin' | 'propertyTypes' | 'timeline' | 'purpose'>) {
  const known = {
    budget: r.budgetMax != null || r.budgetMin != null,
    location: r.communities.length > 0 || r.emirate != null,
    bedrooms: r.bedroomsMin != null,
    propertyType: r.propertyTypes.length > 0,
    timeline: r.timeline !== 'UNKNOWN',
    purpose: r.purpose != null,
  };
  return MISSING_FIELDS.filter((f) => !known[f]);
}

/** Saves AI extraction output as the lead's requirement. Fields an agent set by hand are kept. */
export async function saveExtractedRequirement(leadId: string, o: UnderstandLeadOutput, extractedBy: ExtractedBy) {
  const existing = await prisma.leadRequirement.findUnique({ where: { leadId } });
  const extracted = {
    purpose: o.purpose,
    propertyTypes: o.propertyTypes,
    bedroomsMin: o.bedroomsMin,
    bedroomsMax: o.bedroomsMax,
    budgetMin: o.budgetMin,
    budgetMax: o.budgetMax,
    emirate: o.emirate,
    communities: o.communities,
    timeline: o.timeline,
    financing: o.financing,
    completionPreference: o.completionPreference,
    mustHaves: o.mustHaves,
    niceToHaves: o.niceToHaves,
    summary: o.summary,
    confidence: o.confidence,
    missingFields: o.missingFields,
    extractedBy,
  };
  const data = existing?.extractedBy === 'MANUAL' ? mergeManual(existing, extracted) : extracted;
  return prisma.leadRequirement.upsert({ where: { leadId }, create: { leadId, ...data }, update: data });
}

/** Agent-entered values win; AI fills only what the agent left empty. */
function mergeManual(manual: LeadRequirement, ai: Omit<LeadRequirement, 'id' | 'leadId' | 'updatedAt' | 'currency'>) {
  const pick = <K extends keyof typeof ai>(k: K) => {
    const m = manual[k as keyof LeadRequirement] as unknown;
    const empty = m == null || (Array.isArray(m) && m.length === 0) || m === 'UNKNOWN';
    return (empty ? ai[k] : m) as (typeof ai)[K];
  };
  const merged = { ...ai };
  for (const k of Object.keys(ai) as (keyof typeof ai)[]) (merged as Record<string, unknown>)[k] = pick(k);
  merged.extractedBy = 'MANUAL';
  merged.missingFields = missingFieldsOf(merged);
  return merged;
}

/** Applies what the lead said on a call on top of the existing requirement. */
export async function applyCallUpdates(leadId: string, u: CallSummary['requirementUpdates']) {
  const current = await prisma.leadRequirement.findUnique({ where: { leadId } });
  if (!current) return null;
  const communities = u.communities.map((c) => findCommunity(c)?.name).filter((c): c is string => Boolean(c));
  const patch: Prisma.LeadRequirementUpdateInput = {
    ...(u.budgetMin != null ? { budgetMin: Math.round(u.budgetMin) } : {}),
    ...(u.budgetMax != null ? { budgetMax: Math.round(u.budgetMax) } : {}),
    ...(u.bedroomsMin != null ? { bedroomsMin: u.bedroomsMin, bedroomsMax: u.bedroomsMax ?? u.bedroomsMin } : {}),
    ...(u.propertyTypes.length ? { propertyTypes: u.propertyTypes } : {}),
    ...(communities.length ? { communities, emirate: findCommunity(communities[0])!.emirate } : {}),
    ...(u.timeline ? { timeline: u.timeline } : {}),
    ...(u.financing ? { financing: u.financing } : {}),
    ...(u.addMustHaves.length ? { mustHaves: [...new Set([...current.mustHaves, ...u.addMustHaves])] } : {}),
  };
  if (!Object.keys(patch).length) return current;
  const updated = await prisma.leadRequirement.update({ where: { leadId }, data: patch });
  return prisma.leadRequirement.update({ where: { leadId }, data: { missingFields: missingFieldsOf(updated) } });
}

/** Agent edits to the requirement (marked MANUAL so AI re-processing will not overwrite them). */
export async function updateRequirementManually(leadId: string, patch: Prisma.LeadRequirementUncheckedUpdateInput) {
  const saved = await prisma.leadRequirement.upsert({
    where: { leadId },
    create: { ...(patch as Prisma.LeadRequirementUncheckedCreateInput), leadId, extractedBy: 'MANUAL' },
    update: { ...patch, extractedBy: 'MANUAL' },
  });
  const updated = await prisma.leadRequirement.update({ where: { leadId }, data: { missingFields: missingFieldsOf(saved) } });
  return toRequirementView(updated);
}

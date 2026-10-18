import { toLeadProfile, toListingView } from '../../ai/context/ai-context.js';
import { rerankProperties } from '../../ai/tasks/rerank-properties.task.js';
import type { Property } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { logActivity } from '../activity/activity.service.js';
import { buildPropertyFilter, MAX_RELAX_LEVEL } from './filters.builder.js';
import { prescore } from './prescore.js';

const MIN_CANDIDATES = 5;
const RERANK_POOL = 10;

/**
 * Three-stage matching: SQL hard filters (relaxed step by step) → rule-based prescore
 * → AI re-rank of the top 10 into the final picks, each with a reason.
 */
export async function refreshMatches(leadId: string, pickCount = 3, opts: { useAi?: boolean } = {}) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { requirement: true } });
  if (!lead) throw ApiError.notFound('Lead');
  const profile = toLeadProfile(lead);
  if (!profile.requirement) return [];
  const r = profile.requirement;
  const knownCount = [r.budgetMax ?? r.budgetMin, r.communities.length || r.emirate, r.bedroomsMin ?? (r.propertyTypes.length || null)].filter((v) => v != null && v !== 0 && v !== '').length;
  if (knownCount < 2) {
    await prisma.leadPropertyMatch.deleteMany({ where: { leadId, sentAt: null } });
    await logActivity({ leadId, actorType: 'AI', type: 'matching.skipped', title: 'Needs more details before matching', detail: `Missing: ${r.missingFields.join(', ')}. The AI will ask for these first.` });
    return [];
  }

  // Stage 1: filters, relaxing until there are enough candidates.
  let candidates: Property[] = [];
  let level = 0;
  for (; level <= MAX_RELAX_LEVEL; level++) {
    candidates = await prisma.property.findMany({ where: buildPropertyFilter(profile.requirement, level), take: 60 });
    if (candidates.length >= MIN_CANDIDATES) break;
  }
  if (!candidates.length) {
    await logActivity({ leadId, actorType: 'AI', type: 'matching.none', title: 'No matching properties yet', detail: 'Nothing in stock fits; the lead will be re-matched when new listings arrive.' });
    return [];
  }

  // Stage 2: prescore and keep the best pool for the AI.
  const scored = candidates.map((p) => ({ property: p, score: prescore(profile.requirement!, p) }));
  scored.sort((a, b) => b.score.prescore - a.score.prescore);
  const pool = scored.slice(0, RERANK_POOL);

  // Stage 3: AI re-rank.
  const { picks, source } = await rerankProperties(
    profile,
    pool.map((s) => toListingView(s.property)),
    pool.map((s) => s.score),
    pickCount,
    // Default: AI ranking only for leads on the AI agent.
    opts.useAi ?? lead.agentMode === 'AI',
  );

  const byRef = new Map(pool.map((s) => [s.property.refCode, s]));
  await prisma.$transaction([
    prisma.leadPropertyMatch.deleteMany({ where: { leadId, sentAt: null } }),
    ...pool.map((s) => {
      const rank = picks.findIndex((p) => p.refCode === s.property.refCode);
      const pick = picks[rank];
      const data = {
        filterScore: s.score.prescore,
        finalRank: rank >= 0 ? rank + 1 : null,
        aiFitScore: pick?.fitScore ?? null,
        aiReason: pick?.reason ?? null,
        caveat: pick?.caveat ?? null,
      };
      return prisma.leadPropertyMatch.upsert({
        where: { leadId_propertyId: { leadId, propertyId: s.property.id } },
        create: { leadId, propertyId: s.property.id, ...data },
        update: data,
      });
    }),
  ]);

  const top = picks.map((p) => byRef.get(p.refCode)!.property);
  await logActivity({
    leadId,
    actorType: 'AI',
    type: 'matching.done',
    title: `Matched ${top.length} ${top.length === 1 ? 'property' : 'properties'}`,
    detail: top.map((p) => `${p.title} (${p.community})`).join(' · '),
    payload: { relaxLevel: level, candidates: candidates.length, rankedBy: source },
  });
  return getTopMatches(leadId, pickCount);
}

/** The lead's current ranked matches with property details. */
export const getTopMatches = (leadId: string, take = 3) =>
  prisma.leadPropertyMatch.findMany({
    where: { leadId, finalRank: { not: null } },
    orderBy: { finalRank: 'asc' },
    take,
    include: { property: true },
  });

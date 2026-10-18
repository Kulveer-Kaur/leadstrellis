import type { AgentTask } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { logActivity } from '../../modules/activity/activity.service.js';
import { enqueueRouteTask, setStep } from '../../modules/ai-route/ai-route.service.js';
import { pickPrimaryMatch } from '../../modules/ai-route/proposal.service.js';
import { refreshMatches } from '../../modules/matching/matching.service.js';
import { advanceIfIn } from '../../modules/pipeline/pipeline.service.js';
import type { AgentRunResult } from './types.js';

/**
 * Matchmaker (AI route step 2): compares the lead's needs with every available property,
 * keeps the best 4, and marks the one with the highest fit % as the property to propose.
 */
export async function runMatchmakerAgent(task: AgentTask): Promise<AgentRunResult> {
  if (!task.leadId) return { outcome: 'skipped', reason: 'no leadId' };
  const lead = await prisma.lead.findUnique({ where: { id: task.leadId }, include: { requirement: true } });
  if (!lead) return { outcome: 'skipped', reason: 'lead not found' };
  if (!lead.aiRouteEnabled) return { outcome: 'skipped', reason: 'AI route is off for this lead' };

  // Matches were just made by the AI pipeline when the route continues straight from it;
  // re-run them when the route is (re)started on an older lead or a new proposal is asked for.
  const refresh = (task.payload as { refresh?: boolean } | null)?.refresh ?? false;
  const existing = await prisma.leadPropertyMatch.count({ where: { leadId: lead.id, finalRank: { not: null } } });
  if (refresh || !existing) await refreshMatches(lead.id, 4);
  const pick = await pickPrimaryMatch(lead.id);
  if (!pick) {
    const missing = lead.requirement?.missingFields.length ? `Missing details: ${lead.requirement.missingFields.join(', ')}.` : 'Nothing in stock fits yet.';
    await setStep(lead.id, 'NEEDS_ATTENTION', `No matching property found. ${missing} Edit the requirements and the agent will try again.`);
    return { outcome: 'done', detail: 'no matches: needs attention' };
  }

  await advanceIfIn(lead.id, ['NEW'], 'QUALIFIED', 'AI', 'Matched properties found');
  const best = pick.primary;
  await logActivity({
    leadId: lead.id,
    actorType: 'AI',
    type: 'ai-route.matched',
    title: `Best match: ${best.property.title} (${best.aiFitScore ?? Math.round(best.filterScore)}% fit)`,
    detail: pick.others.length ? `Also matched: ${pick.others.map((m) => `${m.property.title} (${m.aiFitScore ?? Math.round(m.filterScore)}%)`).join(' · ')}` : undefined,
  });
  await setStep(lead.id, 'PROPOSING', `Writing the proposal for ${best.property.title}`);
  await enqueueRouteTask('DEAL', 'ai_route_proposal', lead.id);
  return { outcome: 'done', detail: `best ${best.property.refCode} (${best.aiFitScore ?? '–'}%), ${pick.others.length} alternatives` };
}

import { eventBus } from '../../events/event-bus.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { ActorType, LeadStatus } from '../../generated/prisma/enums.js';
import { enqueueLeadProcessing } from '../../jobs/lead-processing.job.js';
import { emitSocket } from '../../lib/socket.js';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { pageMeta } from '../../utils/pagination.js';
import { normalizePhone } from '../../utils/phone.js';
import { logActivity } from '../activity/activity.service.js';
import { enqueueRouteTask, setAgentMode, setStep } from '../ai-route/ai-route.service.js';
import { listProposals } from '../ai-route/proposal.service.js';
import { refreshMatches } from '../matching/matching.service.js';
import { changeStatus } from '../pipeline/pipeline.service.js';
import { pickAgent } from '../users/assignment.service.js';
import { scoreLead } from './lead-scoring.service.js';
import { findLeadDetail, findLeads } from './lead.repository.js';
import { leadCode, toLeadSummary } from './lead.mapper.js';
import { updateRequirementManually } from './requirement.service.js';
import type { CreateLeadInput, ListLeadsQuery } from './lead.validation.js';

export async function listLeads(q: ListLeadsQuery, user?: { id: string; role: string }) {
  const { rows, total } = await findLeads(q, user);
  return { data: rows.map(toLeadSummary), meta: pageMeta(q.page, q.pageSize, total) };
}

export async function getLead(id: string, user?: { id: string; role: string }) {
  const lead = await findLeadDetail(id);
  if (!lead) throw ApiError.notFound('Lead');
  if (user?.role === 'AGENT' && lead.assignedToId !== user.id) {
    throw ApiError.forbidden('You only have access to leads assigned to you.');
  }
  return { ...lead, code: leadCode(lead), summary: toLeadSummary(lead), proposals: await listProposals(id) };
}

/** Manual entry by an admin/agent. Free-text notes go through the same AI pipeline as any channel. */
export async function createManualLead(input: CreateLeadInput, actor: { id: string }) {
  const lead = await prisma.lead.create({
    data: {
      fullName: input.fullName,
      phone: normalizePhone(input.phone),
      email: input.email?.toLowerCase(),
      instagramHandle: input.instagramHandle?.replace(/^@/, ''),
      source: input.source,
      preferredChannel: input.preferredChannel,
      rawMessage: input.notes,
      assignedToId: input.assignedToId ?? (await pickAgent()),
      // The engine is chosen before the first read, so a RULES/OFF lead never spends AI tokens.
      agentMode: input.agentMode,
    },
  });
  if (input.requirement) await updateRequirementManually(lead.id, input.requirement);
  await logActivity({ leadId: lead.id, actorType: 'USER', type: 'lead.created', title: 'Lead added manually', detail: lead.fullName, payload: { by: actor.id } });
  eventBus.emit('lead.created', { leadId: lead.id });
  emitSocket('lead:created', { leadId: lead.id });
  if (input.agentMode !== 'OFF') {
    // Starts the route; ANALYSING waits for the read that is queued below.
    await setAgentMode(lead.id, input.agentMode, actor.id);
  }
  enqueueLeadProcessing(lead.id);
  return getLead(lead.id);
}

export async function updateLead(id: string, patch: Prisma.LeadUncheckedUpdateInput & { phone?: string | null }) {
  const data = { ...patch, ...(patch.phone !== undefined ? { phone: normalizePhone(patch.phone) ?? null } : {}) };
  await prisma.lead.update({ where: { id }, data });
  emitSocket('lead:updated', { leadId: id });
  return getLead(id);
}

/**
 * Agent override of the AI's requirement → rules-only rescore and fresh matches. A lead
 * whose route stopped at "no matching property" picks up again by itself.
 */
export async function updateRequirement(id: string, patch: Prisma.LeadRequirementUncheckedUpdateInput) {
  await updateRequirementManually(id, patch);
  await logActivity({ leadId: id, actorType: 'USER', type: 'requirement.updated', title: 'Requirements edited by agent' });
  await scoreLead(id);
  await refreshMatches(id);
  const lead = await prisma.lead.findUnique({ where: { id }, select: { aiRouteEnabled: true, aiRouteStep: true, proposals: { where: { status: 'SENT' }, take: 1, select: { id: true } } } });
  if (lead?.aiRouteEnabled && lead.aiRouteStep === 'NEEDS_ATTENTION' && !lead.proposals.length) {
    await setStep(id, 'MATCHING', 'Requirements updated. Finding the best properties in stock.');
    await enqueueRouteTask('MATCHMAKER', 'ai_route_match', id, { refresh: true });
  }
  return getLead(id);
}

export async function setStatus(id: string, status: LeadStatus, actorType: ActorType, reason?: string) {
  await changeStatus(id, status, actorType, reason);
  return getLead(id);
}

/** Re-run the whole AI pipeline (e.g. after a better enquiry text, or a failed run). */
export async function reprocess(id: string) {
  await prisma.lead.update({ where: { id }, data: { processingState: 'PENDING' } });
  enqueueLeadProcessing(id);
  return { queued: true };
}

export async function deleteLead(id: string) {
  await prisma.lead.delete({ where: { id } });
  emitSocket('lead:deleted', { leadId: id });
}

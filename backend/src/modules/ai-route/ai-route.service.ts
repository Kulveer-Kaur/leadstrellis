import { enqueueAgentTask } from '../../agents/agent-task.service.js';
import type { AgentMode, AiRouteStep } from '../../generated/prisma/enums.js';
import { enqueueLeadProcessing } from '../../jobs/lead-processing.job.js';
import { emitSocket } from '../../lib/socket.js';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { logActivity } from '../activity/activity.service.js';

/**
 * The per-lead route, run by one of two engines chosen per lead (Lead.agentMode):
 *   RULES — the free rule-based engine (keyword reading, rule ranking, template proposal,
 *           keyword reply reading); no AI tokens.
 *   AI    — the AI agent writes and reads everything; spends tokens on this lead only.
 *   OFF   — nothing runs (new leads start here, read and scored by rules for free).
 *
 *   ANALYSING → MATCHING (Matchmaker) → PROPOSING (Deal agent: proposal + PDF by email)
 *   → AWAITING_REPLY (Inbox agent reads every reply; a site visit books a viewing)
 *   → WON (a reply clearly agrees to go ahead) / LOST (declined or asked to stop)
 *
 * Each hop is an AgentTask, so the work survives restarts and shows up in the agent feed.
 */
export async function setStep(leadId: string, step: AiRouteStep, note?: string | null) {
  await prisma.lead.update({ where: { id: leadId }, data: { aiRouteStep: step, aiRouteNote: note ?? null } });
  emitSocket('lead:updated', { leadId, aiRouteStep: step });
}

const MODE_LABEL: Record<AgentMode, string> = { OFF: 'Off', RULES: 'Auto (rules)', AI: 'AI agent' };

/** Assigns who works the lead. OFF stops the route; RULES/AI start it (or carry on with the new engine). */
export async function setAgentMode(leadId: string, mode: AgentMode, actorId?: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { requirement: { select: { extractedBy: true } }, proposals: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  if (!lead) throw ApiError.notFound('Lead');
  if (mode === lead.agentMode && (mode === 'OFF' || lead.aiRouteEnabled)) return;

  if (mode === 'OFF') {
    await prisma.lead.update({ where: { id: leadId }, data: { agentMode: 'OFF', aiRouteEnabled: false } });
    await prisma.agentTask.updateMany({ where: { leadId, status: 'PENDING' }, data: { status: 'SKIPPED', finishedAt: new Date(), error: 'Agent switched off' } });
    await logActivity({ leadId, actorType: 'USER', type: 'agent-mode.changed', title: 'Lead agent switched off', payload: { by: actorId } });
    emitSocket('lead:updated', { leadId });
    return;
  }

  if (!lead.email) throw ApiError.badRequest('Add an email address to this lead first: the proposal is sent by email.');
  if (lead.status === 'CLOSED_WON') throw ApiError.badRequest('This lead is already won.');

  await prisma.lead.update({
    where: { id: leadId },
    data: { agentMode: mode, aiRouteEnabled: true, automationPaused: false, aiRouteStartedAt: lead.aiRouteStartedAt ?? new Date() },
  });
  await logActivity({ leadId, actorType: 'USER', type: 'agent-mode.changed', title: `Lead assigned to ${MODE_LABEL[mode]}`, payload: { by: actorId, from: lead.agentMode } });

  // A proposal is already out and unanswered: keep listening; the new engine reads the reply.
  const latest = lead.proposals[0];
  if (latest?.status === 'SENT' && !latest.respondedAt) {
    await setStep(leadId, 'AWAITING_REPLY', 'Proposal already sent. Waiting for the lead to reply.');
    return;
  }

  // Upgrading to the AI agent: the enquiry was only read by rules, so let the AI read it properly
  // (an agent's manual edits are kept). The match step follows from the lead.processed hook.
  const readByRulesOnly = mode === 'AI' && lead.rawMessage && lead.requirement?.extractedBy === 'RULES';
  if (readByRulesOnly || lead.processingState !== 'DONE') {
    await setStep(leadId, 'ANALYSING', mode === 'AI' ? 'AI agent is reading the enquiry' : 'Reading the enquiry');
    if (readByRulesOnly || lead.processingState === 'FAILED') {
      await prisma.lead.update({ where: { id: leadId }, data: { processingState: 'PENDING' } });
      enqueueLeadProcessing(leadId);
    }
    return;
  }
  await setStep(leadId, 'MATCHING', 'Finding the best properties in stock');
  await enqueueRouteTask('MATCHMAKER', 'ai_route_match', leadId, { refresh: true });
}

/** Called after the AI pipeline has read and scored a lead. */
export async function continueAfterProcessing(leadId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { aiRouteEnabled: true, aiRouteStep: true } });
  if (!lead?.aiRouteEnabled || lead.aiRouteStep !== 'ANALYSING') return;
  await setStep(leadId, 'MATCHING', 'Finding the best properties in stock');
  await enqueueRouteTask('MATCHMAKER', 'ai_route_match', leadId);
}

/** True when the Inbox agent will read this lead's replies (route on, proposal still open). */
export async function inboxAgentReads(leadId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { aiRouteEnabled: true, proposals: { where: { status: 'SENT' }, take: 1, select: { id: true } } } });
  return Boolean(lead?.aiRouteEnabled && lead.proposals.length);
}

/** Called for every inbound message: route leads with a live proposal hand it to the Inbox agent. */
export async function onLeadReplied(leadId: string, messageId: string) {
  if (!(await inboxAgentReads(leadId))) return;
  await setStep(leadId, 'AWAITING_REPLY', 'Reply received. The Inbox agent is reading it.');
  await enqueueRouteTask('INBOX', 'ai_route_reply', leadId, { messageId });
}

export async function enqueueRouteTask(agent: 'MATCHMAKER' | 'DEAL' | 'INBOX', type: string, leadId: string, payload?: unknown) {
  const existing = await prisma.agentTask.findFirst({ where: { agent, type, leadId, status: { in: ['PENDING', 'RUNNING'] }, ...(payload ? { payload: { equals: payload as never } } : {}) } });
  if (existing) return existing;
  const task = await enqueueAgentTask({ agent, type, leadId, payload });
  // Kick the runner straight away instead of waiting for the next scheduler tick.
  void import('../../agents/runner-loop.js').then((m) => m.runAgentTickSoon());
  return task;
}

const BOARD_STEPS: AiRouteStep[] = ['ANALYSING', 'MATCHING', 'PROPOSING', 'AWAITING_REPLY', 'WON', 'LOST', 'NEEDS_ATTENTION'];

/** Dashboard "AI route" board: every lead on the route with its step and current proposal. */
export async function getAiRouteBoard(limit = 12) {
  const where = { aiRouteStep: { in: BOARD_STEPS } };
  const [grouped, rows] = await Promise.all([
    prisma.lead.groupBy({ by: ['aiRouteStep'], where, _count: { _all: true } }),
    prisma.lead.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        number: true,
        fullName: true,
        status: true,
        agentMode: true,
        aiRouteEnabled: true,
        aiRouteStep: true,
        aiRouteNote: true,
        dealValueAed: true,
        updatedAt: true,
        proposals: { orderBy: { createdAt: 'desc' }, take: 1, select: { token: true, status: true, fitScore: true, sentAt: true, viewedAt: true, property: { select: { title: true, community: true } } } },
      },
    }),
  ]);
  const { proposalUrl, proposalPdfUrl } = await import('./proposal.service.js');
  return {
    counts: Object.fromEntries(BOARD_STEPS.map((s) => [s, grouped.find((g) => g.aiRouteStep === s)?._count._all ?? 0])),
    leads: rows.map(({ proposals, number, updatedAt, ...l }) => {
      const p = proposals[0];
      return {
        ...l,
        code: `L-${number}`,
        updatedAt: updatedAt.toISOString(),
        proposal: p
          ? { status: p.status, fitScore: p.fitScore, sentAt: p.sentAt?.toISOString() ?? null, viewedAt: p.viewedAt?.toISOString() ?? null, propertyTitle: p.property.title, community: p.property.community, url: proposalUrl(p.token), pdfUrl: proposalPdfUrl(p.token) }
          : null,
      };
    }),
  };
}

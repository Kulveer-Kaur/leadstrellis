import { understandLead } from '../ai/tasks/understand-lead.task.js';
import { eventBus } from '../events/event-bus.js';
import { logger } from '../lib/logger.js';
import { emitSocket } from '../lib/socket.js';
import { prisma } from '../lib/prisma.js';
import { logActivity } from '../modules/activity/activity.service.js';
import { scoreLead } from '../modules/leads/lead-scoring.service.js';
import { saveExtractedRequirement } from '../modules/leads/requirement.service.js';
import { refreshMatches } from '../modules/matching/matching.service.js';
import { advanceIfIn } from '../modules/pipeline/pipeline.service.js';
import { normalizePhone } from '../utils/phone.js';
import { jobQueue } from './job-queue.js';

const INTENT_LABEL = { HIGH: 'high intent', MEDIUM: 'medium intent', LOW: 'low intent' } as const;

/** Steps 3–5 of the AI pipeline: understand → score → match, then hand over to automations. */
export async function processLead(leadId: string) {
  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: { processingState: 'PROCESSING', processingError: null },
    include: { requirement: true },
  });
  emitSocket('lead:updated', { leadId, processingState: 'PROCESSING' });

  // Only leads assigned to the AI agent spend tokens; everyone else is read by rules (free).
  const useAi = lead.agentMode === 'AI';
  try {
    // 1. Understand the free text. Fields an agent typed in by hand are kept (see saveExtractedRequirement).
    let aiIntent: { score: number; reasoning: string } | undefined;
    if (lead.rawMessage) {
      const { data, source } = await understandLead({ source: lead.source, nameOnRecord: lead.fullName, message: lead.rawMessage }, useAi);
      await saveExtractedRequirement(leadId, data, source === 'ai' ? 'AI' : 'RULES');
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          language: data.language,
          phone: lead.phone ?? normalizePhone(data.contact.phone),
          email: lead.email ?? data.contact.email?.toLowerCase(),
        },
      });
      aiIntent = { score: data.intent.score, reasoning: data.intent.reasoning };
      await logActivity({
        leadId,
        actorType: 'AI',
        type: 'lead.understood',
        title: source === 'ai' ? 'AI understood the enquiry' : 'Requirements extracted (rules)',
        detail: data.summary,
        payload: { missing: data.missingFields, signals: data.intent.signals },
      });
    }

    // 2. Score (rules + AI intent).
    const score = await scoreLead(leadId, aiIntent);
    await logActivity({
      leadId,
      actorType: 'AI',
      type: 'lead.scored',
      title: `Scored ${score.total} · ${INTENT_LABEL[score.intentLevel]}`,
      detail: score.breakdown.map((b) => `${b.label} ${b.points}/${b.max}`).join(' · '),
    });
    if (score.intentLevel !== 'LOW') await advanceIfIn(leadId, ['NEW'], 'QUALIFIED', 'AI', `Score ${score.total}`);

    // 3. Match properties.
    await refreshMatches(leadId, 4, { useAi });

    await prisma.lead.update({ where: { id: leadId }, data: { processingState: 'DONE' } });
    emitSocket('lead:updated', { leadId, processingState: 'DONE' });
    eventBus.emit('lead.processed', { leadId });
  } catch (err) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { processingState: 'FAILED', processingError: err instanceof Error ? err.message.slice(0, 500) : String(err) },
    });
    throw err;
  }
}

export const enqueueLeadProcessing = (leadId: string) => jobQueue.enqueue('lead.process', `lead.process:${leadId}`, () => processLead(leadId));

/** On boot: pick up leads that were waiting or mid-way when the server stopped. */
export async function recoverPendingLeads() {
  const pending = await prisma.lead.findMany({
    where: { processingState: { in: ['PENDING', 'PROCESSING'] } },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  for (const { id } of pending) enqueueLeadProcessing(id);
  if (pending.length) logger.info({ count: pending.length }, 'recovered pending leads for AI processing');
}

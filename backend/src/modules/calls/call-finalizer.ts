import { summarizeCall } from '../../ai/tasks/summarize-call.task.js';
import { eventBus } from '../../events/event-bus.js';
import type { CallOutcome, CallStatus } from '../../generated/prisma/enums.js';
import { emitSocket } from '../../lib/socket.js';
import { prisma } from '../../lib/prisma.js';
import { logActivity } from '../activity/activity.service.js';
import { scoreLead } from '../leads/lead-scoring.service.js';
import { applyCallUpdates } from '../leads/requirement.service.js';
import { loadCallContext } from './call-context.js';

const OUTCOME_LABEL: Record<CallOutcome, string> = {
  INTERESTED: 'interested',
  NOT_READY: 'not ready yet',
  NOT_INTERESTED: 'not interested',
  NO_ANSWER: 'no answer',
};

/**
 * Ends a call exactly once: summarise the transcript, update the requirement and score,
 * then emit `call.completed` so the automation engine decides the next step.
 */
export async function finalizeCall(callId: string, status: CallStatus, durationSec?: number) {
  const claimed = await prisma.call.updateMany({ where: { id: callId, finalizedAt: null }, data: { finalizedAt: new Date() } });
  if (claimed.count === 0) return prisma.call.findUnique({ where: { id: callId } });

  const ctx = await loadCallContext(callId);
  const unanswered = status === 'NO_ANSWER' || status === 'FAILED';
  const { data: summary } = unanswered
    ? { data: null }
    : await summarizeCall({ lead: ctx.profile, listings: ctx.listings, slots: ctx.slots, transcript: ctx.transcript });
  const outcome: CallOutcome = summary?.outcome ?? 'NO_ANSWER';

  const endedAt = new Date();
  const call = await prisma.call.update({
    where: { id: callId },
    data: {
      status,
      outcome,
      endedAt,
      durationSec: durationSec ?? (ctx.call.startedAt ? Math.round((endedAt.getTime() - ctx.call.startedAt.getTime()) / 1000) : null),
      summary: summary?.summary ?? (status === 'FAILED' ? 'The call could not be connected.' : 'The lead did not pick up.'),
      extractedUpdates: summary ? { ...summary, slotDates: ctx.slotDates.map((d) => d.toISOString()) } : undefined,
    },
  });

  if (summary) {
    await applyCallUpdates(ctx.call.leadId, summary.requirementUpdates);
    await scoreLead(ctx.call.leadId);
  }
  await logActivity({
    leadId: ctx.call.leadId,
    actorType: 'AI',
    type: 'call.completed',
    title: unanswered ? 'AI call not answered' : `AI call completed${call.durationSec ? ` (${Math.floor(call.durationSec / 60)}m ${call.durationSec % 60}s)` : ''}`,
    detail: `${ctx.lead.fullName} · ${OUTCOME_LABEL[outcome]}${summary ? ` · ${summary.summary}` : ''}`,
    payload: { callId, outcome },
  });
  emitSocket('call:ended', { callId, leadId: ctx.call.leadId, outcome });
  eventBus.emit('call.completed', { callId, leadId: ctx.call.leadId, outcome });
  return call;
}

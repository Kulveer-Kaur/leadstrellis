import type { CallSummary } from '../ai/schemas/summarize-call.schema.js';
import { eventBus } from '../events/event-bus.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { logActivity } from '../modules/activity/activity.service.js';
import { scoreLead } from '../modules/leads/lead-scoring.service.js';
import { readReplySentiment } from '../ai/tasks/reply-sentiment.task.js';
import { continueAfterProcessing, inboxAgentReads, onLeadReplied } from '../modules/ai-route/ai-route.service.js';
import { applyReplySentiment } from '../modules/pipeline/reply-outcome.service.js';
import { bookViewingFromCall } from './actions/book-viewing.action.js';
import { moveToNurture } from './actions/move-to-nurture.action.js';
import { scheduleFollowUp } from './actions/schedule-follow-up.action.js';
import { RULES } from './rule-definitions.js';
import { runRule } from './rule-runner.js';

/** Wires domain events to automation rules ("what happens next", plan §6 step 8). */
export function registerAutomations() {
  // Lead read and scored → continue its AI route (if switched on). Nothing is sent to a
  // lead unless the admin has switched the AI route on for it.
  eventBus.on('lead.processed', async ({ leadId }) => {
    await continueAfterProcessing(leadId);
  });

  // After an AI call → viewing, follow-up or nurture.
  eventBus.on('call.completed', async ({ callId, leadId, outcome }) => {
    if (outcome === 'NO_ANSWER') return; // the no-reply retry rule picks this up
    const call = await prisma.call.findUniqueOrThrow({ where: { id: callId } });
    const summary = call.extractedUpdates as CallSummary | null;

    await runRule(RULES.POST_CALL.key, leadId, async () => {
      if (outcome === 'INTERESTED') return bookViewingFromCall(callId);
      if (outcome === 'NOT_READY') return scheduleFollowUp(leadId, summary?.followUpInDays ?? null, summary?.summary);
      return moveToNurture(leadId, summary?.optOut ?? false);
    });
  });

  // The lead replied → stop pending follow-ups, read what the reply means and move the
  // pipeline card (won / negotiation / nurture / lost / engaged). Replies to an open
  // proposal are read by the Inbox agent instead, which applies the same outcome.
  eventBus.on('lead.replied', async ({ leadId, messageId }) => {
    await scoreLead(leadId);
    await prisma.task.updateMany({ where: { leadId, type: 'FOLLOW_UP', status: 'PENDING' }, data: { status: 'CANCELLED' } });
    await logActivity({ leadId, actorType: 'SYSTEM', type: 'lead.replied', title: 'Lead replied' });
    if (await inboxAgentReads(leadId)) return;
    const [lead, message] = await Promise.all([
      prisma.lead.findUnique({ where: { id: leadId }, select: { fullName: true, status: true, agentMode: true } }),
      prisma.message.findUnique({ where: { id: messageId }, select: { body: true } }),
    ]);
    if (!lead || !message?.body.trim()) return;
    const read = await readReplySentiment({
      firstName: lead.fullName.split(/\s+/)[0] ?? lead.fullName,
      status: lead.status,
      reply: message.body,
      useAi: lead.agentMode === 'AI',
    });
    const outcome = await applyReplySentiment(leadId, read, messageId);
    logger.info({ leadId, sentiment: read.sentiment, confidence: read.confidence, outcome }, 'reply sentiment applied');
  });

  // AI route: the Inbox agent reads every reply to an open proposal.
  eventBus.on('lead.replied', async ({ leadId, messageId }) => {
    await onLeadReplied(leadId, messageId);
  });

  logger.info('automation rules registered');
}

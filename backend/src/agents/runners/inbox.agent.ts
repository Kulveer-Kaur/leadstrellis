import { toListingView } from '../../ai/context/ai-context.js';
import { classifyReply } from '../../ai/tasks/classify-reply.task.js';
import type { AgentTask, Property } from '../../generated/prisma/client.js';
import { replyAddressFor, sendEmail } from '../../integrations/email/mailer.js';
import { responseLinksFor } from '../../modules/responses/response-token.js';
import { replyEmail } from '../../integrations/email/templates.js';
import type { ProposalAlternative } from '../../integrations/pdf/proposal-pdf.js';
import { prisma } from '../../lib/prisma.js';
import { logActivity } from '../../modules/activity/activity.service.js';
import { setStep } from '../../modules/ai-route/ai-route.service.js';
import { confirmSiteVisit } from '../../modules/ai-route/proposal.service.js';
import { applyReplySentiment } from '../../modules/pipeline/reply-outcome.service.js';
import { formatDubai } from '../../utils/dates.js';
import { dailySendCapGuard, incrementDailySendCount } from '../guards/send-guards.js';
import type { AgentRunResult } from './types.js';

const INTENT_LABEL = {
  CONFIRM_VISIT: 'confirmed a site visit',
  WANTS_OTHER_TIME: 'wants a different visit time',
  ASK_QUESTION: 'asked a question',
  NOT_INTERESTED: 'is not interested',
  OTHER: 'replied',
} as const;

/**
 * Inbox agent (AI route step 4): reads the lead's reply to the proposal. A confirmed site
 * visit books the viewing (lead → Viewing); questions get an answer from the listing
 * facts. The reply's sentiment then moves the pipeline card: a clear go-ahead wins the
 * lead, bargaining goes to Negotiation, a "no" to Nurture, "stop" to Lost.
 */
export async function runInboxAgent(task: AgentTask): Promise<AgentRunResult> {
  if (!task.leadId) return { outcome: 'skipped', reason: 'no leadId' };
  const messageId = (task.payload as { messageId?: string } | null)?.messageId;
  const [lead, message] = await Promise.all([
    prisma.lead.findUnique({ where: { id: task.leadId }, include: { assignedTo: { select: { name: true } } } }),
    messageId ? prisma.message.findUnique({ where: { id: messageId } }) : null,
  ]);
  if (!lead || !message) return { outcome: 'skipped', reason: 'lead or message not found' };
  if (!lead.aiRouteEnabled) return { outcome: 'skipped', reason: 'AI route is off for this lead' };

  const proposal = await prisma.proposal.findFirst({ where: { leadId: lead.id, status: 'SENT' }, orderBy: { createdAt: 'desc' }, include: { property: true } });
  if (!proposal) return { outcome: 'skipped', reason: 'no open proposal' };

  const alternatives = proposal.alternatives as unknown as ProposalAlternative[];
  const altProps = alternatives.length ? await prisma.property.findMany({ where: { id: { in: alternatives.map((a) => a.propertyId) } } }) : [];
  const agentName = lead.assignedTo?.name ?? 'The LeadsTrellis team';
  const firstName = lead.fullName.split(/\s+/)[0] ?? lead.fullName;

  const read = await classifyReply({
    firstName,
    reply: message.body,
    best: toListingView(proposal.property),
    alternatives: altProps.map((p) => toListingView(p)),
    slots: proposal.slots.map(formatDubai),
    agentName,
    useAi: lead.agentMode === 'AI',
  });

  await logActivity({
    leadId: lead.id,
    actorType: 'AI',
    type: 'ai-route.reply-read',
    title: `Inbox agent: lead ${INTENT_LABEL[read.intent]}`,
    detail: `${read.summary} (${Math.round(read.confidence * 100)}% sure)`,
    payload: { messageId, intent: read.intent },
  });

  if (read.intent === 'CONFIRM_VISIT') {
    const when = resolveVisitTime(read, proposal.slots);
    if (when && read.confidence >= 0.6) {
      const chosen = read.propertyRef ? altProps.find((p: Property) => p.refCode === read.propertyRef) : undefined;
      await confirmSiteVisit(proposal.id, { scheduledAt: when, propertyId: chosen?.id, via: 'email-reply', note: `Lead wrote: "${message.body.slice(0, 300)}"` });
      return { outcome: 'done', detail: `site visit confirmed for ${formatDubai(when)}: lead moved to viewing` };
    }
    // Sounds like a yes but no usable time: ask for one rather than guessing.
    read.replyBody ||= `Hi ${firstName},\n\nWonderful, I would be happy to arrange the visit. Which of these times suits you?\n${proposal.slots.map((s, i) => `Option ${i + 1}: ${formatDubai(s)}`).join('\n')}\n\nOr tell me another day and time between 10:00 and 19:00.\n\n${agentName}, LeadsTrellis`;
  }

  if (read.intent === 'NOT_INTERESTED') {
    await prisma.proposal.update({ where: { id: proposal.id }, data: { status: 'DECLINED', respondedAt: new Date() } });
  }
  // A decline is never a go-ahead, whatever the model said about sentiment.
  const sentiment = read.intent === 'NOT_INTERESTED' && read.sentiment !== 'STOP' ? 'NEGATIVE' : read.sentiment;
  const moved = await applyReplySentiment(lead.id, { sentiment, confidence: read.sentimentConfidence, summary: read.summary }, messageId);
  if (moved === 'ENGAGED' || moved === 'NONE') {
    await setStep(lead.id, 'AWAITING_REPLY', `Answered the lead (${INTENT_LABEL[read.intent]}). Waiting for a visit time.`);
  }

  // Won: the agent takes it from here personally. Stop: never write back.
  if (moved === 'WON' || moved === 'LOST') return { outcome: 'done', detail: `${read.intent}, ${sentiment}: lead ${moved.toLowerCase()}, no auto-reply` };
  if (!read.replyBody.trim() || !lead.email) return { outcome: 'done', detail: `${read.intent}, no reply sent` };
  const cap = await dailySendCapGuard();
  if ('reschedule' in cap) return { outcome: 'reschedule', runAfter: cap.reschedule, reason: cap.reason };

  const subject = `Re: ${proposal.headline}`.slice(0, 120);
  const result = await sendEmail({
    to: lead.email,
    subject,
    html: replyEmail(read.replyBody, responseLinksFor(lead)),
    replyTo: replyAddressFor(lead.number),
    inReplyTo: message.providerMessageId ?? proposal.emailMessageId ?? undefined,
  });
  await prisma.message.create({
    data: {
      leadId: lead.id,
      channel: 'EMAIL',
      direction: 'OUT',
      subject,
      body: read.replyBody,
      status: result.sent ? 'SENT' : 'FAILED',
      provider: result.provider,
      providerMessageId: result.messageId,
      aiGenerated: read.aiGenerated,
      error: result.error,
    },
  });
  if (result.sent) {
    await incrementDailySendCount();
    await prisma.lead.update({ where: { id: lead.id }, data: { lastContactedAt: new Date() } });
  }
  return { outcome: 'done', detail: `${read.intent}, reply ${result.sent ? 'sent' : 'failed'}` };
}

/** Offered slot the lead picked, or the date/time they proposed (must be in the future). */
function resolveVisitTime(read: { slotNumber: number | null; requestedDateTime: string | null }, slots: Date[]): Date | null {
  if (read.slotNumber && slots[read.slotNumber - 1]) return slots[read.slotNumber - 1]!;
  if (read.requestedDateTime) {
    const d = new Date(read.requestedDateTime);
    if (!Number.isNaN(d.getTime()) && d.getTime() > Date.now()) return d;
  }
  return null;
}

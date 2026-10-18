import { composeMessage } from '../../ai/tasks/compose-message.task.js';
import type { MessagePurpose } from '../../ai/prompts/compose-message.prompt.js';
import { eventBus } from '../../events/event-bus.js';
import type { ActorType, Channel } from '../../generated/prisma/enums.js';
import { replyAddressFor, sendEmail } from '../../integrations/email/mailer.js';
import { replyEmail } from '../../integrations/email/templates.js';
import { getMessagingProvider } from '../../integrations/messaging/messaging.factory.js';
import { logger } from '../../lib/logger.js';
import { emitSocket } from '../../lib/socket.js';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { logActivity } from '../activity/activity.service.js';
import { advanceIfIn } from '../pipeline/pipeline.service.js';
import { responseLinksFor } from '../responses/response-token.js';
import { loadLeadContext } from './lead-context.loader.js';
import { recipientFor } from './recipient.js';

export type TextChannel = Exclude<Channel, 'CALL'>;

const CHANNEL_LABEL: Record<TextChannel, string> = { WHATSAPP: 'WhatsApp', INSTAGRAM: 'Instagram', EMAIL: 'email', SMS: 'SMS' };
/** Purposes that count as a contact attempt for the no-reply retry logic. */
const OUTREACH: MessagePurpose[] = ['INTRO', 'FOLLOW_UP', 'NO_REPLY_RETRY'];

export interface SendInput {
  leadId: string;
  channel: TextChannel;
  purpose: MessagePurpose;
  actorType: ActorType;
  /** Agent-written text; when absent the AI drafts the message. */
  body?: string;
  subject?: string;
  extra?: string;
}

export async function draftMessage(leadId: string, channel: TextChannel, purpose: MessagePurpose, extra?: string) {
  const ctx = await loadLeadContext(leadId, channel === 'SMS' ? 1 : 3);
  return composeMessage({ channel, purpose, lead: ctx.profile, listings: ctx.listings, slots: ctx.slots, agentName: ctx.agentName, extra });
}

/** Drafts (if needed), sends and records one outbound message, then updates the lead. */
export async function sendMessage(input: SendInput) {
  const ctx = await loadLeadContext(input.leadId, input.channel === 'SMS' ? 1 : 3);
  const to = recipientFor(ctx.lead, input.channel);
  if (!to) throw ApiError.badRequest(`Lead has no ${CHANNEL_LABEL[input.channel]} contact`);

  const draft = input.body
    ? { subject: input.subject ?? null, body: input.body, aiGenerated: false }
    : await composeMessage({
        channel: input.channel,
        purpose: input.purpose,
        lead: ctx.profile,
        listings: ctx.listings,
        slots: ctx.slots,
        agentName: ctx.agentName,
        extra: input.extra,
      });

  const message = await prisma.message.create({
    data: { leadId: input.leadId, channel: input.channel, direction: 'OUT', subject: draft.subject, body: draft.body, aiGenerated: draft.aiGenerated },
  });

  try {
    const res = input.channel === 'EMAIL' ? await sendLeadEmail(ctx.lead, to, draft.subject, draft.body) : await getMessagingProvider(input.channel).send({ to, subject: draft.subject, body: draft.body });
    await prisma.message.update({ where: { id: message.id }, data: { status: res.status, provider: res.provider, providerMessageId: res.providerMessageId } });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.error({ err, leadId: input.leadId, channel: input.channel }, 'message send failed');
    await prisma.message.update({ where: { id: message.id }, data: { status: 'FAILED', error } });
    await logActivity({ leadId: input.leadId, actorType: 'SYSTEM', type: 'message.failed', title: `${CHANNEL_LABEL[input.channel]} message failed`, detail: error });
    throw new ApiError(502, 'SEND_FAILED', `Could not send the ${CHANNEL_LABEL[input.channel]} message: ${error}`);
  }

  const isOutreach = OUTREACH.includes(input.purpose);
  await prisma.lead.update({
    where: { id: input.leadId },
    data: { lastContactedAt: new Date(), ...(isOutreach ? { contactAttempts: { increment: 1 } } : {}) },
  });
  if (isOutreach && ctx.matches.length) {
    await prisma.leadPropertyMatch.updateMany({ where: { id: { in: ctx.matches.map((m) => m.id) }, sentAt: null }, data: { sentAt: new Date() } });
  }
  await advanceIfIn(input.leadId, ['NEW', 'QUALIFIED'], 'CONTACTED', input.actorType, `First contact via ${CHANNEL_LABEL[input.channel]}`);

  await logActivity({
    leadId: input.leadId,
    actorType: input.actorType,
    type: 'message.sent',
    title: `${purposeTitle(input.purpose, ctx.listings.length)} on ${CHANNEL_LABEL[input.channel]}`,
    detail: `${ctx.lead.fullName} · ${draft.body.slice(0, 90)}${draft.body.length > 90 ? '…' : ''}`,
    payload: { messageId: message.id, purpose: input.purpose },
  });
  eventBus.emit('message.sent', { leadId: input.leadId, messageId: message.id });
  emitSocket('message:sent', { leadId: input.leadId, messageId: message.id });
  return prisma.message.findUniqueOrThrow({ where: { id: message.id } });
}

/**
 * Email goes out over SMTP (not the in-app mock): threaded under the lead's last email,
 * Reply-To tagged so their answer comes back to this lead, with the one-click answer buttons.
 */
async function sendLeadEmail(lead: { id: string; number: number }, to: string, subject: string | null, body: string) {
  const lastIn = await prisma.message.findFirst({
    where: { leadId: lead.id, channel: 'EMAIL', direction: 'IN', providerMessageId: { not: null } },
    orderBy: { createdAt: 'desc' },
    select: { providerMessageId: true },
  });
  const result = await sendEmail({
    to,
    subject: subject ?? 'A note from LeadsTrellis',
    html: replyEmail(body, responseLinksFor(lead)),
    text: body,
    replyTo: replyAddressFor(lead.number),
    inReplyTo: lastIn?.providerMessageId ?? undefined,
  });
  if (result.error) throw new Error(result.error);
  // provider 'log' = SMTP not configured: kept in the app only, like the mock channels.
  return { status: 'SENT' as const, provider: result.provider, providerMessageId: result.messageId ?? null };
}

/** Stores an inbound message from the lead (reply on any channel). */
export async function recordInbound(leadId: string, channel: TextChannel, body: string, providerMessageId?: string) {
  const message = await prisma.message.create({
    data: { leadId, channel, direction: 'IN', body, status: 'RECEIVED', providerMessageId },
  });
  await prisma.lead.update({ where: { id: leadId }, data: { lastInboundAt: new Date() } });
  await prisma.message.updateMany({ where: { leadId, direction: 'OUT', status: { in: ['SENT', 'DELIVERED'] } }, data: { status: 'REPLIED' } });
  eventBus.emit('lead.replied', { leadId, messageId: message.id });
  emitSocket('message:received', { leadId, messageId: message.id });
  return message;
}

export const listMessages = (leadId: string) => prisma.message.findMany({ where: { leadId }, orderBy: { createdAt: 'asc' } });

function purposeTitle(purpose: MessagePurpose, listings: number) {
  switch (purpose) {
    case 'INTRO':
      return listings ? `${listings} matches sent` : 'Intro message sent';
    case 'FOLLOW_UP':
      return 'Follow-up sent';
    case 'NO_REPLY_RETRY':
      return 'No-reply nudge sent';
    case 'VIEWING_CONFIRMATION':
      return 'Viewing confirmation sent';
    case 'NURTURE':
      return 'Market update sent';
    case 'POST_CALL':
      return 'Call recap sent';
  }
}

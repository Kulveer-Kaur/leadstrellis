import type { ReplySentiment } from '../../ai/schemas/reply-sentiment.schema.js';
import { moveToNurture } from '../../automation/actions/move-to-nurture.action.js';
import type { LeadStatus } from '../../generated/prisma/enums.js';
import { emitSocket } from '../../lib/socket.js';
import { prisma } from '../../lib/prisma.js';
import { logActivity } from '../activity/activity.service.js';
import { setStep } from '../ai-route/ai-route.service.js';
import { advanceIfIn } from './pipeline.service.js';

/** A POSITIVE reply only marks the lead won at or above this confidence; below it an agent confirms. */
export const WON_MIN_CONFIDENCE = 0.8;

const OPEN: LeadStatus[] = ['NEW', 'QUALIFIED', 'CONTACTED', 'ENGAGED', 'VIEWING', 'NEGOTIATION'];

const LABEL: Record<ReplySentiment, string> = {
  POSITIVE: 'positive',
  NEGOTIATION: 'wants to negotiate',
  NEGATIVE: 'negative',
  STOP: 'asked to stop',
  NEUTRAL: 'neutral',
};

export interface ReplyRead {
  sentiment: ReplySentiment;
  confidence: number;
  summary: string;
}

export type ReplyOutcome = 'WON' | 'NEEDS_CONFIRMATION' | 'NEGOTIATION' | 'NURTURE' | 'LOST' | 'ENGAGED' | 'NONE';

/**
 * Moves the lead's pipeline card from what their reply means:
 *   POSITIVE (sure)   → Closed won, with the deal value from the proposal or viewing
 *   POSITIVE (unsure) → Engaged, flagged for an agent to confirm the win
 *   NEGOTIATION       → Negotiation, flagged for the agent
 *   NEGATIVE          → Nurture with monthly market updates
 *   STOP              → Lost, unsubscribed, all automation stopped
 *   NEUTRAL           → Engaged (a reply is engagement); a Nurture lead becomes active again
 */
export async function applyReplySentiment(leadId: string, read: ReplyRead, messageId?: string, via?: string): Promise<ReplyOutcome> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { status: true, aiRouteEnabled: true, aiRouteStep: true } });
  if (!lead || lead.status === 'CLOSED_WON') return 'NONE';
  const onRoute = lead.aiRouteEnabled || lead.aiRouteStep !== 'OFF';

  // `via` = a one-click button in an email: the lead's own choice, nothing was guessed.
  await logActivity({
    leadId,
    actorType: via ? 'SYSTEM' : 'AI',
    type: via ? 'lead.responded' : 'reply.sentiment',
    title: via ? `Lead chose "${via}"` : `Reply read as ${LABEL[read.sentiment]}`,
    detail: via ? read.summary : `${read.summary} (${Math.round(read.confidence * 100)}% sure)`,
    payload: { messageId, sentiment: read.sentiment, confidence: read.confidence, via },
  });

  const outcome = await move(leadId, lead.status, read, onRoute);
  emitSocket('lead:updated', { leadId });
  return outcome;
}

async function move(leadId: string, status: LeadStatus, read: ReplyRead, onRoute: boolean): Promise<ReplyOutcome> {
  switch (read.sentiment) {
    case 'STOP': {
      await advanceIfIn(leadId, [...OPEN, 'NURTURE'], 'CLOSED_LOST', 'AI', 'Asked not to be contacted');
      await prisma.lead.update({ where: { id: leadId }, data: { unsubscribedAt: new Date(), automationPaused: true, aiRouteEnabled: false } });
      await prisma.task.updateMany({ where: { leadId, status: 'PENDING' }, data: { status: 'CANCELLED' } });
      await prisma.agentTask.updateMany({ where: { leadId, status: 'PENDING' }, data: { status: 'SKIPPED', finishedAt: new Date(), error: 'Lead asked not to be contacted' } });
      if (onRoute) await setStep(leadId, 'LOST', `Asked not to be contacted: ${read.summary}`);
      return 'LOST';
    }

    case 'NEGATIVE': {
      if (!OPEN.includes(status)) return 'NONE';
      await moveToNurture(leadId, false);
      if (onRoute) {
        await prisma.lead.update({ where: { id: leadId }, data: { aiRouteEnabled: false } });
        await setStep(leadId, 'LOST', `Not interested: ${read.summary}`);
      }
      return 'NURTURE';
    }

    case 'NEGOTIATION': {
      await advanceIfIn(leadId, ['NEW', 'QUALIFIED', 'CONTACTED', 'NURTURE'], 'ENGAGED', 'AI', 'Lead replied');
      await advanceIfIn(leadId, ['ENGAGED', 'VIEWING'], 'NEGOTIATION', 'AI', read.summary);
      if (onRoute) await setStep(leadId, 'NEEDS_ATTENTION', `Wants to negotiate: ${read.summary}`);
      return 'NEGOTIATION';
    }

    case 'POSITIVE': {
      await advanceIfIn(leadId, ['NEW', 'QUALIFIED', 'NURTURE'], 'ENGAGED', 'AI', 'Lead replied');
      if (read.confidence < WON_MIN_CONFIDENCE) {
        await advanceIfIn(leadId, ['CONTACTED'], 'ENGAGED', 'AI', 'Lead replied');
        await logActivity({ leadId, actorType: 'AI', type: 'reply.confirm-won', title: 'Reply looks like a yes: confirm to mark the lead won', detail: read.summary });
        if (onRoute) await setStep(leadId, 'NEEDS_ATTENTION', `Looks like a yes, please confirm the win: ${read.summary}`);
        return 'NEEDS_CONFIRMATION';
      }
      const won = await advanceIfIn(leadId, ['CONTACTED', 'ENGAGED', 'VIEWING', 'NEGOTIATION'], 'CLOSED_WON', 'AI', `Lead agreed to go ahead: ${read.summary}`);
      if (!won) return 'NONE';
      const property = await dealProperty(leadId);
      await prisma.lead.update({
        where: { id: leadId },
        data: { wonAt: new Date(), aiRouteEnabled: false, ...(property ? { dealValueAed: property.priceAed, wonPropertyId: property.id } : {}) },
      });
      if (onRoute) await setStep(leadId, 'WON', `Agreed to go ahead: ${read.summary}`);
      return 'WON';
    }

    case 'NEUTRAL': {
      await advanceIfIn(leadId, ['CONTACTED'], 'ENGAGED', 'AI', 'Lead replied');
      await advanceIfIn(leadId, ['NURTURE'], 'QUALIFIED', 'AI', 'Lead replied');
      return 'ENGAGED';
    }
  }
}

/** The property the deal is about: the latest accepted or sent proposal, else the latest viewing. */
async function dealProperty(leadId: string) {
  const proposal = await prisma.proposal.findFirst({
    where: { leadId, status: { in: ['ACCEPTED', 'SENT'] } },
    orderBy: [{ respondedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    select: { viewing: { select: { property: { select: { id: true, priceAed: true } } } }, property: { select: { id: true, priceAed: true } } },
  });
  if (proposal) return proposal.viewing?.property ?? proposal.property;
  const viewing = await prisma.viewing.findFirst({ where: { leadId }, orderBy: { scheduledAt: 'desc' }, select: { property: { select: { id: true, priceAed: true } } } });
  return viewing?.property ?? null;
}

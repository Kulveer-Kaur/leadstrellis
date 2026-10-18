import type { LeadStatus } from '../../generated/prisma/enums.js';
import { emitSocket } from '../../lib/socket.js';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { addDays, formatDubai } from '../../utils/dates.js';
import { logActivity } from '../activity/activity.service.js';
import { advanceIfIn } from '../pipeline/pipeline.service.js';
import { applyReplySentiment } from '../pipeline/reply-outcome.service.js';
import { createTask } from '../tasks/task.service.js';
import { parseResponseToken, verifyResponseToken } from './response-token.js';

export const RESPONSE_CHOICES = ['interested', 'later', 'not-interested', 'unsubscribe'] as const;
export type ResponseChoice = (typeof RESPONSE_CHOICES)[number];
export const LATER_MONTHS = [1, 3, 6] as const;

const OPEN: LeadStatus[] = ['NEW', 'QUALIFIED', 'CONTACTED', 'ENGAGED', 'VIEWING', 'NEGOTIATION'];

async function leadByToken(token: string) {
  const parsed = parseResponseToken(token);
  const lead = parsed ? await prisma.lead.findUnique({ where: { number: parsed.number }, include: { assignedTo: { select: { name: true } } } }) : null;
  if (!lead || !parsed || !verifyResponseToken(lead.id, parsed.sig)) throw ApiError.notFound('Link');
  return lead;
}

/** What the public response page shows: first name, agent, and whether they already unsubscribed. */
export async function getResponsePage(token: string) {
  const lead = await leadByToken(token);
  return {
    firstName: lead.fullName.split(/\s+/)[0] ?? lead.fullName,
    agentName: lead.assignedTo?.name ?? null,
    unsubscribed: Boolean(lead.unsubscribedAt),
    won: lead.status === 'CLOSED_WON',
  };
}

/**
 * The lead clicked a button in one of our emails (and confirmed it on the page):
 *   interested     → Engaged, call-back task for the agent today
 *   later          → Nurture, route paused, call-back task in 1/3/6 months
 *   not-interested → Nurture (same as a "no" reply)
 *   unsubscribe    → Lost, no further contact (same as a "stop" reply)
 */
export async function recordResponse(token: string, choice: ResponseChoice, months?: number) {
  const lead = await leadByToken(token);
  if (lead.status === 'CLOSED_WON' && choice !== 'unsubscribe') return { ...(await getResponsePage(token)), recorded: false };

  switch (choice) {
    case 'interested': {
      await advanceIfIn(lead.id, ['NEW', 'QUALIFIED', 'CONTACTED', 'NURTURE'], 'ENGAGED', 'SYSTEM', 'Clicked "I\'m interested" in an email');
      await prisma.lead.update({ where: { id: lead.id }, data: { lastInboundAt: new Date() } });
      await prisma.task.updateMany({ where: { leadId: lead.id, type: 'FOLLOW_UP', status: 'PENDING' }, data: { status: 'CANCELLED' } });
      await createTask(lead.id, 'CALLBACK', new Date(), 'Lead clicked "I\'m interested": call them back');
      await logActivity({ leadId: lead.id, actorType: 'SYSTEM', type: 'lead.responded', title: 'Lead chose "I\'m interested"', detail: 'Call-back task created for the agent', payload: { via: 'email-button', choice } });
      break;
    }

    case 'later': {
      const m = LATER_MONTHS.includes(months as (typeof LATER_MONTHS)[number]) ? months! : 1;
      const when = addDays(new Date(), m * 30);
      await advanceIfIn(lead.id, OPEN, 'NURTURE', 'SYSTEM', `Asked to be contacted again in ${m} month${m > 1 ? 's' : ''}`);
      await prisma.lead.update({
        where: { id: lead.id },
        data: { lastInboundAt: new Date(), aiRouteEnabled: false, ...(lead.aiRouteStep !== 'OFF' ? { aiRouteNote: `Paused: asked to be contacted again around ${formatDubai(when).split(' at ')[0]}` } : {}) },
      });
      await prisma.task.updateMany({ where: { leadId: lead.id, type: 'FOLLOW_UP', status: 'PENDING' }, data: { status: 'CANCELLED' } });
      await prisma.agentTask.updateMany({ where: { leadId: lead.id, status: 'PENDING' }, data: { status: 'SKIPPED', finishedAt: new Date(), error: 'Lead asked to be contacted later' } });
      await createTask(lead.id, 'CALLBACK', when, `Lead asked to be contacted again in ${m} month${m > 1 ? 's' : ''}`);
      await logActivity({ leadId: lead.id, actorType: 'SYSTEM', type: 'lead.responded', title: `Lead chose "Contact me later" (${m} month${m > 1 ? 's' : ''})`, payload: { via: 'email-button', choice, months: m } });
      break;
    }

    case 'not-interested':
      await applyReplySentiment(lead.id, { sentiment: 'NEGATIVE', confidence: 1, summary: 'Clicked "Not interested" in an email.' }, undefined, 'Not interested');
      break;

    case 'unsubscribe':
      await applyReplySentiment(lead.id, { sentiment: 'STOP', confidence: 1, summary: 'Clicked "Unsubscribe" in an email.' }, undefined, 'Unsubscribe');
      // A won lead keeps its stage but still gets no more emails.
      await prisma.lead.updateMany({ where: { id: lead.id, unsubscribedAt: null }, data: { unsubscribedAt: new Date() } });
      break;
  }

  emitSocket('lead:updated', { leadId: lead.id });
  return { ...(await getResponsePage(token)), recorded: true };
}

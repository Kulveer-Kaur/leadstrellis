import { eventBus } from '../../events/event-bus.js';
import type { ActorType, LeadStatus } from '../../generated/prisma/enums.js';
import { emitSocket } from '../../lib/socket.js';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { logActivity } from '../activity/activity.service.js';
import { canTransition, TRANSITIONS } from './status-transitions.js';

const LABEL: Record<LeadStatus, string> = {
  NEW: 'New',
  QUALIFIED: 'Qualified',
  CONTACTED: 'Contacted',
  ENGAGED: 'Engaged',
  VIEWING: 'Viewing',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Closed won',
  CLOSED_LOST: 'Lost',
  NURTURE: 'Nurture',
};

/** Moves a lead to a new status, enforcing the state machine. Throws 409 on an illegal move. */
export async function changeStatus(leadId: string, to: LeadStatus, actorType: ActorType, reason?: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { status: true } });
  if (!lead) throw ApiError.notFound('Lead');
  if (lead.status === to) return lead.status;
  if (!canTransition(lead.status, to)) {
    throw new ApiError(409, 'INVALID_TRANSITION', `Cannot move a lead from ${LABEL[lead.status]} to ${LABEL[to]}`, {
      allowed: TRANSITIONS[lead.status],
    });
  }
  await prisma.lead.update({ where: { id: leadId }, data: { status: to } });
  await logActivity({
    leadId,
    actorType,
    type: 'status.changed',
    title: `Moved to ${LABEL[to].toLowerCase()}`,
    detail: reason,
    payload: { from: lead.status, to },
  });
  eventBus.emit('lead.status-changed', { leadId, from: lead.status, to });
  emitSocket('lead:status-changed', { leadId, from: lead.status, to });
  return to;
}

/** Automation helper: move only when the lead is currently in one of `from` and the move is legal. */
export async function advanceIfIn(leadId: string, from: LeadStatus[], to: LeadStatus, actorType: ActorType = 'AI', reason?: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { status: true } });
  if (!lead || !from.includes(lead.status) || !canTransition(lead.status, to)) return false;
  await changeStatus(leadId, to, actorType, reason);
  return true;
}

import type { LeadStatus } from '../../generated/prisma/enums.js';

/**
 * The allowed status moves. Phase 2 path:
 *   NEW → QUALIFIED → CONTACTED → ENGAGED → VIEWING → NEGOTIATION → CLOSED_WON / CLOSED_LOST.
 * Any open state can go to NURTURE or CLOSED_LOST; NURTURE can come back to QUALIFIED.
 */
export const TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['QUALIFIED', 'CONTACTED', 'ENGAGED', 'VIEWING', 'NURTURE', 'CLOSED_LOST'],
  QUALIFIED: ['CONTACTED', 'ENGAGED', 'VIEWING', 'NURTURE', 'CLOSED_LOST'],
  CONTACTED: ['QUALIFIED', 'ENGAGED', 'VIEWING', 'NURTURE', 'CLOSED_WON', 'CLOSED_LOST'],
  ENGAGED: ['CONTACTED', 'VIEWING', 'NEGOTIATION', 'NURTURE', 'CLOSED_WON', 'CLOSED_LOST'],
  VIEWING: ['CONTACTED', 'ENGAGED', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST', 'NURTURE'],
  NEGOTIATION: ['VIEWING', 'ENGAGED', 'CLOSED_WON', 'CLOSED_LOST', 'NURTURE'],
  NURTURE: ['QUALIFIED', 'CONTACTED', 'ENGAGED', 'VIEWING', 'CLOSED_LOST'],
  CLOSED_LOST: ['NURTURE', 'QUALIFIED'],
  CLOSED_WON: [],
};

export const canTransition = (from: LeadStatus, to: LeadStatus) => from === to || TRANSITIONS[from].includes(to);

export const OPEN_STATUSES: LeadStatus[] = ['NEW', 'QUALIFIED', 'CONTACTED', 'ENGAGED', 'VIEWING', 'NEGOTIATION'];

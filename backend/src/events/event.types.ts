import type { CallOutcome, LeadStatus } from '../generated/prisma/enums.js';

/** Every domain event and its payload. The automation engine and sockets listen to these. */
export interface DomainEvents {
  'lead.created': { leadId: string };
  'lead.processed': { leadId: string };
  'lead.qualified': { leadId: string };
  'lead.status-changed': { leadId: string; from: LeadStatus; to: LeadStatus };
  'lead.replied': { leadId: string; messageId: string };
  'message.sent': { leadId: string; messageId: string };
  'call.turn': { callId: string; leadId: string; speaker: 'AI' | 'LEAD'; text: string };
  'call.completed': { callId: string; leadId: string; outcome: CallOutcome };
  'activity.created': { id: string; leadId: string | null; title: string };
}

export type DomainEventName = keyof DomainEvents;

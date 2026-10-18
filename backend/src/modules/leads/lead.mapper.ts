import type { Lead, LeadRequirement } from '../../generated/prisma/client.js';
import { formatDubai } from '../../utils/dates.js';
import type { LeadWithSummary } from './lead.repository.js';

const BEDS = (r: LeadRequirement) =>
  r.bedroomsMin == null ? 'Any' : r.bedroomsMin === 0 ? 'Studio' : r.bedroomsMax && r.bedroomsMax !== r.bedroomsMin ? `${r.bedroomsMin}-${r.bedroomsMax}BR` : `${r.bedroomsMin}BR`;
const TYPE = (r: LeadRequirement) => {
  const t = r.propertyTypes.find((x) => x !== 'STUDIO') ?? r.propertyTypes[0];
  return t ? t.charAt(0) + t.slice(1).toLowerCase() : 'Property';
};

export const leadCode = (lead: Pick<Lead, 'number'>) => `L-${lead.number}`;

/** What the AI (or agent) will do next for this lead, in a few words. */
const ROUTE_ACTION: Partial<Record<LeadWithSummary['aiRouteStep'], string>> = {
  ANALYSING: 'analysing enquiry',
  MATCHING: 'matching properties',
  PROPOSING: 'writing proposal',
  AWAITING_REPLY: 'awaiting site-visit reply',
  NEEDS_ATTENTION: 'needs attention',
};
const MODE_PREFIX = { OFF: '', RULES: 'Auto', AI: 'AI agent' } as const;

export function nextAction(lead: LeadWithSummary): string {
  if (lead.aiRouteEnabled && ROUTE_ACTION[lead.aiRouteStep]) return `${MODE_PREFIX[lead.agentMode]}: ${ROUTE_ACTION[lead.aiRouteStep]}`;
  if (lead.processingState === 'PENDING' || lead.processingState === 'PROCESSING') return 'AI analysing enquiry';
  if (lead.processingState === 'FAILED') return 'Needs review: AI processing failed';
  if (lead.calls[0]) return 'AI call in progress';
  if (lead.agentMode === 'OFF' && ['NEW', 'QUALIFIED'].includes(lead.status)) return 'Assign an agent (Auto or AI)';
  if (lead.viewings[0]) return `Viewing ${formatDubai(lead.viewings[0].scheduledAt)}`;
  if (lead.tasks[0]) return `${lead.tasks[0].type === 'NURTURE' ? 'Market update' : 'Follow-up'} ${formatDubai(lead.tasks[0].dueAt).split(' at ')[0]}`;
  switch (lead.status) {
    case 'NEW':
      return 'Waiting for outreach';
    case 'QUALIFIED':
      return 'Sending matches';
    case 'CONTACTED':
      return 'Awaiting reply';
    case 'ENGAGED':
      return 'Replying to the lead';
    case 'VIEWING':
      return 'Viewing follow-up';
    case 'NEGOTIATION':
      return 'Proposal in progress';
    case 'NURTURE':
      return 'Monthly market update';
    case 'CLOSED_WON':
      return 'Closed';
    case 'CLOSED_LOST':
      return 'No action';
    default:
      return 'In progress';
  }
}

/** List row. Matches the frontend's LeadSummary type (frontend/src/types/lead.types.ts). */
export const toLeadSummary = (lead: LeadWithSummary) => ({
  id: lead.id,
  code: leadCode(lead),
  fullName: lead.fullName,
  source: lead.source,
  status: lead.status,
  intent: lead.intentLevel ?? 'LOW',
  score: lead.score ?? 0,
  processingState: lead.processingState,
  assignedTo: lead.assignedTo,
  requirement: lead.requirement
    ? {
        bedrooms: BEDS(lead.requirement),
        propertyType: TYPE(lead.requirement),
        community: lead.requirement.communities[0] ?? lead.requirement.emirate ?? 'Any area',
        budgetMaxAed: lead.requirement.budgetMax ?? 0,
        summary: lead.requirement.summary,
      }
    : null,
  nextAction: nextAction(lead),
  agentMode: lead.agentMode,
  aiRouteEnabled: lead.aiRouteEnabled,
  aiRouteStep: lead.aiRouteStep,
  createdAt: lead.createdAt.toISOString(),
});

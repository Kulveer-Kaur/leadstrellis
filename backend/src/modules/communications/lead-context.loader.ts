import { toLeadProfile, toListingView } from '../../ai/context/ai-context.js';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { formatDubai, nextViewingSlots } from '../../utils/dates.js';
import { getTopMatches } from '../matching/matching.service.js';

/** Everything an outreach message or call needs about a lead, loaded once. */
export async function loadLeadContext(leadId: string, listingCount = 3) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { requirement: true, assignedTo: true } });
  if (!lead) throw ApiError.notFound('Lead');
  const matches = await getTopMatches(leadId, listingCount);
  const slotDates = nextViewingSlots();
  return {
    lead,
    profile: toLeadProfile(lead),
    matches,
    listings: matches.map((m) => toListingView(m.property, m.aiReason)),
    slotDates,
    slots: slotDates.map(formatDubai),
    agentName: lead.assignedTo?.name.split(' ')[0] ?? 'The LeadsTrellis team',
  };
}

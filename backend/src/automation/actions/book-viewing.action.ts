import type { CallSummary } from '../../ai/schemas/summarize-call.schema.js';
import { prisma } from '../../lib/prisma.js';
import { getTopMatches } from '../../modules/matching/matching.service.js';
import { createViewing } from '../../modules/viewings/viewing.service.js';
import { formatDubai, nextViewingSlots } from '../../utils/dates.js';
import { sendOutreach } from './send-outreach.action.js';

/** After an "interested" call: book the slot the lead chose for the property they picked, then confirm it. */
export async function bookViewingFromCall(callId: string) {
  const call = await prisma.call.findUniqueOrThrow({ where: { id: callId } });
  const details = call.extractedUpdates as (CallSummary & { slotDates?: string[] }) | null;
  const matches = await getTopMatches(call.leadId, 3);
  const property = matches.find((m) => m.property.refCode === details?.viewing.propertyRef)?.property ?? matches[0]?.property;
  if (!property) return null;

  const slots = details?.slotDates?.map((d) => new Date(d)) ?? nextViewingSlots();
  const scheduledAt = slots[details?.viewing.slotIndex ?? 0] ?? slots[0];
  const notes = details?.viewing.requestedTimeText ? `Lead asked for: ${details.viewing.requestedTimeText}` : 'Booked by the AI call agent';
  const viewing = await createViewing({ leadId: call.leadId, propertyId: property.id, scheduledAt, bookedBy: 'AI', notes });

  const agent = viewing.agentId ? await prisma.user.findUnique({ where: { id: viewing.agentId }, select: { name: true } }) : null;
  const extra = `${property.title}, ${property.community} on ${formatDubai(scheduledAt)}${agent ? ` with ${agent.name}` : ''}`;
  await sendOutreach(call.leadId, 'VIEWING_CONFIRMATION', undefined, extra);
  return `Viewing booked: ${extra}`;
}

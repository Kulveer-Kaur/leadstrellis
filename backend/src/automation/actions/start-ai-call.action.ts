import { prisma } from '../../lib/prisma.js';
import { startCall } from '../../modules/calls/call.service.js';

/** Starts an AI call (Twilio when configured, else a simulated call waiting in the app). */
export async function startAiCall(leadId: string) {
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId }, select: { phone: true } });
  if (!lead.phone) return null;
  const call = await startCall(leadId, { actorType: 'AI' });
  return `AI call started (${call.mode.toLowerCase()}, call ${call.id})`;
}

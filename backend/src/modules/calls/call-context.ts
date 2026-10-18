import { voiceConfig } from '../../config/voice.config.js';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { loadLeadContext } from '../communications/lead-context.loader.js';

/** Call + lead context + transcript, as the call agent needs it. Only 2 listings are pitched on a call. */
export async function loadCallContext(callId: string) {
  const call = await prisma.call.findUnique({ where: { id: callId }, include: { turns: { orderBy: { order: 'asc' } } } });
  if (!call) throw ApiError.notFound('Call');
  const ctx = await loadLeadContext(call.leadId, 2);
  const transcript = call.turns.map((t) => ({ speaker: t.speaker, text: t.text }));
  const aiTurns = call.turns.filter((t) => t.speaker === 'AI').length;
  return {
    call,
    ...ctx,
    transcript,
    agentContext: {
      lead: ctx.profile,
      listings: ctx.listings,
      slots: ctx.slots,
      agentName: ctx.agentName,
      turnsLeft: Math.max(1, voiceConfig.maxTurns - aiTurns),
    },
  };
}

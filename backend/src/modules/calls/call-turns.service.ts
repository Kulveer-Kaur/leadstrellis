import { callAgentTurn } from '../../ai/tasks/call-agent-turn.task.js';
import { eventBus } from '../../events/event-bus.js';
import type { Speaker } from '../../generated/prisma/enums.js';
import { emitSocket } from '../../lib/socket.js';
import { prisma } from '../../lib/prisma.js';
import { loadCallContext } from './call-context.js';

async function appendTurn(callId: string, leadId: string, speaker: Speaker, text: string) {
  const order = await prisma.callTranscriptTurn.count({ where: { callId } });
  const turn = await prisma.callTranscriptTurn.create({ data: { callId, speaker, text, order } });
  eventBus.emit('call.turn', { callId, leadId, speaker, text });
  emitSocket('call:turn', { callId, leadId, speaker, text, order });
  return turn;
}

/**
 * One conversational step: store what the lead said (if anything), ask the agent
 * for its reply, store and return it. `leadText = null` produces the opening line.
 */
export async function nextAgentReply(callId: string, leadText: string | null) {
  const before = await prisma.call.findUniqueOrThrow({ where: { id: callId }, select: { leadId: true } });
  if (leadText !== null) await appendTurn(callId, before.leadId, 'LEAD', leadText);

  const ctx = await loadCallContext(callId);
  const turn = await callAgentTurn(ctx.agentContext, ctx.transcript);
  await appendTurn(callId, ctx.call.leadId, 'AI', turn.reply);
  return { reply: turn.reply, endCall: turn.endCall, outcome: turn.detectedOutcome };
}

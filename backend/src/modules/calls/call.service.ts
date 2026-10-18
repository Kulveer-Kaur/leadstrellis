import { voiceConfig } from '../../config/voice.config.js';
import type { ActorType, CallMode } from '../../generated/prisma/enums.js';
import { placeTwilioCall } from '../../integrations/voice/twilio-voice.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { maskPhone } from '../../utils/phone.js';
import { logActivity } from '../activity/activity.service.js';
import { advanceIfIn } from '../pipeline/pipeline.service.js';
import { finalizeCall } from './call-finalizer.js';
import { nextAgentReply } from './call-turns.service.js';

const ACTIVE = ['QUEUED', 'RINGING', 'IN_PROGRESS'] as const;

export interface StartCallOptions {
  actorType: ActorType;
  /** Force the in-app simulated call even when Twilio is configured. */
  mode?: CallMode;
}

/**
 * Starts an AI call. TWILIO mode dials the lead (or the test number in dev) and the
 * conversation runs through webhooks; SIMULATED mode returns the opening line and the
 * conversation continues through POST /calls/:id/turn.
 */
export async function startCall(leadId: string, opts: StartCallOptions) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw ApiError.notFound('Lead');
  const active = await prisma.call.findFirst({ where: { leadId, status: { in: [...ACTIVE] } } });
  if (active) throw ApiError.conflict('This lead already has a call in progress');

  const mode: CallMode = opts.mode === 'SIMULATED' || !voiceConfig.useTwilioCalls ? 'SIMULATED' : 'TWILIO';
  if (mode === 'TWILIO' && !lead.phone) throw ApiError.badRequest('Lead has no phone number');

  const call = await prisma.call.create({ data: { leadId, mode, toNumber: lead.phone } });
  // A call is a contact attempt: it feeds the no-reply retry logic and moves NEW/QUALIFIED → CONTACTED.
  await prisma.lead.update({ where: { id: leadId }, data: { lastContactedAt: new Date(), contactAttempts: { increment: 1 } } });
  await advanceIfIn(leadId, ['NEW', 'QUALIFIED'], 'CONTACTED', opts.actorType, 'AI call');
  await logActivity({
    leadId,
    actorType: opts.actorType,
    type: 'call.started',
    title: mode === 'TWILIO' ? 'AI call placed' : 'AI call started (simulated)',
    detail: `${lead.fullName}${mode === 'TWILIO' ? ` · ${maskPhone(voiceConfig.dialOverride ?? lead.phone)}` : ''}`,
    payload: { callId: call.id, mode },
  });

  if (mode === 'TWILIO') {
    try {
      const { sid } = await placeTwilioCall(call.id, lead.phone!);
      return prisma.call.update({ where: { id: call.id }, data: { providerCallSid: sid, status: 'RINGING' } });
    } catch (err) {
      logger.error({ err, callId: call.id }, 'Twilio call failed');
      await finalizeCall(call.id, 'FAILED');
      throw new ApiError(502, 'CALL_FAILED', `Twilio could not place the call: ${err instanceof Error ? err.message : err}`);
    }
  }

  await prisma.call.update({ where: { id: call.id }, data: { status: 'IN_PROGRESS', startedAt: new Date() } });
  const opening = await nextAgentReply(call.id, null);
  return { ...(await getCall(call.id)), opening: opening.reply };
}

/** Simulated call: the tester's reply → the agent's next line. Ends and finalises when the agent says goodbye. */
export async function simulatedTurn(callId: string, text: string) {
  const call = await prisma.call.findUnique({ where: { id: callId } });
  if (!call) throw ApiError.notFound('Call');
  if (call.mode !== 'SIMULATED') throw ApiError.badRequest('Only simulated calls accept typed turns');
  if (call.status !== 'IN_PROGRESS') throw ApiError.conflict('This call has ended');

  const turn = await nextAgentReply(callId, text);
  if (turn.endCall) await finalizeCall(callId, 'COMPLETED');
  return { reply: turn.reply, ended: turn.endCall, call: await getCall(callId) };
}

export async function endCall(callId: string) {
  const call = await prisma.call.findUnique({ where: { id: callId } });
  if (!call) throw ApiError.notFound('Call');
  if (call.mode === 'TWILIO' && call.providerCallSid && call.status !== 'COMPLETED') {
    const { getTwilio } = await import('../../lib/twilio.js');
    await getTwilio().calls(call.providerCallSid).update({ status: 'completed' });
    return getCall(callId); // the status webhook finalises it
  }
  await finalizeCall(callId, 'COMPLETED');
  return getCall(callId);
}

export const getCall = (callId: string) =>
  prisma.call.findUniqueOrThrow({ where: { id: callId }, include: { turns: { orderBy: { order: 'asc' } } } });

export const listCalls = (leadId?: string) =>
  prisma.call.findMany({
    where: { leadId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { turns: { orderBy: { order: 'asc' } }, lead: { select: { id: true, fullName: true } } },
  });

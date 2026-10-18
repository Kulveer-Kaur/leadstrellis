import type { Request, Response } from 'express';
import { voiceConfig } from '../../config/voice.config.js';
import type { CallStatus } from '../../generated/prisma/enums.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { finalizeCall } from './call-finalizer.js';
import { nextAgentReply } from './call-turns.service.js';
import { speakAndHangUp, speakAndListen } from './twiml.builder.js';

const FALLBACK_LINE = 'Sorry, we are having a technical issue. An agent from LeadsTrellis will call you back shortly. Goodbye.';

const sendTwiml = (res: Response, xml: string) => res.type('text/xml').send(xml);

/** Twilio: the lead picked up. Speak the opening line and start listening. */
export async function answer(req: Request, res: Response) {
  const callId = req.params.callId as string;
  try {
    await prisma.call.update({ where: { id: callId }, data: { status: 'IN_PROGRESS', startedAt: new Date() } });
    const opening = await nextAgentReply(callId, null);
    sendTwiml(res, await speakAndListen(callId, opening.reply));
  } catch (err) {
    logger.error({ err, callId }, 'answer webhook failed');
    sendTwiml(res, await speakAndHangUp(FALLBACK_LINE));
  }
}

/** Twilio: speech recognised (or silence). Reply, or say goodbye and hang up. */
export async function turn(req: Request, res: Response) {
  const callId = req.params.callId as string;
  const speech = String(req.body?.SpeechResult ?? '').trim();
  try {
    if (!speech) {
      const call = await prisma.call.update({ where: { id: callId }, data: { silentTurns: { increment: 1 } } });
      if (call.silentTurns >= voiceConfig.maxSilentTurns) {
        return sendTwiml(res, await speakAndHangUp('It seems the line is not clear. We will send you the details on WhatsApp instead. Goodbye.'));
      }
      return sendTwiml(res, await speakAndListen(callId, "Sorry, I didn't catch that. Could you say that again?"));
    }
    await prisma.call.update({ where: { id: callId }, data: { silentTurns: 0 } });
    const next = await nextAgentReply(callId, speech);
    sendTwiml(res, next.endCall ? await speakAndHangUp(next.reply) : await speakAndListen(callId, next.reply));
  } catch (err) {
    logger.error({ err, callId }, 'turn webhook failed');
    sendTwiml(res, await speakAndHangUp(FALLBACK_LINE));
  }
}

const STATUS_MAP: Record<string, CallStatus> = {
  queued: 'QUEUED',
  initiated: 'QUEUED',
  ringing: 'RINGING',
  'in-progress': 'IN_PROGRESS',
  completed: 'COMPLETED',
  busy: 'NO_ANSWER',
  'no-answer': 'NO_ANSWER',
  canceled: 'NO_ANSWER',
  failed: 'FAILED',
};

/** Twilio: call lifecycle updates. Terminal states finalise the call (summary + next automation). */
export async function status(req: Request, res: Response) {
  const callId = req.params.callId as string;
  const mapped = STATUS_MAP[String(req.body?.CallStatus ?? '')];
  res.sendStatus(204);
  if (!mapped) return;
  try {
    if (mapped === 'COMPLETED' || mapped === 'NO_ANSWER' || mapped === 'FAILED') {
      const duration = Number(req.body?.CallDuration);
      await finalizeCall(callId, mapped, Number.isFinite(duration) ? duration : undefined);
    } else {
      await prisma.call.updateMany({ where: { id: callId, finalizedAt: null }, data: { status: mapped } });
    }
  } catch (err) {
    logger.error({ err, callId }, 'status webhook failed');
  }
}

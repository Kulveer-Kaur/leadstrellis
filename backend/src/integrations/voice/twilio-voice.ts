import { env } from '../../config/env.js';
import { voiceConfig } from '../../config/voice.config.js';
import { getTwilio } from '../../lib/twilio.js';

export const webhookUrl = (path: string) => `${env.PUBLIC_BASE_URL!.replace(/\/$/, '')}/api/v1/webhooks/twilio${path}`;

/** Places an outbound call; Twilio then calls our answer webhook. Dev calls always ring the test number. */
export async function placeTwilioCall(callId: string, leadPhone: string) {
  const to = voiceConfig.dialOverride ?? leadPhone;
  const call = await getTwilio().calls.create({
    to,
    from: env.TWILIO_FROM_NUMBER!,
    url: webhookUrl(`/voice/${callId}/answer`),
    method: 'POST',
    statusCallback: webhookUrl(`/voice/${callId}/status`),
    statusCallbackMethod: 'POST',
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    timeout: 25,
  });
  return { sid: call.sid, dialed: to };
}

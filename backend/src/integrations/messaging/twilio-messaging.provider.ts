import { env } from '../../config/env.js';
import { voiceConfig } from '../../config/voice.config.js';
import { getTwilio } from '../../lib/twilio.js';
import type { MessagingProvider } from './messaging.types.js';

/** SMS or WhatsApp through Twilio. Outside production the recipient is replaced by the test number. */
export const createTwilioProvider = (channel: 'SMS' | 'WHATSAPP'): MessagingProvider => ({
  name: `twilio-${channel.toLowerCase()}`,
  channel,
  async send(message) {
    const to = voiceConfig.dialOverride ?? message.to;
    const isWa = channel === 'WHATSAPP';
    const res = await getTwilio().messages.create({
      to: isWa ? `whatsapp:${to}` : to,
      from: isWa ? env.TWILIO_WHATSAPP_FROM! : env.TWILIO_FROM_NUMBER!,
      body: message.body,
    });
    return { provider: this.name, providerMessageId: res.sid, status: 'QUEUED' };
  },
});

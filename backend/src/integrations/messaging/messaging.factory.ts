import { env, isProd } from '../../config/env.js';
import { voiceConfig } from '../../config/voice.config.js';
import type { Channel } from '../../generated/prisma/enums.js';
import { createMockProvider } from './mock.provider.js';
import type { MessagingProvider } from './messaging.types.js';
import { createTwilioProvider } from './twilio-messaging.provider.js';

const cache = new Map<string, MessagingProvider>();

/** Real Twilio only when it is configured AND (in dev) a test number protects real phones. */
const twilioSafe = () => voiceConfig.twilioReady && (isProd || Boolean(voiceConfig.dialOverride));

export function getMessagingProvider(channel: Exclude<Channel, 'CALL'>): MessagingProvider {
  const key =
    channel === 'SMS' && twilioSafe()
      ? 'twilio-sms'
      : channel === 'WHATSAPP' && twilioSafe() && env.TWILIO_WHATSAPP_FROM
        ? 'twilio-whatsapp'
        : `mock-${channel}`;
  if (!cache.has(key)) {
    cache.set(key, key === 'twilio-sms' ? createTwilioProvider('SMS') : key === 'twilio-whatsapp' ? createTwilioProvider('WHATSAPP') : createMockProvider(channel));
  }
  return cache.get(key)!;
}

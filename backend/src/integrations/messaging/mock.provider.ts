import { randomUUID } from 'node:crypto';
import type { Channel } from '../../generated/prisma/enums.js';
import { logger } from '../../lib/logger.js';
import { maskPhone } from '../../utils/phone.js';
import type { MessagingProvider } from './messaging.types.js';

/**
 * Dev / demo provider: nothing leaves the server. The message is stored by the
 * communications service and shows up in the in-app thread.
 */
export const createMockProvider = (channel: Exclude<Channel, 'CALL'>): MessagingProvider => ({
  name: `mock-${channel.toLowerCase()}`,
  channel,
  async send(message) {
    const to = channel === 'EMAIL' || channel === 'INSTAGRAM' ? message.to : maskPhone(message.to);
    logger.info({ channel, to, chars: message.body.length }, 'mock message delivered');
    return { provider: this.name, providerMessageId: `mock_${randomUUID()}`, status: 'DELIVERED' };
  },
});

import type { Channel } from '../../generated/prisma/enums.js';

export interface OutboundMessage {
  to: string;
  subject?: string | null;
  body: string;
}

export interface SendResult {
  provider: string;
  providerMessageId: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED';
}

export interface MessagingProvider {
  readonly name: string;
  readonly channel: Exclude<Channel, 'CALL'>;
  send(message: OutboundMessage): Promise<SendResult>;
}

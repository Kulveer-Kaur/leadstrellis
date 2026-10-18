import type { Channel, IntentLevel, LeadStatus, MessageDirection } from '@/types';

export type TextChannel = Exclude<Channel, 'CALL'>;
export type MessagePurpose = 'INTRO' | 'FOLLOW_UP' | 'NO_REPLY_RETRY' | 'VIEWING_CONFIRMATION' | 'NURTURE' | 'POST_CALL';

/** One inbox row (GET /conversations). */
export interface Conversation {
  leadId: string;
  code: string;
  fullName: string;
  status: LeadStatus;
  intent: IntentLevel;
  messageCount: number;
  /** The lead wrote last. */
  awaitingReply: boolean;
  last: {
    id: string;
    channel: Channel;
    direction: MessageDirection;
    subject: string | null;
    preview: string;
    aiGenerated: boolean;
    createdAt: string;
  };
}

export interface SendMessageInput {
  channel: TextChannel;
  purpose: MessagePurpose;
  /** Omit to let the AI write it. */
  body?: string;
  subject?: string;
}

export interface MessageDraft {
  subject: string | null;
  body: string;
  aiGenerated: boolean;
}

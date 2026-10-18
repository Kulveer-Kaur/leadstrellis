import { z } from 'zod';

export const TEXT_CHANNELS = ['WHATSAPP', 'INSTAGRAM', 'EMAIL', 'SMS'] as const;
export const PURPOSES = ['INTRO', 'FOLLOW_UP', 'NO_REPLY_RETRY', 'VIEWING_CONFIRMATION', 'NURTURE', 'POST_CALL'] as const;

export const sendMessageSchema = z.object({
  channel: z.enum(TEXT_CHANNELS),
  purpose: z.enum(PURPOSES).default('FOLLOW_UP'),
  /** Omit to let the AI write it. */
  body: z.string().trim().min(1).max(4000).optional(),
  subject: z.string().trim().max(150).optional(),
});

export const draftMessageSchema = z.object({
  channel: z.enum(TEXT_CHANNELS),
  purpose: z.enum(PURPOSES).default('INTRO'),
});

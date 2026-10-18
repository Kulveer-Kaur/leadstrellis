import { z } from 'zod';
import { REPLY_SENTIMENTS } from './reply-sentiment.schema.js';

export const REPLY_INTENTS = ['CONFIRM_VISIT', 'WANTS_OTHER_TIME', 'ASK_QUESTION', 'NOT_INTERESTED', 'OTHER'] as const;
export type ReplyIntent = (typeof REPLY_INTENTS)[number];

/** How the lead answered a proposal, plus the reply the AI would send back. */
export const classifyReplySchema = z.object({
  intent: z.enum(REPLY_INTENTS),
  confidence: z.number().min(0).max(1),
  /** 1-based index into the offered site-visit slots, or null. */
  slotNumber: z.number().int().min(1).max(10).nullable(),
  /** A specific date/time the lead proposed, ISO 8601 with +04:00, or null. */
  requestedDateTime: z.string().nullable(),
  /** refCode of the property they want to visit when it is not the main one, or null. */
  propertyRef: z.string().nullable(),
  /** What the reply means for the deal (drives the pipeline stage). */
  sentiment: z.enum(REPLY_SENTIMENTS),
  sentimentConfidence: z.number().min(0).max(1),
  summary: z.string().min(1),
  replyBody: z.string(),
});

export type ClassifyReplyOutput = z.infer<typeof classifyReplySchema>;

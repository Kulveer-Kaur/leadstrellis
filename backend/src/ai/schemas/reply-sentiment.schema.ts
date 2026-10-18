import { z } from 'zod';

/**
 * What a lead's reply means for the deal. Drives the pipeline:
 *   POSITIVE → Closed won (when sure enough), NEGOTIATION → Negotiation,
 *   NEGATIVE → Nurture, STOP → Lost + unsubscribed, NEUTRAL → Engaged.
 */
export const REPLY_SENTIMENTS = ['POSITIVE', 'NEGOTIATION', 'NEGATIVE', 'STOP', 'NEUTRAL'] as const;
export type ReplySentiment = (typeof REPLY_SENTIMENTS)[number];

export const replySentimentSchema = z.object({
  sentiment: z.enum(REPLY_SENTIMENTS),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1),
});

export type ReplySentimentOutput = z.infer<typeof replySentimentSchema>;

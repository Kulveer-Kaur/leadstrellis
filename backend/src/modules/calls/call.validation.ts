import { z } from 'zod';

export const startCallSchema = z.object({
  /** SIMULATED forces the in-app text call; omit to use Twilio when it is configured. */
  mode: z.enum(['TWILIO', 'SIMULATED']).optional(),
});

export const simulatedTurnSchema = z.object({
  text: z.string().trim().min(1).max(1000),
});

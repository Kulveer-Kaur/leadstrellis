import { z } from 'zod';

export const CALL_STAGES = ['greeting', 'qualifying', 'presenting', 'booking', 'closing'] as const;

export const callAgentTurnSchema = z.object({
  reply: z.string().min(1),
  stage: z.enum(CALL_STAGES),
  detectedOutcome: z.enum(['INTERESTED', 'NOT_READY', 'NOT_INTERESTED', 'UNDECIDED']),
  endCall: z.boolean(),
});

export type CallAgentTurn = z.infer<typeof callAgentTurnSchema>;

import { z } from 'zod';

export const rerankSchema = z.object({
  picks: z.array(
    z.object({
      refCode: z.string(),
      fitScore: z.number().min(0).max(100),
      reason: z.string().min(1),
      caveat: z.string().nullable(),
    }),
  ),
});

export type RerankOutput = z.infer<typeof rerankSchema>;

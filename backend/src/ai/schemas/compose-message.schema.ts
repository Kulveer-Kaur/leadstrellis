import { z } from 'zod';

export const composeMessageSchema = z.object({
  subject: z.string().nullable(),
  body: z.string().min(1),
});

export type ComposeMessageOutput = z.infer<typeof composeMessageSchema>;

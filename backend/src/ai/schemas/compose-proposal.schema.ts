import { z } from 'zod';

/** The written parts of a property proposal. Prices, specs and the address come from the record, not from here. */
export const composeProposalSchema = z.object({
  headline: z.string().min(1),
  intro: z.string().min(1),
  whyItFits: z.array(z.string().min(1)),
  nextSteps: z.array(z.string().min(1)),
  emailSubject: z.string().min(1),
  emailBody: z.string().min(1),
});

export type ComposeProposalOutput = z.infer<typeof composeProposalSchema>;

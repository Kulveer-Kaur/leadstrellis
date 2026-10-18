import { z } from 'zod';

const message = z.string().trim().min(2).max(4000);

export const webFormSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().max(30).optional(),
    email: z.email().optional(),
    message,
    /** Optional structured fields from the website form; added to the text the AI reads. */
    budget: z.string().trim().max(60).optional(),
    location: z.string().trim().max(120).optional(),
    bedrooms: z.string().trim().max(20).optional(),
    propertyType: z.string().trim().max(40).optional(),
  })
  .refine((v) => v.phone || v.email, { message: 'Phone or email is required', path: ['phone'] });

/** Dummy WhatsApp webhook (the Twilio WhatsApp webhook is separate and signature-checked). */
export const whatsappSchema = z.object({
  from: z.string().trim().min(6).max(30),
  profileName: z.string().trim().max(120).optional(),
  text: message,
});

/** Dummy Instagram DM webhook. */
export const instagramSchema = z.object({
  handle: z.string().trim().min(1).max(60),
  name: z.string().trim().max(120).optional(),
  text: message,
});

export const emailSchema = z.object({
  from: z.email(),
  name: z.string().trim().max(120).optional(),
  subject: z.string().trim().max(200).optional(),
  text: message,
});

export const simulateSchema = z.union([
  z.object({ sampleId: z.string() }),
  z.object({
    channel: z.enum(['WHATSAPP', 'INSTAGRAM', 'EMAIL', 'WEBSITE', 'ADS', 'PHONE']),
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().max(30).optional(),
    email: z.email().optional(),
    instagramHandle: z.string().trim().max(60).optional(),
    message,
  }),
]);

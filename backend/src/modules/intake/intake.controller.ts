import type { Request, Response } from 'express';
import type { z } from 'zod';
import { ApiError } from '../../utils/api-error.js';
import { created, ok } from '../../utils/api-response.js';
import { captureLead } from './intake.service.js';
import type { emailSchema, instagramSchema, simulateSchema, webFormSchema, whatsappSchema } from './intake.validation.js';
import { findSample, SAMPLE_ENQUIRIES } from './sample-enquiries.js';

export async function webForm(req: Request, res: Response) {
  const b = req.body as z.infer<typeof webFormSchema>;
  const fields = [
    b.propertyType && `Type: ${b.propertyType}`,
    b.bedrooms && `Bedrooms: ${b.bedrooms}`,
    b.location && `Location: ${b.location}`,
    b.budget && `Budget: ${b.budget}`,
  ].filter(Boolean);
  const message = fields.length ? `${b.message}\n(${fields.join('; ')})` : b.message;
  created(res, await captureLead({ source: 'WEBSITE', fullName: b.fullName, phone: b.phone, email: b.email, message }));
}

export async function whatsapp(req: Request, res: Response) {
  const b = req.body as z.infer<typeof whatsappSchema>;
  created(res, await captureLead({ source: 'WHATSAPP', fullName: b.profileName ?? 'WhatsApp contact', phone: b.from, message: b.text }));
}

export async function instagram(req: Request, res: Response) {
  const b = req.body as z.infer<typeof instagramSchema>;
  created(res, await captureLead({ source: 'INSTAGRAM', fullName: b.name ?? `@${b.handle.replace(/^@/, '')}`, instagramHandle: b.handle, message: b.text }));
}

export async function email(req: Request, res: Response) {
  const b = req.body as z.infer<typeof emailSchema>;
  const message = b.subject ? `${b.subject}\n\n${b.text}` : b.text;
  created(res, await captureLead({ source: 'EMAIL', fullName: b.name ?? b.from.split('@')[0], email: b.from, message }));
}

/** Simulator: fire a sample (or custom) enquiry from any channel. */
export async function simulate(req: Request, res: Response) {
  const b = req.body as z.infer<typeof simulateSchema>;
  if ('sampleId' in b) {
    const s = findSample(b.sampleId);
    if (!s) throw ApiError.notFound('Sample enquiry');
    return created(res, await captureLead({ ...s }));
  }
  created(res, await captureLead({ source: b.channel, fullName: b.fullName, phone: b.phone, email: b.email, instagramHandle: b.instagramHandle, message: b.message }));
}

export function samples(_req: Request, res: Response) {
  ok(res, SAMPLE_ENQUIRIES);
}

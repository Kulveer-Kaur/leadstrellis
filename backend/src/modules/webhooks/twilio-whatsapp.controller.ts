import type { Request, Response } from 'express';
import twilio from 'twilio';
import { logger } from '../../lib/logger.js';
import { captureLead } from '../intake/intake.service.js';

/** Real inbound WhatsApp via Twilio (sandbox or sender). Replies are sent by the automations, so TwiML is empty. */
export async function inboundWhatsapp(req: Request, res: Response) {
  const from = String(req.body?.From ?? '').replace(/^whatsapp:/, '');
  const body = String(req.body?.Body ?? '').trim();
  if (from && body) {
    try {
      await captureLead({ source: 'WHATSAPP', fullName: String(req.body?.ProfileName ?? 'WhatsApp contact'), phone: from, message: body });
    } catch (err) {
      logger.error({ err }, 'inbound WhatsApp capture failed');
    }
  }
  res.type('text/xml').send(new twilio.twiml.MessagingResponse().toString());
}

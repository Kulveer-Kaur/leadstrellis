import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env.js';
import { replyAddressFor } from '../../integrations/email/mailer.js';
import type { ResponseLinks } from '../../integrations/email/templates.js';

/**
 * Links in lead emails ("I'm interested", "Not interested", …) carry a short signed token:
 * <lead number>-<HMAC of the lead id>. No database row, cannot be guessed or moved to
 * another lead, and stays valid for every email that lead ever gets.
 */
const sign = (leadId: string) => createHmac('sha256', env.JWT_SECRET).update(`lead-response:${leadId}`).digest('base64url').slice(0, 22);

export const responseToken = (lead: { id: string; number: number }) => `${lead.number}-${sign(lead.id)}`;

/** Lead number from a token, or null when malformed. The signature is checked by verifyResponseToken. */
export function parseResponseToken(token: string) {
  const m = /^(\d+)-([A-Za-z0-9_-]{22})$/.exec(token);
  return m ? { number: Number(m[1]), sig: m[2]! } : null;
}

export function verifyResponseToken(leadId: string, sig: string) {
  const expected = Buffer.from(sign(leadId));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Every response link for one lead's emails. */
export function responseLinksFor(lead: { id: string; number: number }): ResponseLinks {
  const base = `${env.PUBLIC_APP_URL.replace(/\/$/, '')}/respond/${responseToken(lead)}`;
  const reply = replyAddressFor(lead.number);
  return {
    interested: `${base}?choice=interested`,
    later: `${base}?choice=later`,
    notInterested: `${base}?choice=not-interested`,
    unsubscribe: `${base}?choice=unsubscribe`,
    question: reply ? `mailto:${reply}?subject=${encodeURIComponent('A question about my property search')}` : undefined,
  };
}

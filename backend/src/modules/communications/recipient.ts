import type { Lead } from '../../generated/prisma/client.js';
import type { Channel } from '../../generated/prisma/enums.js';

/** The address for a channel, or undefined if the lead cannot be reached there. */
export function recipientFor(lead: Pick<Lead, 'phone' | 'email' | 'instagramHandle'>, channel: Exclude<Channel, 'CALL'>) {
  if (channel === 'EMAIL') return lead.email ?? undefined;
  if (channel === 'INSTAGRAM') return lead.instagramHandle ?? undefined;
  return lead.phone ?? undefined;
}

import type { Lead } from '../generated/prisma/client.js';
import type { Channel, LeadSource } from '../generated/prisma/enums.js';
import type { TextChannel } from '../modules/communications/communications.service.js';
import { recipientFor } from '../modules/communications/recipient.js';

type ContactLead = Pick<Lead, 'phone' | 'email' | 'instagramHandle' | 'preferredChannel' | 'source'>;

const SOURCE_DEFAULT: Record<LeadSource, TextChannel> = {
  WHATSAPP: 'WHATSAPP',
  INSTAGRAM: 'INSTAGRAM',
  EMAIL: 'EMAIL',
  WEBSITE: 'EMAIL',
  ADS: 'EMAIL',
  PHONE: 'WHATSAPP',
  MANUAL: 'EMAIL',
  GOOGLE_BUSINESS: 'EMAIL',
  FACEBOOK: 'EMAIL',
  PROPERTY_PORTAL: 'EMAIL',
  REFERRAL: 'EMAIL',
};

export const reachable = (lead: ContactLead, channel: Channel) =>
  channel === 'CALL' ? Boolean(lead.phone) : Boolean(recipientFor(lead, channel));

/** Channel for the first message: the lead's preference → the channel they came from → any channel that works. */
export function primaryChannel(lead: ContactLead): TextChannel | null {
  const order: TextChannel[] = [
    ...(lead.preferredChannel && lead.preferredChannel !== 'CALL' ? [lead.preferredChannel] : []),
    SOURCE_DEFAULT[lead.source],
    'WHATSAPP',
    'EMAIL',
    'INSTAGRAM',
    'SMS',
  ];
  return order.find((c) => reachable(lead, c)) ?? null;
}

/** Retry order after no reply (plan §6 step 8: WhatsApp → email → call), skipping unreachable channels. */
export function retrySequence(lead: ContactLead): Channel[] {
  const first = primaryChannel(lead);
  const order: Channel[] = [...(first ? [first] : []), 'WHATSAPP', 'EMAIL', 'INSTAGRAM', 'CALL'];
  return [...new Set(order)].filter((c) => reachable(lead, c));
}

import { eventBus } from '../../events/event-bus.js';
import type { LeadSource } from '../../generated/prisma/enums.js';
import { enqueueLeadProcessing } from '../../jobs/lead-processing.job.js';
import { emitSocket } from '../../lib/socket.js';
import { prisma } from '../../lib/prisma.js';
import { normalizePhone } from '../../utils/phone.js';
import { logActivity } from '../activity/activity.service.js';
import { recordInbound, type TextChannel } from '../communications/communications.service.js';
import { findByContact } from '../leads/lead.repository.js';
import { pickAgent } from '../users/assignment.service.js';

export interface CaptureInput {
  source: LeadSource;
  fullName: string;
  message: string;
  phone?: string;
  email?: string;
  instagramHandle?: string;
}

const SOURCE_CHANNEL: Partial<Record<LeadSource, TextChannel>> = { WHATSAPP: 'WHATSAPP', INSTAGRAM: 'INSTAGRAM', EMAIL: 'EMAIL' };
const SOURCE_LABEL: Record<LeadSource, string> = {
  WEBSITE: 'website',
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  EMAIL: 'email',
  MANUAL: 'manual entry',
  ADS: 'ad form',
  PHONE: 'phone',
  GOOGLE_BUSINESS: 'Google Business',
  FACEBOOK: 'Facebook',
  PROPERTY_PORTAL: 'property portal',
  REFERRAL: 'referral',
};

/**
 * Steps 1–2: every channel lands here. A known contact gets the message attached to
 * their existing lead (and AI re-processing); a new contact becomes a new lead.
 */
export async function captureLead(input: CaptureInput) {
  const contact = {
    phone: normalizePhone(input.phone),
    email: input.email?.toLowerCase(),
    instagramHandle: input.instagramHandle?.replace(/^@/, '').toLowerCase(),
  };
  const channel = SOURCE_CHANNEL[input.source];
  const existing = await findByContact(contact);

  if (existing) {
    if (channel) await recordInbound(existing.id, channel, input.message);
    const rawMessage = [existing.rawMessage, input.message].filter(Boolean).join('\n---\n');
    await prisma.lead.update({ where: { id: existing.id }, data: { rawMessage, processingState: 'PENDING', lastInboundAt: new Date() } });
    await logActivity({ leadId: existing.id, actorType: 'SYSTEM', type: 'lead.repeat', title: `Repeat enquiry via ${SOURCE_LABEL[input.source]}`, detail: input.message.slice(0, 140) });
    enqueueLeadProcessing(existing.id);
    return { leadId: existing.id, duplicate: true };
  }

  const lead = await prisma.lead.create({
    data: {
      fullName: input.fullName,
      ...contact,
      source: input.source,
      rawMessage: input.message,
      preferredChannel: channel,
      assignedToId: await pickAgent(),
    },
  });
  if (channel) await prisma.message.create({ data: { leadId: lead.id, channel, direction: 'IN', body: input.message, status: 'RECEIVED' } });

  await logActivity({
    leadId: lead.id,
    actorType: 'SYSTEM',
    type: 'lead.captured',
    title: `Lead captured from ${SOURCE_LABEL[input.source]}`,
    detail: `${lead.fullName} · ${input.message.slice(0, 100)}`,
  });
  eventBus.emit('lead.created', { leadId: lead.id });
  emitSocket('lead:created', { leadId: lead.id });
  enqueueLeadProcessing(lead.id);
  return { leadId: lead.id, duplicate: false };
}

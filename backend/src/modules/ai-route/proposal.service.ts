import { responseLinksFor } from '../responses/response-token.js';
import { randomBytes } from 'node:crypto';
import { toLeadProfile, toListingView } from '../../ai/context/ai-context.js';
import { composeProposal } from '../../ai/tasks/compose-proposal.task.js';
import { env } from '../../config/env.js';
import type { Prisma, Property } from '../../generated/prisma/client.js';
import { siteVisitIcs } from '../../integrations/email/ics.js';
import { publicApiUrl, replyAddressFor, sendEmail } from '../../integrations/email/mailer.js';
import { proposalCoverEmail, visitConfirmedEmail } from '../../integrations/email/templates.js';
import { mapsUrl, propertyAddress, renderProposalPdf, type ProposalAlternative } from '../../integrations/pdf/proposal-pdf.js';
import { emitSocket } from '../../lib/socket.js';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { dubaiSlot, formatDubai } from '../../utils/dates.js';
import { logActivity } from '../activity/activity.service.js';
import { getTopMatches } from '../matching/matching.service.js';
import { advanceIfIn } from '../pipeline/pipeline.service.js';
import { createViewing } from '../viewings/viewing.service.js';
import { setStep } from './ai-route.service.js';

const agentSelect = { select: { name: true, email: true, phone: true } } as const;

export const proposalUrl = (token: string) => `${env.PUBLIC_APP_URL.replace(/\/$/, '')}/p/${token}`;
export const proposalPdfUrl = (token: string) => `${publicApiUrl()}/public/proposals/${token}/pdf`;
export const proposalNumber = (leadNumber: number, createdAt: Date) => `P-${leadNumber}-${createdAt.getTime().toString(36).slice(-4).toUpperCase()}`;

/** Three site-visit options: tomorrow 11:00 and 17:00, the day after 11:00 (Dubai time). */
export const siteVisitSlots = (now = new Date()) => [dubaiSlot(1, 11, now), dubaiSlot(1, 17, now), dubaiSlot(2, 11, now)];

/**
 * The best match is the property with the highest AI fit %, the rest of the shortlist
 * become "other options". Ties fall back to the AI's rank.
 */
export async function pickPrimaryMatch(leadId: string) {
  const matches = await getTopMatches(leadId, 4);
  if (!matches.length) return null;
  const sorted = [...matches].sort((a, b) => (b.aiFitScore ?? b.filterScore) - (a.aiFitScore ?? a.filterScore) || (a.finalRank ?? 99) - (b.finalRank ?? 99));
  return { primary: sorted[0]!, others: sorted.slice(1) };
}

/** Writes the AI proposal for the best match, renders the PDF and emails both to the lead. */
export async function createAndSendProposal(leadId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { requirement: true, assignedTo: agentSelect } });
  if (!lead) throw ApiError.notFound('Lead');
  if (!lead.email) throw ApiError.badRequest('Lead has no email address');
  const pick = await pickPrimaryMatch(leadId);
  if (!pick) throw ApiError.badRequest('No matched properties to propose yet');

  const best = pick.primary.property;
  const slots = siteVisitSlots();
  const agentName = lead.assignedTo?.name ?? 'The LeadsTrellis team';
  const written = await composeProposal({
    lead: toLeadProfile(lead),
    best: toListingView(best, pick.primary.aiReason),
    address: propertyAddress(best),
    alternatives: pick.others.map((m) => toListingView(m.property, m.aiReason)),
    slots: slots.map(formatDubai),
    agentName,
    useAi: lead.agentMode === 'AI',
  });

  const alternatives: ProposalAlternative[] = pick.others.map((m) => ({
    propertyId: m.property.id,
    refCode: m.property.refCode,
    title: m.property.title,
    community: m.property.community,
    priceAed: m.property.priceAed,
    bedrooms: m.property.bedrooms,
    fitScore: m.aiFitScore,
    reason: m.aiReason,
  }));

  const proposal = await prisma.proposal.create({
    data: {
      leadId,
      propertyId: best.id,
      token: randomBytes(18).toString('base64url'),
      fitScore: pick.primary.aiFitScore,
      headline: written.headline,
      intro: written.intro,
      whyItFits: written.whyItFits,
      nextSteps: written.nextSteps,
      slots,
      alternatives: alternatives as unknown as Prisma.InputJsonValue,
      aiGenerated: written.aiGenerated,
    },
  });

  const pdf = await buildProposalPdf(proposal.id);
  const html = proposalCoverEmail(
    written.emailBody,
    { ...best, reason: pick.primary.aiReason ?? undefined },
    { proposalUrl: proposalUrl(proposal.token), pdfUrl: proposalPdfUrl(proposal.token) },
    responseLinksFor(lead),
  );
  const result = await sendEmail({
    to: lead.email,
    subject: written.emailSubject,
    html,
    replyTo: replyAddressFor(lead.number),
    headers: { 'X-Leadstrellis-Lead': `L-${lead.number}`, 'X-Leadstrellis-Proposal': proposal.id },
    attachments: [{ filename: pdf.filename, content: pdf.buffer, contentType: 'application/pdf' }],
  });

  await prisma.message.create({
    data: {
      leadId,
      channel: 'EMAIL',
      direction: 'OUT',
      subject: written.emailSubject,
      body: written.emailBody,
      status: result.sent ? 'SENT' : 'FAILED',
      provider: result.provider,
      providerMessageId: result.messageId,
      aiGenerated: written.aiGenerated,
      error: result.error ?? (result.sent ? undefined : 'SMTP is not configured'),
    },
  });

  if (!result.sent) {
    await prisma.proposal.update({ where: { id: proposal.id }, data: { status: 'FAILED', error: result.error ?? 'SMTP is not configured' } });
    await logActivity({ leadId, actorType: 'AI', type: 'proposal.failed', title: 'Proposal email could not be sent', detail: result.error ?? 'SMTP is not configured' });
    return { proposal, sent: false as const, error: result.error ?? 'SMTP is not configured' };
  }

  await prisma.proposal.update({ where: { id: proposal.id }, data: { sentAt: new Date(), emailMessageId: result.messageId } });
  await prisma.lead.update({ where: { id: leadId }, data: { lastContactedAt: new Date(), contactAttempts: { increment: 1 } } });
  await prisma.leadPropertyMatch.updateMany({ where: { leadId, finalRank: { not: null }, sentAt: null }, data: { sentAt: new Date() } });
  await advanceIfIn(leadId, ['NEW', 'QUALIFIED', 'NURTURE'], 'CONTACTED', 'AI', 'AI proposal sent');
  await logActivity({
    leadId,
    actorType: 'AI',
    type: 'proposal.sent',
    title: `Proposal sent: ${best.title}`,
    detail: `${pick.primary.aiFitScore ?? '–'}% match · PDF attached · ${alternatives.length} other option${alternatives.length === 1 ? '' : 's'} listed`,
    payload: { proposalId: proposal.id },
  });
  emitSocket('lead:updated', { leadId });
  return { proposal, propertyTitle: best.title, sent: true as const };
}

/** Renders a stored proposal as a PDF (always from the record, so the file matches what was sent). */
export async function buildProposalPdf(proposalId: string) {
  const p = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { property: true, lead: { select: { number: true, fullName: true, assignedTo: agentSelect } } },
  });
  if (!p) throw ApiError.notFound('Proposal');
  const number = proposalNumber(p.lead.number, p.createdAt);
  const buffer = await renderProposalPdf({
    number,
    createdAt: p.createdAt,
    leadName: p.lead.fullName,
    agent: p.lead.assignedTo,
    fitScore: p.fitScore,
    headline: p.headline,
    intro: p.intro,
    whyItFits: p.whyItFits,
    nextSteps: p.nextSteps,
    slots: p.slots,
    property: p.property,
    alternatives: p.alternatives as unknown as ProposalAlternative[],
    proposalUrl: proposalUrl(p.token),
  });
  return { buffer, filename: `Leadstrellis-proposal-${number}.pdf` };
}

/** Public view of a proposal (no internal fields). Marks it viewed the first time. */
export async function getPublicProposal(token: string) {
  const p = await prisma.proposal.findUnique({
    where: { token },
    include: { property: true, lead: { select: { number: true, fullName: true, assignedTo: agentSelect } }, viewing: { include: { property: { select: { title: true } } } } },
  });
  if (!p) throw ApiError.notFound('Proposal');
  if (!p.viewedAt) {
    await prisma.proposal.update({ where: { id: p.id }, data: { viewedAt: new Date() } });
    await logActivity({ leadId: p.leadId, actorType: 'SYSTEM', type: 'proposal.viewed', title: 'Lead opened the proposal' });
  }
  const pr = p.property;
  return {
    number: proposalNumber(p.lead.number, p.createdAt),
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    leadFirstName: p.lead.fullName.split(/\s+/)[0],
    agent: p.lead.assignedTo,
    fitScore: p.fitScore,
    headline: p.headline,
    intro: p.intro,
    whyItFits: p.whyItFits,
    nextSteps: p.nextSteps,
    slots: p.slots.map((s) => ({ at: s.toISOString(), label: formatDubai(s) })),
    property: {
      id: pr.id,
      refCode: pr.refCode,
      title: pr.title,
      description: pr.description,
      type: pr.type,
      listingType: pr.listingType,
      priceAed: pr.priceAed,
      bedrooms: pr.bedrooms,
      bathrooms: pr.bathrooms,
      areaSqft: pr.areaSqft,
      completionStatus: pr.completionStatus,
      furnished: pr.furnished,
      view: pr.view,
      amenities: pr.amenities,
      imageUrls: pr.imageUrls,
      address: propertyAddress(pr),
      mapsUrl: mapsUrl(pr),
    },
    alternatives: p.alternatives as unknown as ProposalAlternative[],
    pdfUrl: proposalPdfUrl(p.token),
    visit: p.viewing ? { at: p.viewing.scheduledAt.toISOString(), label: formatDubai(p.viewing.scheduledAt), propertyTitle: p.viewing.property.title } : null,
  };
}

export interface ConfirmVisitInput {
  scheduledAt: Date;
  /** Visit another property from the proposal instead of the main one. */
  propertyId?: string | null;
  via: 'email-reply' | 'proposal-page' | 'agent';
  note?: string;
}

/**
 * The lead confirmed a site visit: book it, move the lead to Viewing, and send a
 * confirmation with the address, a map link and a calendar invite. The lead is marked
 * Won later, when a reply shows they agree to go ahead (see reply-outcome.service).
 */
export async function confirmSiteVisit(proposalId: string, input: ConfirmVisitInput) {
  const p = await prisma.proposal.findUnique({ where: { id: proposalId }, include: { property: true, lead: { include: { assignedTo: agentSelect } } } });
  if (!p) throw ApiError.notFound('Proposal');
  if (p.status === 'ACCEPTED' && p.viewingId) return { alreadyConfirmed: true as const, viewingId: p.viewingId };
  if (p.status === 'DECLINED') throw ApiError.badRequest('This proposal was declined');

  const altIds = (p.alternatives as unknown as ProposalAlternative[]).map((a) => a.propertyId).filter(Boolean);
  const propertyId = input.propertyId && altIds.includes(input.propertyId) ? input.propertyId : p.propertyId;
  const property: Property = propertyId === p.propertyId ? p.property : await prisma.property.findUniqueOrThrow({ where: { id: propertyId } });

  const viewing = await createViewing({
    leadId: p.leadId,
    propertyId,
    scheduledAt: input.scheduledAt,
    bookedBy: input.via === 'agent' ? 'USER' : 'AI',
    notes: input.note ?? `Site visit confirmed by the lead via ${input.via.replace('-', ' ')}`,
  });
  await prisma.viewing.update({ where: { id: viewing.id }, data: { status: 'CONFIRMED' } });
  await prisma.proposal.update({ where: { id: p.id }, data: { status: 'ACCEPTED', respondedAt: new Date(), viewingId: viewing.id } });

  await advanceIfIn(p.leadId, ['CONTACTED', 'ENGAGED'], 'VIEWING', 'AI', `Site visit confirmed for ${property.title}`);
  // Expected deal value for the board; wonAt is only set once the lead agrees to go ahead.
  await prisma.lead.update({ where: { id: p.leadId }, data: { dealValueAed: property.priceAed } });
  await setStep(p.leadId, 'AWAITING_REPLY', `Site visit booked for ${formatDubai(input.scheduledAt)}. Waiting for the lead's decision.`);

  const lead = p.lead;
  if (lead.email) {
    const when = formatDubai(input.scheduledAt);
    const address = propertyAddress(property);
    const email = visitConfirmedEmail(lead, {
      when,
      propertyTitle: property.title,
      address,
      mapsUrl: mapsUrl(property),
      agentName: lead.assignedTo?.name ?? null,
      agentPhone: lead.assignedTo?.phone ?? null,
    }, responseLinksFor(lead));
    const ics = siteVisitIcs({
      uid: viewing.id,
      start: input.scheduledAt,
      title: `Site visit: ${property.title}`,
      location: address,
      description: `Site visit with ${lead.assignedTo?.name ?? 'LeadsTrellis'}. Map: ${mapsUrl(property)}`,
      organizerEmail: env.SMTP_USER,
    });
    const result = await sendEmail({
      to: lead.email,
      subject: email.subject,
      html: email.html,
      replyTo: replyAddressFor(lead.number),
      inReplyTo: p.emailMessageId ?? undefined,
      attachments: [{ filename: 'site-visit.ics', content: ics, contentType: 'text/calendar; charset=utf-8; method=PUBLISH' }],
    });
    await prisma.message.create({
      data: {
        leadId: lead.id,
        channel: 'EMAIL',
        direction: 'OUT',
        subject: email.subject,
        body: `Site visit confirmed: ${property.title}, ${when} (Dubai time). Address: ${address}.`,
        status: result.sent ? 'SENT' : 'FAILED',
        provider: result.provider,
        providerMessageId: result.messageId,
        aiGenerated: true,
        error: result.error,
      },
    });
  }

  await logActivity({
    leadId: p.leadId,
    actorType: input.via === 'agent' ? 'USER' : 'AI',
    type: 'proposal.accepted',
    title: 'Site visit confirmed',
    detail: `${property.title} · ${formatDubai(input.scheduledAt)} · via ${input.via.replace('-', ' ')}`,
    payload: { proposalId: p.id, viewingId: viewing.id },
  });
  emitSocket('lead:updated', { leadId: p.leadId });
  return { alreadyConfirmed: false as const, viewingId: viewing.id };
}

/** Lead-page list of proposals with their public links. */
export async function listProposals(leadId: string) {
  const rows = await prisma.proposal.findMany({
    where: { leadId },
    orderBy: { createdAt: 'desc' },
    include: { property: { select: { id: true, title: true, community: true, priceAed: true, refCode: true } }, lead: { select: { number: true } } },
  });
  return rows.map(({ lead, token, ...r }) => ({
    ...r,
    number: proposalNumber(lead.number, r.createdAt),
    url: proposalUrl(token),
    pdfUrl: proposalPdfUrl(token),
  }));
}

export async function proposalIdByToken(token: string) {
  const p = await prisma.proposal.findUnique({ where: { token }, select: { id: true } });
  if (!p) throw ApiError.notFound('Proposal');
  return p.id;
}

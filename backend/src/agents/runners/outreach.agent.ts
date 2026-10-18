import { logActivity } from '../../modules/activity/activity.service.js';
import { getTopMatches, refreshMatches } from '../../modules/matching/matching.service.js';
import { advanceIfIn } from '../../modules/pipeline/pipeline.service.js';
import { replyAddressFor, sendEmail } from '../../integrations/email/mailer.js';
import { responseLinksFor } from '../../modules/responses/response-token.js';
import { recommendationEmail } from '../../integrations/email/templates.js';
import { prisma } from '../../lib/prisma.js';
import type { AgentTask } from '../../generated/prisma/client.js';
import { dailySendCapGuard, incrementDailySendCount, perLeadEmailGuard, workingHoursGate } from '../guards/send-guards.js';
import type { AgentRunResult } from './types.js';

/**
 * Outreach agent — sends the first recommendation email with 1–3 property cards. If the
 * lead needs more info, falls back to a short "a few quick questions" nudge. Falls back
 * to a log entry when SMTP is not configured so the queue still clears.
 */
export async function runOutreachAgent(task: AgentTask): Promise<AgentRunResult> {
  if (!task.leadId) return { outcome: 'skipped', reason: 'no leadId' };
  const lead = await prisma.lead.findUnique({ where: { id: task.leadId }, include: { requirement: true } });
  if (!lead) return { outcome: 'skipped', reason: 'lead not found' };
  if (!lead.email) return { outcome: 'skipped', reason: 'lead has no email address' };
  if (lead.automationPaused) return { outcome: 'skipped', reason: 'automation paused on lead' };
  if (lead.unsubscribedAt) return { outcome: 'skipped', reason: 'lead unsubscribed' };

  const guards = [await workingHoursGate(), await dailySendCapGuard(), await perLeadEmailGuard(lead.id)];
  for (const g of guards) {
    if ('reschedule' in g) return { outcome: 'reschedule', runAfter: g.reschedule, reason: g.reason };
    if ('skip' in g) return { outcome: 'skipped', reason: g.skip };
  }

  // Make sure the lead has fresh matches (cheap, cached in DB).
  let matches = await getTopMatches(lead.id, 3);
  if (!matches.length) {
    try {
      await refreshMatches(lead.id, 3);
      matches = await getTopMatches(lead.id, 3);
    } catch {
      // ignore — the email will still send without property cards
    }
  }

  const propertyCards = matches
    .filter((m) => m.property)
    .map((m) => ({
      refCode: m.property.refCode,
      title: m.property.title,
      community: m.property.community,
      emirate: m.property.emirate,
      priceAed: m.property.priceAed,
      bedrooms: m.property.bedrooms,
      bathrooms: m.property.bathrooms,
      areaSqft: m.property.areaSqft,
      imageUrls: m.property.imageUrls,
      reason: m.aiReason ?? undefined,
    }));

  const email = recommendationEmail({ id: lead.id, fullName: lead.fullName, number: lead.number }, propertyCards, responseLinksFor(lead));
  const result = await sendEmail({
    to: lead.email,
    replyTo: replyAddressFor(lead.number),
    subject: email.subject,
    html: email.html,
    headers: { 'X-Leadstrellis-Lead': `L-${lead.number}`, 'X-Leadstrellis-Agent': 'OUTREACH' },
  });

  await prisma.message.create({
    data: {
      leadId: lead.id,
      channel: 'EMAIL',
      direction: 'OUT',
      subject: email.subject,
      body: email.html,
      status: result.sent ? 'SENT' : 'FAILED',
      provider: result.provider,
      providerMessageId: result.messageId,
      aiGenerated: true,
      error: result.error,
    },
  });

  if (result.sent) await incrementDailySendCount();

  await prisma.lead.update({
    where: { id: lead.id },
    data: result.sent
      ? { lastContactedAt: new Date(), contactAttempts: { increment: 1 } }
      : { contactAttempts: { increment: 1 } },
  });

  await advanceIfIn(lead.id, ['NEW', 'QUALIFIED'], 'CONTACTED', 'AI', 'Outreach agent sent recommendations');

  await logActivity({
    leadId: lead.id,
    actorType: 'AI',
    type: 'agent.outreach',
    title: result.sent ? 'Outreach agent sent recommendations' : 'Outreach agent logged a recommendation (SMTP not configured)',
    detail: propertyCards.length
      ? `${propertyCards.length} ${propertyCards.length === 1 ? 'property' : 'properties'} — subject "${email.subject}"`
      : `No matches yet — subject "${email.subject}"`,
  });

  return { outcome: 'done', detail: `${propertyCards.length} properties, provider=${result.provider}, sent=${result.sent}` };
}

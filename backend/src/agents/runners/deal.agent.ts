import { logActivity } from '../../modules/activity/activity.service.js';
import { replyAddressFor, sendEmail } from '../../integrations/email/mailer.js';
import { responseLinksFor } from '../../modules/responses/response-token.js';
import { proposalEmail, viewingReminderEmail } from '../../integrations/email/templates.js';
import { prisma } from '../../lib/prisma.js';
import { advanceIfIn } from '../../modules/pipeline/pipeline.service.js';
import type { AgentTask } from '../../generated/prisma/client.js';
import { formatDubai } from '../../utils/dates.js';
import { dailySendCapGuard, incrementDailySendCount, perLeadEmailGuard, workingHoursGate } from '../guards/send-guards.js';
import type { AgentRunResult } from './types.js';
import { setStep } from '../../modules/ai-route/ai-route.service.js';
import { createAndSendProposal } from '../../modules/ai-route/proposal.service.js';

/**
 * Deal agent — handles the end of the funnel: viewing reminders, post-viewing proposal,
 * and the "mark won" transition (which still goes through the Inbox agent when the lead
 * clearly accepts; the Deal agent here just prepares the proposal).
 */
export async function runDealAgent(task: AgentTask): Promise<AgentRunResult> {
  if (!task.leadId) return { outcome: 'skipped', reason: 'no leadId' };
  const lead = await prisma.lead.findUnique({
    where: { id: task.leadId },
    include: { viewings: { orderBy: { scheduledAt: 'desc' }, take: 1, include: { property: true } }, matches: { include: { property: true }, orderBy: { finalRank: 'asc' }, take: 1 } },
  });
  if (!lead) return { outcome: 'skipped', reason: 'lead not found' };
  if (!lead.email) return { outcome: 'skipped', reason: 'lead has no email address' };
  if (task.type === 'ai_route_proposal') return runRouteProposal(task, lead.aiRouteEnabled);
  if (lead.automationPaused) return { outcome: 'skipped', reason: 'automation paused on lead' };
  if (lead.unsubscribedAt) return { outcome: 'skipped', reason: 'lead unsubscribed' };

  const guards = [await workingHoursGate(), await dailySendCapGuard(), await perLeadEmailGuard(lead.id)];
  for (const g of guards) {
    if ('reschedule' in g) return { outcome: 'reschedule', runAfter: g.reschedule, reason: g.reason };
    if ('skip' in g) return { outcome: 'skipped', reason: g.skip };
  }

  if (task.type === 'viewing_reminder') {
    const viewing = lead.viewings[0];
    if (!viewing) return { outcome: 'skipped', reason: 'no viewing to remind about' };
    const email = viewingReminderEmail(
      { id: lead.id, fullName: lead.fullName, number: lead.number },
      formatDubai(viewing.scheduledAt),
      viewing.property?.title ?? 'the property',
      responseLinksFor(lead),
    );
    const result = await sendEmail({ to: lead.email, subject: email.subject, html: email.html, replyTo: replyAddressFor(lead.number) });
    await persistMessage(lead.id, email, result);
    if (result.sent) await incrementDailySendCount();
    await logActivity({ leadId: lead.id, actorType: 'AI', type: 'agent.deal.reminder', title: 'Deal agent sent a viewing reminder' });
    return { outcome: 'done', detail: `viewing reminder, sent=${result.sent}` };
  }

  // Default: post-viewing proposal based on the best match (plan §2 Deal agent).
  const topProperty = lead.viewings[0]?.property ?? lead.matches[0]?.property;
  if (!topProperty) return { outcome: 'skipped', reason: 'no shortlisted property to propose' };
  const email = proposalEmail(
    { id: lead.id, fullName: lead.fullName, number: lead.number },
    {
      refCode: topProperty.refCode,
      title: topProperty.title,
      community: topProperty.community,
      emirate: topProperty.emirate,
      priceAed: topProperty.priceAed,
      bedrooms: topProperty.bedrooms,
      bathrooms: topProperty.bathrooms,
      areaSqft: topProperty.areaSqft,
      imageUrls: topProperty.imageUrls,
    },
    responseLinksFor(lead),
  );
  const result = await sendEmail({
    to: lead.email,
    replyTo: replyAddressFor(lead.number),
    subject: email.subject,
    html: email.html,
    headers: { 'X-Leadstrellis-Lead': `L-${lead.number}`, 'X-Leadstrellis-Agent': 'DEAL' },
  });

  await persistMessage(lead.id, email, result);
  if (result.sent) await incrementDailySendCount();

  await prisma.lead.update({
    where: { id: lead.id },
    data: { lastContactedAt: new Date(), contactAttempts: { increment: 1 } },
  });

  await advanceIfIn(lead.id, ['VIEWING', 'ENGAGED'], 'NEGOTIATION', 'AI', 'Proposal sent');

  await logActivity({
    leadId: lead.id,
    actorType: 'AI',
    type: 'agent.deal.proposal',
    title: 'Deal agent sent a proposal',
    detail: `${topProperty.title} — ${result.sent ? 'email sent' : 'logged (SMTP unavailable)'}`,
  });

  return { outcome: 'done', detail: `proposal for ${topProperty.refCode}, sent=${result.sent}` };
}

async function persistMessage(leadId: string, email: { subject: string; html: string }, result: { sent: boolean; provider: string; messageId?: string; error?: string }) {
  await prisma.message.create({
    data: {
      leadId,
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
}

/**
 * AI route step 3: AI-written proposal for the best match, as a PDF by email. The admin
 * switched the route on for this lead, so it goes out now (working hours and the per-lead
 * nudge limit apply to unprompted follow-ups, not to this); the daily send cap still applies.
 */
async function runRouteProposal(task: AgentTask, aiRouteEnabled: boolean): Promise<AgentRunResult> {
  const leadId = task.leadId!;
  if (!aiRouteEnabled) return { outcome: 'skipped', reason: 'AI route is off for this lead' };
  const cap = await dailySendCapGuard();
  if ('reschedule' in cap) {
    await setStep(leadId, 'PROPOSING', 'Daily email limit reached: the proposal goes out tomorrow.');
    return { outcome: 'reschedule', runAfter: cap.reschedule, reason: cap.reason };
  }
  const res = await createAndSendProposal(leadId);
  if (!res.sent) {
    await setStep(leadId, 'NEEDS_ATTENTION', `Proposal email failed: ${res.error}. Check the SMTP settings, then resend it.`);
    return { outcome: 'done', detail: `proposal created but not sent: ${res.error}` };
  }
  await incrementDailySendCount();
  await setStep(leadId, 'AWAITING_REPLY', 'Proposal sent with PDF. Waiting for the lead to confirm a site visit.');
  return { outcome: 'done', detail: `proposal sent: ${res.propertyTitle} (PDF attached)` };
}

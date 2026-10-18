import { responseLinksFor } from '../../modules/responses/response-token.js';
import { logActivity } from '../../modules/activity/activity.service.js';
import { replyAddressFor, sendEmail } from '../../integrations/email/mailer.js';
import { followUpEmail } from '../../integrations/email/templates.js';
import { prisma } from '../../lib/prisma.js';
import type { AgentTask } from '../../generated/prisma/client.js';
import { dailySendCapGuard, incrementDailySendCount, perLeadEmailGuard, workingHoursGate } from '../guards/send-guards.js';
import type { AgentRunResult } from './types.js';

const ANGLES: Record<string, string> = {
  nudge_no_reply: "Just checking in — did any of the properties I sent earlier catch your eye? Happy to tailor the list.",
  offer_viewing: "A quick thought — would it help to see one or two of these in person this week? I can arrange a viewing in Dubai.",
  default: 'One more suggestion: tell me what you did NOT like in the last list and I can send sharper matches.',
};

/**
 * Follow-up agent — short "still interested?" or "want to view?" email, triggered by the
 * pilot when a lead has gone quiet. One template per angle; no AI call needed, so the
 * token budget is untouched.
 */
export async function runFollowUpAgent(task: AgentTask): Promise<AgentRunResult> {
  if (!task.leadId) return { outcome: 'skipped', reason: 'no leadId' };
  const lead = await prisma.lead.findUnique({ where: { id: task.leadId } });
  if (!lead) return { outcome: 'skipped', reason: 'lead not found' };
  if (!lead.email) return { outcome: 'skipped', reason: 'lead has no email address' };
  if (lead.automationPaused) return { outcome: 'skipped', reason: 'automation paused on lead' };
  if (lead.unsubscribedAt) return { outcome: 'skipped', reason: 'lead unsubscribed' };

  const guards = [await workingHoursGate(), await dailySendCapGuard(), await perLeadEmailGuard(lead.id)];
  for (const g of guards) {
    if ('reschedule' in g) return { outcome: 'reschedule', runAfter: g.reschedule, reason: g.reason };
    if ('skip' in g) return { outcome: 'skipped', reason: g.skip };
  }

  const angle = ANGLES[task.type] ?? ANGLES.default!;
  const email = followUpEmail({ id: lead.id, fullName: lead.fullName, number: lead.number }, angle, responseLinksFor(lead));
  const result = await sendEmail({
    to: lead.email,
    subject: email.subject,
    html: email.html,
    replyTo: replyAddressFor(lead.number),
    headers: { 'X-Leadstrellis-Lead': `L-${lead.number}`, 'X-Leadstrellis-Agent': 'FOLLOW_UP' },
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
    data: { lastContactedAt: new Date(), contactAttempts: { increment: 1 } },
  });

  await logActivity({
    leadId: lead.id,
    actorType: 'AI',
    type: 'agent.follow_up',
    title: 'Follow-up agent nudged the lead',
    detail: `Angle: ${task.type}, provider=${result.provider}, sent=${result.sent}`,
  });

  return { outcome: 'done', detail: `angle=${task.type}, provider=${result.provider}, sent=${result.sent}` };
}

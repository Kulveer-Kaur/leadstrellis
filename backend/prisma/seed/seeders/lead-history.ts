import { toLeadProfile, toListingView } from '../../../src/ai/context/ai-context.js';
import { composeWithTemplate } from '../../../src/ai/fallbacks/message-templates.js';
import { primaryChannel } from '../../../src/automation/channel-selector.js';
import type { Lead } from '../../../src/generated/prisma/client.js';
import { prisma } from '../../../src/lib/prisma.js';
import { getTopMatches } from '../../../src/modules/matching/matching.service.js';
import { addDays, formatDubai } from '../../../src/utils/dates.js';
import type { SeedStage } from '../data/seed-leads.data.js';
import type { createRandom } from '../utils/random.js';

type Random = ReturnType<typeof createRandom>;
const minutesAfter = (d: Date, m: number) => new Date(d.getTime() + m * 60_000);
const CONTACTED_OR_LATER: SeedStage[] = ['CONTACTED', 'VIEWING', 'CLOSED_WON', 'NURTURE'];

/** Writes the messages, calls, viewings and tasks a lead at `stage` would realistically have. */
export async function writeHistory(lead: Lead, stage: SeedStage, rnd: Random) {
  if (!CONTACTED_OR_LATER.includes(stage)) return;
  const full = await prisma.lead.findUniqueOrThrow({ where: { id: lead.id }, include: { requirement: true, assignedTo: true } });
  const matches = await getTopMatches(lead.id);
  const profile = toLeadProfile(full);
  const agentName = full.assignedTo?.name.split(' ')[0] ?? 'Sara';
  const channel = primaryChannel(full);
  const sentAt = minutesAfter(lead.createdAt, rnd.int(2, 6));

  if (channel) {
    const draft = composeWithTemplate(channel, 'INTRO', profile, matches.map((m) => toListingView(m.property, m.aiReason)), [], agentName);
    await prisma.message.create({
      data: { leadId: lead.id, channel, direction: 'OUT', subject: draft.subject, body: draft.body, status: 'DELIVERED', provider: `mock-${channel.toLowerCase()}`, aiGenerated: true, createdAt: sentAt },
    });
    await prisma.leadPropertyMatch.updateMany({ where: { leadId: lead.id, finalRank: { not: null } }, data: { sentAt } });
    await log(lead.id, 'message.sent', `${matches.length} matches sent on ${channel === 'WHATSAPP' ? 'WhatsApp' : channel.toLowerCase()}`, `${lead.fullName} · ${draft.body.slice(0, 80)}…`, sentAt);
  }
  await prisma.lead.update({ where: { id: lead.id }, data: { contactAttempts: 1, lastContactedAt: sentAt } });

  if (stage === 'CONTACTED') {
    if (rnd.chance(0.4)) {
      const replyAt = minutesAfter(sentAt, rnd.int(20, 300));
      await prisma.message.create({ data: { leadId: lead.id, channel: channel ?? 'WHATSAPP', direction: 'IN', body: rnd.pick(['Thanks, the first one looks interesting. Can you share the floor plan?', 'Can we do a call tomorrow?', 'Is the price negotiable?']), status: 'RECEIVED', createdAt: replyAt } });
      await prisma.lead.update({ where: { id: lead.id }, data: { lastInboundAt: replyAt } });
    }
    if (rnd.chance(0.35)) await prisma.task.create({ data: { leadId: lead.id, type: 'FOLLOW_UP', dueAt: addDays(new Date(), rnd.int(1, 10)), note: 'Not ready yet; check in' } });
    return;
  }

  // VIEWING, CLOSED_WON, NURTURE all had an AI call.
  const interested = stage !== 'NURTURE';
  const callStart = minutesAfter(sentAt, rnd.int(3, 15));
  const best = matches[0]?.property;
  const lines: [ 'AI' | 'LEAD', string ][] = interested
    ? [
        ['AI', `Hi ${profile.firstName}, this is Layla, LeadsTrellis's AI assistant, calling about your property enquiry. Is now a good time?`],
        ['LEAD', 'Yes, go ahead.'],
        ['AI', best ? `I have ${best.title} in ${best.community} that fits your brief. Would you like to view it?` : 'I have a few options that fit your brief. Would you like to view them?'],
        ['LEAD', 'Yes please, the morning works better for me.'],
        ['AI', `Perfect, it is booked. ${agentName} will send you a WhatsApp confirmation shortly. Thank you!`],
      ]
    : [
        ['AI', `Hi ${profile.firstName}, this is Layla, LeadsTrellis's AI assistant, calling about your enquiry. Is now a good time?`],
        ['LEAD', 'Honestly I am just looking for now, not buying this year.'],
        ['AI', 'No problem at all. Would you like occasional market updates for your area?'],
        ['LEAD', 'Sure, once a month is fine.'],
        ['AI', 'Lovely, I will send those. Thank you for your time!'],
      ];
  const durationSec = rnd.int(95, 260);
  const call = await prisma.call.create({
    data: {
      leadId: lead.id,
      mode: 'SIMULATED',
      status: 'COMPLETED',
      toNumber: lead.phone,
      startedAt: callStart,
      endedAt: new Date(callStart.getTime() + durationSec * 1000),
      durationSec,
      outcome: interested ? 'INTERESTED' : 'NOT_INTERESTED',
      summary: interested ? `${profile.firstName} confirmed the brief and agreed to a morning viewing${best ? ` of ${best.title}` : ''}.` : `${profile.firstName} is only browsing and not buying this year; agreed to monthly market updates.`,
      finalizedAt: new Date(callStart.getTime() + durationSec * 1000),
      createdAt: callStart,
      turns: { create: lines.map(([speaker, text], order) => ({ speaker, text, order, createdAt: new Date(callStart.getTime() + order * 20_000) })) },
    },
  });
  await log(lead.id, 'call.completed', `AI call completed (${Math.floor(durationSec / 60)}m ${durationSec % 60}s)`, `${lead.fullName} · ${interested ? 'interested' : 'not interested'}`, call.endedAt!);
  await prisma.lead.update({ where: { id: lead.id }, data: { contactAttempts: 2, lastContactedAt: callStart } });

  if (stage === 'NURTURE') {
    await prisma.task.create({ data: { leadId: lead.id, type: 'NURTURE', dueAt: addDays(new Date(), rnd.int(3, 28)), note: 'Monthly market update' } });
    return;
  }
  if (!best) return;
  const upcoming = stage === 'VIEWING';
  const scheduledAt = upcoming ? new Date(Date.now() + rnd.int(2, 60) * 3_600_000) : addDays(lead.createdAt, rnd.int(2, 6));
  await prisma.viewing.create({
    data: {
      leadId: lead.id,
      propertyId: best.id,
      agentId: lead.assignedToId,
      scheduledAt,
      status: upcoming ? (rnd.chance(0.5) ? 'CONFIRMED' : 'SCHEDULED') : 'COMPLETED',
      bookedBy: rnd.chance(0.8) ? 'AI' : 'USER',
      notes: 'Booked by the AI call agent',
      createdAt: call.endedAt!,
    },
  });
  await log(lead.id, 'viewing.booked', 'Viewing booked automatically', `${best.title}, ${best.community} · ${formatDubai(scheduledAt)}`, minutesAfter(call.endedAt!, 1));
}

async function log(leadId: string, type: string, title: string, detail: string, createdAt: Date) {
  await prisma.activityLog.create({ data: { leadId, actorType: 'AI', type, title, detail, createdAt } });
}

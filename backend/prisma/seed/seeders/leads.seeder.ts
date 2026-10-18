import { extractWithRules } from '../../../src/ai/fallbacks/keyword-extractor.js';
import { prisma } from '../../../src/lib/prisma.js';
import { scoreLead } from '../../../src/modules/leads/lead-scoring.service.js';
import { saveExtractedRequirement } from '../../../src/modules/leads/requirement.service.js';
import { refreshMatches } from '../../../src/modules/matching/matching.service.js';
import { normalizePhone } from '../../../src/utils/phone.js';
import { SEED_LEADS } from '../data/seed-leads.data.js';
import { createRandom } from '../utils/random.js';
import { writeHistory } from './lead-history.js';

const CHANNEL = { WHATSAPP: 'WHATSAPP', INSTAGRAM: 'INSTAGRAM', EMAIL: 'EMAIL' } as const;

export async function seedLeads() {
  const rnd = createRandom(42);
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const agents = await prisma.user.findMany({ where: { role: 'AGENT' }, orderBy: { name: 'asc' } });
  const ordered = [...SEED_LEADS].sort((a, b) => b.daysAgo - a.daysAgo); // oldest first → ascending L-numbers
  let pending = 0;

  for (const [i, s] of ordered.entries()) {
    const createdAt = new Date(Date.now() - s.daysAgo * 86_400_000);
    const channel = CHANNEL[s.source as keyof typeof CHANNEL];
    const assignedToId = agents.length ? agents[i % agents.length]!.id : (admin?.id ?? null);
    const lead = await prisma.lead.create({
      data: {
        fullName: s.fullName,
        phone: normalizePhone(s.phone),
        email: s.email,
        instagramHandle: s.instagramHandle,
        source: s.source,
        rawMessage: s.message,
        preferredChannel: channel,
        assignedToId,
        processingState: s.stage === 'PENDING' ? 'PENDING' : 'DONE',
        createdAt,
        ...(channel ? { messages: { create: { channel, direction: 'IN', body: s.message, status: 'RECEIVED', createdAt } } } : {}),
      },
    });
    await prisma.activityLog.create({ data: { leadId: lead.id, actorType: 'SYSTEM', type: 'lead.captured', title: `Lead captured from ${s.source === 'WHATSAPP' ? 'WhatsApp' : s.source.toLowerCase()}`, detail: `${s.fullName} · ${s.message.slice(0, 90)}`, createdAt } });

    if (s.stage === 'PENDING') {
      pending++;
      continue;
    }

    // Same pipeline the server runs, with the rule-based "AI" (mock mode) so seeding is free and repeatable.
    const understood = extractWithRules(s.message);
    await saveExtractedRequirement(lead.id, understood, 'RULES');
    await prisma.lead.update({ where: { id: lead.id }, data: { language: understood.language } });
    await scoreLead(lead.id, { score: understood.intent.score, reasoning: understood.intent.reasoning });
    await refreshMatches(lead.id);
    await prisma.lead.update({ where: { id: lead.id }, data: { status: s.stage } });
    await writeHistory(lead, s.stage, rnd);

    // Pipeline steps above logged "now"; move them to just after the lead arrived.
    const recent = await prisma.activityLog.findMany({ where: { leadId: lead.id, createdAt: { gte: new Date(Date.now() - 120_000) } }, orderBy: { createdAt: 'asc' } });
    for (const [n, a] of recent.entries()) await prisma.activityLog.update({ where: { id: a.id }, data: { createdAt: new Date(createdAt.getTime() + (n + 1) * 45_000) } });
    await prisma.leadScore.updateMany({ where: { leadId: lead.id }, data: { createdAt: new Date(createdAt.getTime() + 60_000) } });
  }
  return { total: ordered.length, pending };
}

import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';

/** Plain-text preview: HTML emails lose their markup, whitespace collapses. */
const toPreview = (body: string) =>
  body
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);

/** How many recent messages to scan when building the inbox (one row per lead). */
const SCAN_LIMIT = 1000;

/**
 * Inbox list: one row per lead that has messages, newest conversation first, with the
 * last message and whether the lead's latest reply is still unanswered.
 */
export async function listConversations(opts: { search?: string; limit: number }) {
  const where: Prisma.MessageWhereInput = opts.search
    ? {
        lead: {
          OR: [
            { fullName: { contains: opts.search, mode: 'insensitive' } },
            { email: { contains: opts.search, mode: 'insensitive' } },
            { phone: { contains: opts.search } },
          ],
        },
      }
    : {};
  const rows = await prisma.message.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: SCAN_LIMIT,
    include: {
      lead: { select: { id: true, number: true, fullName: true, status: true, intentLevel: true, lastInboundAt: true, lastContactedAt: true } },
    },
  });

  const seen = new Map<string, (typeof rows)[number] & { count: number }>();
  for (const m of rows) {
    const hit = seen.get(m.leadId);
    if (hit) hit.count += 1;
    else seen.set(m.leadId, { ...m, count: 1 });
  }

  return [...seen.values()].slice(0, opts.limit).map((m) => ({
    leadId: m.lead.id,
    code: `L-${m.lead.number}`,
    fullName: m.lead.fullName,
    status: m.lead.status,
    intent: m.lead.intentLevel ?? 'LOW',
    messageCount: m.count,
    awaitingReply: m.direction === 'IN',
    last: {
      id: m.id,
      channel: m.channel,
      direction: m.direction,
      subject: m.subject,
      preview: toPreview(m.body),
      aiGenerated: m.aiGenerated,
      createdAt: m.createdAt.toISOString(),
    },
  }));
}

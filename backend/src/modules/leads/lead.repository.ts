import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { toSkipTake } from '../../utils/pagination.js';
import type { ListLeadsQuery } from './lead.validation.js';

/** Relations needed to render a lead row (including its next action). */
export const leadSummaryInclude = {
  requirement: true,
  assignedTo: { select: { id: true, name: true } },
  viewings: { where: { status: { in: ['SCHEDULED', 'CONFIRMED'] }, scheduledAt: { gte: new Date() } }, orderBy: { scheduledAt: 'asc' }, take: 1 },
  tasks: { where: { status: 'PENDING' }, orderBy: { dueAt: 'asc' }, take: 1 },
  calls: { where: { status: { in: ['QUEUED', 'RINGING', 'IN_PROGRESS'] } }, take: 1 },
} satisfies Prisma.LeadInclude;

export type LeadWithSummary = Prisma.LeadGetPayload<{ include: typeof leadSummaryInclude }>;

function buildWhere(q: ListLeadsQuery, user?: { id: string; role: string }): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {
    status: q.status ? { in: q.status } : undefined,
    intentLevel: q.intent ? { in: q.intent } : undefined,
    source: q.source ? { in: q.source } : undefined,
    assignedToId: user?.role === 'AGENT' ? user.id : q.assignedToId,
    requirement: q.emirate ? { emirate: q.emirate } : undefined,
  };
  if (q.view === 'hot') where.intentLevel = 'HIGH';
  if (q.view === 'action') where.OR = [{ status: { in: ['NEW', 'NURTURE'] } }, { processingState: 'FAILED' }];
  if (q.search) {
    const s = q.search;
    where.AND = [
      {
        OR: [
          { fullName: { contains: s, mode: 'insensitive' } },
          { email: { contains: s, mode: 'insensitive' } },
          { phone: { contains: s } },
          { requirement: { communities: { has: s } } },
          ...(/^L-?\d+$/i.test(s) ? [{ number: Number(s.replace(/\D/g, '')) }] : []),
        ],
      },
    ];
  }
  return where;
}

export async function findLeads(q: ListLeadsQuery, user?: { id: string; role: string }) {
  const where = buildWhere(q, user);
  const [field, dir] = q.sort.startsWith('-') ? [q.sort.slice(1), 'desc' as const] : [q.sort, 'asc' as const];
  const [rows, total] = await prisma.$transaction([
    prisma.lead.findMany({
      where,
      include: leadSummaryInclude,
      orderBy: field === 'score' ? [{ score: { sort: dir, nulls: 'last' } }, { createdAt: 'desc' }] : { createdAt: dir },
      ...toSkipTake(q.page, q.pageSize),
    }),
    prisma.lead.count({ where }),
  ]);
  return { rows, total };
}

export const findLeadDetail = (id: string) =>
  prisma.lead.findUnique({
    where: { id },
    include: {
      ...leadSummaryInclude,
      scores: { orderBy: { createdAt: 'desc' }, take: 5 },
      matches: { where: { finalRank: { not: null } }, orderBy: { finalRank: 'asc' }, include: { property: true } },
      messages: { orderBy: { createdAt: 'asc' } },
      calls: { orderBy: { createdAt: 'desc' }, include: { turns: { orderBy: { order: 'asc' } } } },
      viewings: { orderBy: { scheduledAt: 'desc' }, include: { property: { select: { id: true, title: true, community: true, refCode: true } } } },
      tasks: { orderBy: { dueAt: 'asc' } },
    },
  });

/** Finds an existing lead by any contact handle (used for de-duplication at intake). */
export function findByContact(c: { phone?: string; email?: string; instagramHandle?: string }) {
  const or: Prisma.LeadWhereInput[] = [];
  if (c.phone) or.push({ phone: c.phone });
  if (c.email) or.push({ email: { equals: c.email, mode: 'insensitive' } });
  if (c.instagramHandle) or.push({ instagramHandle: { equals: c.instagramHandle, mode: 'insensitive' } });
  return or.length ? prisma.lead.findFirst({ where: { OR: or }, orderBy: { createdAt: 'desc' } }) : null;
}

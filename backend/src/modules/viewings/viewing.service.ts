import type { ActorType, ViewingStatus } from '../../generated/prisma/enums.js';
import { emitSocket } from '../../lib/socket.js';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { formatDubai } from '../../utils/dates.js';
import { logActivity } from '../activity/activity.service.js';
import { advanceIfIn } from '../pipeline/pipeline.service.js';

export interface CreateViewingInput {
  leadId: string;
  propertyId: string;
  scheduledAt: Date;
  bookedBy: ActorType;
  agentId?: string | null;
  notes?: string;
}

export async function createViewing(input: CreateViewingInput) {
  const lead = await prisma.lead.findUnique({ where: { id: input.leadId }, select: { fullName: true, assignedToId: true } });
  if (!lead) throw ApiError.notFound('Lead');
  const viewing = await prisma.viewing.create({
    data: { ...input, agentId: input.agentId ?? lead.assignedToId },
    include: { property: { select: { title: true, community: true } } },
  });
  await advanceIfIn(input.leadId, ['NEW', 'QUALIFIED', 'CONTACTED', 'ENGAGED', 'NURTURE'], 'VIEWING', input.bookedBy, 'Viewing booked');
  await logActivity({
    leadId: input.leadId,
    actorType: input.bookedBy,
    type: 'viewing.booked',
    title: input.bookedBy === 'AI' ? 'Viewing booked automatically' : 'Viewing booked',
    detail: `${viewing.property.title}, ${viewing.property.community} · ${formatDubai(viewing.scheduledAt)}`,
    payload: { viewingId: viewing.id },
  });
  emitSocket('viewing:created', { viewingId: viewing.id, leadId: input.leadId });
  return viewing;
}

export function listViewings(opts: { upcoming?: boolean; hours?: number; leadId?: string }) {
  const now = new Date();
  return prisma.viewing.findMany({
    where: {
      leadId: opts.leadId,
      ...(opts.upcoming
        ? { status: { in: ['SCHEDULED', 'CONFIRMED'] }, scheduledAt: { gte: now, ...(opts.hours ? { lte: new Date(now.getTime() + opts.hours * 3_600_000) } : {}) } }
        : {}),
    },
    orderBy: { scheduledAt: opts.upcoming ? 'asc' : 'desc' },
    take: 100,
    include: {
      lead: { select: { id: true, fullName: true } },
      property: { select: { id: true, title: true, community: true, refCode: true } },
      agent: { select: { id: true, name: true } },
    },
  });
}

export async function updateViewing(id: string, data: { status?: ViewingStatus; scheduledAt?: Date; notes?: string }) {
  const viewing = await prisma.viewing.update({ where: { id }, data });
  if (data.status) {
    await logActivity({ leadId: viewing.leadId, actorType: 'USER', type: 'viewing.updated', title: `Viewing ${data.status.toLowerCase().replace('_', ' ')}` });
  }
  return viewing;
}

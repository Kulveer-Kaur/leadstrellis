import type { Prisma } from '../../generated/prisma/client.js';
import type { ActorType } from '../../generated/prisma/enums.js';
import { emitSocket } from '../../lib/socket.js';
import { prisma } from '../../lib/prisma.js';

export interface ActivityInput {
  leadId?: string | null;
  actorType: ActorType;
  type: string;
  title: string;
  detail?: string;
  payload?: Prisma.InputJsonValue;
}

/** Writes one timeline entry and pushes it to connected dashboards. */
export async function logActivity(input: ActivityInput) {
  const row = await prisma.activityLog.create({ data: { ...input, leadId: input.leadId ?? null } });
  emitSocket('activity:created', row);
  return row;
}

export const listActivity = (opts: { leadId?: string; actorType?: ActorType; limit: number }) =>
  prisma.activityLog.findMany({
    where: { leadId: opts.leadId, actorType: opts.actorType },
    orderBy: { createdAt: 'desc' },
    take: opts.limit,
    include: { lead: { select: { id: true, fullName: true, number: true } } },
  });

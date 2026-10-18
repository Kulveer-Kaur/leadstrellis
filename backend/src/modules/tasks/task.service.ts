import type { TaskStatus, TaskType } from '../../generated/prisma/enums.js';
import { prisma } from '../../lib/prisma.js';
import { formatDubai } from '../../utils/dates.js';
import { logActivity } from '../activity/activity.service.js';

export async function createTask(leadId: string, type: TaskType, dueAt: Date, note?: string) {
  // One pending task per type per lead: replace rather than stack follow-ups.
  await prisma.task.updateMany({ where: { leadId, type, status: 'PENDING' }, data: { status: 'CANCELLED' } });
  const task = await prisma.task.create({ data: { leadId, type, dueAt, note } });
  await logActivity({
    leadId,
    actorType: 'AI',
    type: 'task.scheduled',
    title: type === 'NURTURE' ? 'Market update scheduled' : type === 'CALLBACK' ? 'Call back scheduled' : 'Follow-up scheduled',
    detail: `${formatDubai(dueAt)}${note ? ` · ${note}` : ''}`,
  });
  return task;
}

export const listTasks = (opts: { status?: TaskStatus; leadId?: string }) =>
  prisma.task.findMany({
    where: { status: opts.status, leadId: opts.leadId },
    orderBy: { dueAt: 'asc' },
    take: 100,
    include: { lead: { select: { id: true, fullName: true } } },
  });

export const updateTask = (id: string, data: { status?: TaskStatus; dueAt?: Date; note?: string }) =>
  prisma.task.update({ where: { id }, data: { ...data, completedAt: data.status === 'DONE' ? new Date() : undefined } });

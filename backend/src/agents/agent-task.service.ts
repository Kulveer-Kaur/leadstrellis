import type { AgentType } from '../generated/prisma/enums.js';
import { prisma } from '../lib/prisma.js';

/**
 * Postgres-backed queue for the Phase-2 agents. The runner polls PENDING rows whose
 * runAfter has passed, claims one with a conditional update, and hands it to the
 * matching agent. Keeping the queue in Postgres means pending work survives restarts.
 */
export interface EnqueueInput {
  agent: AgentType;
  type: string;
  leadId?: string | null;
  runAfter?: Date;
  payload?: unknown;
  maxAttempts?: number;
}

export function enqueueAgentTask(input: EnqueueInput) {
  return prisma.agentTask.create({
    data: {
      agent: input.agent,
      type: input.type,
      leadId: input.leadId ?? null,
      runAfter: input.runAfter ?? new Date(),
      payload: input.payload as never,
      maxAttempts: input.maxAttempts ?? 3,
    },
  });
}

/** Atomically claim one due task (PENDING + runAfter <= now). Returns null if nothing's ready. */
export async function claimNextTask(filterAgents?: AgentType[]) {
  const where = {
    status: 'PENDING' as const,
    runAfter: { lte: new Date() },
    ...(filterAgents?.length ? { agent: { in: filterAgents } } : {}),
  };
  const next = await prisma.agentTask.findFirst({ where, orderBy: { runAfter: 'asc' } });
  if (!next) return null;

  const claim = await prisma.agentTask.updateMany({
    where: { id: next.id, status: 'PENDING' },
    data: { status: 'RUNNING', startedAt: new Date(), attempts: { increment: 1 } },
  });
  if (!claim.count) return null;
  return prisma.agentTask.findUniqueOrThrow({ where: { id: next.id } });
}

export function markTaskDone(id: string, result?: unknown) {
  return prisma.agentTask.update({
    where: { id },
    data: { status: 'DONE', finishedAt: new Date(), result: (result ?? null) as never },
  });
}

export async function markTaskFailed(id: string, error: string, maxAttempts: number, attempts: number) {
  const finalFail = attempts >= maxAttempts;
  // Exponential backoff: 1m, 2m, 4m.
  const retryIn = Math.min(60_000 * 2 ** (attempts - 1), 15 * 60_000);
  return prisma.agentTask.update({
    where: { id },
    data: finalFail
      ? { status: 'FAILED', finishedAt: new Date(), error }
      : { status: 'PENDING', runAfter: new Date(Date.now() + retryIn), error },
  });
}

import type { AgentTask } from '../generated/prisma/client.js';
import { AgentType } from '../generated/prisma/enums.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { isAgentActive } from '../modules/settings/settings.service.js';
import { claimNextTask, markTaskDone, markTaskFailed } from './agent-task.service.js';
import { runDealAgent } from './runners/deal.agent.js';
import { runFollowUpAgent } from './runners/follow-up.agent.js';
import { runInboxAgent } from './runners/inbox.agent.js';
import { runMatchmakerAgent } from './runners/matchmaker.agent.js';
import { runOutreachAgent } from './runners/outreach.agent.js';
import type { AgentRunResult } from './runners/types.js';

const MAX_BATCH = 5;

type Runner = (task: AgentTask) => Promise<AgentRunResult>;
const RUNNERS: Partial<Record<AgentType, Runner>> = {
  [AgentType.OUTREACH]: runOutreachAgent,
  [AgentType.FOLLOW_UP]: runFollowUpAgent,
  [AgentType.DEAL]: runDealAgent,
  [AgentType.MATCHMAKER]: runMatchmakerAgent,
  [AgentType.INBOX]: runInboxAgent,
};

let running = false;
let rerun = false;

/** Runs a tick right away (used when the AI route queues work), never two at once. */
export function runAgentTickSoon() {
  if (running) {
    rerun = true;
    return;
  }
  setTimeout(() => void runAgentTickGuarded(), 100);
}

/** Single-flight wrapper used by the scheduler and by runAgentTickSoon. */
export async function runAgentTickGuarded() {
  if (running) {
    rerun = true;
    return null;
  }
  running = true;
  try {
    let stats = await runAgentTick();
    while (rerun) {
      rerun = false;
      const more = await runAgentTick();
      stats = { processed: stats.processed + more.processed, done: stats.done + more.done, skipped: stats.skipped + more.skipped, rescheduled: stats.rescheduled + more.rescheduled, failed: stats.failed + more.failed };
    }
    if (stats.processed) logger.info({ agents: stats }, 'agent runner tick');
    return stats;
  } catch (err) {
    logger.error({ err }, 'agent runner tick failed');
    return null;
  } finally {
    running = false;
  }
}

/**
 * Claims up to MAX_BATCH ready AgentTasks per tick and dispatches each to its runner.
 * The claim is atomic (status PENDING → RUNNING, attempts += 1), so two scheduler
 * ticks never run the same task. Agents without a wired-up runner get their tasks
 * marked SKIPPED so they don't jam the queue.
 */
export async function runAgentTick(): Promise<{ processed: number; done: number; skipped: number; rescheduled: number; failed: number }> {
  const stats = { processed: 0, done: 0, skipped: 0, rescheduled: 0, failed: 0 };
  for (let i = 0; i < MAX_BATCH; i++) {
    const task = await claimNextTask();
    if (!task) break;
    stats.processed += 1;

    try {
      if (!(await isAgentActive(task.agent))) {
        await markTaskDone(task.id, { outcome: 'skipped', reason: 'agent switched off' });
        stats.skipped += 1;
        continue;
      }

      const runner = RUNNERS[task.agent];
      if (!runner) {
        await markTaskDone(task.id, { outcome: 'skipped', reason: `no runner wired for ${task.agent}` });
        stats.skipped += 1;
        continue;
      }

      const result = await runner(task);
      if (result.outcome === 'done') {
        await markTaskDone(task.id, result);
        await bumpAgentCounter(task.agent);
        stats.done += 1;
      } else if (result.outcome === 'skipped') {
        await markTaskDone(task.id, result);
        stats.skipped += 1;
      } else if (result.outcome === 'reschedule') {
        await prisma.agentTask.update({
          where: { id: task.id },
          data: { status: 'PENDING', runAfter: result.runAfter, error: result.reason },
        });
        stats.rescheduled += 1;
      } else {
        await markTaskFailed(task.id, result.error, task.maxAttempts, task.attempts);
        stats.failed += 1;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err, taskId: task.id, agent: task.agent }, 'agent runner threw');
      await markTaskFailed(task.id, message, task.maxAttempts, task.attempts);
      stats.failed += 1;
      // A route step that has run out of retries must not leave the lead looking "in progress".
      if (task.leadId && task.type.startsWith('ai_route') && task.attempts >= task.maxAttempts) {
        await prisma.lead.update({ where: { id: task.leadId }, data: { aiRouteStep: 'NEEDS_ATTENTION', aiRouteNote: `${task.agent.toLowerCase()} step failed: ${message.slice(0, 200)}` } });
      }
    }
  }
  return stats;
}

async function bumpAgentCounter(agent: AgentType) {
  await prisma.agentSetting.upsert({
    where: { agent },
    create: { agent, isActive: true, lastRunAt: new Date(), tasksDoneToday: 1 },
    update: { lastRunAt: new Date(), tasksDoneToday: { increment: 1 } },
  });
}

import { runPilotTick } from '../agents/pilot/pilot.agent.js';
import { runAgentTickGuarded } from '../agents/runner-loop.js';
import { env } from '../config/env.js';
import { imapReady, pollInbox, startInboxWatcher, stopInboxWatcher } from '../integrations/email/inbox-reader.js';
import { voiceConfig } from '../config/voice.config.js';
import { finalizeCall } from '../modules/calls/call-finalizer.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';

/**
 * Background loops:
 *  - every SCHEDULER_INTERVAL_SECONDS: run due AgentTasks (match → proposal → reply handling)
 *  - email replies: an IMAP IDLE connection pushes them in as they arrive; every
 *    IMAP_POLL_SECONDS a backup check runs only while that connection is down
 *  - every 10 minutes: the pilot sweep (only when switched on in Settings)
 */
let timer: NodeJS.Timeout | undefined;
let pilotTimer: NodeJS.Timeout | undefined;
let inboxTimer: NodeJS.Timeout | undefined;
let busy = false;

const PILOT_INTERVAL_MS = 10 * 60 * 1000;

export function startScheduler() {
  timer = setInterval(() => void tick(), env.SCHEDULER_INTERVAL_SECONDS * 1000);
  pilotTimer = setInterval(() => void runPilotTick().catch((err) => logger.error({ err }, 'pilot tick failed')), PILOT_INTERVAL_MS);
  if (imapReady()) {
    void startInboxWatcher();
    inboxTimer = setInterval(() => void pollInbox(), env.IMAP_POLL_SECONDS * 1000);
  } else {
    logger.warn('IMAP not configured: email replies will not be read automatically (use "Add lead reply" on the lead page)');
  }
  logger.info({ everySeconds: env.SCHEDULER_INTERVAL_SECONDS, pilotEveryMinutes: 10, inboxEverySeconds: imapReady() ? env.IMAP_POLL_SECONDS : null }, 'scheduler started');
}

export const stopScheduler = () => {
  clearInterval(timer);
  clearInterval(pilotTimer);
  clearInterval(inboxTimer);
  void stopInboxWatcher();
};

async function tick() {
  if (busy) return;
  busy = true;
  try {
    await expireIdleCalls();
    await runAgentTickGuarded();
  } catch (err) {
    logger.error({ err }, 'scheduler tick failed');
  } finally {
    busy = false;
  }
}

/** Calls are switched off in the UI, but any left open from earlier are closed so they don't linger. */
async function expireIdleCalls() {
  const now = Date.now();
  const open = await prisma.call.findMany({
    where: { finalizedAt: null, status: { in: ['QUEUED', 'RINGING', 'IN_PROGRESS'] } },
    include: { turns: { orderBy: { order: 'desc' }, take: 1 } },
    take: 20,
  });
  for (const call of open) {
    const lastActivity = (call.turns[0]?.createdAt ?? call.createdAt).getTime();
    const limitMin = call.mode === 'SIMULATED' ? voiceConfig.simulatedIdleMinutes : voiceConfig.twilioStaleMinutes;
    if (now - lastActivity < limitMin * 60_000) continue;
    const answered = await prisma.callTranscriptTurn.count({ where: { callId: call.id, speaker: 'LEAD' } });
    await finalizeCall(call.id, answered ? 'COMPLETED' : 'NO_ANSWER');
  }
}

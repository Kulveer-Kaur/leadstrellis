import { AgentType } from '../../generated/prisma/enums.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { getSettings, isAgentActive } from '../../modules/settings/settings.service.js';
import { addHours } from '../../utils/dates.js';
import { enqueueAgentTask } from '../agent-task.service.js';

/**
 * EstatePilot — the "pilot" agent. Every 10 minutes it walks the pipeline the way an
 * admin would and queues tasks for the other agents. It uses pure rule-based checks
 * (no AI calls here) so leaving it switched on costs essentially zero tokens.
 *
 * It only looks at leads whose AI route is switched on; the route itself sends the
 * first proposal, so the pilot handles what comes after it.
 *
 * Checks:
 *   - Leads stuck in CONTACTED > 48h with no reply          → Follow-up
 *   - Leads in ENGAGED > 72h with no viewing booked         → Follow-up / Deal nudge
 *   - Viewings completed > 24h ago with no proposal yet     → Deal
 *   - Leads in NEGOTIATION with no reply > 72h              → Deal nudge
 */
export async function runPilotTick() {
  if (!(await isAgentActive(AgentType.PILOT))) {
    logger.debug('pilot: inactive, skipping tick');
    return { skipped: 'inactive' as const };
  }
  const settings = await getSettings();
  if (!settings.pilotEnabled) {
    logger.debug('pilot: disabled via settings, skipping tick');
    return { skipped: 'disabled' as const };
  }

  const now = new Date();
  const fortyEightHoursAgo = addHours(now, -48);
  const seventyTwoHoursAgo = addHours(now, -72);
  const oneDayAgo = addHours(now, -24);

  const [stuckContactedRaw, engagedNoViewing, viewingsNoProposal] = await Promise.all([
    prisma.lead.findMany({
      where: {
        automationPaused: false,
        aiRouteEnabled: true,
        unsubscribedAt: null,
        status: 'CONTACTED',
        lastContactedAt: { lte: fortyEightHoursAgo },
      },
      select: { id: true, lastContactedAt: true, lastInboundAt: true },
      take: 40,
    }),
    prisma.lead.findMany({
      where: {
        automationPaused: false,
        aiRouteEnabled: true,
        unsubscribedAt: null,
        status: 'ENGAGED',
        lastInboundAt: { lte: seventyTwoHoursAgo },
        viewings: { none: {} },
      },
      select: { id: true },
      take: 20,
    }),
    prisma.lead.findMany({
      where: {
        automationPaused: false,
        aiRouteEnabled: true,
        unsubscribedAt: null,
        status: 'VIEWING',
        viewings: { some: { status: 'COMPLETED', scheduledAt: { lte: oneDayAgo } } },
      },
      select: { id: true },
      take: 20,
    }),
  ]);

  // In Postgres, "they haven't replied" = inbound either null or older than our last contact.
  const stuckContacted = stuckContactedRaw.filter(
    (l) => !l.lastInboundAt || (l.lastContactedAt && l.lastInboundAt < l.lastContactedAt),
  );

  const queued = {
    outreach: 0,
    followUp: 0,
    deal: 0,
  };

  for (const l of stuckContacted) {
    await enqueuePilotChild(AgentType.FOLLOW_UP, 'nudge_no_reply', l.id);
    queued.followUp += 1;
  }
  for (const l of engagedNoViewing) {
    await enqueuePilotChild(AgentType.FOLLOW_UP, 'offer_viewing', l.id);
    queued.followUp += 1;
  }
  for (const l of viewingsNoProposal) {
    await enqueuePilotChild(AgentType.DEAL, 'post_viewing_proposal', l.id);
    queued.deal += 1;
  }

  await prisma.agentSetting.upsert({
    where: { agent: AgentType.PILOT },
    create: { agent: AgentType.PILOT, isActive: true, lastRunAt: now, tasksDoneToday: queued.outreach + queued.followUp + queued.deal },
    update: { lastRunAt: now, tasksDoneToday: { increment: queued.outreach + queued.followUp + queued.deal } },
  });

  logger.info({ queued }, 'pilot tick complete');
  return { queued };
}

/** Only enqueue a child task if there isn't already a pending one of the same kind. */
async function enqueuePilotChild(agent: AgentType, type: string, leadId: string) {
  const existing = await prisma.agentTask.findFirst({
    where: { agent, type, leadId, status: { in: ['PENDING', 'RUNNING'] } },
    select: { id: true },
  });
  if (existing) return null;
  return enqueueAgentTask({ agent, type, leadId });
}

import type { LeadStatus } from '../../generated/prisma/enums.js';
import { prisma } from '../../lib/prisma.js';
import { OPEN_STATUSES } from '../pipeline/status-transitions.js';
import { listAgentSettings } from '../settings/settings.service.js';

/**
 * Live "AI agent feed" for the dashboard — the last N finished AgentTasks, with the
 * agent that ran them and the lead they touched. This replaces the manual activity
 * feed on the Phase-2 dashboard.
 */
export async function getAgentFeed(limit = 20) {
  const rows = await prisma.agentTask.findMany({
    // Only real work: tasks an agent skipped (switched off, no email, …) are noise here.
    where: { status: { in: ['DONE', 'FAILED'] }, NOT: { result: { path: ['outcome'], equals: 'skipped' } } },
    orderBy: { finishedAt: 'desc' },
    take: limit,
    include: { lead: { select: { fullName: true, number: true } } },
  });
  return rows.map((r) => {
    const outcome = (r.result as { outcome?: string; detail?: string; reason?: string } | null) ?? {};
    return {
      id: r.id,
      agent: r.agent,
      type: r.type,
      leadId: r.leadId,
      leadLabel: r.lead ? `${r.lead.fullName} · L-${r.lead.number}` : null,
      outcome: outcome.outcome ?? r.status,
      detail: outcome.detail ?? outcome.reason ?? r.error ?? null,
      at: (r.finishedAt ?? r.createdAt).toISOString(),
    };
  });
}

/**
 * Agent-team card: one row per Phase-2 agent with its on/off switch, tasksDoneToday
 * and lastRunAt — straight from AgentSetting, which the runner keeps up to date.
 */
export async function getAgentTeam() {
  const agents = await listAgentSettings();
  return agents.map((a) => ({
    agent: a.agent,
    isActive: a.isActive,
    tasksDoneToday: a.tasksDoneToday,
    lastRunAt: a.lastRunAt ? a.lastRunAt.toISOString() : null,
  }));
}

/**
 * "Likely to win" list for the dashboard: open leads sorted by winProbability (when
 * available) or by score as a fallback, with a one-line reason summary.
 */
export async function getLikelyToWin(limit = 8) {
  const rows = await prisma.lead.findMany({
    where: {
      status: { in: OPEN_STATUSES as LeadStatus[] },
      automationPaused: false,
      unsubscribedAt: null,
    },
    orderBy: [{ winProbability: 'desc' }, { score: 'desc' }],
    take: limit,
    select: {
      id: true,
      number: true,
      fullName: true,
      status: true,
      score: true,
      winProbability: true,
      winReasons: true,
      dealValueAed: true,
      requirement: { select: { budgetMax: true, budgetMin: true } },
    },
  });
  return rows.map((l) => ({
    id: l.id,
    code: `L-${l.number}`,
    fullName: l.fullName,
    status: l.status,
    score: l.score ?? 0,
    winProbability: l.winProbability ?? scoreAsProbability(l.score),
    reason: l.winReasons[0] ?? deriveReason(l),
    dealValueAed: l.dealValueAed ?? l.requirement?.budgetMax ?? l.requirement?.budgetMin ?? null,
  }));
}

/**
 * Revenue forecast = Σ(open deal value × win probability). When no explicit deal value
 * is set yet, we use the lead's budgetMax as a conservative estimate.
 */
export async function getRevenueForecast() {
  const rows = await prisma.lead.findMany({
    where: {
      status: { in: OPEN_STATUSES as LeadStatus[] },
      automationPaused: false,
      unsubscribedAt: null,
    },
    select: {
      dealValueAed: true,
      winProbability: true,
      score: true,
      requirement: { select: { budgetMax: true, budgetMin: true } },
    },
  });
  let expected = 0;
  let openCount = 0;
  for (const l of rows) {
    const value = l.dealValueAed ?? l.requirement?.budgetMax ?? l.requirement?.budgetMin ?? 0;
    const prob = (l.winProbability ?? scoreAsProbability(l.score)) / 100;
    expected += value * prob;
    openCount += 1;
  }
  return {
    expectedAed: Math.round(expected),
    openLeads: openCount,
  };
}

/** Email send/receive totals for the Phase-2 "Email stats" card. */
export async function getEmailStats() {
  const since24h = new Date(Date.now() - 24 * 3_600_000);
  const since7d = new Date(Date.now() - 7 * 24 * 3_600_000);
  const [sent24h, sent7d, replies24h, replies7d] = await Promise.all([
    prisma.message.count({ where: { channel: 'EMAIL', direction: 'OUT', createdAt: { gte: since24h } } }),
    prisma.message.count({ where: { channel: 'EMAIL', direction: 'OUT', createdAt: { gte: since7d } } }),
    prisma.message.count({ where: { channel: 'EMAIL', direction: 'IN', createdAt: { gte: since24h } } }),
    prisma.message.count({ where: { channel: 'EMAIL', direction: 'IN', createdAt: { gte: since7d } } }),
  ]);
  const replyRate = sent7d ? Math.round((replies7d / sent7d) * 100) : 0;
  return { sent24h, sent7d, replies24h, replies7d, replyRate };
}

/**
 * EstatePilot insights for the "next best actions" card. Pure rule-based so it costs
 * nothing to compute; shows the same categories the pilot already looks for.
 */
export async function getPilotInsights() {
  const twoHoursAgo = new Date(Date.now() - 2 * 3_600_000);
  const [hotNotContacted, stuckContacted, viewingsPending, waitingNewListing] = await Promise.all([
    prisma.lead.count({
      where: { status: { in: ['NEW', 'QUALIFIED'] }, score: { gte: 70 }, OR: [{ lastContactedAt: null }, { lastContactedAt: { lte: twoHoursAgo } }] },
    }),
    prisma.lead.count({ where: { status: 'CONTACTED', lastContactedAt: { lte: new Date(Date.now() - 48 * 3_600_000) } } }),
    prisma.viewing.count({ where: { status: { in: ['SCHEDULED', 'CONFIRMED'] }, scheduledAt: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 3_600_000) } } }),
    prisma.lead.count({ where: { status: { in: ['QUALIFIED', 'CONTACTED', 'ENGAGED'] }, matches: { none: {} } } }),
  ]);
  return [
    { key: 'hot-not-contacted', title: 'Hot leads waiting for outreach', count: hotNotContacted, severity: hotNotContacted ? 'high' : 'ok' },
    { key: 'stuck-contacted', title: 'Contacted but no reply over 48h', count: stuckContacted, severity: stuckContacted ? 'medium' : 'ok' },
    { key: 'viewings-pending', title: 'Viewings scheduled this week', count: viewingsPending, severity: 'info' },
    { key: 'no-matches', title: 'Leads with no matches yet', count: waitingNewListing, severity: waitingNewListing ? 'medium' : 'ok' },
  ];
}

function scoreAsProbability(score: number | null | undefined) {
  // Simple preset until the real win-predictor lands (plan §4): score / 100 scaled gently.
  if (!score) return 10;
  return Math.min(95, Math.max(5, Math.round(score * 0.85)));
}

function deriveReason(l: { status: string; score: number | null }) {
  if ((l.score ?? 0) >= 80) return 'High score and clear requirements';
  if (l.status === 'VIEWING' || l.status === 'NEGOTIATION') return 'Already engaged in the funnel';
  return 'Open lead, scored by rules';
}

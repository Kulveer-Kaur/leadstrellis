import { prisma } from '../../lib/prisma.js';
import { AgentType } from '../../generated/prisma/enums.js';

const GLOBAL_ID = 'global';

export type AppSettings = Awaited<ReturnType<typeof getSettings>>;

/**
 * Loads the single AppSetting row, creating defaults on first call. Settings are a
 * key/value store so the admin can flip the pilot or live-feed on/off from the UI
 * without a redeploy. Pilot is OFF by default so the token budget is never spent
 * silently in the background.
 */
export async function getSettings() {
  const row = await prisma.appSetting.upsert({
    where: { id: GLOBAL_ID },
    create: { id: GLOBAL_ID },
    update: {},
  });
  return resetCountersIfStale(row);
}

export async function updateSettings(patch: Partial<{
  pilotEnabled: boolean;
  liveFeedEnabled: boolean;
  workingDays: number[];
  workingHoursStart: number;
  workingHoursEnd: number;
  aiDailyTokenBudget: number;
  emailsPerLeadPerDay: number;
  emailsPerLeadPerWeek: number;
  dailySendCap: number;
}>) {
  await getSettings();
  return prisma.appSetting.update({ where: { id: GLOBAL_ID }, data: patch });
}

export async function listAgentSettings() {
  const result = [] as Awaited<ReturnType<typeof prisma.agentSetting.findMany>>;
  // Serial upsert so two concurrent GET /settings calls don't race on the first row.
  for (const agent of Object.values(AgentType)) {
    // PILOT defaults to OFF so background checks don't spend tokens by surprise.
    const isActive = agent !== AgentType.PILOT;
    const row = await prisma.agentSetting.upsert({
      where: { agent },
      create: { agent, isActive },
      update: {},
    });
    result.push(row);
  }
  return result;
}

export async function setAgentActive(agent: AgentType, isActive: boolean) {
  await listAgentSettings();
  return prisma.agentSetting.update({ where: { agent }, data: { isActive } });
}

export async function isAgentActive(agent: AgentType): Promise<boolean> {
  const row = await prisma.agentSetting.findUnique({ where: { agent } });
  if (row) return row.isActive;
  // PILOT defaults off, all others on.
  return agent !== AgentType.PILOT;
}

async function resetCountersIfStale(row: Awaited<ReturnType<typeof prisma.appSetting.findUniqueOrThrow>>) {
  const now = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const needs: Record<string, unknown> = {};
  if (!sameDay(row.aiBudgetResetAt, now)) {
    needs.aiTokensUsedToday = 0;
    needs.aiBudgetResetAt = now;
  }
  if (!sameDay(row.dailySendResetAt, now)) {
    needs.dailySendCount = 0;
    needs.dailySendResetAt = now;
  }
  if (Object.keys(needs).length === 0) return row;
  return prisma.appSetting.update({ where: { id: GLOBAL_ID }, data: needs });
}

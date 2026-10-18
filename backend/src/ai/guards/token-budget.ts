import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { getSettings } from '../../modules/settings/settings.service.js';

/**
 * Daily token budget guard for the Groq free tier (default 180K / day across all tasks).
 * When the cap is reached, callers must fall back to templates / rules so the service
 * keeps working without burning the quota.
 *
 * Reads and writes AppSetting.aiTokensUsedToday; the daily reset happens in getSettings.
 */
export async function hasTokenBudget(estimatedTokens = 1000): Promise<boolean> {
  const s = await getSettings();
  return s.aiTokensUsedToday + estimatedTokens <= s.aiDailyTokenBudget;
}

export async function recordTokenUsage(inputTokens: number | undefined, outputTokens: number | undefined) {
  const used = (inputTokens ?? 0) + (outputTokens ?? 0);
  if (used <= 0) return;
  try {
    await prisma.appSetting.update({
      where: { id: 'global' },
      data: { aiTokensUsedToday: { increment: used } },
    });
  } catch (err) {
    logger.debug({ err }, 'failed to update ai token usage');
  }
}

export async function getBudgetStatus() {
  const s = await getSettings();
  return {
    used: s.aiTokensUsedToday,
    budget: s.aiDailyTokenBudget,
    remaining: Math.max(0, s.aiDailyTokenBudget - s.aiTokensUsedToday),
    percent: Math.min(100, Math.round((s.aiTokensUsedToday / s.aiDailyTokenBudget) * 100)),
    exhausted: s.aiTokensUsedToday >= s.aiDailyTokenBudget,
    resetAt: s.aiBudgetResetAt,
  };
}

import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import type { RuleKey } from './rule-definitions.js';

/**
 * Runs one automation rule for a lead if it is switched on, and records the run.
 * The action returns a log line, or null when it decided there was nothing to do.
 */
export async function runRule(key: RuleKey, leadId: string | null, action: () => Promise<string | null>) {
  const rule = await prisma.automationRule.findUnique({ where: { key } });
  if (!rule?.isActive) return false;
  try {
    const log = await action();
    if (log === null) return false;
    await prisma.automationRun.create({ data: { ruleId: rule.id, leadId, status: 'SUCCESS', log } });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err, rule: key, leadId }, 'automation rule failed');
    await prisma.automationRun.create({ data: { ruleId: rule.id, leadId, status: 'FAILED', log: message.slice(0, 2000) } });
    return false;
  }
}

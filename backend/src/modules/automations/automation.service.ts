import { prisma } from '../../lib/prisma.js';

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Rules with today's run counts. Shape matches frontend AutomationRuleSummary (plus extras). */
export async function listRules() {
  const rules = await prisma.automationRule.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { runs: { where: { createdAt: { gte: startOfToday() }, status: 'SUCCESS' } } } } },
  });
  return rules.map(({ _count, ...r }) => ({ id: r.id, key: r.key, name: r.name, description: r.description, trigger: r.trigger, active: r.isActive, runsToday: _count.runs }));
}

export const setRuleActive = (id: string, isActive: boolean) => prisma.automationRule.update({ where: { id }, data: { isActive } });

export const listRuns = (opts: { ruleId?: string; leadId?: string; limit: number }) =>
  prisma.automationRun.findMany({
    where: { ruleId: opts.ruleId, leadId: opts.leadId },
    orderBy: { createdAt: 'desc' },
    take: opts.limit,
    include: { rule: { select: { name: true, key: true } }, lead: { select: { id: true, fullName: true } } },
  });

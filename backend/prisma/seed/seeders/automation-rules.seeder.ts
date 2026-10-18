import { RULES } from '../../../src/automation/rule-definitions.js';
import { prisma } from '../../../src/lib/prisma.js';

export async function seedAutomationRules() {
  const rules = Object.values(RULES);
  await prisma.automationRule.createMany({ data: rules.map((r) => ({ ...r, isActive: true })) });
  return rules.length;
}

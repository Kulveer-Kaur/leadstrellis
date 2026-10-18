import type { PillOption } from '@/components/ui';

/** Budgets are always AED; the unit only scales the number the agent types. */
export type BudgetUnit = 'M' | 'K' | 'AED';

export const BUDGET_UNIT_OPTIONS: PillOption[] = [
  { value: 'M', label: 'Million' },
  { value: 'K', label: 'Thousand' },
  { value: 'AED', label: 'AED' },
];

const SCALE: Record<BudgetUnit, number> = { M: 1e6, K: 1e3, AED: 1 };

/** Keeps only what a number can contain, so letters never reach the field. */
export const cleanAmount = (input: string) => input.replace(/[^\d.,]/g, '');

/** "2.5" + Million → 2500000. Undefined when empty or not a positive number. */
export function toAed(amount: string, unit: string): number | undefined {
  const text = amount.replace(/,/g, '').trim();
  if (!/^\d+(\.\d+)?$/.test(text)) return undefined;
  const n = Math.round(Number(text) * (SCALE[unit as BudgetUnit] ?? 1));
  return n > 0 ? n : undefined;
}

/** 2500000 → { amount: "2.5", unit: "M" }: the form an agent would type it back in. */
export function fromAed(aed: number | null | undefined): { amount: string; unit: BudgetUnit } {
  if (!aed) return { amount: '', unit: 'M' };
  const unit: BudgetUnit = aed >= 1e6 ? 'M' : aed >= 1e3 ? 'K' : 'AED';
  return { amount: String(Number((aed / SCALE[unit]).toFixed(3))), unit };
}

/** Live preview under the field, e.g. "= AED 2,500,000". */
export const budgetPreview = (amount: string, unit: string) => {
  const aed = toAed(amount, unit);
  return aed ? `= AED ${aed.toLocaleString('en-US')}` : undefined;
};

import type { Prisma } from '../../generated/prisma/client.js';
import { addDays } from '../../utils/dates.js';

export type Period = '7d' | '30d' | 'qtd';

/** [start, end) of the selected period and of the period before it (for deltas). */
export function periodRange(period: Period, now = new Date()) {
  let start: Date;
  if (period === '7d') start = addDays(now, -7);
  else if (period === 'qtd') start = new Date(Date.UTC(now.getUTCFullYear(), Math.floor(now.getUTCMonth() / 3) * 3, 1));
  else start = addDays(now, -30);
  const length = now.getTime() - start.getTime();
  return { start, end: now, prevStart: new Date(start.getTime() - length), prevEnd: start };
}

/** Lead filter for an emirate (via the extracted requirement) — "all" means no filter. */
export const emirateFilter = (emirate: string): Prisma.LeadWhereInput =>
  emirate && emirate !== 'all' ? { requirement: { emirate: { equals: emirate.replace(/-/g, ' '), mode: 'insensitive' } } } : {};

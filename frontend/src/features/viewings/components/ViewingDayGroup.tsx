import { Card } from '@/components/ui';
import type { Viewing } from '@/types';
import { formatDay } from '@/utils/format';
import { ViewingRow } from './ViewingRow';

const dayKey = (iso: string) => new Date(iso).toDateString();

/** Splits viewings into one card per calendar day, keeping their order. */
export function groupByDay(viewings: Viewing[]) {
  const groups = new Map<string, Viewing[]>();
  for (const v of viewings) groups.set(dayKey(v.scheduledAt), [...(groups.get(dayKey(v.scheduledAt)) ?? []), v]);
  return [...groups.values()];
}

function dayLabel(iso: string) {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86_400_000);
  if (dayKey(iso) === today.toDateString()) return 'Today';
  if (dayKey(iso) === tomorrow.toDateString()) return 'Tomorrow';
  return formatDay(iso);
}

export function ViewingDayGroup({ viewings }: { viewings: Viewing[] }) {
  return (
    <Card>
      <h2 className="mb-1 flex items-baseline gap-2 text-title-medium">
        {dayLabel(viewings[0].scheduledAt)}
        <span className="num text-body-small text-muted">
          {viewings.length} {viewings.length === 1 ? 'viewing' : 'viewings'}
        </span>
      </h2>
      <ul>
        {viewings.map((v) => (
          <ViewingRow key={v.id} viewing={v} />
        ))}
      </ul>
    </Card>
  );
}

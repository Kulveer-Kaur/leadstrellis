import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui';
import { formatDay, formatTime } from '@/utils/format';
import type { UpcomingViewing } from '../types';

export function ViewingItem({ viewing }: { viewing: UpcomingViewing }) {
  const [weekday, ...rest] = formatDay(viewing.at).split(' ');
  return (
    <li className="flex items-center gap-4 rounded-panel p-2 transition-colors hover:bg-surface-2">
      <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-surface-2 py-2">
        <span className="text-body-small text-muted">{weekday.replace(',', '')}</span>
        <span className="num text-title-medium text-heading">{rest.join(' ')}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-medium font-medium text-heading">{viewing.leadName}</p>
        <p className="truncate text-body-small text-muted">
          {viewing.property} · {viewing.community}
        </p>
        <p className="num text-body-small text-text">
          {formatTime(viewing.at)} · {viewing.agent}
        </p>
      </div>
      {viewing.bookedBy === 'AI' ? (
        <Badge tone="primary" icon={<Sparkles className="size-3" aria-hidden />}>
          AI booked
        </Badge>
      ) : (
        <Badge>Agent</Badge>
      )}
    </li>
  );
}

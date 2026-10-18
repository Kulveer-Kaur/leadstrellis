import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui';
import { leadPath, propertyPath } from '@/constants/routes';
import type { Viewing } from '@/types';
import { formatTime } from '@/utils/format';
import { ViewingActions } from './ViewingActions';
import { ViewingStatusBadge } from './ViewingStatusBadge';

export function ViewingRow({ viewing }: { viewing: Viewing }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border py-3 first:border-t-0">
      <span className="num w-20 shrink-0 text-title-medium text-heading">{formatTime(viewing.scheduledAt)}</span>
      <div className="min-w-0 flex-1 basis-56">
        <Link to={leadPath(viewing.lead.id)} className="text-body-medium font-medium text-heading hover:text-primary">
          {viewing.lead.fullName}
        </Link>
        <p className="truncate text-body-small text-muted">
          <Link to={propertyPath(viewing.property.id)} className="hover:text-primary">
            {viewing.property.title}
          </Link>{' '}
          · {viewing.property.community} · {viewing.property.refCode}
        </p>
      </div>
      <span className="text-body-small text-text">{viewing.agent?.name ?? 'Unassigned'}</span>
      {viewing.bookedBy === 'AI' ? (
        <Badge tone="primary" icon={<Sparkles className="size-3" aria-hidden />}>
          AI booked
        </Badge>
      ) : (
        <Badge>Agent booked</Badge>
      )}
      <ViewingStatusBadge status={viewing.status} />
      <ViewingActions id={viewing.id} status={viewing.status} />
    </li>
  );
}

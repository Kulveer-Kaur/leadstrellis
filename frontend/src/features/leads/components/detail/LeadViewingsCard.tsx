import { CalendarPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, IconButton } from '@/components/ui';
import { propertyPath } from '@/constants/routes';
import { ViewingActions, ViewingStatusBadge } from '@/features/viewings/components';
import type { LeadDetail } from '@/types';
import { formatDateTime } from '@/utils/format';

export function LeadViewingsCard({ viewings, onBook }: { viewings: LeadDetail['viewings']; onBook: () => void }) {
  return (
    <Card>
      <CardHeader
        title="Viewings"
        action={
          <IconButton label="Book a viewing" variant="outline" size="sm" onClick={onBook}>
            <CalendarPlus className="size-4" />
          </IconButton>
        }
      />
      {viewings.length === 0 ? (
        <p className="text-body-medium text-muted">No viewings booked yet.</p>
      ) : (
        <ul className="flex flex-col">
          {viewings.map((v) => (
            <li key={v.id} className="flex flex-col gap-2 border-t border-border py-3 first:border-t-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={propertyPath(v.property.id)} className="text-body-medium font-medium text-heading hover:text-primary">
                    {v.property.title}
                  </Link>
                  <p className="num text-body-small text-muted">{formatDateTime(v.scheduledAt)}</p>
                </div>
                <ViewingStatusBadge status={v.status} />
              </div>
              <div className="flex justify-end">
                <ViewingActions id={v.id} status={v.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

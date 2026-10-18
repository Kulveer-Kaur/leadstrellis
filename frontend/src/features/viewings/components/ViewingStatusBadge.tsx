import { Badge } from '@/components/ui';
import { VIEWING_STATUS_META } from '@/constants/property-meta';
import type { ViewingStatus } from '@/types';

export function ViewingStatusBadge({ status }: { status: ViewingStatus }) {
  const meta = VIEWING_STATUS_META[status];
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}

import { Badge } from '@/components/ui';
import { PROPERTY_STATUS_META } from '@/constants/property-meta';
import type { PropertyStatus } from '@/types';

export function PropertyStatusBadge({ status, className }: { status: PropertyStatus; className?: string }) {
  const meta = PROPERTY_STATUS_META[status];
  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  );
}

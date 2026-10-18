import { Badge } from '@/components/ui';
import { STATUS_META } from '@/constants/lead-meta';
import type { LeadStatus } from '@/types';

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}

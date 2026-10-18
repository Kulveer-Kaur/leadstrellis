import { PillSelect, type PillOption } from '@/components/ui';
import type { ViewingStatus } from '@/types';
import { useUpdateViewing } from '../hooks/useViewings';

/** What an agent can do next from each status. */
const NEXT: Record<ViewingStatus, PillOption[]> = {
  SCHEDULED: [
    { value: 'CONFIRMED', label: 'Mark confirmed' },
    { value: 'COMPLETED', label: 'Mark completed' },
    { value: 'NO_SHOW', label: 'Mark no-show' },
    { value: 'CANCELLED', label: 'Cancel viewing' },
  ],
  CONFIRMED: [
    { value: 'COMPLETED', label: 'Mark completed' },
    { value: 'NO_SHOW', label: 'Mark no-show' },
    { value: 'CANCELLED', label: 'Cancel viewing' },
  ],
  COMPLETED: [],
  CANCELLED: [{ value: 'SCHEDULED', label: 'Re-open' }],
  NO_SHOW: [{ value: 'SCHEDULED', label: 'Re-open' }],
};

export function ViewingActions({ id, status }: { id: string; status: ViewingStatus }) {
  const update = useUpdateViewing();
  const options = NEXT[status];
  if (!options.length) return null;
  return (
    <PillSelect
      label="Update viewing"
      size="sm"
      align="right"
      value=""
      options={[{ value: '', label: update.isPending ? 'Saving…' : 'Update' }, ...options]}
      onChange={(v) => v && update.mutate({ id, status: v as ViewingStatus })}
    />
  );
}

import { PillSelect } from '@/components/ui';
import { STATUS_META, TRANSITIONS } from '@/constants/lead-meta';
import type { LeadStatus } from '@/types';
import { useSetLeadStatus } from '../../hooks/useLeadMutations';

/** Status picker limited to the moves the pipeline allows from the current status. */
export function StatusSelect({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const setStatus = useSetLeadStatus();
  const options = [status, ...TRANSITIONS[status]].map((s) => ({ value: s, label: STATUS_META[s].label }));
  return (
    <PillSelect
      label="Lead status"
      size="sm"
      align="right"
      value={status}
      options={options}
      onChange={(next) => next !== status && setStatus.mutate({ id: leadId, status: next as LeadStatus })}
    />
  );
}

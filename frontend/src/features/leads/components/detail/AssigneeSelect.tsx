import { PillSelect } from '@/components/ui';
import { useTeam } from '../../hooks/useLeads';
import { useUpdateLead } from '../../hooks/useLeadMutations';

export function AssigneeSelect({ leadId, assignedToId }: { leadId: string; assignedToId: string | null }) {
  const { data: team = [] } = useTeam();
  const update = useUpdateLead(leadId);
  const options = [
    { value: '', label: 'Unassigned' },
    ...team.map((u) => ({ value: u.id, label: `${u.name} (${u.role.toLowerCase()}) · ${u.openLeads} open` })),
  ];
  return (
    <PillSelect
      label="Assigned agent"
      size="sm"
      align="right"
      value={assignedToId ?? ''}
      options={options}
      onChange={(id) => update.mutate({ assignedToId: id || null })}
    />
  );
}

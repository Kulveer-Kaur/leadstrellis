import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLead } from '../api/leads.api';

/** POST /leads, then refresh the dashboard and lead lists so the new lead (and the AI's work on it) shows up. */
export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLead,
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ['dashboard'] }), qc.invalidateQueries({ queryKey: ['leads'] })]),
  });
}

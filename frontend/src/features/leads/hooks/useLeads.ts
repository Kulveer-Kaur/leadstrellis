import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/services/query-keys';
import { fetchLeads, fetchTeam, type LeadListParams } from '../api/leads.api';

/** Paged lead list. The AI updates leads in the background, so it polls. */
export const useLeads = (params: LeadListParams) =>
  useQuery({
    queryKey: queryKeys.leads.list(params),
    queryFn: () => fetchLeads(params),
    placeholderData: (prev) => prev,
    refetchInterval: 15_000,
  });

export const useTeam = () => useQuery({ queryKey: queryKeys.users, queryFn: fetchTeam, staleTime: 5 * 60_000 });

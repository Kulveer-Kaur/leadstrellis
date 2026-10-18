import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/services/query-keys';
import { fetchLead, fetchLeadTimeline } from '../api/leads.api';

export const useLead = (id: string) =>
  useQuery({
    queryKey: queryKeys.leads.detail(id),
    queryFn: () => fetchLead(id),
    // Poll quickly while the AI is working on the lead (reading it, or running its AI route), then relax.
    refetchInterval: (q) => {
      const d = q.state.data;
      const busy = ['PENDING', 'PROCESSING'].includes(d?.processingState ?? '') || ['ANALYSING', 'MATCHING', 'PROPOSING'].includes(d?.aiRouteStep ?? '');
      return busy ? 3_000 : d?.aiRouteEnabled ? 10_000 : 20_000;
    },
  });

export const useLeadTimeline = (id: string) =>
  useQuery({ queryKey: queryKeys.leads.timeline(id), queryFn: () => fetchLeadTimeline(id), refetchInterval: 20_000 });

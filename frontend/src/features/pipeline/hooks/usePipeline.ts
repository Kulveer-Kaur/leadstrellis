import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { PIPELINE_STAGES } from '@/constants/lead-meta';
import { fetchLeads, setLeadStatus } from '@/features/leads/api/leads.api';
import type { PageMeta } from '@/services/http';
import { queryKeys } from '@/services/query-keys';
import type { LeadStatus, LeadSummary } from '@/types';

/** Cards shown per column; the header still shows the full count. */
const PER_STAGE = 30;

type StagePage = { data: LeadSummary[]; meta?: PageMeta };

/** One query per board column, best leads first. */
export function usePipelineStages(search: string) {
  return useQueries({
    queries: PIPELINE_STAGES.map((status) => ({
      queryKey: [...queryKeys.leads.stage(status), search],
      queryFn: () => fetchLeads({ status, pageSize: PER_STAGE, sort: '-score', search: search.trim() || undefined }),
      placeholderData: (prev: StagePage | undefined) => prev,
      refetchInterval: 20_000,
    })),
  });
}

/** Moves a card between columns straight away, then confirms with the server (rolls back on error). */
export function useMoveLead(search: string) {
  const qc = useQueryClient();
  const key = (s: LeadStatus) => [...queryKeys.leads.stage(s), search];
  return useMutation({
    mutationFn: ({ lead, to }: { lead: LeadSummary; to: LeadStatus }) => setLeadStatus(lead.id, to),
    onMutate: async ({ lead, to }) => {
      await qc.cancelQueries({ queryKey: ['leads', 'stage'] });
      const from = lead.status;
      const prevFrom = qc.getQueryData<StagePage>(key(from));
      const prevTo = qc.getQueryData<StagePage>(key(to));
      const bump = (meta: PageMeta | undefined, by: number) => meta && { ...meta, total: meta.total + by };
      qc.setQueryData<StagePage>(key(from), (p) => p && { data: p.data.filter((l) => l.id !== lead.id), meta: bump(p.meta, -1) });
      qc.setQueryData<StagePage>(key(to), (p) => p && { data: [{ ...lead, status: to }, ...p.data], meta: bump(p.meta, 1) });
      return { from, prevFrom, prevTo };
    },
    onError: (_err, { to }, ctx) => {
      if (!ctx) return;
      qc.setQueryData(key(ctx.from), ctx.prevFrom);
      qc.setQueryData(key(to), ctx.prevTo);
    },
    onSettled: () => Promise.all([qc.invalidateQueries({ queryKey: ['leads'] }), qc.invalidateQueries({ queryKey: ['dashboard'] })]),
  });
}

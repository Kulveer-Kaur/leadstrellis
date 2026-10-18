import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/query-keys';
import * as api from '../api/dashboard.api';
import type { DashboardFilters } from '../types';

/** The AI works in the background, so live cards poll; lists refresh faster than charts. */
const FAST_REFRESH_MS = 10_000;
const LIVE_REFRESH_MS = 30_000;

export const useDashboardSummary = (filters: DashboardFilters) =>
  useQuery({
    queryKey: queryKeys.dashboard.summary(filters),
    queryFn: () => api.fetchDashboardSummary(filters),
    placeholderData: (prev) => prev,
    refetchInterval: LIVE_REFRESH_MS,
  });

export const useRecentLeads = (view: string, search: string) =>
  useQuery({
    queryKey: queryKeys.dashboard.recentLeads(view, search),
    queryFn: () => api.fetchRecentLeads(view, search),
    placeholderData: (prev) => prev,
    refetchInterval: FAST_REFRESH_MS,
  });

export const useUpcomingViewings = () =>
  useQuery({ queryKey: queryKeys.dashboard.viewings, queryFn: api.fetchUpcomingViewings, refetchInterval: LIVE_REFRESH_MS });

export const useAgentFeed = () =>
  useQuery({ queryKey: ['dashboard', 'agent-feed'] as const, queryFn: api.fetchAgentFeed, refetchInterval: FAST_REFRESH_MS });

export const useAiRouteBoard = () =>
  useQuery({ queryKey: ['dashboard', 'ai-route'] as const, queryFn: api.fetchAiRouteBoard, refetchInterval: FAST_REFRESH_MS });

/** Refresh every dashboard card (e.g. after a lead is added). */
export const useRefreshDashboard = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['dashboard'] });
};

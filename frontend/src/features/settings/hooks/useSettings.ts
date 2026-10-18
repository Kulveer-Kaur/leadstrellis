import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/query-keys';
import type { AgentType, AppSettings } from '@/types';
import { settingsApi } from '../api/settings.api';

/**
 * One place to read + write the Phase 2 global settings. Returns the full /settings
 * payload (toggles, agent list, AI budget) and refetches every 60s so the AI-budget
 * ring and daily-task counters stay roughly current without socket wiring.
 */
export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: () => settingsApi.get(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<AppSettings>) => settingsApi.update(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.settings.all }),
  });
}

export function useSetAgentActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agent, isActive }: { agent: AgentType; isActive: boolean }) =>
      settingsApi.setAgentActive(agent, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.settings.all }),
  });
}

export function useRunPilot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => settingsApi.runPilot(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.settings.all }),
  });
}

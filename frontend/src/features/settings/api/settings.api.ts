import { http } from '@/services/http';
import type { AgentSetting, AgentType, AppSettings, SettingsResponse } from '@/types';

export const settingsApi = {
  get: () => http.get<SettingsResponse>('/settings'),
  update: (patch: Partial<AppSettings>) => http.patch<AppSettings>('/settings', patch),
  setAgentActive: (agent: AgentType, isActive: boolean) =>
    http.patch<AgentSetting>(`/settings/agents/${agent}`, { isActive }),
  runPilot: () => http.post<{ queued?: { outreach: number; followUp: number; deal: number }; skipped?: string }>('/settings/pilot/run'),
};

export type AgentType = 'INTAKE' | 'QUALIFIER' | 'MATCHMAKER' | 'OUTREACH' | 'INBOX' | 'FOLLOW_UP' | 'DEAL' | 'PILOT';

export interface AgentSetting {
  id: string;
  agent: AgentType;
  isActive: boolean;
  lastRunAt: string | null;
  tasksDoneToday: number;
  statsResetAt: string;
  config: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: string;
  pilotEnabled: boolean;
  liveFeedEnabled: boolean;
  workingDays: number[];
  workingHoursStart: number;
  workingHoursEnd: number;
  timezone: string;
  aiDailyTokenBudget: number;
  aiTokensUsedToday: number;
  aiBudgetResetAt: string;
  emailsPerLeadPerDay: number;
  emailsPerLeadPerWeek: number;
  dailySendCap: number;
  dailySendCount: number;
  dailySendResetAt: string;
  updatedAt: string;
}

export interface AiBudgetStatus {
  used: number;
  budget: number;
  remaining: number;
  percent: number;
  exhausted: boolean;
  resetAt: string;
}

/** Shape returned by GET /api/v1/settings. */
export interface SettingsResponse {
  settings: AppSettings;
  agents: AgentSetting[];
  aiBudget: AiBudgetStatus;
}

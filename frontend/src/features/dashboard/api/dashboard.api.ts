/** Dashboard data from the Express API (backend/src/modules/dashboard). One function per card. */
import { http } from '@/services/http';
import type { LeadSummary } from '@/types';
import type { DashboardFilters, DashboardSummary, UpcomingViewing } from '../types';

export const fetchDashboardSummary = (filters: DashboardFilters) =>
  http.get<DashboardSummary>('/dashboard/summary', { period: filters.period, emirate: filters.emirate });

export const fetchRecentLeads = (view: string, search: string) =>
  http.get<LeadSummary[]>('/leads', { view, search: search.trim() || undefined, pageSize: 8, sort: '-createdAt' });

export const fetchUpcomingViewings = () => http.get<UpcomingViewing[]>('/dashboard/viewings');

export interface AgentFeedEntry {
  id: string;
  agent: string;
  type: string;
  leadId: string | null;
  leadLabel: string | null;
  outcome: string;
  detail: string | null;
  at: string;
}

export const fetchAgentFeed = () => http.get<AgentFeedEntry[]>('/dashboard/agent-feed');

export interface AiRouteBoardLead {
  id: string;
  code: string;
  fullName: string;
  status: string;
  agentMode: 'OFF' | 'RULES' | 'AI';
  aiRouteEnabled: boolean;
  aiRouteStep: 'ANALYSING' | 'MATCHING' | 'PROPOSING' | 'AWAITING_REPLY' | 'WON' | 'LOST' | 'NEEDS_ATTENTION';
  aiRouteNote: string | null;
  dealValueAed: number | null;
  updatedAt: string;
  proposal: { status: string; fitScore: number | null; sentAt: string | null; viewedAt: string | null; propertyTitle: string; community: string; url: string; pdfUrl: string } | null;
}

export interface AiRouteBoard {
  counts: Record<AiRouteBoardLead['aiRouteStep'], number>;
  leads: AiRouteBoardLead[];
}

export const fetchAiRouteBoard = () => http.get<AiRouteBoard>('/dashboard/ai-route');

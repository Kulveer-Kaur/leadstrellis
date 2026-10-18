import { http } from '@/services/http';
import type { ActivityEntry, AgentMode, Channel, LeadDetail, LeadMatch, LeadStatus, LeadSummary, TeamMember } from '@/types';
import type { CreatedLead, CreateLeadInput, RequirementInput } from '../leads.types';

export interface LeadListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  view?: string;
  /** Comma-separated lists, as the API expects. */
  status?: string;
  intent?: string;
  source?: string;
  sort?: string;
}

export interface LeadUpdate {
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  instagramHandle?: string | null;
  preferredChannel?: Channel | null;
  assignedToId?: string | null;
}

export const createLead = (input: CreateLeadInput) => http.post<CreatedLead>('/leads', input);

export const fetchLeads = (params: LeadListParams) => http.getPage<LeadSummary[]>('/leads', { ...params });

export const fetchLead = (id: string) => http.get<LeadDetail>(`/leads/${id}`);

export const fetchLeadTimeline = (id: string) => http.get<ActivityEntry[]>(`/leads/${id}/timeline`);

export const updateLead = (id: string, patch: LeadUpdate) => http.patch<LeadDetail>(`/leads/${id}`, patch);

/** Agent edit of what the lead wants: rescored and re-matched on the server. */
export const updateRequirement = (id: string, patch: RequirementInput) => http.patch<LeadDetail>(`/leads/${id}/requirement`, patch);

export const setLeadStatus = (id: string, status: LeadStatus, reason?: string) => http.patch<LeadDetail>(`/leads/${id}/status`, { status, reason });

export const reprocessLead = (id: string) => http.post<{ queued: boolean }>(`/leads/${id}/reprocess`);

export const refreshMatches = (id: string) => http.post<LeadMatch[]>(`/leads/${id}/matches/refresh`);

/** Admin only. */
export const deleteLead = (id: string) => http.delete<{ deleted: boolean }>(`/leads/${id}`);

export const fetchTeam = () => http.get<TeamMember[]>('/users');
export const inviteAgent = (data: { name: string; email: string }) =>
  http.post<{ id: string; name: string; email: string; role: string; inviteUrl: string }>('/users/invite', data);
export const resendInvite = (id: string) => http.post<{ ok: boolean; inviteUrl: string }>(`/users/${id}/resend-invite`);
export const deleteAgent = (id: string) => http.delete<{ ok: boolean }>(`/users/${id}`);

/** Assign who works the lead: OFF, RULES (free) or AI (uses AI tokens). */
export const setAgentMode = (id: string, mode: AgentMode) => http.post<{ agentMode: AgentMode }>(`/leads/${id}/agent-mode`, { mode });

/** Re-match and send a fresh AI proposal. */
export const resendProposal = (id: string) => http.post<unknown>(`/leads/${id}/proposals`);

/** Record the lead's reply (from a call/WhatsApp, or to test); the Inbox agent reads it. */
export const addLeadReply = (id: string, body: string) => http.post<unknown>(`/leads/${id}/replies`, { body });

/** Agent confirms the site visit on the lead's behalf. */
export const confirmVisit = (id: string, proposalId: string, slotIndex: number) =>
  http.post<unknown>(`/leads/${id}/proposals/${proposalId}/confirm`, { slotIndex });

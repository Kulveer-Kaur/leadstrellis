import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AgentMode, LeadStatus } from '@/types';
import * as api from '../api/leads.api';
import type { RequirementInput } from '../leads.types';

/** Every lead change touches lists, the board, the detail page and the dashboard. */
function useInvalidateLead() {
  const qc = useQueryClient();
  return () =>
    Promise.all([qc.invalidateQueries({ queryKey: ['leads'] }), qc.invalidateQueries({ queryKey: ['dashboard'] }), qc.invalidateQueries({ queryKey: ['conversations'] })]);
}

export function useSetLeadStatus() {
  const invalidate = useInvalidateLead();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: LeadStatus; reason?: string }) => api.setLeadStatus(id, status, reason),
    onSettled: invalidate,
  });
}

export function useUpdateLead(id: string) {
  const invalidate = useInvalidateLead();
  return useMutation({ mutationFn: (patch: api.LeadUpdate) => api.updateLead(id, patch), onSuccess: invalidate });
}

export function useUpdateRequirement(id: string) {
  const invalidate = useInvalidateLead();
  return useMutation({ mutationFn: (patch: RequirementInput) => api.updateRequirement(id, patch), onSuccess: invalidate });
}

export function useReprocessLead(id: string) {
  const invalidate = useInvalidateLead();
  return useMutation({ mutationFn: () => api.reprocessLead(id), onSuccess: invalidate });
}

export function useRefreshMatches(id: string) {
  const invalidate = useInvalidateLead();
  return useMutation({ mutationFn: () => api.refreshMatches(id), onSuccess: invalidate });
}

export function useDeleteLead() {
  const invalidate = useInvalidateLead();
  return useMutation({ mutationFn: (id: string) => api.deleteLead(id), onSuccess: invalidate });
}

export function useSetAgentMode(id: string) {
  const invalidate = useInvalidateLead();
  return useMutation({ mutationFn: (mode: AgentMode) => api.setAgentMode(id, mode), onSettled: invalidate });
}

export function useResendProposal(id: string) {
  const invalidate = useInvalidateLead();
  return useMutation({ mutationFn: () => api.resendProposal(id), onSettled: invalidate });
}

export function useAddLeadReply(id: string) {
  const invalidate = useInvalidateLead();
  return useMutation({ mutationFn: (body: string) => api.addLeadReply(id, body), onSettled: invalidate });
}

export function useConfirmVisit(id: string) {
  const invalidate = useInvalidateLead();
  return useMutation({ mutationFn: ({ proposalId, slotIndex }: { proposalId: string; slotIndex: number }) => api.confirmVisit(id, proposalId, slotIndex), onSettled: invalidate });
}

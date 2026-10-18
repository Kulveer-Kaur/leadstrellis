import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/query-keys';
import * as api from '../api/messages.api';
import type { MessagePurpose, SendMessageInput, TextChannel } from '../types';

export const useConversations = (search: string) =>
  useQuery({
    queryKey: queryKeys.conversations(search),
    queryFn: () => api.fetchConversations(search),
    placeholderData: (prev) => prev,
    refetchInterval: 15_000,
  });

export const useMessages = (leadId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.leads.messages(leadId ?? ''),
    queryFn: () => api.fetchMessages(leadId!),
    enabled: Boolean(leadId),
    refetchInterval: 15_000,
  });

export function useSendMessage(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMessageInput) => api.sendMessage(leadId, input),
    // Sending can move the lead to Contacted and adds a timeline entry.
    onSettled: () => Promise.all([qc.invalidateQueries({ queryKey: ['leads'] }), qc.invalidateQueries({ queryKey: ['conversations'] }), qc.invalidateQueries({ queryKey: ['dashboard'] })]),
  });
}

export function useDraftMessage(leadId: string) {
  return useMutation({ mutationFn: ({ channel, purpose }: { channel: TextChannel; purpose: MessagePurpose }) => api.draftMessage(leadId, channel, purpose) });
}

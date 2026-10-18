import { http } from '@/services/http';
import type { Message } from '@/types';
import type { Conversation, MessageDraft, MessagePurpose, SendMessageInput, TextChannel } from '../types';

export const fetchConversations = (search: string) => http.get<Conversation[]>('/conversations', { search: search.trim() || undefined });

export const fetchMessages = (leadId: string) => http.get<Message[]>(`/leads/${leadId}/messages`);

export const sendMessage = (leadId: string, input: SendMessageInput) => http.post<Message>(`/leads/${leadId}/messages`, input);

export const draftMessage = (leadId: string, channel: TextChannel, purpose: MessagePurpose) =>
  http.post<MessageDraft>(`/leads/${leadId}/draft-message`, { channel, purpose });

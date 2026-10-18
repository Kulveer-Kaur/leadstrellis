import { http } from '@/services/http';
import type { Viewing, ViewingStatus } from '@/types';

export interface CreateViewingInput {
  leadId: string;
  propertyId: string;
  scheduledAt: string;
  notes?: string;
}

export interface ViewingUpdate {
  status?: ViewingStatus;
  scheduledAt?: string;
  notes?: string;
}

export const fetchViewings = (upcoming: boolean) => http.get<Viewing[]>('/viewings', { upcoming });

export const createViewing = (input: CreateViewingInput) => http.post<Viewing>('/viewings', input);

export const updateViewing = (id: string, patch: ViewingUpdate) => http.patch<Viewing>(`/viewings/${id}`, patch);

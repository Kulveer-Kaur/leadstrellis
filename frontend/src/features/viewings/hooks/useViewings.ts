import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/query-keys';
import * as api from '../api/viewings.api';

export const useViewings = (upcoming: boolean) =>
  useQuery({ queryKey: queryKeys.viewings.list(upcoming), queryFn: () => api.fetchViewings(upcoming), placeholderData: (prev) => prev, refetchInterval: 30_000 });

/** Viewings change lead status and appear on the dashboard, so refresh all three. */
function useInvalidateViewings() {
  const qc = useQueryClient();
  return () => Promise.all([qc.invalidateQueries({ queryKey: ['viewings'] }), qc.invalidateQueries({ queryKey: ['leads'] }), qc.invalidateQueries({ queryKey: ['dashboard'] })]);
}

export function useCreateViewing() {
  const invalidate = useInvalidateViewings();
  return useMutation({ mutationFn: api.createViewing, onSuccess: invalidate });
}

export function useUpdateViewing() {
  const invalidate = useInvalidateViewings();
  return useMutation({ mutationFn: ({ id, ...patch }: api.ViewingUpdate & { id: string }) => api.updateViewing(id, patch), onSettled: invalidate });
}

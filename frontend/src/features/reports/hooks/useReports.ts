import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/services/query-keys';
import * as api from '../api/reports.api';

const REFRESH_MS = 60_000;

export const useForecast = () => useQuery({ queryKey: queryKeys.reports.forecast, queryFn: api.fetchForecast, refetchInterval: REFRESH_MS });
export const useEmailStats = () => useQuery({ queryKey: queryKeys.reports.emailStats, queryFn: api.fetchEmailStats, refetchInterval: REFRESH_MS });
export const useLikelyToWin = () => useQuery({ queryKey: queryKeys.reports.likelyToWin, queryFn: api.fetchLikelyToWin, refetchInterval: REFRESH_MS });
export const usePilotInsights = () => useQuery({ queryKey: queryKeys.reports.insights, queryFn: api.fetchPilotInsights, refetchInterval: REFRESH_MS });

/** Report cards, from the dashboard module's Phase-2 endpoints. */
import { http } from '@/services/http';
import type { EmailStats, LikelyToWinLead, PilotInsight, RevenueForecast } from '../types';

export const fetchForecast = () => http.get<RevenueForecast>('/dashboard/forecast');
export const fetchEmailStats = () => http.get<EmailStats>('/dashboard/email-stats');
export const fetchLikelyToWin = () => http.get<LikelyToWinLead[]>('/dashboard/likely-to-win');
export const fetchPilotInsights = () => http.get<PilotInsight[]>('/dashboard/pilot-insights');

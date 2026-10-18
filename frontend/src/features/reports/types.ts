import type { LeadStatus } from '@/types';

export interface RevenueForecast {
  expectedAed: number;
  openLeads: number;
}

export interface EmailStats {
  sent24h: number;
  sent7d: number;
  replies24h: number;
  replies7d: number;
  replyRate: number;
}

export interface LikelyToWinLead {
  id: string;
  code: string;
  fullName: string;
  status: LeadStatus;
  score: number;
  winProbability: number;
  reason: string;
  dealValueAed: number | null;
}

export interface PilotInsight {
  key: string;
  title: string;
  count: number;
  severity: 'high' | 'medium' | 'info' | 'ok';
}

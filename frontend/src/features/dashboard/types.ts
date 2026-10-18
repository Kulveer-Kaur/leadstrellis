import type { BarDatum, FunnelStage, SparkPoint } from '@/components/charts';
import type { IntentLevel, LeadSource } from '@/types';

export interface DashboardFilters {
  emirate: string;
  period: string;
}

export interface DashboardSummary {
  overview: { qualifiedRate: number; newLeads: number; qualified: number };
  autopilot: { automatedRate: number; delta: number; calls: number; messages: number; viewings: number };
  sources: BarDatum[];
  pipelineValue: { totalAed: number; delta: number; trend: SparkPoint[] };
  viewingTarget: { booked: number; target: number };
  funnel: FunnelStage[];
}

export interface LeadHotspot {
  id: string;
  community: string;
  lat: number;
  lng: number;
  leads: number;
  intent: IntentLevel;
}

export interface LatestLeadCapture {
  leadId: string;
  name: string;
  source: LeadSource;
  message: string;
  score: number;
  capturedAt: string;
}

export interface HotspotData {
  hotspots: LeadHotspot[];
  /** Null when there are no leads yet. */
  latest: LatestLeadCapture | null;
}

export type ActivityKind = 'captured' | 'qualified' | 'message' | 'call' | 'viewing' | 'nurture';

export interface AiActivity {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  at: string;
}

export interface UpcomingViewing {
  id: string;
  leadName: string;
  property: string;
  community: string;
  at: string;
  agent: string;
  bookedBy: 'AI' | 'Agent';
}

export interface AutomationRuleSummary {
  id: string;
  key: string;
  description: string;
  name: string;
  trigger: string;
  runsToday: number;
  active: boolean;
}

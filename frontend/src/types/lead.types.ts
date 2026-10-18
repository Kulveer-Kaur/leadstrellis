import type { Property } from './property.types';

export type LeadStatus =
  | 'NEW'
  | 'QUALIFIED'
  | 'CONTACTED'
  | 'ENGAGED'
  | 'VIEWING'
  | 'NEGOTIATION'
  | 'CLOSED_WON'
  | 'CLOSED_LOST'
  | 'NURTURE';

export type LeadSource =
  | 'WEBSITE'
  | 'WHATSAPP'
  | 'INSTAGRAM'
  | 'EMAIL'
  | 'MANUAL'
  | 'ADS'
  | 'PHONE'
  | 'GOOGLE_BUSINESS'
  | 'FACEBOOK'
  | 'PROPERTY_PORTAL'
  | 'REFERRAL';

export type IntentLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type Channel = 'EMAIL' | 'WHATSAPP' | 'INSTAGRAM' | 'SMS' | 'CALL';

export type ProcessingState = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

/** Where a lead is on its AI route (backend AiRouteStep). */
export type AiRouteStep = 'OFF' | 'ANALYSING' | 'MATCHING' | 'PROPOSING' | 'AWAITING_REPLY' | 'WON' | 'LOST' | 'NEEDS_ATTENTION';
/** Who works the lead: nobody, the free rule-based engine, or the AI agent (uses tokens). */
export type AgentMode = 'OFF' | 'RULES' | 'AI';
export type ProposalStatus = 'SENT' | 'FAILED' | 'ACCEPTED' | 'DECLINED';

/** One proposal on the lead page (GET /leads/:id → proposals). */
export interface LeadProposal {
  id: string;
  number: string;
  status: ProposalStatus;
  fitScore: number | null;
  headline: string;
  slots: string[];
  aiGenerated: boolean;
  error: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  property: { id: string; title: string; community: string; priceAed: number; refCode: string };
  url: string;
  pdfUrl: string;
}

export interface LeadRequirementSummary {
  bedrooms: string;
  propertyType: string;
  community: string;
  budgetMaxAed: number;
  summary: string | null;
}

/** One row of GET /leads (backend lead.mapper.ts → toLeadSummary). */
export interface LeadSummary {
  id: string;
  /** Human-friendly id, e.g. "L-1041". */
  code: string;
  fullName: string;
  source: LeadSource;
  status: LeadStatus;
  intent: IntentLevel;
  score: number;
  processingState: ProcessingState;
  assignedTo: { id: string; name: string } | null;
  /** Null until the AI has read the enquiry. */
  requirement: LeadRequirementSummary | null;
  nextAction: string;
  agentMode: AgentMode;
  aiRouteEnabled: boolean;
  aiRouteStep: AiRouteStep;
  createdAt: string;
}

export type LeadPurpose = 'BUY' | 'RENT' | 'INVEST';
export type Timeline = 'IMMEDIATE' | 'ONE_TO_THREE_MONTHS' | 'THREE_TO_SIX_MONTHS' | 'SIX_MONTHS_PLUS' | 'UNKNOWN';
export type Financing = 'CASH' | 'MORTGAGE' | 'UNKNOWN';
export type ActorType = 'USER' | 'AI' | 'SYSTEM';

/** The full requirement row the AI extracted (or an agent edited). */
export interface LeadRequirement {
  purpose: LeadPurpose | null;
  propertyTypes: string[];
  bedroomsMin: number | null;
  bedroomsMax: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  emirate: string | null;
  communities: string[];
  timeline: Timeline;
  financing: Financing;
  mustHaves: string[];
  niceToHaves: string[];
  summary: string | null;
  confidence: number;
  missingFields: string[];
  extractedBy: 'AI' | 'RULES' | 'MANUAL';
}

export interface ScoreBreakdownItem {
  key: string;
  label: string;
  points: number;
  max: number;
  note?: string;
}

export interface LeadScoreRecord {
  id: string;
  total: number;
  intentLevel: IntentLevel;
  breakdown: ScoreBreakdownItem[];
  aiIntentScore: number;
  reasoning: string;
  createdAt: string;
}

export type MessageDirection = 'OUT' | 'IN';
export type MessageStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'REPLIED' | 'RECEIVED';

export interface Message {
  id: string;
  leadId: string;
  channel: Channel;
  direction: MessageDirection;
  subject: string | null;
  body: string;
  status: MessageStatus;
  aiGenerated: boolean;
  error: string | null;
  createdAt: string;
}

export type ViewingStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface LeadTask {
  id: string;
  type: 'FOLLOW_UP' | 'NURTURE' | 'CALLBACK';
  dueAt: string;
  status: 'PENDING' | 'DONE' | 'CANCELLED';
  note: string | null;
}

/** GET /leads/:id (backend lead.service.ts → getLead). */
export interface LeadDetail {
  id: string;
  code: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  instagramHandle: string | null;
  source: LeadSource;
  rawMessage: string | null;
  status: LeadStatus;
  intentLevel: IntentLevel | null;
  score: number | null;
  winProbability: number | null;
  preferredChannel: Channel | null;
  processingState: ProcessingState;
  processingError: string | null;
  contactAttempts: number;
  lastContactedAt: string | null;
  lastInboundAt: string | null;
  automationPaused: boolean;
  agentMode: AgentMode;
  aiRouteEnabled: boolean;
  aiRouteStep: AiRouteStep;
  aiRouteNote: string | null;
  aiRouteStartedAt: string | null;
  dealValueAed: number | null;
  wonAt: string | null;
  lostReason: string | null;
  assignedToId: string | null;
  assignedTo: { id: string; name: string } | null;
  createdAt: string;
  requirement: LeadRequirement | null;
  scores: LeadScoreRecord[];
  matches: LeadMatch[];
  messages: Message[];
  viewings: (LeadViewing & { property: { id: string; title: string; community: string; refCode: string } })[];
  tasks: LeadTask[];
  proposals: LeadProposal[];
  summary: LeadSummary;
}

export interface LeadViewing {
  id: string;
  leadId: string;
  propertyId: string;
  agentId: string | null;
  scheduledAt: string;
  status: ViewingStatus;
  bookedBy: ActorType;
  notes: string | null;
}

/** One ranked property for a lead (GET /leads/:id/matches). */
export interface LeadMatch {
  id: string;
  propertyId: string;
  filterScore: number;
  finalRank: number | null;
  aiFitScore: number | null;
  aiReason: string | null;
  caveat: string | null;
  sentAt: string | null;
  property: Property;
}

/** One timeline entry (GET /leads/:id/timeline, GET /activity). */
export interface ActivityEntry {
  id: string;
  leadId: string | null;
  actorType: ActorType;
  type: string;
  title: string;
  detail: string | null;
  createdAt: string;
  lead: { id: string; fullName: string; number: number } | null;
}

/** GET /users — the team, for assignment pickers. */
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'AGENT';
  avatarUrl: string | null;
  openLeads: number;
  invitePending?: boolean;
  hasSetPassword?: boolean;
}

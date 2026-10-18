import type { Channel, Financing, IntentLevel, LeadPurpose, LeadSource, LeadStatus, Timeline } from '@/types';

export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const STATUS_META: Record<LeadStatus, { label: string; tone: Tone }> = {
  NEW: { label: 'New', tone: 'info' },
  QUALIFIED: { label: 'Qualified', tone: 'primary' },
  CONTACTED: { label: 'Contacted', tone: 'neutral' },
  ENGAGED: { label: 'Engaged', tone: 'primary' },
  VIEWING: { label: 'Viewing', tone: 'success' },
  NEGOTIATION: { label: 'Negotiation', tone: 'success' },
  CLOSED_WON: { label: 'Closed won', tone: 'success' },
  CLOSED_LOST: { label: 'Lost', tone: 'danger' },
  NURTURE: { label: 'Nurture', tone: 'warning' },
};

export const INTENT_META: Record<IntentLevel, { label: string; tone: Tone }> = {
  HIGH: { label: 'High intent', tone: 'success' },
  MEDIUM: { label: 'Medium intent', tone: 'warning' },
  LOW: { label: 'Low intent', tone: 'neutral' },
};

export const SOURCE_LABEL: Record<LeadSource, string> = {
  WEBSITE: 'Website',
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  EMAIL: 'Email',
  MANUAL: 'Manual',
  ADS: 'Ads',
  PHONE: 'Phone',
  GOOGLE_BUSINESS: 'Google Business',
  FACEBOOK: 'Facebook',
  PROPERTY_PORTAL: 'Property portal',
  REFERRAL: 'Referral',
};

/** Allowed status moves; mirrors backend pipeline/status-transitions.ts. */
export const TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['QUALIFIED', 'CONTACTED', 'ENGAGED', 'VIEWING', 'NURTURE', 'CLOSED_LOST'],
  QUALIFIED: ['CONTACTED', 'ENGAGED', 'VIEWING', 'NURTURE', 'CLOSED_LOST'],
  CONTACTED: ['QUALIFIED', 'ENGAGED', 'VIEWING', 'NURTURE', 'CLOSED_WON', 'CLOSED_LOST'],
  ENGAGED: ['CONTACTED', 'VIEWING', 'NEGOTIATION', 'NURTURE', 'CLOSED_WON', 'CLOSED_LOST'],
  VIEWING: ['CONTACTED', 'ENGAGED', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST', 'NURTURE'],
  NEGOTIATION: ['VIEWING', 'ENGAGED', 'CLOSED_WON', 'CLOSED_LOST', 'NURTURE'],
  NURTURE: ['QUALIFIED', 'CONTACTED', 'ENGAGED', 'VIEWING', 'CLOSED_LOST'],
  CLOSED_LOST: ['NURTURE', 'QUALIFIED'],
  CLOSED_WON: [],
};

export const canMoveTo = (from: LeadStatus, to: LeadStatus) => from !== to && TRANSITIONS[from].includes(to);

/** Pipeline board column order. */
export const PIPELINE_STAGES: LeadStatus[] = ['NEW', 'QUALIFIED', 'CONTACTED', 'ENGAGED', 'VIEWING', 'NEGOTIATION', 'CLOSED_WON', 'NURTURE', 'CLOSED_LOST'];

export const CHANNEL_LABEL: Record<Channel, string> = {
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  SMS: 'SMS',
  CALL: 'Call',
};

export const PURPOSE_LABEL: Record<LeadPurpose, string> = { BUY: 'Buy', RENT: 'Rent', INVEST: 'Invest' };

export const TIMELINE_LABEL: Record<Timeline, string> = {
  IMMEDIATE: 'Now',
  ONE_TO_THREE_MONTHS: '1–3 months',
  THREE_TO_SIX_MONTHS: '3–6 months',
  SIX_MONTHS_PLUS: '6+ months',
  UNKNOWN: 'Not given',
};

export const FINANCING_LABEL: Record<Financing, string> = { CASH: 'Cash', MORTGAGE: 'Mortgage', UNKNOWN: 'Not given' };

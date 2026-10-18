import type { PillOption } from '@/components/ui';
import { UAE_COMMUNITIES } from '@/constants/uae-communities';

export const SOURCE_OPTIONS: PillOption[] = [
  { value: 'MANUAL', label: 'Walk-in / referral' },
  { value: 'PHONE', label: 'Phone call' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'ADS', label: 'Ad campaign' },
];

export const CHANNEL_OPTIONS: PillOption[] = [
  { value: '', label: 'Let AI choose' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'CALL', label: 'Phone call' },
];

export const PURPOSE_OPTIONS: PillOption[] = [
  { value: '', label: 'Not specified' },
  { value: 'BUY', label: 'Buy' },
  { value: 'RENT', label: 'Rent' },
  { value: 'INVEST', label: 'Invest' },
];

export const BEDROOM_OPTIONS: PillOption[] = [
  { value: '', label: 'Any' },
  { value: '0', label: 'Studio' },
  ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} bedroom${n > 1 ? 's' : ''}` })),
];

export const TIMELINE_OPTIONS: PillOption[] = [
  { value: '', label: 'Not specified' },
  { value: 'IMMEDIATE', label: 'Now / this month' },
  { value: 'ONE_TO_THREE_MONTHS', label: '1–3 months' },
  { value: 'THREE_TO_SIX_MONTHS', label: '3–6 months' },
  { value: 'SIX_MONTHS_PLUS', label: '6+ months' },
];

export const PROPERTY_TYPE_OPTIONS: PillOption[] = [
  { value: '', label: 'Any' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'TOWNHOUSE', label: 'Townhouse' },
  { value: 'PENTHOUSE', label: 'Penthouse' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'PLOT', label: 'Plot' },
  { value: 'OFFICE', label: 'Office' },
];

export const FINANCING_OPTIONS: PillOption[] = [
  { value: 'UNKNOWN', label: 'Not specified' },
  { value: 'CASH', label: 'Cash' },
  { value: 'MORTGAGE', label: 'Mortgage' },
];

export const COMMUNITY_OPTIONS: PillOption[] = [
  { value: '', label: 'Not specified' },
  ...UAE_COMMUNITIES.map((c) => ({ value: c.name, label: `${c.name} · ${c.emirate}` })),
];

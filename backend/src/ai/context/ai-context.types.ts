import type {
  CompletionStatus,
  Financing,
  IntentLevel,
  LeadPurpose,
  LeadSource,
  ListingType,
  PropertyType,
  Timeline,
} from '../../generated/prisma/enums.js';

/** The lead as the AI sees it. No phone numbers or emails are ever put into prompts. */
export interface LeadProfile {
  fullName: string;
  firstName: string;
  source: LeadSource;
  language: string;
  rawMessage: string | null;
  intentLevel: IntentLevel | null;
  score: number | null;
  requirement: RequirementView | null;
}

export interface RequirementView {
  purpose: LeadPurpose | null;
  propertyTypes: PropertyType[];
  bedroomsMin: number | null;
  bedroomsMax: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  emirate: string | null;
  communities: string[];
  timeline: Timeline;
  financing: Financing;
  completionPreference: CompletionStatus | null;
  mustHaves: string[];
  niceToHaves: string[];
  summary: string | null;
  missingFields: string[];
}

export interface ListingView {
  refCode: string;
  title: string;
  community: string;
  emirate: string;
  type: PropertyType;
  listingType: ListingType;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  priceAed: number;
  view: string | null;
  amenities: string[];
  completionStatus: CompletionStatus;
  handoverDate: Date | null;
  furnished: boolean;
  /** Why the AI matched it, when known. */
  reason?: string | null;
}

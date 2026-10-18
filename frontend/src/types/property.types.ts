import type { IntentLevel, LeadStatus, ViewingStatus } from './lead.types';

export interface PropertyFeature {
  icon: 'bed' | 'bath' | 'area' | 'view' | 'pool' | 'parking';
  label: string;
}

export interface MatchedProperty {
  id: string;
  title: string;
  community: string;
  priceAed: number;
  imageUrl: string;
  summary: string;
  matchedLeads: number;
  features: PropertyFeature[];
}

export type PropertyType = 'APARTMENT' | 'VILLA' | 'TOWNHOUSE' | 'PENTHOUSE' | 'STUDIO' | 'PLOT' | 'OFFICE';
export type ListingType = 'SALE' | 'RENT';
export type PropertyStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';

/** One listing (GET /properties rows; matches also embed it). */
export interface Property {
  id: string;
  refCode: string;
  title: string;
  description: string;
  type: PropertyType;
  listingType: ListingType;
  /** Sale price, or yearly rent for RENT listings. */
  priceAed: number;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  emirate: string;
  community: string;
  building: string | null;
  lat: number;
  lng: number;
  developer: string | null;
  completionStatus: 'READY' | 'OFF_PLAN';
  handoverDate: string | null;
  furnished: boolean;
  view: string | null;
  amenities: string[];
  imageUrls: string[];
  status: PropertyStatus;
  createdAt: string;
  /** Only on list rows. */
  matchedLeads?: number;
}

/** GET /properties/:id */
export interface PropertyDetail extends Property {
  matches: {
    id: string;
    aiFitScore: number | null;
    aiReason: string | null;
    lead: { id: string; fullName: string; score: number | null; intentLevel: IntentLevel | null; status: LeadStatus };
  }[];
  viewings: { id: string; leadId: string; scheduledAt: string; status: ViewingStatus }[];
}

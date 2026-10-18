import type { ListingType, PropertyStatus, PropertyType, ViewingStatus } from '@/types';
import type { Tone } from './lead-meta';

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  APARTMENT: 'Apartment',
  VILLA: 'Villa',
  TOWNHOUSE: 'Townhouse',
  PENTHOUSE: 'Penthouse',
  STUDIO: 'Studio',
  PLOT: 'Plot',
  OFFICE: 'Office',
};

export const LISTING_LABEL: Record<ListingType, string> = { SALE: 'For sale', RENT: 'For rent' };

export const PROPERTY_STATUS_META: Record<PropertyStatus, { label: string; tone: Tone }> = {
  AVAILABLE: { label: 'Available', tone: 'success' },
  RESERVED: { label: 'Reserved', tone: 'warning' },
  SOLD: { label: 'Sold', tone: 'neutral' },
};

export const VIEWING_STATUS_META: Record<ViewingStatus, { label: string; tone: Tone }> = {
  SCHEDULED: { label: 'Scheduled', tone: 'info' },
  CONFIRMED: { label: 'Confirmed', tone: 'primary' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  NO_SHOW: { label: 'No-show', tone: 'danger' },
};

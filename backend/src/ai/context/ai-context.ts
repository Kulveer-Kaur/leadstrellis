import type { Lead, LeadRequirement, Property } from '../../generated/prisma/client.js';
import { formatAed } from '../../utils/currency.js';
import type { LeadProfile, ListingView, RequirementView } from './ai-context.types.js';

export const toRequirementView = (r: LeadRequirement): RequirementView => ({
  purpose: r.purpose,
  propertyTypes: r.propertyTypes,
  bedroomsMin: r.bedroomsMin,
  bedroomsMax: r.bedroomsMax,
  budgetMin: r.budgetMin,
  budgetMax: r.budgetMax,
  emirate: r.emirate,
  communities: r.communities,
  timeline: r.timeline,
  financing: r.financing,
  completionPreference: r.completionPreference,
  mustHaves: r.mustHaves,
  niceToHaves: r.niceToHaves,
  summary: r.summary,
  missingFields: r.missingFields,
});

export const toLeadProfile = (lead: Lead & { requirement?: LeadRequirement | null }): LeadProfile => ({
  fullName: lead.fullName,
  firstName: lead.fullName.split(/\s+/)[0] ?? lead.fullName,
  source: lead.source,
  language: lead.language,
  rawMessage: lead.rawMessage,
  intentLevel: lead.intentLevel,
  score: lead.score,
  requirement: lead.requirement ? toRequirementView(lead.requirement) : null,
});

export const toListingView = (p: Property, reason?: string | null): ListingView => ({
  refCode: p.refCode,
  title: p.title,
  community: p.community,
  emirate: p.emirate,
  type: p.type,
  listingType: p.listingType,
  bedrooms: p.bedrooms,
  bathrooms: p.bathrooms,
  areaSqft: p.areaSqft,
  priceAed: p.priceAed,
  view: p.view,
  amenities: p.amenities,
  completionStatus: p.completionStatus,
  handoverDate: p.handoverDate,
  furnished: p.furnished,
  reason,
});

const range = (min: number | null, max: number | null, fmt: (n: number) => string) =>
  min != null && max != null ? (min === max ? fmt(min) : `${fmt(min)}–${fmt(max)}`) : max != null ? `up to ${fmt(max)}` : min != null ? `from ${fmt(min)}` : 'unknown';

const beds = (n: number) => (n === 0 ? 'studio' : `${n}BR`);

/** Compact, labelled requirement block for prompts. */
export function describeRequirement(r: RequirementView | null): string {
  if (!r) return 'No structured requirements yet.';
  const rent = r.purpose === 'RENT';
  return [
    `Purpose: ${r.purpose ?? 'unknown'}`,
    `Type: ${r.propertyTypes.join(', ') || 'unknown'}`,
    `Bedrooms: ${range(r.bedroomsMin, r.bedroomsMax, beds)}`,
    `Budget: ${range(r.budgetMin, r.budgetMax, formatAed)}${rent ? ' per year' : ''}`,
    `Location: ${r.communities.join(', ') || r.emirate || 'unknown'}`,
    `Timeline: ${r.timeline}`,
    `Financing: ${r.financing}`,
    `Ready/off-plan: ${r.completionPreference ?? 'either'}`,
    `Must-haves: ${r.mustHaves.join(', ') || 'none stated'}`,
    `Nice-to-haves: ${r.niceToHaves.join(', ') || 'none stated'}`,
    `Missing info: ${r.missingFields.join(', ') || 'none'}`,
  ].join('\n');
}

/** One listing per line: the only facts the AI is allowed to use about a property. */
export function describeListing(l: ListingView): string {
  const handover = l.completionStatus === 'OFF_PLAN' && l.handoverDate ? ` handover ${l.handoverDate.toISOString().slice(0, 7)}` : '';
  const price = `${formatAed(l.priceAed)}${l.listingType === 'RENT' ? '/yr' : ''}`;
  return [
    `[${l.refCode}] ${l.title}`,
    `${l.community}, ${l.emirate}`,
    `${l.type} for ${l.listingType}`,
    `${beds(l.bedrooms)}, ${l.bathrooms} bath, ${l.areaSqft} sqft`,
    price,
    `${l.completionStatus}${handover}`,
    l.view ? `view: ${l.view}` : null,
    l.furnished ? 'furnished' : null,
    l.amenities.length ? `amenities: ${l.amenities.slice(0, 6).join(', ')}` : null,
  ]
    .filter(Boolean)
    .join(' | ');
}

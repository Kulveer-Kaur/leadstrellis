import type { LeadRequirementSummary } from '@/types';

/** "2BR villa · JVC". Avoids "Studio studio" when the bedrooms and the type are both Studio. */
export function describeNeed(r: LeadRequirementSummary) {
  const type = r.propertyType.toLowerCase();
  const what = r.bedrooms.toLowerCase() === type ? r.bedrooms : `${r.bedrooms} ${type}`;
  return `${what} · ${r.community}`;
}

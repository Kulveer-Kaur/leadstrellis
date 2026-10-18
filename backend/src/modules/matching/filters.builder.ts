import type { RequirementView } from '../../ai/context/ai-context.types.js';
import { findCommunity } from '../../constants/uae-locations.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { PropertyType } from '../../generated/prisma/enums.js';

/**
 * Stage 1 of matching: SQL hard filters. Level 0 is strict; each level relaxes one
 * constraint (nearby communities → budget +20% → bedrooms ±1 and related types → whole emirate).
 */
export const MAX_RELAX_LEVEL = 4;

const RELATED_TYPES: Partial<Record<PropertyType, PropertyType[]>> = {
  APARTMENT: ['APARTMENT', 'PENTHOUSE', 'STUDIO'],
  STUDIO: ['STUDIO', 'APARTMENT'],
  PENTHOUSE: ['PENTHOUSE', 'APARTMENT'],
  VILLA: ['VILLA', 'TOWNHOUSE'],
  TOWNHOUSE: ['TOWNHOUSE', 'VILLA'],
};

export function buildPropertyFilter(r: RequirementView, level: number): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = {
    status: 'AVAILABLE',
    listingType: r.purpose === 'RENT' ? 'RENT' : 'SALE',
  };

  // Property type
  if (r.propertyTypes.length) {
    const types = level >= 3 ? [...new Set(r.propertyTypes.flatMap((t) => RELATED_TYPES[t] ?? [t]))] : r.propertyTypes;
    where.type = { in: types };
  } else {
    where.type = { notIn: ['OFFICE', 'PLOT'] }; // homes only unless commercial was asked for
  }

  // Bedrooms
  if (r.bedroomsMin != null) {
    const slack = level >= 3 ? 1 : 0;
    where.bedrooms = { gte: Math.max(0, r.bedroomsMin - slack), lte: (r.bedroomsMax ?? r.bedroomsMin) + slack };
  }

  // Budget: +5% always (a slightly-over listing can still be the best home), +20% from level 2.
  if (r.budgetMax != null) {
    const ceiling = level >= 2 ? 1.2 : 1.05;
    where.priceAed = { lte: Math.round(r.budgetMax * ceiling), ...(r.budgetMin ? { gte: Math.round(r.budgetMin * 0.75) } : {}) };
  }

  // Location
  const emirate = r.emirate ?? (r.communities[0] ? findCommunity(r.communities[0])?.emirate : undefined);
  if (level >= 4 && emirate) {
    where.emirate = emirate;
  } else if (r.communities.length) {
    const communities = level >= 1 ? [...new Set(r.communities.flatMap((c) => [c, ...(findCommunity(c)?.nearby ?? [])]))] : r.communities;
    where.community = { in: communities };
  } else if (r.emirate) {
    where.emirate = r.emirate;
  }

  if (r.completionPreference && level < 2) where.completionStatus = r.completionPreference;
  return where;
}

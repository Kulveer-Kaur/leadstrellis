import type { RequirementView } from '../ai/context/ai-context.types.js';
import type { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

/** Median asking price of available listings comparable to the requirement (same purpose, type, beds, area). */
export async function marketMedianFor(r: RequirementView | null): Promise<number | null> {
  if (!r) return null;
  const where: Prisma.PropertyWhereInput = {
    status: 'AVAILABLE',
    listingType: r.purpose === 'RENT' ? 'RENT' : 'SALE',
    ...(r.propertyTypes.length ? { type: { in: r.propertyTypes } } : {}),
    ...(r.bedroomsMin != null ? { bedrooms: { gte: r.bedroomsMin, lte: r.bedroomsMax ?? r.bedroomsMin } } : {}),
    ...(r.communities.length ? { community: { in: r.communities } } : r.emirate ? { emirate: r.emirate } : {}),
  };
  const rows = await prisma.property.findMany({ where, select: { priceAed: true }, take: 200 });
  if (rows.length < 2) return null;
  const prices = rows.map((p) => p.priceAed).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  return prices.length % 2 ? prices[mid] : Math.round((prices[mid - 1] + prices[mid]) / 2);
}

import { describe, expect, it } from 'vitest';
import type { RequirementView } from '../../src/ai/context/ai-context.types.js';
import type { Property } from '../../src/generated/prisma/client.js';
import { prescore } from '../../src/modules/matching/prescore.js';

const req: RequirementView = {
  purpose: 'BUY',
  propertyTypes: ['APARTMENT'],
  bedroomsMin: 2,
  bedroomsMax: 2,
  budgetMin: null,
  budgetMax: 2_400_000,
  emirate: 'Dubai',
  communities: ['Dubai Marina'],
  timeline: 'IMMEDIATE',
  financing: 'CASH',
  completionPreference: 'READY',
  mustHaves: ['sea view'],
  niceToHaves: [],
  summary: null,
  missingFields: [],
};

const listing = (over: Partial<Property>): Property =>
  ({
    refCode: 'EP-1',
    type: 'APARTMENT',
    listingType: 'SALE',
    priceAed: 2_200_000,
    bedrooms: 2,
    community: 'Dubai Marina',
    emirate: 'Dubai',
    view: 'Sea',
    amenities: [],
    description: '',
    furnished: false,
    completionStatus: 'READY',
    ...over,
  }) as Property;

describe('prescore', () => {
  it('ranks an exact match above a wrong-bedroom one', () => {
    const exact = prescore(req, listing({}));
    const oneBed = prescore(req, listing({ bedrooms: 1, priceAed: 1_700_000 }));
    expect(exact.prescore).toBeGreaterThan(oneBed.prescore);
    expect(exact.matched).toEqual(expect.arrayContaining(['in Dubai Marina', '2 bedrooms', 'sea view']));
  });

  it('penalises going over budget and reports by how much', () => {
    const over = prescore(req, listing({ priceAed: 2_640_000 }));
    expect(over.overBudgetPct).toBeCloseTo(10, 0);
    expect(over.prescore).toBeLessThan(prescore(req, listing({})).prescore);
  });

  it('gives partial credit to a nearby community', () => {
    const nearby = prescore(req, listing({ community: 'JLT' }));
    expect(nearby.matched.some((m) => m.includes('next to your preferred area'))).toBe(true);
  });
});

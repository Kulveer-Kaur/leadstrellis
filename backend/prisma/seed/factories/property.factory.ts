import { findCommunity } from '../../../src/constants/uae-locations.js';
import type { Prisma } from '../../../src/generated/prisma/client.js';
import type { PropertyType } from '../../../src/generated/prisma/enums.js';
import type { CommunityProfile } from '../data/community-profiles.data.js';
import { PROPERTY_IMAGES } from '../data/property-images.data.js';
import { createImageAllocator, imagesFor } from '../images/image-plan.js';
import type { createRandom } from '../utils/random.js';

type Random = ReturnType<typeof createRandom>;

/** One allocator per seed run: every listing gets photos no other listing uses. */
const takeImage = createImageAllocator(PROPERTY_IMAGES);

const BEDS: Record<PropertyType, number[]> = {
  STUDIO: [0],
  APARTMENT: [1, 1, 2, 2, 3],
  PENTHOUSE: [3, 4, 5],
  TOWNHOUSE: [3, 3, 4],
  VILLA: [4, 5, 6],
  OFFICE: [0],
  PLOT: [0],
};
const SQFT_PER_BED: Record<PropertyType, (beds: number) => number> = {
  STUDIO: () => 450,
  APARTMENT: (b) => 450 + b * 420,
  PENTHOUSE: (b) => 1400 + b * 700,
  TOWNHOUSE: (b) => 900 + b * 500,
  VILLA: (b) => 1500 + b * 850,
  OFFICE: () => 1200,
  PLOT: () => 6000,
};
/** Villas/penthouses trade at a premium per sqft; studios at a slight discount. */
const PPSF_FACTOR: Partial<Record<PropertyType, number>> = { PENTHOUSE: 1.35, VILLA: 1.1, STUDIO: 0.95, OFFICE: 0.8 };

const AMENITIES = {
  building: ['Gym', 'Pool', 'Concierge', '24/7 security', 'Covered parking', 'Kids play area', 'Sauna', 'Residents lounge'],
  villa: ['Private pool', 'Private garden', "Maid's room", 'Driver room', 'Covered parking', 'Community pool', 'BBQ area', 'Smart home'],
  extras: ['Near metro', 'Pet friendly', 'Balcony', 'Study room', 'Walk-in wardrobe', 'Built-in wardrobes', 'Near schools', 'Beach access'],
};

const TYPE_LABEL: Record<PropertyType, string> = {
  APARTMENT: 'apartment',
  STUDIO: 'studio',
  PENTHOUSE: 'penthouse',
  TOWNHOUSE: 'townhouse',
  VILLA: 'villa',
  OFFICE: 'office',
  PLOT: 'plot',
};

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function buildProperty(profile: CommunityProfile, index: number, ref: number, rnd: Random): Prisma.PropertyCreateInput {
  const community = findCommunity(profile.community)!;
  const type = profile.mix[index % profile.mix.length];
  const bedrooms = rnd.pick(BEDS[type]);
  const areaSqft = roundTo(SQFT_PER_BED[type](bedrooms) * rnd.between(0.9, 1.2), 10);
  const isVilla = type === 'VILLA' || type === 'TOWNHOUSE';
  const isRent = type !== 'PENTHOUSE' && type !== 'VILLA' ? rnd.chance(0.42) : rnd.chance(0.15);
  const offPlan = !isRent && rnd.chance(profile.offPlanShare);

  const salePrice = areaSqft * profile.ppsf * (PPSF_FACTOR[type] ?? 1) * rnd.between(0.9, 1.15);
  const priceAed = isRent ? roundTo((salePrice * profile.yieldPct) / 100, 5000) : roundTo(salePrice, 10000);

  const building = rnd.pick(profile.buildings);
  const view = rnd.chance(0.75) ? rnd.pick(profile.views) : null;
  const amenities = [
    ...rnd.sample(isVilla ? AMENITIES.villa : AMENITIES.building, rnd.int(3, 5)),
    ...rnd.sample(AMENITIES.extras, rnd.int(1, 3)),
    ...(bedrooms >= 3 && !isVilla && rnd.chance(0.5) ? ["Maid's room"] : []),
  ];
  const furnished = isRent ? rnd.chance(0.45) : rnd.chance(0.15);
  const handoverDate = offPlan ? new Date(Date.UTC(rnd.pick([2027, 2027, 2028]), rnd.pick([2, 5, 8, 11]), 1)) : null;

  const bedLabel = bedrooms === 0 ? '' : `${bedrooms}BR `;
  const title = `${bedLabel}${TYPE_LABEL[type]} in ${building}`.replace(/^./, (c) => c.toUpperCase());
  const description = [
    `${bedrooms ? `${bedrooms}-bedroom ` : ''}${TYPE_LABEL[type]} of ${areaSqft.toLocaleString('en-AE')} sqft in ${building}, ${profile.community}.`,
    view ? `${view} views from the main living area.` : 'Bright layout with large windows.',
    offPlan ? `Off-plan by ${profile.developer} with a post-handover payment plan; handover ${handoverDate!.getUTCFullYear()}.` : `Ready to move in${furnished ? ', fully furnished' : ''}.`,
    `Highlights: ${amenities.slice(0, 4).join(', ').toLowerCase()}.`,
  ].join(' ');

  const imageUrls = imagesFor(type, ref, takeImage);

  return {
    refCode: `EP-${ref}`,
    title,
    description,
    type,
    listingType: isRent ? 'RENT' : 'SALE',
    priceAed,
    bedrooms,
    bathrooms: Math.max(1, bedrooms + (isVilla ? 1 : rnd.int(0, 1))),
    areaSqft,
    emirate: community.emirate,
    community: profile.community,
    building,
    lat: community.lat + rnd.between(-0.006, 0.006),
    lng: community.lng + rnd.between(-0.006, 0.006),
    developer: profile.developer,
    completionStatus: offPlan ? 'OFF_PLAN' : 'READY',
    handoverDate,
    furnished,
    view: view ? `${view}` : null,
    amenities,
    imageUrls,
    status: rnd.chance(0.9) ? 'AVAILABLE' : rnd.pick(['RESERVED', 'SOLD'] as const),
  };
}

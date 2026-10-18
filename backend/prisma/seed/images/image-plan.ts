import type { PropertyType } from '../../../src/generated/prisma/enums.js';

/** Kinds of photo a listing can use. Each listing gets three: a cover and two inside shots. */
export const IMAGE_CATEGORIES = ['house', 'tower', 'living', 'bedroom', 'kitchen', 'studio', 'bathroom', 'office'] as const;
export type ImageCategory = (typeof IMAGE_CATEGORIES)[number];
export type ImagePool = Record<ImageCategory, string[]>;

/**
 * Which photo goes in each slot, by property type. The third slot alternates on the ref
 * number so a block of apartments does not all end on a kitchen.
 */
export function slotsFor(type: PropertyType, ref: number): [ImageCategory, ImageCategory, ImageCategory] {
  const even = ref % 2 === 0;
  switch (type) {
    case 'VILLA':
    case 'TOWNHOUSE':
      return ['house', 'living', even ? 'kitchen' : 'bedroom'];
    case 'APARTMENT':
      return ['tower', 'living', even ? 'bedroom' : 'kitchen'];
    case 'PENTHOUSE':
      return ['tower', 'living', 'bedroom'];
    case 'STUDIO':
      return ['studio', even ? 'kitchen' : 'bathroom', 'studio'];
    case 'OFFICE':
    case 'PLOT':
      return ['office', 'office', 'office'];
  }
}

/** Where to borrow from when a kind runs out, before any photo is used twice. */
const FALLBACK: Record<ImageCategory, ImageCategory[]> = {
  house: ['living', 'kitchen'],
  tower: ['living', 'bedroom'],
  living: ['bedroom', 'kitchen', 'studio'],
  bedroom: ['living', 'studio'],
  kitchen: ['living', 'studio'],
  studio: ['living', 'bedroom', 'kitchen'],
  bathroom: ['kitchen', 'living'],
  office: ['living', 'tower'],
};

/**
 * Hands out photos in order, never the same one twice while any related kind still has an
 * unused photo (it repeats only if far more listings are seeded than there are photos).
 * Seeding runs in a fixed order, so every re-seed gives each listing the same photos.
 */
export function createImageAllocator(pool: ImagePool) {
  const used = new Set<string>();
  const next: Partial<Record<ImageCategory, number>> = {};
  const fresh = (c: ImageCategory) => {
    const list = pool[c];
    for (let i = next[c] ?? 0; i < list.length; i++) {
      if (used.has(list[i]!)) continue;
      next[c] = i + 1;
      return list[i]!;
    }
    return undefined;
  };
  let repeats = 0;
  return (category: ImageCategory) => {
    for (const c of [category, ...FALLBACK[category]]) {
      const url = fresh(c);
      if (url) {
        used.add(url);
        return url;
      }
    }
    const list = pool[category].length ? pool[category] : pool.living;
    return list[repeats++ % list.length]!;
  };
}

export function imagesFor(type: PropertyType, ref: number, take: (c: ImageCategory) => string) {
  return slotsFor(type, ref).map(take);
}

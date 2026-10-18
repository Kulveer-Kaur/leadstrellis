import { z } from 'zod';
import { CompletionStatus, ListingType, PropertyStatus, PropertyType } from '../../generated/prisma/enums.js';

export const listPropertiesQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
  search: z.string().trim().optional(),
  emirate: z.string().optional(),
  community: z.string().optional(),
  type: z.enum(PropertyType).optional(),
  listingType: z.enum(ListingType).optional(),
  status: z.enum(PropertyStatus).optional(),
  bedrooms: z.coerce.number().int().min(0).max(10).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  sort: z.enum(['priceAed', '-priceAed', '-createdAt']).default('-createdAt'),
});
export type ListPropertiesQuery = z.infer<typeof listPropertiesQuery>;

export const propertySchema = z.object({
  refCode: z.string().trim().min(3).max(20),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(4000),
  type: z.enum(PropertyType),
  listingType: z.enum(ListingType),
  priceAed: z.number().int().positive(),
  bedrooms: z.number().int().min(0).max(10),
  bathrooms: z.number().int().min(0).max(12),
  areaSqft: z.number().int().positive(),
  emirate: z.string().trim(),
  community: z.string().trim(),
  building: z.string().trim().nullable().optional(),
  lat: z.number().optional().default(25.2048),
  lng: z.number().optional().default(55.2708),
  developer: z.string().trim().nullable().optional(),
  completionStatus: z.enum(CompletionStatus).default('READY'),
  handoverDate: z.coerce.date().nullable().optional(),
  furnished: z.boolean().default(false),
  view: z.string().trim().nullable().optional(),
  amenities: z.array(z.string()).default([]),
  imageUrls: z.array(z.string()).default([]),
  status: z.enum(PropertyStatus).default('AVAILABLE'),
});

export const updatePropertySchema = propertySchema.partial();

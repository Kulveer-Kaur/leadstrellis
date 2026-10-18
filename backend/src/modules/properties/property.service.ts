import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { pageMeta, toSkipTake } from '../../utils/pagination.js';
import type { ListPropertiesQuery } from './property.validation.js';

export async function listProperties(q: ListPropertiesQuery) {
  const where: Prisma.PropertyWhereInput = {
    emirate: q.emirate,
    community: q.community,
    type: q.type,
    listingType: q.listingType,
    status: q.status,
    bedrooms: q.bedrooms,
    priceAed: q.minPrice || q.maxPrice ? { gte: q.minPrice, lte: q.maxPrice } : undefined,
    ...(q.search
      ? { OR: [{ title: { contains: q.search, mode: 'insensitive' } }, { community: { contains: q.search, mode: 'insensitive' } }, { refCode: { equals: q.search, mode: 'insensitive' } }] }
      : {}),
  };
  const orderBy: Prisma.PropertyOrderByWithRelationInput =
    q.sort === 'priceAed' ? { priceAed: 'asc' } : q.sort === '-priceAed' ? { priceAed: 'desc' } : { createdAt: 'desc' };
  const [rows, total] = await prisma.$transaction([
    prisma.property.findMany({ where, orderBy, ...toSkipTake(q.page, q.pageSize), include: { _count: { select: { matches: { where: { finalRank: { not: null } } } } } } }),
    prisma.property.count({ where }),
  ]);
  return { data: rows.map(({ _count, ...p }) => ({ ...p, matchedLeads: _count.matches })), meta: pageMeta(q.page, q.pageSize, total) };
}

export async function getProperty(id: string) {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      matches: {
        where: { finalRank: { not: null } },
        orderBy: { aiFitScore: 'desc' },
        include: { lead: { select: { id: true, fullName: true, score: true, intentLevel: true, status: true } } },
      },
      viewings: { orderBy: { scheduledAt: 'desc' }, take: 10 },
    },
  });
  if (!property) throw ApiError.notFound('Property');
  return property;
}

export const createProperty = (data: Prisma.PropertyCreateInput) => prisma.property.create({ data });
export const updateProperty = (id: string, data: Prisma.PropertyUpdateInput) => prisma.property.update({ where: { id }, data });

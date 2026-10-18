import type { PageMeta } from './api-response.js';

export const toSkipTake = (page: number, pageSize: number) => ({ skip: (page - 1) * pageSize, take: pageSize });

export const pageMeta = (page: number, pageSize: number, total: number): PageMeta => ({
  page,
  pageSize,
  total,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
});

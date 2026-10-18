import type { Response } from 'express';

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Success shape: { success: true, data, meta? } (see IMPLEMENTATION_PLAN.md §8). */
export const ok = <T>(res: Response, data: T, meta?: PageMeta, status = 200) =>
  res.status(status).json(meta ? { success: true, data, meta } : { success: true, data });

export const created = <T>(res: Response, data: T) => ok(res, data, undefined, 201);

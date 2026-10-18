import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { isProd } from '../config/env.js';
import { Prisma } from '../generated/prisma/client.js';
import { logger } from '../lib/logger.js';
import { ApiError } from '../utils/api-error.js';

/** Error shape: { success: false, error: { code, message, details? } }. */
export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ success: false, error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details } });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Record not found' } });
    if (err.code === 'P2002') return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Record already exists' } });
  }

  logger.error({ err, path: req.path }, 'unhandled error');
  const message = isProd ? 'Something went wrong' : err instanceof Error ? err.message : String(err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
}

export function notFoundMiddleware(req: Request, res: Response) {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` } });
}

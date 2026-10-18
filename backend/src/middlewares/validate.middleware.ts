import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';

interface Schemas {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}

/**
 * Zod request validation. The parsed body replaces req.body; parsed query and params
 * (Express 5 makes req.query read-only) are stored on req.validated.
 * Failures throw ZodError, which the error middleware turns into a 400.
 */
export const validate = (schemas: Schemas) => (req: Request, _res: Response, next: NextFunction) => {
  if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
  req.validated = {
    query: schemas.query ? schemas.query.parse(req.query) : undefined,
    params: schemas.params ? schemas.params.parse(req.params) : undefined,
  };
  next();
};

export const getQuery = <T>(req: Request) => req.validated?.query as T;
export const getParams = <T>(req: Request) => req.validated?.params as T;

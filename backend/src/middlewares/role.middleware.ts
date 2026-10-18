import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../generated/prisma/enums.js';
import { ApiError } from '../utils/api-error.js';

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };

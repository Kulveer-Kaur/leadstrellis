import type { NextFunction, Request, Response } from 'express';
import { AUTH_COOKIE, verifyToken } from '../modules/auth/token.js';
import { ApiError } from '../utils/api-error.js';

/** Accepts `Authorization: Bearer <jwt>` or the httpOnly auth cookie. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : (req.cookies?.[AUTH_COOKIE] as string | undefined);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return next(ApiError.unauthorized());
  req.user = { id: payload.sub, role: payload.role, email: payload.email };
  next();
}

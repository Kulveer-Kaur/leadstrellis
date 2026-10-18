import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.js';
import type { Role } from '../../generated/prisma/enums.js';

export interface TokenPayload {
  sub: string;
  role: Role;
  email: string;
}

export const signToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] });

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export const AUTH_COOKIE = 'ep_token';

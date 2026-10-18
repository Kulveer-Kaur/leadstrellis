import type { Request, Response } from 'express';
import { env, isProd } from '../../config/env.js';
import { ok } from '../../utils/api-response.js';
import * as authService from './auth.service.js';
import { AUTH_COOKIE } from './token.js';

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body);
  res.cookie(AUTH_COOKIE, result.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : isProd,
    maxAge: 7 * 86_400_000,
  });
  ok(res, result);
}

export async function me(req: Request, res: Response) {
  ok(res, await authService.me(req.user!.id));
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(AUTH_COOKIE);
  ok(res, { loggedOut: true });
}

export async function getInvite(req: Request, res: Response) {
  const user = await authService.verifyInvite(req.params.token as string);
  ok(res, { valid: true, user });
}

export async function acceptInvite(req: Request, res: Response) {
  const result = await authService.acceptInvite(req.params.token as string, req.body.password);
  res.cookie(AUTH_COOKIE, result.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : isProd,
    maxAge: 7 * 86_400_000,
  });
  ok(res, result);
}

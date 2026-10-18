import type { Request, Response } from 'express';
import { ok } from '../../utils/api-response.js';
import { getTopMatches, refreshMatches } from './matching.service.js';

export async function list(req: Request, res: Response) {
  ok(res, await getTopMatches(req.params.id as string, 10));
}

export async function refresh(req: Request, res: Response) {
  ok(res, await refreshMatches(req.params.id as string));
}

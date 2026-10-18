import type { Request, Response } from 'express';
import type { z } from 'zod';
import { created, ok } from '../../utils/api-response.js';
import * as service from './call.service.js';
import type { simulatedTurnSchema, startCallSchema } from './call.validation.js';

export async function start(req: Request, res: Response) {
  const body = req.body as z.infer<typeof startCallSchema>;
  created(res, await service.startCall(req.params.id as string, { actorType: 'USER', mode: body.mode }));
}

export async function listForLead(req: Request, res: Response) {
  ok(res, await service.listCalls(req.params.id as string));
}

export async function list(_req: Request, res: Response) {
  ok(res, await service.listCalls());
}

export async function get(req: Request, res: Response) {
  ok(res, await service.getCall(req.params.callId as string));
}

export async function turn(req: Request, res: Response) {
  const body = req.body as z.infer<typeof simulatedTurnSchema>;
  ok(res, await service.simulatedTurn(req.params.callId as string, body.text));
}

export async function end(req: Request, res: Response) {
  ok(res, await service.endCall(req.params.callId as string));
}

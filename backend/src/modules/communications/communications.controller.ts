import type { Request, Response } from 'express';
import type { z } from 'zod';
import { created, ok } from '../../utils/api-response.js';
import * as service from './communications.service.js';
import type { draftMessageSchema, sendMessageSchema } from './communications.validation.js';

export async function list(req: Request, res: Response) {
  ok(res, await service.listMessages(req.params.id as string));
}

export async function send(req: Request, res: Response) {
  const body = req.body as z.infer<typeof sendMessageSchema>;
  const message = await service.sendMessage({ leadId: req.params.id as string, actorType: 'USER', ...body });
  created(res, message);
}

export async function draft(req: Request, res: Response) {
  const body = req.body as z.infer<typeof draftMessageSchema>;
  ok(res, await service.draftMessage(req.params.id as string, body.channel, body.purpose));
}

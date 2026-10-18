import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getQuery, validate } from '../../middlewares/validate.middleware.js';
import { ok } from '../../utils/api-response.js';
import { listConversations } from './conversations.service.js';

const listQuery = z.object({
  search: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(60),
});

/** Inbox: conversations across all leads. A single thread is GET /leads/:id/messages. */
export const conversationRoutes = Router();

conversationRoutes.get('/', validate({ query: listQuery }), async (req: Request, res: Response) =>
  ok(res, await listConversations(getQuery<z.infer<typeof listQuery>>(req))),
);

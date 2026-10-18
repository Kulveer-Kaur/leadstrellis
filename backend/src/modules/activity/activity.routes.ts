import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { ActorType } from '../../generated/prisma/enums.js';
import { getQuery, validate } from '../../middlewares/validate.middleware.js';
import { ok } from '../../utils/api-response.js';
import { listActivity } from './activity.service.js';

const querySchema = z.object({
  actor: z.enum(ActorType).optional(),
  leadId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const activityRoutes = Router();

activityRoutes.get('/', validate({ query: querySchema }), async (req: Request, res: Response) => {
  const q = getQuery<z.infer<typeof querySchema>>(req);
  ok(res, await listActivity({ leadId: q.leadId, actorType: q.actor, limit: q.limit }));
});

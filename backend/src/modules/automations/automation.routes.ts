import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireRole } from '../../middlewares/role.middleware.js';
import { getQuery, validate } from '../../middlewares/validate.middleware.js';
import { ok } from '../../utils/api-response.js';
import { listRules, listRuns, setRuleActive } from './automation.service.js';

const runsQuery = z.object({ ruleId: z.string().optional(), leadId: z.string().optional(), limit: z.coerce.number().int().min(1).max(200).default(50) });

export const automationRoutes = Router();

automationRoutes.get('/', async (_req: Request, res: Response) => ok(res, await listRules()));
automationRoutes.get('/runs', validate({ query: runsQuery }), async (req: Request, res: Response) => ok(res, await listRuns(getQuery<z.infer<typeof runsQuery>>(req))));
automationRoutes.patch('/:id', requireRole('ADMIN'), validate({ body: z.object({ active: z.boolean() }) }), async (req: Request, res: Response) =>
  ok(res, await setRuleActive(req.params.id as string, req.body.active)),
);

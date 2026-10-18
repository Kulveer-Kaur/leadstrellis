import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { ViewingStatus } from '../../generated/prisma/enums.js';
import { getQuery, validate } from '../../middlewares/validate.middleware.js';
import { created, ok } from '../../utils/api-response.js';
import { createViewing, listViewings, updateViewing } from './viewing.service.js';

const listQuery = z.object({
  upcoming: z.stringbool().default(false),
  hours: z.coerce.number().int().positive().max(24 * 60).optional(),
  leadId: z.string().optional(),
});
const createSchema = z.object({
  leadId: z.string(),
  propertyId: z.string(),
  scheduledAt: z.coerce.date(),
  agentId: z.string().optional(),
  notes: z.string().max(2000).optional(),
});
const updateSchema = z.object({
  status: z.enum(ViewingStatus).optional(),
  scheduledAt: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
});

export const viewingRoutes = Router();

viewingRoutes.get('/', validate({ query: listQuery }), async (req: Request, res: Response) => ok(res, await listViewings(getQuery<z.infer<typeof listQuery>>(req))));
viewingRoutes.post('/', validate({ body: createSchema }), async (req: Request, res: Response) => created(res, await createViewing({ ...req.body, bookedBy: 'USER' })));
viewingRoutes.patch('/:id', validate({ body: updateSchema }), async (req: Request, res: Response) => ok(res, await updateViewing(req.params.id as string, req.body)));

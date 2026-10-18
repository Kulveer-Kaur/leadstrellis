import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { TaskStatus } from '../../generated/prisma/enums.js';
import { getQuery, validate } from '../../middlewares/validate.middleware.js';
import { ok } from '../../utils/api-response.js';
import { listTasks, updateTask } from './task.service.js';

const listQuery = z.object({ status: z.enum(TaskStatus).optional(), leadId: z.string().optional() });
const updateSchema = z.object({ status: z.enum(TaskStatus).optional(), dueAt: z.coerce.date().optional(), note: z.string().max(2000).optional() });

export const taskRoutes = Router();

taskRoutes.get('/', validate({ query: listQuery }), async (req: Request, res: Response) => ok(res, await listTasks(getQuery<z.infer<typeof listQuery>>(req))));
taskRoutes.patch('/:id', validate({ body: updateSchema }), async (req: Request, res: Response) => ok(res, await updateTask(req.params.id as string, req.body)));

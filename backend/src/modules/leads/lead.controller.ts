import type { Request, Response } from 'express';
import { getQuery } from '../../middlewares/validate.middleware.js';
import { created, ok } from '../../utils/api-response.js';
import { listActivity } from '../activity/activity.service.js';
import * as service from './lead.service.js';
import type { ListLeadsQuery } from './lead.validation.js';

const id = (req: Request) => req.params.id as string;

export async function list(req: Request, res: Response) {
  const { data, meta } = await service.listLeads(getQuery<ListLeadsQuery>(req), req.user);
  ok(res, data, meta);
}

export const get = async (req: Request, res: Response) => ok(res, await service.getLead(id(req), req.user));
export const create = async (req: Request, res: Response) => created(res, await service.createManualLead(req.body, req.user!));
export const update = async (req: Request, res: Response) => ok(res, await service.updateLead(id(req), req.body));
export const updateRequirement = async (req: Request, res: Response) => ok(res, await service.updateRequirement(id(req), req.body));
export const setStatus = async (req: Request, res: Response) => ok(res, await service.setStatus(id(req), req.body.status, 'USER', req.body.reason));
export const reprocess = async (req: Request, res: Response) => ok(res, await service.reprocess(id(req)));
export const timeline = async (req: Request, res: Response) => ok(res, await listActivity({ leadId: id(req), limit: 100 }));

export async function remove(req: Request, res: Response) {
  await service.deleteLead(id(req));
  ok(res, { deleted: true });
}

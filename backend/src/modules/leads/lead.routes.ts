import { Router } from 'express';
import { requireRole } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as callController from '../calls/call.controller.js';
import { startCallSchema } from '../calls/call.validation.js';
import * as messageController from '../communications/communications.controller.js';
import { draftMessageSchema, sendMessageSchema } from '../communications/communications.validation.js';
import * as matchingController from '../matching/matching.controller.js';
import * as controller from './lead.controller.js';
import { changeStatusSchema, createLeadSchema, listLeadsQuery, updateLeadSchema, updateRequirementSchema } from './lead.validation.js';

export const leadRoutes = Router();

leadRoutes.get('/', validate({ query: listLeadsQuery }), controller.list);
leadRoutes.post('/', validate({ body: createLeadSchema }), controller.create);
leadRoutes.get('/:id', controller.get);
leadRoutes.patch('/:id', validate({ body: updateLeadSchema }), controller.update);
leadRoutes.delete('/:id', requireRole('ADMIN'), controller.remove);
leadRoutes.patch('/:id/requirement', validate({ body: updateRequirementSchema }), controller.updateRequirement);
leadRoutes.patch('/:id/status', validate({ body: changeStatusSchema }), controller.setStatus);
leadRoutes.post('/:id/reprocess', controller.reprocess);
leadRoutes.get('/:id/timeline', controller.timeline);

leadRoutes.get('/:id/matches', matchingController.list);
leadRoutes.post('/:id/matches/refresh', matchingController.refresh);

leadRoutes.get('/:id/messages', messageController.list);
leadRoutes.post('/:id/messages', validate({ body: sendMessageSchema }), messageController.send);
leadRoutes.post('/:id/draft-message', validate({ body: draftMessageSchema }), messageController.draft);

leadRoutes.get('/:id/calls', callController.listForLead);
leadRoutes.post('/:id/calls', validate({ body: startCallSchema }), callController.start);

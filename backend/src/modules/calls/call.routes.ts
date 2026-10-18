import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './call.controller.js';
import { simulatedTurnSchema } from './call.validation.js';

/** /calls — lead-scoped call routes live in leads.routes. */
export const callRoutes = Router();

callRoutes.get('/', controller.list);
callRoutes.get('/:callId', controller.get);
callRoutes.post('/:callId/turn', validate({ body: simulatedTurnSchema }), controller.turn);
callRoutes.post('/:callId/end', controller.end);

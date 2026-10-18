import { Router, type Request, type Response } from 'express';
import { requireRole } from '../../middlewares/role.middleware.js';
import { getQuery, validate } from '../../middlewares/validate.middleware.js';
import { created, ok } from '../../utils/api-response.js';
import * as service from './property.service.js';
import { listPropertiesQuery, propertySchema, updatePropertySchema, type ListPropertiesQuery } from './property.validation.js';

export const propertyRoutes = Router();

propertyRoutes.get('/', validate({ query: listPropertiesQuery }), async (req: Request, res: Response) => {
  const { data, meta } = await service.listProperties(getQuery<ListPropertiesQuery>(req));
  ok(res, data, meta);
});
propertyRoutes.get('/:id', async (req: Request, res: Response) => ok(res, await service.getProperty(req.params.id as string)));
propertyRoutes.post('/', requireRole('ADMIN'), validate({ body: propertySchema }), async (req: Request, res: Response) =>
  created(res, await service.createProperty(req.body)),
);
propertyRoutes.patch('/:id', requireRole('ADMIN'), validate({ body: updatePropertySchema }), async (req: Request, res: Response) =>
  ok(res, await service.updateProperty(req.params.id as string, req.body)),
);

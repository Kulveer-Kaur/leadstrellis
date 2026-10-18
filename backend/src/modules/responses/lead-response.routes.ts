import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { intakeLimiter } from '../../middlewares/rate-limit.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ok } from '../../utils/api-response.js';
import { getResponsePage, LATER_MONTHS, recordResponse, RESPONSE_CHOICES } from './lead-response.service.js';

/**
 * Public (no login): the page a lead opens from a one-click button in our emails. Opening
 * the link only reads; the choice is recorded by the POST when they confirm on the page,
 * so email scanners that pre-open links can never unsubscribe or close a lead.
 */
export const leadResponseRoutes = Router();

leadResponseRoutes.get('/:token', async (req: Request, res: Response) => ok(res, await getResponsePage(req.params.token as string)));

leadResponseRoutes.post(
  '/:token',
  intakeLimiter,
  validate({
    body: z.object({
      choice: z.enum(RESPONSE_CHOICES),
      months: z.number().int().refine((m) => (LATER_MONTHS as readonly number[]).includes(m)).optional(),
    }),
  }),
  async (req: Request, res: Response) => ok(res, await recordResponse(req.params.token as string, req.body.choice, req.body.months)),
);

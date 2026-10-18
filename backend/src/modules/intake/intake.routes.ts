import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { intakeLimiter } from '../../middlewares/rate-limit.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './intake.controller.js';
import { emailSchema, instagramSchema, simulateSchema, webFormSchema, whatsappSchema } from './intake.validation.js';

/**
 * Lead capture. The web form is public (rate limited). The WhatsApp / Instagram / email
 * endpoints are dummy webhooks for demos and require auth until real providers are connected.
 */
export const intakeRoutes = Router();

intakeRoutes.post('/web-form', intakeLimiter, validate({ body: webFormSchema }), controller.webForm);
intakeRoutes.post('/whatsapp', requireAuth, validate({ body: whatsappSchema }), controller.whatsapp);
intakeRoutes.post('/instagram', requireAuth, validate({ body: instagramSchema }), controller.instagram);
intakeRoutes.post('/email', requireAuth, validate({ body: emailSchema }), controller.email);
intakeRoutes.post('/simulate', requireAuth, validate({ body: simulateSchema }), controller.simulate);
intakeRoutes.get('/samples', requireAuth, controller.samples);

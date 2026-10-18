import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { loginLimiter } from '../../middlewares/rate-limit.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './auth.controller.js';
import { loginSchema } from './auth.validation.js';

import { z } from 'zod';

export const authRoutes = Router();

authRoutes.post('/login', loginLimiter, validate({ body: loginSchema }), controller.login);
authRoutes.get('/me', requireAuth, controller.me);
authRoutes.post('/logout', controller.logout);
authRoutes.get('/invite/:token', controller.getInvite);
authRoutes.post('/invite/:token/accept', validate({ body: z.object({ password: z.string().min(6, 'Password must be at least 6 characters') }) }), controller.acceptInvite);

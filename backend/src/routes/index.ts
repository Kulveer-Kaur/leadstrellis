import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { leadAiRouteRoutes, publicRoutes } from '../modules/ai-route/ai-route.routes.js';
import { activityRoutes } from '../modules/activity/activity.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { automationRoutes } from '../modules/automations/automation.routes.js';
import { callRoutes } from '../modules/calls/call.routes.js';
import { conversationRoutes } from '../modules/communications/conversations.routes.js';
import { dashboardRoutes } from '../modules/dashboard/dashboard.routes.js';
import { intakeRoutes } from '../modules/intake/intake.routes.js';
import { leadRoutes } from '../modules/leads/lead.routes.js';
import { mediaRoutes } from '../modules/media/media.routes.js';
import { propertyRoutes } from '../modules/properties/property.routes.js';
import { leadResponseRoutes } from '../modules/responses/lead-response.routes.js';
import { settingsRoutes } from '../modules/settings/settings.routes.js';
import { taskRoutes } from '../modules/tasks/task.routes.js';
import { userRoutes } from '../modules/users/users.routes.js';
import { viewingRoutes } from '../modules/viewings/viewing.routes.js';
import { webhookRoutes } from '../modules/webhooks/webhook.routes.js';

/** Everything under /api/v1. Public: auth, intake web form, Twilio webhooks, TTS media, proposal pages, email response links. */
export const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/intake', intakeRoutes);
apiRouter.use('/webhooks', webhookRoutes);
apiRouter.use('/media', mediaRoutes);
apiRouter.use('/public/respond', leadResponseRoutes);
apiRouter.use('/public', publicRoutes);

apiRouter.use('/leads', requireAuth, leadRoutes);
apiRouter.use('/leads', requireAuth, leadAiRouteRoutes);
apiRouter.use('/properties', requireAuth, propertyRoutes);
apiRouter.use('/calls', requireAuth, callRoutes);
apiRouter.use('/viewings', requireAuth, viewingRoutes);
apiRouter.use('/conversations', requireAuth, conversationRoutes);
apiRouter.use('/tasks', requireAuth, taskRoutes);
apiRouter.use('/automations', requireAuth, automationRoutes);
apiRouter.use('/activity', requireAuth, activityRoutes);
apiRouter.use('/dashboard', requireAuth, dashboardRoutes);
apiRouter.use('/users', requireAuth, userRoutes);
apiRouter.use('/settings', requireAuth, settingsRoutes);

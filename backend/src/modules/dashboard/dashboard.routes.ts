import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getQuery, validate } from '../../middlewares/validate.middleware.js';
import { ok } from '../../utils/api-response.js';
import { listRules } from '../automations/automation.service.js';
import { getAgentFeed, getAgentTeam, getEmailStats, getLikelyToWin, getPilotInsights, getRevenueForecast } from './phase2.service.js';
import { getAiRouteBoard } from '../ai-route/ai-route.service.js';
import { getSummary } from './summary.service.js';
import { getAiActivity, getHotspots, getTopMatchedProperties, getUpcomingViewings } from './widgets.service.js';

const summaryQuery = z.object({ period: z.enum(['7d', '30d', 'qtd']).default('30d'), emirate: z.string().default('all') });
const matchesQuery = z.object({ segment: z.enum(['high', 'all']).default('high') });

/** One endpoint per dashboard card (frontend/src/features/dashboard/api/dashboard.api.ts). */
export const dashboardRoutes = Router();

dashboardRoutes.get('/summary', validate({ query: summaryQuery }), async (req: Request, res: Response) => {
  const q = getQuery<z.infer<typeof summaryQuery>>(req);
  ok(res, await getSummary(q.period, q.emirate));
});
dashboardRoutes.get('/hotspots', async (_req: Request, res: Response) => ok(res, await getHotspots()));
dashboardRoutes.get('/top-matches', validate({ query: matchesQuery }), async (req: Request, res: Response) =>
  ok(res, await getTopMatchedProperties(getQuery<z.infer<typeof matchesQuery>>(req).segment)),
);
dashboardRoutes.get('/activity', async (_req: Request, res: Response) => ok(res, await getAiActivity()));
dashboardRoutes.get('/viewings', async (_req: Request, res: Response) => ok(res, await getUpcomingViewings()));
dashboardRoutes.get('/automations', async (_req: Request, res: Response) => ok(res, await listRules()));

// Phase-2 dashboard cards.
dashboardRoutes.get('/agent-feed', async (_req: Request, res: Response) => ok(res, await getAgentFeed()));
dashboardRoutes.get('/agent-team', async (_req: Request, res: Response) => ok(res, await getAgentTeam()));
dashboardRoutes.get('/likely-to-win', async (_req: Request, res: Response) => ok(res, await getLikelyToWin()));
dashboardRoutes.get('/forecast', async (_req: Request, res: Response) => ok(res, await getRevenueForecast()));
dashboardRoutes.get('/email-stats', async (_req: Request, res: Response) => ok(res, await getEmailStats()));
dashboardRoutes.get('/ai-route', async (_req: Request, res: Response) => ok(res, await getAiRouteBoard()));
dashboardRoutes.get('/pilot-insights', async (_req: Request, res: Response) => ok(res, await getPilotInsights()));

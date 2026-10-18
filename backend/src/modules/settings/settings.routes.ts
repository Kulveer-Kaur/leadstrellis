import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { AgentType } from '../../generated/prisma/enums.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ok } from '../../utils/api-response.js';
import { runPilotTick } from '../../agents/pilot/pilot.agent.js';
import { runAgentTickGuarded } from '../../agents/runner-loop.js';
import { getBudgetStatus } from '../../ai/guards/token-budget.js';
import { getSettings, listAgentSettings, setAgentActive, updateSettings } from './settings.service.js';

const agentValues = Object.values(AgentType) as [string, ...string[]];

const settingsBody = z
  .object({
    pilotEnabled: z.boolean().optional(),
    liveFeedEnabled: z.boolean().optional(),
    workingDays: z.array(z.number().int().min(0).max(6)).optional(),
    workingHoursStart: z.number().int().min(0).max(23).optional(),
    workingHoursEnd: z.number().int().min(1).max(24).optional(),
    aiDailyTokenBudget: z.number().int().min(1000).max(10_000_000).optional(),
    emailsPerLeadPerDay: z.number().int().min(1).max(10).optional(),
    emailsPerLeadPerWeek: z.number().int().min(1).max(50).optional(),
    dailySendCap: z.number().int().min(1).max(10_000).optional(),
  })
  .strict()
  .refine(
    (v) => v.workingHoursStart == null || v.workingHoursEnd == null || v.workingHoursEnd > v.workingHoursStart,
    'workingHoursEnd must be greater than workingHoursStart',
  );

const agentParam = z.object({ agent: z.enum(agentValues) });

export const settingsRoutes = Router();

settingsRoutes.get('/', async (_req: Request, res: Response) => {
  const [settings, agents, budget] = await Promise.all([getSettings(), listAgentSettings(), getBudgetStatus()]);
  ok(res, { settings, agents, aiBudget: budget });
});

settingsRoutes.patch(
  '/',
  requireRole('ADMIN'),
  validate({ body: settingsBody }),
  async (req: Request, res: Response) => ok(res, await updateSettings(req.body)),
);

settingsRoutes.patch(
  '/agents/:agent',
  requireRole('ADMIN'),
  validate({ params: agentParam, body: z.object({ isActive: z.boolean() }) }),
  async (req: Request, res: Response) =>
    ok(res, await setAgentActive(req.params.agent as AgentType, req.body.isActive)),
);

/**
 * Manually trigger a pilot sweep. Useful for the admin "Run now" button and for QA.
 * Honours the pilot on/off switch; returns the task counts it queued.
 */
settingsRoutes.post('/pilot/run', requireRole('ADMIN'), async (_req: Request, res: Response) => {
  ok(res, await runPilotTick());
});

/** Flush one batch of AgentTasks immediately — handy for QA so you don't wait a minute for the scheduler. */
settingsRoutes.post('/agents/run', requireRole('ADMIN'), async (_req: Request, res: Response) => {
  ok(res, await runAgentTickGuarded());
});

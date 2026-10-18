import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { intakeLimiter } from '../../middlewares/rate-limit.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { created, ok } from '../../utils/api-response.js';
import { recordInbound } from '../communications/communications.service.js';
import { AgentMode } from '../../generated/prisma/enums.js';
import { enqueueRouteTask, setAgentMode, setStep } from './ai-route.service.js';
import { buildProposalPdf, confirmSiteVisit, getPublicProposal, listProposals, proposalIdByToken } from './proposal.service.js';

const leadId = (req: Request) => req.params.id as string;

/** Mounted under /leads (auth required). */
export const leadAiRouteRoutes = Router();

/** Who works this lead: OFF, RULES (free, rule-based) or AI (the AI agent, spends tokens). */
leadAiRouteRoutes.post('/:id/agent-mode', validate({ body: z.object({ mode: z.enum(AgentMode) }) }), async (req: Request, res: Response) => {
  await setAgentMode(leadId(req), req.body.mode, req.user?.id);
  ok(res, await prisma.lead.findUnique({ where: { id: leadId(req) }, select: { agentMode: true, aiRouteEnabled: true, aiRouteStep: true, aiRouteNote: true } }));
});

leadAiRouteRoutes.get('/:id/proposals', async (req: Request, res: Response) => ok(res, await listProposals(leadId(req))));

/** Write and send a fresh proposal now (e.g. after editing the requirements, or when the first send failed). */
leadAiRouteRoutes.post('/:id/proposals', async (req: Request, res: Response) => {
  const lead = await prisma.lead.findUnique({ where: { id: leadId(req) }, select: { agentMode: true, aiRouteEnabled: true, email: true } });
  if (!lead) throw ApiError.notFound('Lead');
  if (!lead.email) throw ApiError.badRequest('Add an email address to this lead first');
  if (lead.agentMode === 'OFF') throw ApiError.badRequest('Assign the lead to Auto (rules) or the AI agent first');
  if (!lead.aiRouteEnabled) await prisma.lead.update({ where: { id: leadId(req) }, data: { aiRouteEnabled: true, aiRouteStartedAt: new Date() } });
  await prisma.proposal.updateMany({ where: { leadId: leadId(req), status: 'SENT' }, data: { status: 'DECLINED', respondedAt: new Date() } });
  await setStep(leadId(req), 'MATCHING', 'Re-checking matches for a new proposal');
  created(res, await enqueueRouteTask('MATCHMAKER', 'ai_route_match', leadId(req), { refresh: true }));
});

/** Record a reply the lead sent (e.g. by phone or WhatsApp, or to test without a mailbox). The Inbox agent reads it. */
leadAiRouteRoutes.post('/:id/replies', validate({ body: z.object({ body: z.string().trim().min(1).max(4000) }) }), async (req: Request, res: Response) => {
  created(res, await recordInbound(leadId(req), 'EMAIL', req.body.body));
});

/** Agent confirms the site visit on the lead's behalf (e.g. agreed on a call). */
leadAiRouteRoutes.post(
  '/:id/proposals/:proposalId/confirm',
  validate({ body: z.object({ slotIndex: z.number().int().min(0).max(9).optional(), scheduledAt: z.coerce.date().optional(), propertyId: z.string().optional() }) }),
  async (req: Request, res: Response) => {
    const p = await prisma.proposal.findFirst({ where: { id: req.params.proposalId as string, leadId: leadId(req) } });
    if (!p) throw ApiError.notFound('Proposal');
    const at = req.body.scheduledAt ?? p.slots[req.body.slotIndex ?? 0];
    if (!at) throw ApiError.badRequest('Pick a visit time');
    ok(res, await confirmSiteVisit(p.id, { scheduledAt: at, propertyId: req.body.propertyId, via: 'agent' }));
  },
);

/** Public (no login): the lead's proposal page and PDF. Tokens are unguessable. */
export const publicRoutes = Router();

publicRoutes.get('/proposals/:token', async (req: Request, res: Response) => ok(res, await getPublicProposal(req.params.token as string)));

publicRoutes.get('/proposals/:token/pdf', async (req: Request, res: Response) => {
  const { buffer, filename } = await buildProposalPdf(await proposalIdByToken(req.params.token as string));
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${req.query.download ? 'attachment' : 'inline'}; filename="${filename}"`);
  res.send(buffer);
});

publicRoutes.post(
  '/proposals/:token/confirm',
  intakeLimiter,
  validate({ body: z.object({ slotIndex: z.number().int().min(0).max(9), propertyId: z.string().optional() }) }),
  async (req: Request, res: Response) => {
    const id = await proposalIdByToken(req.params.token as string);
    const p = await prisma.proposal.findUniqueOrThrow({ where: { id } });
    const at = p.slots[req.body.slotIndex];
    if (!at) throw ApiError.badRequest('That time is no longer available');
    if (at.getTime() < Date.now()) throw ApiError.badRequest('That time has passed. Reply to our email and we will suggest new times.');
    await confirmSiteVisit(id, { scheduledAt: at, propertyId: req.body.propertyId, via: 'proposal-page' });
    ok(res, await getPublicProposal(req.params.token as string));
  },
);

import crypto from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { sendEmail } from '../../integrations/email/mailer.js';
import { agentInviteEmail } from '../../integrations/email/templates.js';
import { prisma } from '../../lib/prisma.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ApiError } from '../../utils/api-error.js';
import { created, ok } from '../../utils/api-response.js';
import { OPEN_STATUSES } from '../pipeline/status-transitions.js';

export const userRoutes = Router();

const inviteAgentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
});

/** Team list with open-lead counts (for assignment pickers and team settings). */
userRoutes.get('/', async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
      inviteToken: true,
      inviteExpiresAt: true,
      createdAt: true,
      _count: { select: { leads: { where: { status: { in: OPEN_STATUSES } } } } },
    },
  });
  ok(
    res,
    users.map(({ _count, inviteToken, ...u }) => ({
      ...u,
      hasPendingInvite: Boolean(inviteToken && u.inviteExpiresAt && u.inviteExpiresAt > new Date() && !u.isActive),
      openLeads: _count.leads,
    })),
  );
});

/** Invite a new agent (Admin only). Sends email with account setup link. */
userRoutes.post('/invite', requireRole('ADMIN'), validate({ body: inviteAgentSchema }), async (req: Request, res: Response) => {
  const { name, email, phone } = req.body;
  const normalized = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    if (existing.isActive) {
      throw ApiError.badRequest('A user with this email address already exists and is active.');
    }
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 86_400_000); // 7 days
  const setupUrl = `${env.PUBLIC_APP_URL.replace(/\/$/, '')}/setup-account?token=${token}`;

  let user;
  if (existing) {
    user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name,
        phone: phone || existing.phone,
        inviteToken: token,
        inviteExpiresAt: expiresAt,
        role: 'AGENT',
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        name,
        email: normalized,
        phone: phone || null,
        role: 'AGENT',
        passwordHash: '', // Set when agent accepts invite
        isActive: false, // Inactive until account password is set
        inviteToken: token,
        inviteExpiresAt: expiresAt,
      },
    });
  }

  const emailContent = agentInviteEmail({ name, email: normalized, setupUrl });
  const result = await sendEmail({
    to: normalized,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  created(res, {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    emailSent: result.sent,
    setupUrl,
  });
});

/** Resend invite email to an agent with a pending invitation (Admin only). */
userRoutes.post('/:id/resend-invite', requireRole('ADMIN'), async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id as string } });
  if (!user) throw ApiError.notFound('Agent');
  if (user.isActive && !user.inviteToken) {
    throw ApiError.badRequest('Agent has already activated their account.');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 86_400_000);
  const setupUrl = `${env.PUBLIC_APP_URL.replace(/\/$/, '')}/setup-account?token=${token}`;

  await prisma.user.update({
    where: { id: user.id },
    data: { inviteToken: token, inviteExpiresAt: expiresAt },
  });

  const emailContent = agentInviteEmail({ name: user.name, email: user.email, setupUrl });
  const result = await sendEmail({
    to: user.email,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  ok(res, { emailSent: result.sent, setupUrl });
});

/** Deactivate or delete an agent (Admin only). */
userRoutes.delete('/:id', requireRole('ADMIN'), async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id as string } });
  if (!user) throw ApiError.notFound('Agent');
  if (user.id === req.user?.id) throw ApiError.badRequest('Cannot delete yourself');

  // Unassign active leads assigned to this agent
  await prisma.lead.updateMany({
    where: { assignedToId: user.id },
    data: { assignedToId: null },
  });

  await prisma.user.delete({ where: { id: user.id } });
  ok(res, { deleted: true });
});

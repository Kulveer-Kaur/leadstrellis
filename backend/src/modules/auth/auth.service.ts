import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import type { LoginInput } from './auth.validation.js';
import { signToken } from './token.js';

const publicUser = { id: true, name: true, email: true, role: true, avatarUrl: true } as const;

export async function login({ email, password }: LoginInput) {
  const normalized = email.trim().toLowerCase();
  let user = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: 'insensitive' } },
  });

  // If user typed admin alias or old domain, support fallback to the active admin user
  if (!user && (normalized === 'admin@leadstrellis.com' || normalized === 'lead.strellis@gmail.com' || normalized === 'admin@estatepilot.cm')) {
    user = await prisma.user.findFirst({
      where: { role: 'ADMIN', isActive: true },
    });
  }

  const valid = user?.isActive && (await bcrypt.compare(password, user.passwordHash));
  if (!user || !valid) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  const token = signToken({ sub: user.id, role: user.role, email: user.email });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl } };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUser });
  if (!user) throw ApiError.notFound('User');
  return user;
}

export async function verifyInvite(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      inviteToken: token,
      inviteExpiresAt: { gt: new Date() },
    },
    select: { id: true, name: true, email: true },
  });
  if (!user) throw ApiError.badRequest('This invitation link is invalid or has expired. Please contact your admin for a new link.');
  return user;
}

export async function acceptInvite(token: string, password: string) {
  const user = await verifyInvite(token);
  const passwordHash = await bcrypt.hash(password, 10);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      isActive: true,
      inviteToken: null,
      inviteExpiresAt: null,
    },
    select: publicUser,
  });

  const authToken = signToken({ sub: updated.id, role: updated.role, email: updated.email });
  return { token: authToken, user: updated };
}

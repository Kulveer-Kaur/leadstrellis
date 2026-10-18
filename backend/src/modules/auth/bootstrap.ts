import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

export async function bootstrapUsers() {
  try {
    const adminEmail = env.ADMIN_EMAIL.trim().toLowerCase();
    const adminPassHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);

    // 1. Ensure primary admin from .env exists with updated password
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        name: env.ADMIN_NAME,
        passwordHash: adminPassHash,
        role: 'ADMIN',
        isActive: true,
      },
      create: {
        name: env.ADMIN_NAME,
        email: adminEmail,
        role: 'ADMIN',
        passwordHash: adminPassHash,
        isActive: true,
      },
    });

    // 2. If SMTP_USER is set and different from ADMIN_EMAIL, also ensure it can log in as ADMIN
    if (env.SMTP_USER) {
      const smtpEmail = env.SMTP_USER.trim().toLowerCase();
      if (smtpEmail !== adminEmail && smtpEmail.includes('@')) {
        await prisma.user.upsert({
          where: { email: smtpEmail },
          update: {
            passwordHash: adminPassHash,
            role: 'ADMIN',
            isActive: true,
          },
          create: {
            name: `${env.ADMIN_NAME} (Email)`,
            email: smtpEmail,
            role: 'ADMIN',
            passwordHash: adminPassHash,
            isActive: true,
          },
        });
      }
    }

    logger.info({ adminEmail }, 'Admin user synced from .env');
  } catch (err) {
    logger.warn({ err: err instanceof Error ? err.message : err }, 'User bootstrap check failed');
  }
}

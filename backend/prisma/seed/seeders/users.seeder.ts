import bcrypt from 'bcryptjs';
import { prisma } from '../../../src/lib/prisma.js';
import { getSeedUsers } from '../data/users.data.js';

export async function seedUsers() {
  const users = getSeedUsers();
  return Promise.all(
    users.map(async (u) =>
      prisma.user.create({ data: { name: u.name, email: u.email, role: u.role, passwordHash: await bcrypt.hash(u.password, 10) } }),
    ),
  );
}

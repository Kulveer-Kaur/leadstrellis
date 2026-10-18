import { prisma } from '../../lib/prisma.js';
import { OPEN_STATUSES } from '../pipeline/status-transitions.js';

/** Round-robin by load: the active agent with the fewest open leads. */
export async function pickAgent() {
  const agents = await prisma.user.findMany({
    where: { role: 'AGENT', isActive: true },
    select: { id: true, _count: { select: { leads: { where: { status: { in: OPEN_STATUSES } } } } } },
  });
  if (!agents.length) return null;
  agents.sort((a, b) => a._count.leads - b._count.leads);
  return agents[0].id;
}

import { prisma } from '../../lib/prisma.js';
import { getSettings } from '../../modules/settings/settings.service.js';
import { addDays } from '../../utils/dates.js';

/**
 * Guard results tell the agent runner what to do next:
 *   { ok: true }                → go ahead and send
 *   { reschedule: Date }        → leave the AgentTask PENDING with a later runAfter
 *   { skip: 'reason string' }   → mark the AgentTask DONE with the reason as the result
 */
export type GuardResult = { ok: true } | { reschedule: Date; reason: string } | { skip: string };

/**
 * Working-hours gate (plan §2.3). Returns the next open slot in Dubai time when the
 * request falls outside the configured window. We work in a Date derived from the
 * Dubai offset (+04:00, no DST) so the maths stay simple and exact.
 */
export async function workingHoursGate(now = new Date()): Promise<GuardResult> {
  const s = await getSettings();
  const dubai = new Date(now.getTime() + 4 * 3_600_000);
  const dayUtc = dubai.getUTCDay();
  const hourUtc = dubai.getUTCHours();
  const insideWindow = s.workingDays.includes(dayUtc) && hourUtc >= s.workingHoursStart && hourUtc < s.workingHoursEnd;
  if (insideWindow) return { ok: true };
  return { reschedule: nextOpenSlot(now, s.workingDays, s.workingHoursStart), reason: 'outside working hours' };
}

function nextOpenSlot(now: Date, workingDays: number[], startHourDubai: number): Date {
  for (let i = 0; i < 8; i++) {
    const candidate = addDays(now, i);
    const dubai = new Date(candidate.getTime() + 4 * 3_600_000);
    const day = dubai.getUTCDay();
    if (!workingDays.includes(day)) continue;
    dubai.setUTCHours(startHourDubai, 0, 0, 0);
    const dubaiMs = dubai.getTime() - 4 * 3_600_000;
    if (dubaiMs > now.getTime()) return new Date(dubaiMs);
  }
  return addDays(now, 1); // Fallback — should never hit.
}

/** Global daily send cap (plan §2.3). Increments after a successful send. */
export async function dailySendCapGuard(): Promise<GuardResult> {
  const s = await getSettings();
  if (s.dailySendCount >= s.dailySendCap) {
    const tomorrow = new Date(Date.now() + 24 * 3_600_000);
    return { reschedule: tomorrow, reason: 'daily send cap reached' };
  }
  return { ok: true };
}

export async function incrementDailySendCount() {
  await prisma.appSetting.update({ where: { id: 'global' }, data: { dailySendCount: { increment: 1 } } });
}

/** Per-lead send frequency (plan §2.3): default 1/day, 4/week on automated outbound emails. */
export async function perLeadEmailGuard(leadId: string): Promise<GuardResult> {
  const s = await getSettings();
  const now = Date.now();
  const since24h = new Date(now - 24 * 3_600_000);
  const since7d = new Date(now - 7 * 24 * 3_600_000);
  const [count24h, count7d] = await Promise.all([
    prisma.message.count({ where: { leadId, direction: 'OUT', channel: 'EMAIL', aiGenerated: true, createdAt: { gte: since24h } } }),
    prisma.message.count({ where: { leadId, direction: 'OUT', channel: 'EMAIL', aiGenerated: true, createdAt: { gte: since7d } } }),
  ]);
  if (count24h >= s.emailsPerLeadPerDay) {
    return { reschedule: new Date(now + 24 * 3_600_000), reason: 'per-lead daily cap reached' };
  }
  if (count7d >= s.emailsPerLeadPerWeek) {
    return { reschedule: new Date(now + 7 * 24 * 3_600_000), reason: 'per-lead weekly cap reached' };
  }
  return { ok: true };
}

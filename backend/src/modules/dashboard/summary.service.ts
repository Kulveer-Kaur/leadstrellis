import type { LeadSource } from '../../generated/prisma/enums.js';
import { prisma } from '../../lib/prisma.js';
import { addDays } from '../../utils/dates.js';
import { emirateFilter, periodRange, type Period } from './dashboard.period.js';

const SOURCE_META: Record<LeadSource, { label: string; short: string }> = {
  WEBSITE: { label: 'Website', short: 'Web' },
  WHATSAPP: { label: 'WhatsApp', short: 'WA' },
  INSTAGRAM: { label: 'Instagram', short: 'IG' },
  EMAIL: { label: 'Email', short: 'Mail' },
  ADS: { label: 'Ads', short: 'Ads' },
  PHONE: { label: 'Phone', short: 'Call' },
  MANUAL: { label: 'Manual', short: 'Agent' },
  GOOGLE_BUSINESS: { label: 'Google Business', short: 'GBP' },
  FACEBOOK: { label: 'Facebook', short: 'FB' },
  PROPERTY_PORTAL: { label: 'Property portal', short: 'Portal' },
  REFERRAL: { label: 'Referral', short: 'Ref' },
};
const VIEWING_TARGET_PER_MONTH = 50;
const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

/** GET /dashboard/summary — shape matches frontend DashboardSummary. */
export async function getSummary(period: Period, emirate: string) {
  const { start, end, prevStart, prevEnd } = periodRange(period);
  const area = emirateFilter(emirate);
  const inPeriod = { ...area, createdAt: { gte: start, lt: end } };
  const automated = { OR: [{ messages: { some: { direction: 'OUT' as const, aiGenerated: true } } }, { calls: { some: {} } }] };

  const [newLeads, qualified, autoNow, prevTotal, autoPrev, calls, messages, aiViewings, bySource] = await Promise.all([
    prisma.lead.count({ where: inPeriod }),
    prisma.lead.count({ where: { ...inPeriod, intentLevel: { in: ['HIGH', 'MEDIUM'] } } }),
    prisma.lead.count({ where: { ...inPeriod, ...automated } }),
    prisma.lead.count({ where: { ...area, createdAt: { gte: prevStart, lt: prevEnd } } }),
    prisma.lead.count({ where: { ...area, createdAt: { gte: prevStart, lt: prevEnd }, ...automated } }),
    prisma.call.count({ where: { createdAt: { gte: start }, lead: area } }),
    prisma.message.count({ where: { direction: 'OUT', createdAt: { gte: start }, lead: area } }),
    prisma.viewing.count({ where: { bookedBy: 'AI', createdAt: { gte: start }, lead: area } }),
    prisma.lead.groupBy({ by: ['source'], where: inPeriod, _count: { _all: true } }),
  ]);

  const automatedRate = pct(autoNow, newLeads);
  return {
    overview: { qualifiedRate: pct(qualified, newLeads), newLeads, qualified },
    autopilot: { automatedRate, delta: automatedRate - pct(autoPrev, prevTotal), calls, messages, viewings: aiViewings },
    sources: (Object.keys(SOURCE_META) as LeadSource[]).map((s) => ({
      key: s,
      ...SOURCE_META[s],
      value: bySource.find((g) => g.source === s)?._count._all ?? 0,
    })),
    pipelineValue: await pipelineValue(area),
    viewingTarget: await viewingTarget(area),
    funnel: await funnel(inPeriod),
  };
}

/** Sum of open leads' budgets, with a 10-week trend of the open pipeline as it stood each week. */
async function pipelineValue(area: object) {
  const open = await prisma.lead.findMany({
    where: { ...area, status: { in: ['NEW', 'QUALIFIED', 'CONTACTED', 'VIEWING'] }, requirement: { budgetMax: { not: null }, purpose: { not: 'RENT' } } },
    select: { createdAt: true, requirement: { select: { budgetMax: true } } },
  });
  const now = new Date();
  const valueAt = (d: Date) => open.filter((l) => l.createdAt <= d).reduce((s, l) => s + (l.requirement?.budgetMax ?? 0), 0);
  const trend = Array.from({ length: 10 }, (_, i) => {
    const at = addDays(now, -7 * (9 - i));
    return { label: i === 9 ? 'This week' : `${9 - i} weeks ago`, value: valueAt(at) };
  });
  const totalAed = trend[9].value;
  const fourWeeksAgo = trend[5].value;
  return { totalAed, delta: fourWeeksAgo ? Math.round(((totalAed - fourWeeksAgo) / fourWeeksAgo) * 100) : 0, trend };
}

async function viewingTarget(area: object) {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const booked = await prisma.viewing.count({ where: { createdAt: { gte: monthStart }, status: { not: 'CANCELLED' }, lead: area } });
  return { booked, target: VIEWING_TARGET_PER_MONTH };
}

/** How many leads reached each stage (a closed lead also counts as having been contacted, etc.). */
async function funnel(where: object) {
  const [total, qualified, contacted, engaged, viewing, negotiation, closed] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.count({ where: { ...where, OR: [{ status: { in: ['QUALIFIED', 'CONTACTED', 'ENGAGED', 'VIEWING', 'NEGOTIATION', 'CLOSED_WON'] } }, { intentLevel: { in: ['HIGH', 'MEDIUM'] } }] } }),
    prisma.lead.count({ where: { ...where, OR: [{ status: { in: ['CONTACTED', 'ENGAGED', 'VIEWING', 'NEGOTIATION', 'CLOSED_WON'] } }, { contactAttempts: { gt: 0 } }] } }),
    prisma.lead.count({ where: { ...where, OR: [{ status: { in: ['ENGAGED', 'VIEWING', 'NEGOTIATION', 'CLOSED_WON'] } }, { lastInboundAt: { not: null } }] } }),
    prisma.lead.count({ where: { ...where, OR: [{ status: { in: ['VIEWING', 'NEGOTIATION', 'CLOSED_WON'] } }, { viewings: { some: {} } }] } }),
    prisma.lead.count({ where: { ...where, status: { in: ['NEGOTIATION', 'CLOSED_WON'] } } }),
    prisma.lead.count({ where: { ...where, status: 'CLOSED_WON' } }),
  ]);
  return [
    { key: 'NEW', label: 'New', value: total },
    { key: 'QUALIFIED', label: 'Qualified', value: qualified },
    { key: 'CONTACTED', label: 'Contacted', value: contacted },
    { key: 'ENGAGED', label: 'Engaged', value: engaged },
    { key: 'VIEWING', label: 'Viewing', value: viewing },
    { key: 'NEGOTIATION', label: 'Negotiation', value: negotiation },
    { key: 'CLOSED_WON', label: 'Won', value: closed },
  ];
}

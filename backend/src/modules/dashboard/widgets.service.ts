import { COMMUNITIES } from '../../constants/uae-locations.js';
import type { IntentLevel } from '../../generated/prisma/enums.js';
import { prisma } from '../../lib/prisma.js';
import { listViewings } from '../viewings/viewing.service.js';

const OPEN = ['NEW', 'QUALIFIED', 'CONTACTED', 'VIEWING'] as const;
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** GET /dashboard/hotspots — active leads per community + the latest captured lead. */
export async function getHotspots() {
  const leads = await prisma.lead.findMany({
    where: { status: { in: [...OPEN] }, requirement: { isNot: null } },
    select: { intentLevel: true, requirement: { select: { communities: true } } },
  });
  const byCommunity = new Map<string, { leads: number; high: number }>();
  for (const l of leads) {
    const name = l.requirement?.communities[0];
    if (!name) continue;
    const entry = byCommunity.get(name) ?? { leads: 0, high: 0 };
    entry.leads += 1;
    if (l.intentLevel === 'HIGH') entry.high += 1;
    byCommunity.set(name, entry);
  }
  const hotspots = [...byCommunity.entries()]
    .map(([name, v]) => {
      const c = COMMUNITIES.find((x) => x.name === name);
      const intent: IntentLevel = v.high / v.leads >= 0.4 ? 'HIGH' : v.high > 0 ? 'MEDIUM' : 'LOW';
      return c ? { id: name.toLowerCase().replace(/\W+/g, '-'), community: name, lat: c.lat, lng: c.lng, leads: v.leads, intent } : null;
    })
    .filter((h): h is NonNullable<typeof h> => h !== null)
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 12);

  const latest = await prisma.lead.findFirst({ orderBy: { createdAt: 'desc' }, include: { requirement: { select: { summary: true } } } });
  return {
    hotspots,
    latest: latest && {
      leadId: latest.id,
      name: latest.fullName,
      source: latest.source,
      message: latest.rawMessage?.slice(0, 160) ?? latest.requirement?.summary ?? '',
      score: latest.score ?? 0,
      capturedAt: latest.createdAt.toISOString(),
    },
  };
}

/** GET /dashboard/top-matches?segment=high|all — the listings the AI matched to the most leads. */
export async function getTopMatchedProperties(segment: 'high' | 'all', take = 2) {
  const grouped = await prisma.leadPropertyMatch.groupBy({
    by: ['propertyId'],
    where: { finalRank: { not: null }, ...(segment === 'high' ? { lead: { intentLevel: 'HIGH' } } : {}) },
    _count: { _all: true },
    orderBy: { _count: { propertyId: 'desc' } },
    take,
  });
  const properties = await prisma.property.findMany({ where: { id: { in: grouped.map((g) => g.propertyId) } } });
  const usedImages = new Set<string>();
  return grouped.map((g) => {
    const p = properties.find((x) => x.id === g.propertyId)!;
    // Show a different cover on each card when listings share stock photos.
    const imageUrl = p.imageUrls.find((u) => !usedImages.has(u)) ?? p.imageUrls[0] ?? '';
    usedImages.add(imageUrl);
    const features = [
      { icon: 'bed', label: p.bedrooms === 0 ? 'Studio' : `${p.bedrooms} beds` },
      p.view ? { icon: 'view', label: `${p.view.split(' ')[0]} view` } : p.amenities.some((a) => /pool/i.test(a)) ? { icon: 'pool', label: 'Pool' } : { icon: 'area', label: `${p.areaSqft.toLocaleString('en-AE')} sqft` },
    ];
    return {
      id: p.id,
      title: p.title,
      community: p.community,
      priceAed: p.priceAed,
      imageUrl,
      summary: capitalize(p.description.split('. ')[0].slice(0, 110)),
      matchedLeads: g._count._all,
      features,
    };
  });
}

const ACTIVITY_KIND: Record<string, string> = {
  'lead.captured': 'captured',
  'lead.understood': 'qualified',
  'lead.scored': 'qualified',
  'message.sent': 'message',
  'call.started': 'call',
  'call.completed': 'call',
  'viewing.booked': 'viewing',
  'status.changed': 'qualified',
  'task.scheduled': 'nurture',
};

/** GET /dashboard/activity — AI and system actions only. */
export async function getAiActivity(limit = 12) {
  const rows = await prisma.activityLog.findMany({
    where: { actorType: { in: ['AI', 'SYSTEM'] }, type: { in: Object.keys(ACTIVITY_KIND) } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    kind: r.type === 'status.changed' && (r.payload as { to?: string } | null)?.to === 'NURTURE' ? 'nurture' : ACTIVITY_KIND[r.type],
    title: r.title,
    detail: r.detail ?? '',
    at: r.createdAt.toISOString(),
  }));
}

/** GET /dashboard/viewings — next 48 hours. */
export async function getUpcomingViewings() {
  const rows = await listViewings({ upcoming: true, hours: 48 });
  return rows.map((v) => ({
    id: v.id,
    leadName: v.lead.fullName,
    property: v.property.title,
    community: v.property.community,
    at: v.scheduledAt.toISOString(),
    agent: v.agent ? `${v.agent.name.split(' ')[0]} ${v.agent.name.split(' ')[1]?.[0] ?? ''}.`.trim() : 'Unassigned',
    bookedBy: v.bookedBy === 'AI' ? 'AI' : 'Agent',
  }));
}

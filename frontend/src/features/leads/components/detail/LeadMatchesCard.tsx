import { Building2, CalendarPlus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, CardHeader, EmptyState, IconButton } from '@/components/ui';
import { propertyPath } from '@/constants/routes';
import type { LeadMatch } from '@/types';
import { formatAedCompact, formatRelative } from '@/utils/format';
import { useRefreshMatches } from '../../hooks/useLeadMutations';

interface LeadMatchesCardProps {
  leadId: string;
  matches: LeadMatch[];
  /** Property in the latest proposal, if one was sent. */
  proposedPropertyId?: string;
  onBook: (propertyId: string) => void;
}

/** The AI's ranked shortlist for this lead. */
export function LeadMatchesCard({ leadId, matches, proposedPropertyId, onBook }: LeadMatchesCardProps) {
  const refresh = useRefreshMatches(leadId);
  // Best match = highest fit % (what the AI route proposes); the rest are alternatives.
  const fit = (m: LeadMatch) => m.aiFitScore ?? m.filterScore;
  const sorted = [...matches].sort((a, b) => fit(b) - fit(a) || (a.finalRank ?? 99) - (b.finalRank ?? 99));
  const bestId = proposedPropertyId && matches.some((m) => m.property.id === proposedPropertyId) ? proposedPropertyId : sorted[0]?.property.id;
  const ordered = [...sorted.filter((m) => m.property.id === bestId), ...sorted.filter((m) => m.property.id !== bestId)];
  return (
    <Card>
      <CardHeader
        title="Matched properties"
        subtitle="Compared by the AI with every available property. The best match goes into the proposal."
        action={
          <IconButton label="Find matches again" variant="outline" size="sm" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
            <RefreshCw className={`size-4 ${refresh.isPending ? 'animate-spin' : ''}`} />
          </IconButton>
        }
      />
      {matches.length === 0 ? (
        <EmptyState icon={<Building2 className="size-5" aria-hidden />} title="No matches yet" description="Nothing in stock fits yet. The matchmaker checks again when new listings arrive." />
      ) : (
        <ul className="flex flex-col gap-3">
          {ordered.map((m) => (
            <li key={m.id} className={`flex flex-col gap-3 rounded-panel border p-3 sm:flex-row ${m.property.id === bestId ? 'border-primary bg-primary-soft/40' : 'border-border'}`}>
              <img src={m.property.imageUrls[0]} alt="" loading="lazy" className="h-32 w-full shrink-0 rounded-xl bg-surface-2 object-cover sm:h-28 sm:w-40" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Badge tone={m.property.id === bestId ? 'primary' : 'neutral'} className="mb-1">
                      {m.property.id === bestId ? (bestId === proposedPropertyId ? 'Best match · in proposal' : 'Best match') : 'Alternative'}
                    </Badge>
                    <Link to={propertyPath(m.property.id)} className="block text-title-small text-heading hover:text-primary">
                      {m.property.title}
                    </Link>
                    <p className="num text-label-medium text-primary">
                      {m.property.community} · {formatAedCompact(m.property.priceAed)}
                    </p>
                  </div>
                  {m.aiFitScore != null && <Badge tone={m.aiFitScore >= 75 ? 'success' : 'warning'}>{m.aiFitScore}% fit</Badge>}
                </div>
                {m.aiReason && <p className="mt-1.5 text-body-medium text-text">{m.aiReason}</p>}
                {m.caveat && <p className="mt-1 text-body-small text-warning">Note: {m.caveat}</p>}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-body-small text-muted">{m.sentAt ? `Sent to lead ${formatRelative(m.sentAt)}` : 'Not sent yet'}</span>
                  <Button variant="soft" className="min-h-9 px-4" onClick={() => onBook(m.property.id)} icon={<CalendarPlus className="size-4" aria-hidden />}>
                    Book viewing
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

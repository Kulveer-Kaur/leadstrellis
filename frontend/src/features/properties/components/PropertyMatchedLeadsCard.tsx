import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, Badge, Card, CardHeader, EmptyState } from '@/components/ui';
import { leadPath } from '@/constants/routes';
import { LeadScore, LeadStatusBadge } from '@/features/leads/components';
import type { PropertyDetail } from '@/types';

/** Leads the AI shortlisted this listing for. */
export function PropertyMatchedLeadsCard({ matches }: { matches: PropertyDetail['matches'] }) {
  return (
    <Card>
      <CardHeader title="Matched leads" subtitle="Leads the AI shortlisted this listing for" action={<span />} />
      {matches.length === 0 ? (
        <EmptyState icon={<Users className="size-5" aria-hidden />} title="No matched leads yet" />
      ) : (
        <ul className="flex flex-col">
          {matches.map((m) => (
            <li key={m.id} className="flex items-center gap-3 border-t border-border py-3 first:border-t-0">
              <Avatar name={m.lead.fullName} size="sm" />
              <div className="min-w-0 flex-1">
                <Link to={leadPath(m.lead.id)} className="text-body-medium font-medium text-heading hover:text-primary">
                  {m.lead.fullName}
                </Link>
                {m.aiReason && <p className="line-clamp-1 text-body-small text-muted">{m.aiReason}</p>}
              </div>
              {m.aiFitScore != null && <Badge tone={m.aiFitScore >= 75 ? 'success' : 'warning'}>{m.aiFitScore}% fit</Badge>}
              <LeadStatusBadge status={m.lead.status} />
              <LeadScore score={m.lead.score ?? 0} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

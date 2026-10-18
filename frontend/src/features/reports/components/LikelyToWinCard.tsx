import { Link } from 'react-router-dom';
import { Card, CardHeader, CardSkeleton, ProgressBar } from '@/components/ui';
import { leadPath } from '@/constants/routes';
import { LeadStatusBadge } from '@/features/leads/components';
import { formatAedCompact, formatPercent } from '@/utils/format';
import { useLikelyToWin } from '../hooks/useReports';

export function LikelyToWinCard() {
  const { data, isLoading } = useLikelyToWin();
  if (isLoading || !data) return <CardSkeleton className="h-96" />;
  return (
    <Card>
      <CardHeader title="Most likely to close" subtitle="Open leads ranked by win probability" action={<span />} />
      {data.length === 0 ? (
        <p className="text-body-medium text-muted">No open leads.</p>
      ) : (
        <ol className="flex flex-col">
          {data.map((l) => (
            <li key={l.id} className="border-t border-border py-3 first:border-t-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <Link to={leadPath(l.id)} className="text-body-medium font-medium text-heading hover:text-primary">
                    {l.fullName}
                  </Link>
                  <p className="text-body-small text-muted">
                    <span className="num">{l.code}</span> · {l.reason}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {l.dealValueAed != null && <span className="num text-label-medium text-primary">{formatAedCompact(l.dealValueAed)}</span>}
                  <LeadStatusBadge status={l.status} />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <ProgressBar value={l.winProbability} label={`${l.fullName} win probability`} />
                <span className="num w-10 text-right text-label-medium text-heading">{formatPercent(l.winProbability)}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

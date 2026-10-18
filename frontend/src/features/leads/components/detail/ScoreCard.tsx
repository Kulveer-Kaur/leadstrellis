import { Card, CardHeader, ProgressBar } from '@/components/ui';
import type { LeadScoreRecord } from '@/types';
import { formatPercent } from '@/utils/format';
import { LeadScore } from '../LeadScore';

interface ScoreCardProps {
  score: number | null;
  winProbability: number | null;
  latest: LeadScoreRecord | undefined;
}

/** The score and the points behind it, so the number can always be explained. */
export function ScoreCard({ score, winProbability, latest }: ScoreCardProps) {
  return (
    <Card>
      <CardHeader title="AI score" action={<LeadScore score={score ?? 0} className="size-12" />} />
      {latest ? (
        <>
          <ul className="flex flex-col gap-3">
            {latest.breakdown.map((b) => (
              <li key={b.key}>
                <div className="flex items-baseline justify-between gap-3 text-body-medium">
                  <span className="text-text">{b.label}</span>
                  <span className="num text-heading">
                    {b.points}
                    <span className="text-muted">/{b.max}</span>
                  </span>
                </div>
                <ProgressBar className="mt-1.5" value={(b.points / Math.max(1, b.max)) * 100} label={`${b.label}: ${b.points} of ${b.max}`} />
                {b.note && <p className="mt-1 text-body-small text-muted">{b.note}</p>}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-panel bg-surface-2 px-4 py-3 text-body-medium text-text">{latest.reasoning}</p>
        </>
      ) : (
        <p className="text-body-medium text-muted">Not scored yet.</p>
      )}
      {winProbability != null && (
        <p className="mt-3 text-body-medium text-muted">
          Win probability <span className="num text-heading">{formatPercent(winProbability)}</span>
        </p>
      )}
    </Card>
  );
}
